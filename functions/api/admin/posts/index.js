/* GET  /api/admin/posts  – tous les articles (brouillons compris)
   POST /api/admin/posts  – créer un article */
import { getPost, listAll } from '../../../_lib/db.js';
import { pingIndexNow, validatePost } from '../../../_lib/posts.js';
import { json } from '../../../_lib/util.js';

export async function onRequestGet({ data }) {
  return json({ posts: await listAll(data.db) });
}

export async function onRequestPost(ctx) {
  const { request, data } = ctx;
  const db = data.db;
  const { errors, post } = validatePost(await request.json().catch(() => ({})));
  if (errors.length) return json({ error: 'invalid', message: errors.join(' ') }, 400);
  let slug = post.slug, n = 2;
  while (await getPost(db, slug)) slug = `${post.slug}-${n++}`;
  const now = new Date().toISOString();
  await db.prepare(`INSERT INTO posts (slug, title, cat, date, read_min, image, description, excerpt, body, status, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(slug, post.title, post.cat, post.date, post.read, post.image, post.description, post.excerpt, post.body, post.status, now, now).run();
  if (post.status === 'published') pingIndexNow(ctx, slug);
  return json({ ok: true, post: await getPost(db, slug) }, 201);
}
