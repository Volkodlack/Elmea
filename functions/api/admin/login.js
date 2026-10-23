import { checkPassword, clearFailures, createSessionCookie, recordFailure, tooManyAttempts } from '../../_lib/auth.js';
import { json } from '../../_lib/util.js';

export async function onRequestPost({ request, env, data }) {
  const db = data.db;
  const ip = request.headers.get('CF-Connecting-IP') || 'local';
  if (await tooManyAttempts(db, ip)) return json({ error: 'locked', message: 'Trop de tentatives. Réessayez dans 15 minutes.' }, 429);
  let password = '';
  try { password = String((await request.json()).password || ''); } catch {}
  if (!password || !(await checkPassword(env, password))) {
    await recordFailure(db, ip);
    return json({ error: 'bad', message: 'Mot de passe incorrect.' }, 401);
  }
  await clearFailures(db, ip);
  return json({ ok: true }, 200, { 'Set-Cookie': await createSessionCookie(db, env, request) });
}
