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

const SITE_HOSTS = new Set(['oneflamegame.com', 'www.oneflamegame.com']);

/** Makes links to other websites open in a new tab; links within OneFlameGame.com stay in the same tab. */
export function externalLinksInNewTab(html: string): string {
  return html.replace(/<a\b([^>]*)>/gi, (tag, attrs: string) => {
    const href = /\bhref\s*=\s*"([^"]*)"/i.exec(attrs)?.[1] ?? '';
    let host = '';
    try {
      if (/^https?:\/\//i.test(href)) host = new URL(href).hostname.toLowerCase();
    } catch {
      return tag;
    }
    if (!host || SITE_HOSTS.has(host)) return tag;
    let out = attrs.replace(/\s*\btarget\s*=\s*"[^"]*"/i, '');
    const rel = /\brel\s*=\s*"([^"]*)"/i.exec(out);
    if (rel) {
      const words = new Set(rel[1].split(/\s+/).filter(Boolean));
      words.add('noopener');
      out = out.replace(rel[0], `rel="${[...words].join(' ')}"`);
    } else {
      out += ' rel="noopener"';
    }
    return `<a${out} target="_blank">`;
  });
}
