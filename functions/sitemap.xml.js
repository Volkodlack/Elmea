/* Sitemap dynamique : pages fixes + articles publiés dans la base D1 */
import { getDB, listPublished } from './_lib/db.js';
import { STATIC_PAGES } from './_lib/generated.js';
import { SITE } from '../src/config.mjs';

export async function onRequestGet(ctx) {
  let db = null;
  try { db = await getDB(ctx.env); } catch { db = null; }
  if (!db) return ctx.next();
  const posts = await listPublished(db);
  const lastPost = posts[0]?.date;
  const urls = [
    ...STATIC_PAGES,
    { path: '/blog/', lastmod: lastPost, priority: '0.7' },
    ...posts.map((p) => ({ path: `/blog/${p.slug}/`, lastmod: p.updated || p.date, priority: '0.6' }))
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE.url}${u.path}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<priority>${u.priority}</priority></url>`).join('\n')}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
