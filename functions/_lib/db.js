/* Base de données Cloudflare D1 (liaison « DB »).
   Les tables sont créées automatiquement au premier appel,
   et les articles d'origine du site y sont recopiés une seule fois. */
import { SEED_POSTS, PHOTO_MAP } from './generated.js';
import { randomHex, rowToPost } from './util.js';

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT)`,
  `CREATE TABLE IF NOT EXISTS posts (
     slug TEXT PRIMARY KEY, title TEXT NOT NULL, cat TEXT, date TEXT, read_min INTEGER,
     image TEXT, description TEXT, excerpt TEXT, body TEXT,
     status TEXT NOT NULL DEFAULT 'published', created_at TEXT, updated_at TEXT)`,
  `CREATE INDEX IF NOT EXISTS posts_status_date ON posts(status, date)`,
  `CREATE TABLE IF NOT EXISTS hits (
     id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER, day TEXT, type TEXT, name TEXT,
     path TEXT, ref TEXT, device TEXT, country TEXT, vid TEXT)`,
  `CREATE INDEX IF NOT EXISTS hits_day_type ON hits(day, type)`,
  `CREATE TABLE IF NOT EXISTS media (id TEXT PRIMARY KEY, mime TEXT, data TEXT, size INTEGER, created_at TEXT)`,
  `CREATE TABLE IF NOT EXISTS login_attempts (ip TEXT, ts INTEGER)`
];

let ready = null;
let secretCache = null;

async function init(db) {
  await db.batch(SCHEMA.map((q) => db.prepare(q)));
  const seeded = await db.prepare(`SELECT v FROM meta WHERE k = 'seeded'`).first();
  if (seeded) return migratePhotos(db);
  const now = new Date().toISOString();
  const ins = `INSERT OR IGNORE INTO posts (slug, title, cat, date, read_min, image, description, excerpt, body, status, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?)`;
  const stmts = SEED_POSTS.map((p) => db.prepare(ins).bind(p.slug, p.title, p.cat, p.date, p.read, p.image, p.description, p.excerpt, p.body, now, now));
  stmts.push(db.prepare(`INSERT OR IGNORE INTO meta (k, v) VALUES ('secret', ?)`).bind(randomHex(32)));
  stmts.push(db.prepare(`INSERT OR IGNORE INTO meta (k, v) VALUES ('seeded', ?)`).bind(now));
  await db.batch(stmts);
}

/* Photos Unsplash → copies locales WebP (une seule fois par version) */
async function migratePhotos(db) {
  const ids = Object.keys(PHOTO_MAP);
  if (!ids.length) return;
  const ver = ids.join(',');
  const done = await db.prepare(`SELECT v FROM meta WHERE k = 'photos_local'`).first();
  if (done?.v === ver) return;
  await db.batch([
    ...ids.map((id) => db.prepare(`UPDATE posts SET image = ? WHERE instr(image, ?) > 0`).bind(PHOTO_MAP[id], `images.unsplash.com/${id}`)),
    db.prepare(`INSERT INTO meta (k, v) VALUES ('photos_local', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v`).bind(ver)
  ]);
}

/* Renvoie la base prête à l'emploi, ou null si elle n'est pas branchée */
export async function getDB(env) {
  if (!env.DB) return null;
  if (!ready) ready = init(env.DB).catch((e) => { ready = null; throw e; });
  await ready;
  return env.DB;
}

export async function getSecret(db, env) {
  if (env.SESSION_SECRET) return env.SESSION_SECRET;
  if (!secretCache) secretCache = (await db.prepare(`SELECT v FROM meta WHERE k = 'secret'`).first())?.v;
  return secretCache;
}

const LIST_COLS = 'slug, title, cat, date, read_min, image, description, excerpt, status, updated_at';

export async function listPublished(db, limit = 500) {
  const { results } = await db.prepare(`SELECT ${LIST_COLS} FROM posts WHERE status = 'published' ORDER BY date DESC, created_at DESC LIMIT ?`).bind(limit).all();
  return results.map(rowToPost);
}

export async function listAll(db) {
  const { results } = await db.prepare(`SELECT * FROM posts ORDER BY date DESC, created_at DESC`).all();
  return results.map(rowToPost);
}

export async function getPost(db, slug) {
  const r = await db.prepare(`SELECT * FROM posts WHERE slug = ?`).bind(slug).first();
  return r ? rowToPost(r) : null;
}
