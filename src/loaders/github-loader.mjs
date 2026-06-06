import jsYaml from 'js-yaml';

const GITHUB_API = 'https://api.github.com';

async function fetchTree(repo, token) {
  const res = await fetch(`${GITHUB_API}/repos/${repo}/git/trees/HEAD?recursive=1`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) throw new Error(`GitHub tree fetch failed: ${res.status} ${res.statusText} (${repo})`);
  const { tree } = await res.json();
  return tree.filter((f) => f.type === 'blob');
}

async function fetchContent(repo, path, token) {
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  const res = await fetch(`${GITHUB_API}/repos/${repo}/contents/${encodedPath}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.raw+json' },
  });
  if (!res.ok) throw new Error(`GitHub content fetch failed: ${res.status} ${res.statusText} (${path})`);
  return res.text();
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: content };
  return { data: jsYaml.load(match[1]) ?? {}, body: match[2] };
}

// Converts a glob pattern to a RegExp. Supports **, *, {a,b} — sufficient for our path patterns.
function globToRegex(pattern) {
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
 * Astro Content Layer loader that fetches markdown files from a private GitHub repo.
 *
 * @param {object} options
 * @param {string} options.repo - GitHub repo in "owner/name" format
 * @param {string} options.pathPattern - Glob pattern to match files (e.g. "articles/**\/fr/index.{md,mdx}")
 * @param {string} options.token - GitHub fine-grained PAT with contents:read
 * @param {string} [options.stripPrefix] - Path prefix to strip from the entry ID (e.g. "cv/")
 */
export function githubLoader({ repo, pathPattern, token, stripPrefix = '' }) {
  return {
    name: 'github-loader',
    async load({ store, logger, parseData }) {
      if (!token) {
        logger.warn(`CONTENT_TOKEN not set — skipping loader for ${repo} (${pathPattern})`);
        return;
      }

      logger.info(`Fetching tree: ${repo}`);
      const tree = await fetchTree(repo, token);
      const regex = globToRegex(pathPattern);
      const matches = tree.filter((f) => regex.test(f.path));
      logger.info(`${matches.length} files match ${pathPattern}`);

      let fetched = 0;
      for (const file of matches) {
        const id = stripPrefix && file.path.startsWith(stripPrefix)
          ? file.path.slice(stripPrefix.length)
          : file.path;

        if (store.get(id)?.digest === file.sha) continue;

        const raw = await fetchContent(repo, file.path, token);
        const { data, body } = parseFrontmatter(raw);
        const parsed = await parseData({ id, data });
        store.set({ id, data: parsed, body, digest: file.sha });
        fetched++;
      }

      logger.info(`Fetched ${fetched} new/changed files from ${repo}`);
    },
  };
}
