import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'news'>;

/** Every post, newest first. Drafts show only on the development server. */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('news', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf() || a.id.localeCompare(b.id));
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/** NOV 21, 2026 */
export const shortDate = (d: Date) => `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;

/** 2026-11-21 */
export const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export const postUrl = (post: Post) => `/news/${post.id}/`;
