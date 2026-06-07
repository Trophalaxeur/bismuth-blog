import { describe, expect, it } from 'vitest';
import { globToRegex, parseFrontmatter } from './github-loader.mjs';

describe('globToRegex', () => {
  describe('** wildcard', () => {
    it('matches nested paths', () => {
      const re = globToRegex('articles/**/fr/index.md');
      expect(re.test('articles/my-post/fr/index.md')).toBe(true);
      expect(re.test('articles/a/b/c/fr/index.md')).toBe(true);
    });

    it('does not match across directory boundaries with single *', () => {
      const re = globToRegex('cv/*/profile.md');
      expect(re.test('cv/fr/profile.md')).toBe(true);
      expect(re.test('cv/fr/en/profile.md')).toBe(false);
    });
  });

  describe('{a,b} alternation', () => {
    it('matches any listed branch', () => {
      const re = globToRegex('cv/{fr,en}/*.md');
      expect(re.test('cv/fr/profile.md')).toBe(true);
      expect(re.test('cv/en/skills.md')).toBe(true);
    });

    it('rejects paths outside the alternation', () => {
      const re = globToRegex('cv/{fr,en}/*.md');
      expect(re.test('cv/de/profile.md')).toBe(false);
    });
  });

  describe('{md,mdx} extension alternation', () => {
    it('matches both .md and .mdx', () => {
      const re = globToRegex('articles/**/fr/index.{md,mdx}');
      expect(re.test('articles/my-post/fr/index.md')).toBe(true);
      expect(re.test('articles/my-post/fr/index.mdx')).toBe(true);
    });

    it('does not match unrelated extensions', () => {
      const re = globToRegex('articles/**/fr/index.{md,mdx}');
      expect(re.test('articles/my-post/fr/index.txt')).toBe(false);
    });
  });

  describe('docs/** pattern', () => {
    it('matches files at any depth under docs/', () => {
      const re = globToRegex('docs/**/*.md');
      expect(re.test('docs/adguard-config.md')).toBe(true);
      expect(re.test('docs/networking/adguard-config.md')).toBe(true);
    });

    it('does not match files outside docs/', () => {
      const re = globToRegex('docs/**/*.md');
      expect(re.test('README.md')).toBe(false);
      expect(re.test('src/docs/foo.md')).toBe(false);
    });
  });
});

describe('parseFrontmatter', () => {
  it('parses title and description', () => {
    const content = '---\ntitle: My Post\ndescription: A test post\n---\nBody text here.';
    const { data, body } = parseFrontmatter(content);
    expect(data.title).toBe('My Post');
    expect(data.description).toBe('A test post');
    expect(body.trim()).toBe('Body text here.');
  });

  it('returns empty data and raw content when no frontmatter', () => {
    const content = 'Just body text, no frontmatter.';
    const { data, body } = parseFrontmatter(content);
    expect(data).toEqual({});
    expect(body).toBe(content);
  });

  it('parses numeric and boolean values', () => {
    const content = '---\npriority: 42\ndraft: true\n---\n';
    const { data } = parseFrontmatter(content);
    expect(data.priority).toBe(42);
    expect(data.draft).toBe(true);
  });

  it('handles CRLF line endings', () => {
    const content = '---\r\ntitle: CRLF Post\r\n---\r\nBody.';
    const { data, body } = parseFrontmatter(content);
    expect(data.title).toBe('CRLF Post');
    expect(body).toBe('Body.');
  });

  it('handles empty body after frontmatter', () => {
    const content = '---\ntitle: No Body\n---\n';
    const { data, body } = parseFrontmatter(content);
    expect(data.title).toBe('No Body');
    expect(body).toBe('');
  });
});
