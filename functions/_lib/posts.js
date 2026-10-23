/* Validation commune pour la création / modification d'articles */
import { clip, parisDay, readingMinutes, sanitizeHtml, slugify } from './util.js';
import { SITE_URL } from './generated.js';
import { SITE } from '../../src/config.mjs';

/* Signale immédiatement une page nouvelle ou modifiée à Bing & co (IndexNow) */
export function pingIndexNow(ctx, slug) {
  const urls = [`${SITE_URL}/blog/${slug}/`, `${SITE_URL}/blog/`, `${SITE_URL}/`];
  ctx.waitUntil(fetch('https://api.indexnow.org/indexnow', {
    method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: new URL(SITE_URL).host, key: SITE.indexNowKey, keyLocation: `${SITE_URL}/${SITE.indexNowKey}.txt`, urlList: urls })
  }).catch(() => {}));
}

export function validatePost(input) {
  const title = clip(input.title, 160);
  const body = sanitizeHtml(input.body);
  const errors = [];
  if (title.length < 5) errors.push('Le titre doit contenir au moins 5 caractères.');
  if (body.replace(/<[^>]+>/g, '').trim().length < 30) errors.push('Le contenu de l’article est trop court.');
  const slug = slugify(input.slug || title);
  if (!slug) errors.push('Adresse (slug) invalide.');
  const date = /^\d{4}-\d{2}-\d{2}$/.test(input.date || '') ? input.date : parisDay();
  const plain = body.replace(/<h[23][^>]*>[\s\S]*?<\/h[23]>/g, ' ').replace(/<\/?(strong|em|u|a)\b[^>]*>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').replace(/\s+([.,])/g, '$1').trim();
  const excerpt = clip(input.excerpt, 300) || clip(plain, 220).replace(/\s+\S*$/, '') + '…';
  const description = clip(input.description, 170) || clip(excerpt, 160);
  let image = clip(input.image, 500);
  if (image && !/^(https:\/\/|\/media\/|\/assets\/)/.test(image)) image = '';
  return {
    errors,
    post: {
      slug, title, body, date, excerpt, description, image,
      cat: clip(input.cat, 40) || 'Actualités',
      read: readingMinutes(body),
      status: input.status === 'draft' ? 'draft' : 'published'
    }
  };
}
