import jsYaml from 'js-yaml';
import { execFileSync } from 'child_process';
import { writeFileSync, readFileSync, unlinkSync, mkdtempSync, rmdirSync, readdirSync, copyFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join, posix, dirname, resolve } from 'path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';

// Starlight renders the frontmatter title as its own h1 — strip any leading h1 from body.
function rehypeStripFirstH1() {
  return function (tree) {
    let found = false;
    tree.children = tree.children.filter((node) => {
      if (!found && node.type === 'element' && node.tagName === 'h1') {
        found = true;
        return false;
      }
      return true;
    });
  };
}

// Collect h2/h3 headings into an array for Starlight's TOC (rendered.metadata.headings).
// Must run after rehype-slug so id attributes are already set.
function extractText(nodes) {
  return nodes.flatMap((c) => (c.type === 'text' ? [c.value] : c.children ? extractText(c.children) : [])).join('');
}

function rehypeCollectHeadings(collected) {
  return function (tree) {
    visit(tree, 'element', (node) => {
      const match = node.tagName.match(/^h([23])$/);
      if (!match) return;
      const depth = parseInt(match[1], 10);
      const slug = node.properties?.id ?? '';
      const text = extractText(node.children);
      collected.push({ depth, slug, text });
    });
  };
}

// Compile a .d2 source string to an inline SVG string via the d2 CLI.
function compileD2ToSvg(d2Source) {
  const dir = mkdtempSync(join(tmpdir(), 'd2-'));
  const inFile = join(dir, 'diagram.d2');
  const outFile = join(dir, 'diagram.svg');
  try {
    writeFileSync(inFile, d2Source, 'utf8');
    execFileSync('d2', ['--theme=0', '--dark-theme=200', inFile, outFile], { timeout: 15000 });
    const svg = readFileSync(outFile, 'utf8');
    // Strip XML declaration — not needed for inline SVG
    return svg.replace(/<\?xml[^?]*\?>\s*/i, '');
  } finally {
    try { unlinkSync(inFile); } catch {}
    try { unlinkSync(outFile); } catch {}
    try { rmdirSync(dir); } catch {}
  }
}

// Fix relative links in markdown fetched from GitHub.
// Starlight serves each page as a virtual directory (trailing slash), so a sibling link
// like "skill-authoring" resolves one level too deep. We need "../skill-authoring".
// Rules:
//   - Strip .md / .mdx extension, preserving any #fragment
//   - Skip .d2 links — handled separately by rehypeInlineD2
//   - Prepend "../" if the link is relative and doesn't already start with ".."
function rehypeStripMdExtension() {
  return function (tree) {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'a') return;
      const href = node.properties?.href;
      if (!href || /^https?:\/\//.test(href) || href.startsWith('#') || href.startsWith('/')) return;
      if (href.includes('.d2')) return;

      let fixed = href.replace(/\.mdx?(#.*)?$/, (_, frag) => frag ?? '');

      // Normalise "./" prefix → "../" (Starlight virtual dir shifts relative base one level down)
      if (fixed.startsWith('./')) {
        fixed = '../' + fixed.slice(2);
      } else if (!fixed.startsWith('../')) {
        fixed = '../' + fixed;
      }

      node.properties.href = fixed;
    });
  };
}

// Replace <a href="*.d2"> links with inline <figure class="d2-diagram"> containing the compiled SVG.
// d2Map: { relHref: svgString }
function rehypeInlineD2(d2Map) {
  return function (tree) {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'a') return;
      const href = node.properties?.href;
      if (!href || !href.endsWith('.d2')) return;
      const svg = d2Map[href];
      if (!svg || !parent) return;
      parent.children[index] = {
        type: 'element',
        tagName: 'figure',
        properties: { className: ['d2-diagram'] },
        children: [{ type: 'raw', value: svg }],
      };
    });
  };
}

// Rewrite <img src="*"> for images copied to public/docs-assets by copyLocalImages.
// imageMap: { originalRelativeSrc: '/docs-assets/...' }
function rehypeRewriteImages(imageMap) {
  return function (tree) {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'img') return;
      const src = node.properties?.src;
      if (src && imageMap[src]) {
        node.properties.src = imageMap[src];
      }
    });
  };
}

function buildProcessor(d2Map = {}, imageMap = {}) {
  const headings = [];
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeStripFirstH1)
    .use(rehypeSlug)
    .use(rehypeCollectHeadings, headings)
    .use(rehypeStripMdExtension)
    .use(rehypeInlineD2, d2Map)
    .use(rehypeRewriteImages, imageMap)
    .use(rehypeStringify, { allowDangerousHtml: true });
  return { processor, headings };
}

const GITHUB_API = 'https://api.github.com';

