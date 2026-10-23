/* Utilitaires partagés par les fonctions Cloudflare */

export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers }
  });

export const html = (body, status = 200) =>
  new Response(body, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=0, must-revalidate' }
  });

const enc = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

export const randomHex = (bytes = 16) => hex(crypto.getRandomValues(new Uint8Array(bytes)));

export async function sha256(text) {
  return hex(await crypto.subtle.digest('SHA-256', enc.encode(text)));
}

export async function hmac(secret, text) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, enc.encode(text)));
}

export async function pbkdf2(password, salt, iterations) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations }, key, 256);
  return hex(bits);
}

export function safeEqual(a, b) {
  a = String(a); b = String(b);
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

/* Date du jour à Paris, au format AAAA-MM-JJ */
const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' });
export const parisDay = (d = new Date()) => dayFmt.format(d);
export const daysAgo = (n) => parisDay(new Date(Date.now() - n * 86400000));

export function slugify(s) {
  return String(s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[’'"]/g, '-')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 80).replace(/-+$/g, '');
}

export function readingMinutes(htmlBody) {
  const words = String(htmlBody || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export const clip = (s, n) => String(s ?? '').trim().slice(0, n);

/* ---------- Nettoyage du HTML des articles (liste blanche) ---------- */
const ALLOWED = {
  p: [], h2: [], h3: [], ul: [], ol: [], li: [], strong: [], em: [], u: [],
  a: ['href'], blockquote: [], br: [], img: ['src', 'alt']
};
const RENAME = { b: 'strong', i: 'em', div: 'p', h1: 'h2', h4: 'h3', h5: 'h3', h6: 'h3' };

export function sanitizeHtml(input) {
  let s = String(input || '');
  s = s.replace(/<(script|style|iframe|object|embed|noscript|template|svg|math|form|textarea|select|button)\b[\s\S]*?<\/\1\s*>/gi, '');
  s = s.replace(/<!--[\s\S]*?-->/g, '');
  s = s.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (m, rawTag, attrs) => {
    let tag = rawTag.toLowerCase();
    tag = RENAME[tag] || tag;
    if (!ALLOWED[tag]) return '';
    if (m.startsWith('</')) return tag === 'br' || tag === 'img' ? '' : `</${tag}>`;
    let out = '';
    for (const name of ALLOWED[tag]) {
      const mm = attrs.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
      if (!mm) continue;
      let v = (mm[1] ?? mm[2] ?? mm[3] ?? '').trim().replace(/&amp;/g, '&');
      if ((name === 'href' || name === 'src') && !/^(https?:\/\/|\/(?!\/)|mailto:|tel:|#)/i.test(v)) continue;
      out += ` ${name}="${v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')}"`;
    }
    if (tag === 'a' && /href="https?:/i.test(out)) out += ' target="_blank" rel="noopener"';
    if (tag === 'img') { if (!/src=/.test(out)) return ''; out += ' loading="lazy"'; }
    return `<${tag}${out}>`;
  });
  s = s.replace(/<p>(\s|&nbsp;|<br>)*<\/p>/g, '').replace(/(<br>\s*){3,}/g, '<br><br>');
  return s.trim();
}

/* Ligne SQL -> objet article */
export const rowToPost = (r) => ({
  slug: r.slug, title: r.title, cat: r.cat || '', date: r.date, read: r.read_min || 1,
  image: r.image || '', description: r.description || '', excerpt: r.excerpt || '',
  body: r.body ?? '', status: r.status, updated: (r.updated_at || '').slice(0, 10)
});
