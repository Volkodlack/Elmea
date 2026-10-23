/* GET /api/admin/stats?days=30 – statistiques agrégées */
import { daysAgo, json, parisDay } from '../../_lib/util.js';

export async function onRequestGet({ request, data }) {
  const db = data.db;
  const days = [7, 30, 90, 365].includes(Number(new URL(request.url).searchParams.get('days'))) ? Number(new URL(request.url).searchParams.get('days')) : 30;
  const start = daysAgo(days - 1);
  const prevStart = daysAgo(2 * days - 1);
  const today = parisDay();
  const V = `COUNT(DISTINCT day || vid)`;
  const q = (sql, ...b) => db.prepare(sql).bind(...b);

  const res = await db.batch([
    q(`SELECT day, COUNT(*) pv, COUNT(DISTINCT vid) v FROM hits WHERE type = 'pv' AND day >= ?1 GROUP BY day`, start),
    q(`SELECT COUNT(*) pv, ${V} v FROM hits WHERE type = 'pv' AND day >= ?1`, start),
    q(`SELECT COUNT(*) pv, ${V} v FROM hits WHERE type = 'pv' AND day >= ?1 AND day < ?2`, prevStart, start),
    q(`SELECT name, COUNT(*) n FROM hits WHERE type = 'ev' AND day >= ?1 GROUP BY name`, start),
    q(`SELECT name, COUNT(*) n FROM hits WHERE type = 'ev' AND day >= ?1 AND day < ?2 GROUP BY name`, prevStart, start),
    q(`SELECT path, COUNT(*) pv, ${V} v FROM hits WHERE type = 'pv' AND day >= ?1 GROUP BY path ORDER BY pv DESC LIMIT 10`, start),
    q(`SELECT ref, ${V} v FROM hits WHERE type = 'pv' AND day >= ?1 AND ref != '(interne)' GROUP BY ref ORDER BY v DESC LIMIT 8`, start),
    q(`SELECT device, ${V} v FROM hits WHERE type = 'pv' AND day >= ?1 GROUP BY device ORDER BY v DESC`, start),
    q(`SELECT country, ${V} v FROM hits WHERE type = 'pv' AND day >= ?1 GROUP BY country ORDER BY v DESC LIMIT 8`, start),
    q(`SELECT COUNT(*) pv, COUNT(DISTINCT vid) v FROM hits WHERE type = 'pv' AND day = ?1`, today)
  ]);
  const r = (i) => res[i].results || [];

  const byDay = Object.fromEntries(r(0).map((x) => [x.day, x]));
  const series = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = daysAgo(i);
    series.push({ day: d, pv: byDay[d]?.pv || 0, v: byDay[d]?.v || 0 });
  }
  const ev = Object.fromEntries(r(3).map((x) => [x.name, x.n]));
  const evPrev = Object.fromEntries(r(4).map((x) => [x.name, x.n]));
  const contacts = (o) => ['whatsapp', 'telephone', 'email', 'formulaire'].reduce((s, k) => s + (o[k] || 0), 0);

  return json({
    days, start, today,
    series,
    totals: { pv: r(1)[0]?.pv || 0, v: r(1)[0]?.v || 0, contacts: contacts(ev) },
    previous: { pv: r(2)[0]?.pv || 0, v: r(2)[0]?.v || 0, contacts: contacts(evPrev) },
    todayStats: r(9)[0] || { pv: 0, v: 0 },
    events: ev,
    pages: r(5),
    sources: r(6),
    devices: r(7),
    countries: r(8)
  });
}