async function fetchTree(repo, token) {
  const repoRes = await fetch(`${GITHUB_API}/repos/${repo}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
  });
  if (!repoRes.ok) throw new Error(`GitHub repo fetch failed: ${repoRes.status} ${repoRes.statusText} (${repo})`);
  const { default_branch } = await repoRes.json();
  const res = await fetch(`${GITHUB_API}/repos/${repo}/git/trees/${default_branch}?recursive=1`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) throw new Error(`GitHub tree fetch failed: ${res.status} ${res.statusText} (${repo})`);
  const data = await res.json();
  if (data.truncated) throw new Error(`GitHub tree truncated for ${repo} — repo exceeds API limit`);
  return data.tree.filter((f) => f.type === 'blob');
}

async function fetchContent(repo, path, token) {
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  const res = await fetch(`${GITHUB_API}/repos/${repo}/contents/${encodedPath}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.raw' },
  });
  if (!res.ok) throw new Error(`GitHub content fetch failed: ${res.status} ${res.statusText} (${path})`);
  return res.text();
}

export function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: content };
  const parsed = jsYaml.load(match[1]);
  const data = parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  return { data, body: match[2] };
}

// Converts a glob pattern to a RegExp. Supports **, *, {a,b} — sufficient for our path patterns.
export function globToRegex(pattern) {
  let result = '';
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === '.') {
      result += '\\.';
    } else if (c === '{') {
      result += '(';
    } else if (c === '}') {
      result += ')';
    } else if (c === ',') {
      result += '|';
    } else if (pattern.slice(i, i + 3) === '**/') {
      result += '(.+/)?';
      i += 2;
    } else if (pattern.slice(i, i + 2) === '**') {
      result += '.*';
      i += 1;
    } else if (c === '*') {
      result += '[^/]+';
    } else {
      result += c;
    }
  }
  return new RegExp(`^${result}$`);
}

