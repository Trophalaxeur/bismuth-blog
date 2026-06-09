import type { CollectionEntry } from 'astro:content';
import { getCollection } from 'astro:content';

export type PostEntry = CollectionEntry<'postFr'> | CollectionEntry<'postEn'>;

/** Derives the URL slug from a collection entry ID.
 * Handles GitHub loader format (articles/[slug]/[lang]/index.md) and legacy glob format. */
export function getPostSlug(id: string): string {
  const githubMatch = id.match(/^articles\/([^/]+)\/(?:fr|en)\/index\.(?:md|mdx)$/);
  if (githubMatch) return githubMatch[1];
  return id.replace(/\/index\.(md|mdx)$/, '').replace(/\.(md|mdx)$/, '');
}

/** Note: this function filters out draft posts based on the environment */
export async function getAllPosts() {
  return await getCollection('postFr', ({ data }) => {
    return import.meta.env.PROD ? data.draft !== true : true;
  });
}

export async function getAllPostsEn() {
  return await getCollection('postEn', ({ data }) => {
    return import.meta.env.PROD ? data.draft !== true : true;
  });
}

export function sortMDByDate(posts: Array<PostEntry>) {
  return posts.sort((a, b) => {
    const aDate = new Date(a.data.updatedDate ?? a.data.publishDate).valueOf();
    const bDate = new Date(b.data.updatedDate ?? b.data.publishDate).valueOf();
    return bDate - aDate;
  });
}

/** Note: This function doesn't filter draft posts, pass it the result of getAllPosts above to do so. */
export function getAllTags(posts: Array<PostEntry>) {
  return posts.flatMap((post) => [...post.data.tags]);
}

/** Note: This function doesn't filter draft posts, pass it the result of getAllPosts above to do so. */
export function getUniqueTags(posts: Array<PostEntry>) {
  return [...new Set(getAllTags(posts))];
}

/** Note: This function doesn't filter draft posts, pass it the result of getAllPosts above to do so. */
export function getUniqueTagsWithCount(posts: Array<PostEntry>): Array<[string, number]> {
  return [...getAllTags(posts).reduce((acc, t) => acc.set(t, (acc.get(t) || 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1]);
}
