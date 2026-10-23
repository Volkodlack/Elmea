/* GET /media/:id – images envoyées depuis l'espace admin */
import { getDB } from '../_lib/db.js';

export async function onRequestGet({ params, env }) {
  const db = await getDB(env).catch(() => null);
  if (!db || !/^[a-f0-9]{20}\.(jpg|png|webp)$/.test(params.id)) return new Response('Introuvable', { status: 404 });
  const r = await db.prepare(`SELECT mime, data FROM media WHERE id = ?`).bind(params.id).first();
  if (!r) return new Response('Introuvable', { status: 404 });
  const bin = atob(r.data);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return new Response(out, { headers: { 'Content-Type': r.mime, 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'" } });
}
