/* GET / PUT / DELETE /api/admin/posts/:slug */
import { getPost } from '../../../_lib/db.js';
import { validatePost } from '../../../_lib/posts.js';
import { json } from '../../../_lib/util.js';

export async function onRequestGet({ params, data }) {
  const post = await getPost(data.db, params.slug);
  return post ? json({ post }) : json({ error: 'notfound', message: 'Article introuvable.' }, 404);
}

export async function onRequestPut({ request, params, data }) {
  const db = data.db;
  const current = await getPost(db, params.slug);
  if (!current) return json({ error: 'notfound', message: 'Article introuvable.' }, 404);
  const { errors, post } = validatePost(await request.json().catch(() => ({})));
  if (errors.length) return json({ error: 'invalid', message: errors.join(' ') }, 400);
  if (post.slug !== current.slug && (await getPost(db, post.slug))) {
    return json({ error: 'slug', message: 'Cette adresse est déjà utilisée par un autre article.' }, 409);
  }
  await db.prepare(`UPDATE posts SET slug = ?, title = ?, cat = ?, date = ?, read_min = ?, image = ?, description = ?, excerpt = ?, body = ?, status = ?, updated_at = ? WHERE slug = ?`)
    .bind(post.slug, post.title, post.cat, post.date, post.read, post.image, post.description, post.excerpt, post.body, post.status, new Date().toISOString(), current.slug).run();
  return json({ ok: true, post: await getPost(db, post.slug) });
}

export async function onRequestDelete({ params, data }) {
  const r = await data.db.prepare(`DELETE FROM posts WHERE slug = ?`).bind(params.slug).run();
  return r.meta.changes ? json({ ok: true }) : json({ error: 'notfound', message: 'Article introuvable.' }, 404);
}
