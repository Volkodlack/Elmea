/* POST /api/track – mesure d'audience interne, sans cookie.
   Aucune adresse IP n'est stockée : un identifiant haché, renouvelé
   chaque jour, sert uniquement à compter les visites. */
import { getDB, getSecret } from '../_lib/db.js';
import { daysAgo, parisDay, sha256 } from '../_lib/util.js';

const BOT = /bot|crawl|spider|slurp|headless|lighthouse|pingdom|preview|facebookexternalhit|curl|wget|python|axios|node-fetch/i;
const EVENTS = new Set(['whatsapp', 'telephone', 'email', 'formulaire', 'facebook', 'instagram']);
const SOURCES = [
  [/google\./, 'Google'], [/bing\./, 'Bing'], [/duckduckgo\./, 'DuckDuckGo'], [/qwant\./, 'Qwant'],
  [/ecosia\./, 'Ecosia'], [/yahoo\./, 'Yahoo'], [/(^|\.)(facebook\.com|fb\.com|fb\.me)$/, 'Facebook'],
  [/instagram\.com$/, 'Instagram'], [/(linkedin\.com|lnkd\.in)$/, 'LinkedIn'], [/(t\.co|twitter\.com|x\.com)$/, 'X (Twitter)'],
  [/(wa\.me|whatsapp\.com)$/, 'WhatsApp'], [/chatgpt\.com|openai\.com/, 'ChatGPT'], [/pagesjaunes\./, 'PagesJaunes']
];

function source(ref, utm, host) {
  if (utm) return utm.slice(0, 40);
  if (!ref) return '';
  let h;
  try { h = new URL(ref).hostname.replace(/^www\./, ''); } catch { return ''; }
  if (h === host.replace(/^www\./, '')) return '(interne)';
  for (const [re, name] of SOURCES) if (re.test(h)) return name;
  return h.slice(0, 60);
}

export async function onRequestPost({ request, env, waitUntil }) {
  try {
    const ua = request.headers.get('User-Agent') || '';
    if (!ua || BOT.test(ua)) return new Response(null, { status: 204 });
    const db = await getDB(env);
    if (!db) return new Response(null, { status: 204 });

    const raw = await request.text();
    if (raw.length > 2000) return new Response(null, { status: 413 });
    const d = JSON.parse(raw);
    const type = d.t === 'ev' ? 'ev' : 'pv';
    const name = type === 'ev' ? String(d.n || '') : '';
    if (type === 'ev' && !EVENTS.has(name)) return new Response(null, { status: 204 });

    let path = String(d.p || '/').split('?')[0].slice(0, 200);
    if (!path.startsWith('/') || path.startsWith('/admin') || path.startsWith('/api')) return new Response(null, { status: 204 });
    if (!path.endsWith('/') && !path.includes('.')) path += '/';

    const url = new URL(request.url);
    const w = Number(d.w) || 0;
    const device = /Mobi|Android.+Mobile|iPhone/i.test(ua) || (w && w < 768) ? 'mobile' : (/iPad|Tablet/i.test(ua) || (w && w < 1100) ? 'tablette' : 'ordinateur');
    const country = (request.cf && request.cf.country) || '';
    const ip = request.headers.get('CF-Connecting-IP') || '';
    const day = parisDay();
    const vid = (await sha256(`${day}|${ip}|${ua}|${await getSecret(db, env)}`)).slice(0, 16);
    const ref = type === 'pv' ? source(String(d.r || ''), String(d.s || ''), url.hostname) : '';

    await db.prepare(`INSERT INTO hits (ts, day, type, name, path, ref, device, country, vid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(Date.now(), day, type, name, path, ref, device, country, vid).run();

    // Nettoyage occasionnel : conservation 13 mois
    if (Math.random() < 0.01) waitUntil(db.prepare(`DELETE FROM hits WHERE day < ?`).bind(daysAgo(396)).run());
    return new Response(null, { status: 204 });
  } catch (e) {
    return new Response(null, { status: 204 });
  }
}
