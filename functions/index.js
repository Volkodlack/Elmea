/* Page d'accueil : la rubrique « Derniers conseils » reflète les articles de la base D1 */
import { listPublished, getDB } from './_lib/db.js';
import { R } from './_lib/render.js';

export async function onRequestGet(ctx) {
  const res = await ctx.next();
  try {
    const db = await getDB(ctx.env);
    if (!db || !(res.headers.get('Content-Type') || '').includes('text/html')) return res;
    const latest = await listPublished(db, 3);
    const cards = latest.map((p) => R.card(p)).join('');
    return new HTMLRewriter().on('#latestPosts', { element(el) { el.setInnerContent(cards, { html: true }); } }).transform(res);
  } catch {
    return res;
  }
}
