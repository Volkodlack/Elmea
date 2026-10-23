/* Protège toutes les routes /api/admin/* (sauf la connexion) */
import { getDB } from '../../_lib/db.js';
import { isAuthenticated } from '../../_lib/auth.js';
import { json } from '../../_lib/util.js';

export async function onRequest(ctx) {
  try {
    const url = new URL(ctx.request.url);
    const { pathname } = url;
    // Protection CSRF : toute requête qui modifie des données doit venir du site lui-même
    if (!['GET', 'HEAD'].includes(ctx.request.method)) {
      const origin = ctx.request.headers.get('Origin');
      if (!origin || new URL(origin).host !== url.host) return json({ error: 'origin', message: 'Requête refusée.' }, 403);
    }
    const db = await getDB(ctx.env);
    if (!db) return json({ error: 'nodb', message: 'La base de données D1 n’est pas encore branchée (liaison « DB »).' }, 503);
    ctx.data.db = db;
    if (pathname === '/api/admin/login') return await ctx.next();
    if (!(await isAuthenticated(ctx.request, db, ctx.env))) return json({ error: 'auth', message: 'Session expirée, reconnectez-vous.' }, 401);
    return await ctx.next();
  } catch (e) {
    return json({ error: 'server', message: 'Erreur serveur : ' + (e && e.message) }, 500);
  }
}