// Recursively list files under absBase matching pathPattern, relative to absBase.
function listLocalFiles(absBase, pathPattern) {
  const regex = globToRegex(pathPattern);
  const results = [];
  const walk = (relDir) => {
    for (const entry of readdirSync(join(absBase, relDir), { withFileTypes: true })) {
      const relPath = relDir ? `${relDir}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walk(relPath);
      } else if (regex.test(relPath)) {
        results.push(relPath);
      }
    }
  };
  walk('');
  return results;
}

// Copy images referenced by a local markdown file into public/docs-assets, so they're
// servable as static assets — relative image paths have no meaningful base once the
// content is rendered into a virtual Starlight route. Returns { originalSrc: publicPath }.
function copyLocalImages(body, absBase, fileDir, logger) {
  const imageMap = {};
  const imageLinks = [...body.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map((m) => m[1]);
  for (const relHref of imageLinks) {
    if (/^https?:\/\//.test(relHref) || relHref.startsWith('/')) continue;
    const resolvedRelPath = posix.normalize(posix.join(fileDir, relHref));
    const srcPath = join(absBase, resolvedRelPath);
    const destPath = resolve('public', 'docs-assets', resolvedRelPath);
    try {
      mkdirSync(dirname(destPath), { recursive: true });
      copyFileSync(srcPath, destPath);
      imageMap[relHref] = `/docs-assets/${resolvedRelPath}`;
    } catch (err) {
      logger?.warn(`Image copy failed for ${srcPath}: ${err.message}`);
    }
  }
  return imageMap;
}

// Local counterpart of the GitHub fetch loop below — reads markdown straight off disk
// instead of calling the GitHub API. Used for this repo's own docs/ folder, which is
// already on disk at build time and needs no remote round-trip.
async function loadLocalSource({ base, pathPattern, idPrefix = '', stripExtension = false, starlightDocsBase, store, logger, parseData }) {
  const absBase = resolve(base);
  logger.info(`Reading local docs: ${base}`);
  const files = listLocalFiles(absBase, pathPattern);
  logger.info(`${files.length} files match ${pathPattern}`);

  for (const relPath of files) {
    const relativePath = stripExtension ? relPath.replace(/\.(md|mdx)$/, '') : relPath;
    const id = idPrefix + relativePath;

    const raw = readFileSync(join(absBase, relPath), 'utf8');
    const { data, body } = parseFrontmatter(raw);
    const parsed = await parseData({ id, data });

    const d2Map = {};
    const d2Links = [...body.matchAll(/\[[^\]]*\]\(([^)]+\.d2)\)/g)].map((m) => m[1]);
    const fileDir = posix.dirname(relPath);
    for (const relHref of d2Links) {
      const localPath = join(absBase, posix.normalize(posix.join(fileDir, relHref)));
      try {
        const d2Source = readFileSync(localPath, 'utf8');
        d2Map[relHref] = compileD2ToSvg(d2Source);
        logger.info(`Compiled D2: ${localPath}`);
      } catch (err) {
        logger.warn(`D2 compile failed for ${localPath}: ${err.message}`);
      }
    }

    const imageMap = copyLocalImages(body, absBase, fileDir, logger);

    const { processor, headings } = buildProcessor(d2Map, imageMap);
    const result = await processor.process(body);
    const html = String(result);
    const filePath = starlightDocsBase ? `${starlightDocsBase}/${id}.md` : undefined;
    store.set({ id, data: parsed, body, rendered: { html, metadata: { headings } }, digest: `${relPath}:${raw.length}`, filePath });
  }

  logger.info(`Loaded ${files.length} local files from ${base}`);
}

/**
 * Astro Content Layer loader that fetches markdown files from one or more private GitHub repos.
 *
 * @param {object|object[]} sources - Single config or array of configs
 * @param {string} sources.repo - GitHub repo in "owner/name" format (ignored when sources.local is true)
 * @param {string} sources.pathPattern - Glob pattern to match files
 * @param {string} sources.token - GitHub fine-grained PAT with contents:read (ignored when sources.local is true)
 * @param {string} [sources.stripPrefix] - Path prefix to strip from the source path (GitHub sources only)
 * @param {string} [sources.idPrefix] - Prefix to prepend to the entry ID
 * @param {boolean} [sources.stripExtension] - Strip .md/.mdx extension from the entry ID
 * @param {string} [sources.starlightDocsBase] - When set, generates a fake filePath for Starlight
 *   (e.g. "src/content/docs"). Starlight requires filePath for sidebar autogenerate.
 *   The file doesn't need to exist on disk — Starlight only uses the string for path operations.
 *   Formula: `${starlightDocsBase}/${id}.md` → Starlight strips the base to derive the sidebar group.
 *   See: carbon-notes/docs/decisions/starlight-content-layer-integration.md for the full decision record.
 * @param {boolean} [sources.local] - Read from local disk instead of the GitHub API — for content
 *   that already lives in this repo (e.g. this repo's own docs/ folder). No token needed.
 * @param {string} [sources.base] - Directory to read from, relative to the repo root (local sources only)
 */
export function githubLoader(sources) {
  const sourceList = Array.isArray(sources) ? sources : [sources];
  return {
    name: 'github-loader',
    async load({ store, logger, parseData }) {
      for (const {
        repo,
        pathPattern,
        token,
        stripPrefix = '',
        idPrefix = '',
        stripExtension = false,
        starlightDocsBase,
        local = false,
        base,
      } of sourceList) {
        if (local) {
          await loadLocalSource({ base, pathPattern, idPrefix, stripExtension, starlightDocsBase, store, logger, parseData });
          continue;
        }

        if (!token) {
          logger.warn(`CONTENT_TOKEN not set — skipping loader for ${repo} (${pathPattern})`);
          continue;
        }

        logger.info(`Fetching tree: ${repo}`);
        const tree = await fetchTree(repo, token);
        const regex = globToRegex(pathPattern);
        const matches = tree.filter((f) => regex.test(f.path));
        logger.info(`${matches.length} files match ${pathPattern}`);

        let fetched = 0;
        for (const file of matches) {
          let relativePath = stripPrefix && file.path.startsWith(stripPrefix)
            ? file.path.slice(stripPrefix.length)
            : file.path;

          if (stripExtension) relativePath = relativePath.replace(/\.(md|mdx)$/, '');

          const id = idPrefix + relativePath;

          if (store.get(id)?.digest === file.sha) continue;

          const raw = await fetchContent(repo, file.path, token);
          const { data, body } = parseFrontmatter(raw);
          const parsed = await parseData({ id, data });

          // Compile any .d2 diagrams linked from this file before running the pipeline.
          const d2Map = {};
          const d2Links = [...body.matchAll(/\[[^\]]*\]\(([^)]+\.d2)\)/g)].map((m) => m[1]);
          const fileDir = posix.dirname(file.path);
          for (const relHref of d2Links) {
            const repoPath = posix.normalize(posix.join(fileDir, relHref));
            try {
              const d2Source = await fetchContent(repo, repoPath, token);
              d2Map[relHref] = compileD2ToSvg(d2Source);
              logger.info(`Compiled D2: ${repoPath}`);
            } catch (err) {
              logger.warn(`D2 compile failed for ${repoPath}: ${err.message}`);
            }
          }

          const { processor, headings } = buildProcessor(d2Map);
          const result = await processor.process(body);
          const html = String(result);
          // starlightDocsBase: fake filePath so Starlight's sidebar autogenerate works.
          // navigation.ts does filePath.replace('src/content/docs/', '') to derive the directory.
          const filePath = starlightDocsBase ? `${starlightDocsBase}/${id}.md` : undefined;
          store.set({ id, data: parsed, body, rendered: { html, metadata: { headings } }, digest: file.sha, filePath });
          fetched++;
        }

        const unchanged = matches.length - fetched;
        logger.info(`Fetched ${fetched} new/changed, ${unchanged} unchanged from ${repo}`);
      }
    },
  };
}
