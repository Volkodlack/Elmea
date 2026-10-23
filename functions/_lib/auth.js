/* Authentification de l'espace admin.
   Mot de passe par défaut stocké sous forme d'empreinte (PBKDF2).
   Pour le changer sans toucher au code : variable secrète ADMIN_PASSWORD
   dans Cloudflare (Settings → Variables and secrets). */
import { getSecret } from './db.js';
import { hmac, pbkdf2, safeEqual, sha256 } from './util.js';

const DEFAULT_PASSWORD = {
  salt: 'd7fb3940428ffcb5714a0efe02db0c90',
  hash: '04b3bed947e6eadee91a479074dd1bc942e548eb33c96961e00d58724a2fd860',
  iterations: 100000
};

const COOKIE = 'elmea_admin';
const SESSION_DAYS = 7;
const MAX_ATTEMPTS = 8;          // essais ratés autorisés…
const WINDOW_MS = 15 * 60 * 1000; // …par tranche de 15 minutes et par adresse IP

export async function checkPassword(env, password) {
  if (env.ADMIN_PASSWORD) return safeEqual(await sha256(password), await sha256(env.ADMIN_PASSWORD));
  const h = await pbkdf2(password, DEFAULT_PASSWORD.salt, DEFAULT_PASSWORD.iterations);
  return safeEqual(h, DEFAULT_PASSWORD.hash);
}

export async function tooManyAttempts(db, ip) {
  const r = await db.prepare(`SELECT COUNT(*) n FROM login_attempts WHERE ip = ? AND ts > ?`).bind(ip, Date.now() - WINDOW_MS).first();
  return (r?.n || 0) >= MAX_ATTEMPTS;
}

export async function recordFailure(db, ip) {
  await db.batch([
    db.prepare(`INSERT INTO login_attempts (ip, ts) VALUES (?, ?)`).bind(ip, Date.now()),
    db.prepare(`DELETE FROM login_attempts WHERE ts < ?`).bind(Date.now() - 24 * 3600 * 1000)
  ]);
}

export async function clearFailures(db, ip) {
  await db.prepare(`DELETE FROM login_attempts WHERE ip = ?`).bind(ip).run();
}

const b64 = (s) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = (s) => atob(s.replace(/-/g, '+').replace(/_/g, '/'));

async function sessionVersion(db) {
  return Number((await db.prepare(`SELECT v FROM meta WHERE k = 'session_ver'`).first())?.v || 1);
}

/* Déconnexion : invalide toutes les sessions ouvertes */
export async function revokeSessions(db) {
  await db.prepare(`INSERT INTO meta (k, v) VALUES ('session_ver', '2') ON CONFLICT(k) DO UPDATE SET v = CAST(v AS INTEGER) + 1`).run();
}

export async function createSessionCookie(db, env, request) {
  const payload = b64(JSON.stringify({ exp: Date.now() + SESSION_DAYS * 86400000, v: await sessionVersion(db) }));
  const sig = await hmac(await getSecret(db, env), payload);
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${COOKIE}=${payload}.${sig}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_DAYS * 86400}${secure}`;
}

export const clearCookie = `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;

export async function isAuthenticated(request, db, env) {
  const cookie = request.headers.get('Cookie') || '';
  const m = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  if (!m) return false;
  const [payload, sig] = m[1].split('.');
  if (!payload || !sig) return false;
  const expected = await hmac(await getSecret(db, env), payload);
  if (!safeEqual(sig, expected)) return false;
  try {
    const data = JSON.parse(unb64(payload));
    return data.exp > Date.now() && data.v === (await sessionVersion(db));
  } catch { return false; }
}
