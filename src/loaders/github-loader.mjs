import jsYaml from 'js-yaml';

const GITHUB_API = 'https://api.github.com';

async function fetchTree(repo, token) {
  const res = await fetch(`${GITHUB_API}/repos/${repo}/git/trees/HEAD?recursive=1`, {
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
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.raw+json' },
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

/**
 * Astro Content Layer loader that fetches markdown files from one or more private GitHub repos.
 *
 * @param {object|object[]} sources - Single config or array of configs
 * @param {string} sources.repo - GitHub repo in "owner/name" format
 * @param {string} sources.pathPattern - Glob pattern to match files
 * @param {string} sources.token - GitHub fine-grained PAT with contents:read
 * @param {string} [sources.stripPrefix] - Path prefix to strip from the source path
 * @param {string} [sources.idPrefix] - Prefix to prepend to the entry ID
 * @param {boolean} [sources.stripExtension] - Strip .md/.mdx extension from the entry ID
 * @param {string} [sources.starlightDocsBase] - When set, generates a fake filePath for Starlight
 *   (e.g. "src/content/docs"). Starlight requires filePath for sidebar autogenerate.
 *   The file doesn't need to exist on disk — Starlight only uses the string for path operations.
 *   Formula: `${starlightDocsBase}/${id}.md` → Starlight strips the base to derive the sidebar group.
 *   See: carbon-notes/docs/decisions/starlight-content-layer-integration.md for the full decision record.
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
      } of sourceList) {
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
          // starlightDocsBase: fake filePath so Starlight's sidebar autogenerate works.
          // navigation.ts does filePath.replace('src/content/docs/', '') to derive the directory.
          const filePath = starlightDocsBase ? `${starlightDocsBase}/${id}.md` : undefined;
          store.set({ id, data: parsed, body, digest: file.sha, filePath });
          fetched++;
        }

        const unchanged = matches.length - fetched;
        logger.info(`Fetched ${fetched} new/changed, ${unchanged} unchanged from ${repo}`);
      }
    },
  };
}
