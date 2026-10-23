/* Rendu des pages du blog côté Cloudflare, à partir du gabarit généré au build */
import { TEMPLATE, ICONS, SITE_URL } from './generated.js';
import { SITE as BASE } from '../../src/config.mjs';

const SITE = { ...BASE, url: SITE_URL };
import { createBlogRenderer, esc } from '../../src/blog-render.mjs';

const ic = (name, cls = 'w-5 h-5') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${cls}" aria-hidden="true">${ICONS[name] || ''}</svg>`;

export const R = createBlogRenderer({ ic, SITE });

export function renderPage(pg) {
  const ld = (pg.ld || []).map((o) => `\n  <script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('');
  const vals = {
    TITLE: esc(pg.title),
    DESC: esc(pg.description),
    PATH: pg.path,
    OGTYPE: pg.ogType || 'website',
    OGIMAGE: esc(pg.ogImage || SITE.url + '/assets/img/og-image.jpg'),
    HEAD: (pg.head || '') + ld,
    BODY: pg.body
  };
  return TEMPLATE.replace(/%%(TITLE|DESC|PATH|OGTYPE|OGIMAGE|HEAD|BODY)%%/g, (_, k) => vals[k]);
}

export async function notFound(ctx) {
  const r = await ctx.env.ASSETS.fetch(new URL('/404', ctx.request.url));
  return new Response(r.body, { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
