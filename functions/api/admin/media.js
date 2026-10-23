/* POST /api/admin/media – envoi d'une image (corps brut, image/jpeg|png|webp).
   L'image est redimensionnée dans le navigateur avant l'envoi. */
import { json, randomHex } from '../../_lib/util.js';

const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX = 1400 * 1024;

export async function onRequestPost({ request, data }) {
  const mime = (request.headers.get('Content-Type') || '').split(';')[0].trim();
  if (!TYPES[mime]) return json({ error: 'type', message: 'Format accepté : JPEG, PNG ou WebP.' }, 415);
  const buf = new Uint8Array(await request.arrayBuffer());
  if (!buf.length || buf.length > MAX) return json({ error: 'size', message: 'Image trop lourde (1,4 Mo maximum après compression).' }, 413);
  // Vérifie la signature réelle du fichier (pas seulement l'en-tête déclaré)
  const sig = [...buf.subarray(0, 12)];
  const isJpeg = sig[0] === 0xff && sig[1] === 0xd8 && sig[2] === 0xff;
  const isPng = sig[0] === 0x89 && sig[1] === 0x50 && sig[2] === 0x4e && sig[3] === 0x47;
  const isWebp = String.fromCharCode(...sig.slice(0, 4)) === 'RIFF' && String.fromCharCode(...sig.slice(8, 12)) === 'WEBP';
  if (!({ 'image/jpeg': isJpeg, 'image/png': isPng, 'image/webp': isWebp })[mime]) return json({ error: 'type', message: 'Le fichier n’est pas une image valide.' }, 415);
  let bin = '';
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
  const id = randomHex(10) + '.' + TYPES[mime];
  await data.db.prepare(`INSERT INTO media (id, mime, data, size, created_at) VALUES (?, ?, ?, ?, ?)`)
    .bind(id, mime, btoa(bin), buf.length, new Date().toISOString()).run();
  return json({ ok: true, url: '/media/' + id }, 201);
}
