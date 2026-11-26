import type { APIRoute } from 'astro';
import { getPosts, isoDate, postUrl } from '../lib/news';

export const GET: APIRoute = async ({ site }) => {
  const base = site ?? new URL('https://oneflamegame.com');
  const posts = await getPosts();
  const newsPages = Math.max(1, Math.ceil(posts.length / 7));
  const pages: { path: string; lastmod?: string }[] = [
    { path: '/' },
    ...Array.from({ length: newsPages }, (_, i) => ({ path: i === 0 ? '/news/' : `/news/${i + 1}/` })),
    ...posts.map((post) => ({ path: postUrl(post), lastmod: isoDate(post.data.date) })),
    { path: '/rance9/' },
    { path: '/download/' },
    { path: '/terms/' },
    { path: '/privacy/' },
  ];
  const urls = pages
    .map(({ path, lastmod }) => `<url><loc>${new URL(path, base).href.toLowerCase()}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`)
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
