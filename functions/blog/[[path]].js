/* Blog dynamique : /blog/ et /blog/:slug/ servis depuis la base D1.
   Sans base branchée, les pages statiques générées au build sont servies. */
import { getDB, getPost, listPublished } from '../_lib/db.js';
import { html } from '../_lib/util.js';
import { R, notFound, renderPage } from '../_lib/render.js';

export async function onRequestGet(ctx) {
  let db = null;
  try { db = await getDB(ctx.env); } catch { db = null; }
  if (!db) return ctx.next();

  const url = new URL(ctx.request.url);
  const parts = (ctx.params.path || []).filter(Boolean);

  if (parts.length === 0) {
    if (!url.pathname.endsWith('/')) return Response.redirect(url.origin + '/blog/' + url.search, 301);
    return html(renderPage(R.indexPage(await listPublished(db))));
  }
  if (parts.length === 1 && !parts[0].includes('.')) {
    if (!url.pathname.endsWith('/')) return Response.redirect(`${url.origin}/blog/${parts[0]}/${url.search}`, 301);
    const post = await getPost(db, parts[0]);
    if (!post || post.status !== 'published') return notFound(ctx);
    return html(renderPage(R.articlePage(post, await listPublished(db, 30))));
  }
  return ctx.next();
}
