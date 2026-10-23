/* ==========================================================
   Rendu du blog – partagé entre le générateur statique (build.mjs)
   et les fonctions Cloudflare (blog dynamique alimenté par D1).
   Un « post » : { slug, title, cat, date, read, image, description, excerpt, body }
   ========================================================== */

export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export const fmtDate = (d) => {
  try { return new Date(d + 'T12:00:00Z').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' }); }
  catch { return d; }
};

/* Vignette plus légère pour les photos Unsplash */
const LOCAL_W = [400, 800, 1200, 1600];
export const thumb = (url, w = 700) => {
  url = url || '';
  if (/images\.unsplash\.com/.test(url)) return url.replace(/([?&])w=\d+/, `$1w=${w}`);
  const m = url.match(/^(\/assets\/img\/photos\/[a-z]+)-\d+\.webp$/);
  if (m) return `${m[1]}-${LOCAL_W.find((x) => x >= w) || 1600}.webp`;
  return url;
};

export function createBlogRenderer({ ic, SITE }) {
  const abs = (p) => SITE.url + p;
  const contactUrl = (service) => '/contact/' + (service ? '?service=' + encodeURIComponent(service) : '');

  const img = (url, w, alt, cls, eager = false) => url
    ? `<img src="${esc(thumb(url, w))}" alt="${esc(alt)}" class="${cls}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" data-fallback>`
    : '';

  function breadcrumb(items) {
    return `<nav aria-label="Fil d’Ariane" class="text-sm text-ink/60">
    <ol class="flex flex-wrap items-center gap-1.5">${items.map(([name, p], i) =>
      i < items.length - 1
        ? `<li><a href="${p}" class="hover:text-terra">${esc(name)}</a></li><li aria-hidden="true">${ic('chevron-right', 'w-3.5 h-3.5')}</li>`
        : `<li aria-current="page" class="text-forest font-medium">${esc(name)}</li>`).join('')}</ol></nav>`;
  }

  const breadcrumbLd = (items) => ({
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, p], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(p) }))
  });

  const ctaBlock = (title = 'Discutons de vos besoins !', text = 'Premier échange gratuit et sans engagement pour définir ensemble la formule la plus adaptée.', service = '') => `
<section class="py-20">
  <div class="max-w-5xl mx-auto px-4 reveal">
    <div class="relative overflow-hidden rounded-[2rem] bg-terra text-white p-10 sm:p-14 text-center">
      <div class="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10" aria-hidden="true"></div>
      <div class="absolute -left-10 -bottom-16 w-56 h-56 rounded-full bg-white/10" aria-hidden="true"></div>
      <p class="font-script text-5xl relative">${title}</p>
      <p class="mt-4 text-white/90 max-w-xl mx-auto relative">${text}</p>
      <div class="mt-8 flex flex-col sm:flex-row gap-3 justify-center relative">
        <a href="${contactUrl(service)}" class="bg-white text-terra px-7 py-4 rounded-full font-semibold hover:bg-forest hover:text-white transition">Demander un devis gratuit</a>
        <a href="tel:${SITE.phoneIntl}" class="border border-white/60 px-7 py-4 rounded-full font-semibold hover:bg-white/10 transition inline-flex items-center justify-center gap-2">${ic('phone')} ${SITE.phone}</a>
      </div>
    </div>
  </div>
</section>`;

  const card = (a, h = 'h3') => `
<article class="group bg-white rounded-3xl overflow-hidden shadow-soft flex flex-col reveal" data-cat="${esc(a.cat)}">
  <a href="/blog/${esc(a.slug)}/" class="block h-52 img-fallback overflow-hidden" tabindex="-1" aria-hidden="true">${img(a.image, 700, '', 'w-full h-full object-cover group-hover:scale-105 transition duration-500')}</a>
  <div class="p-7 flex flex-col flex-1">
    <div class="flex flex-wrap items-center gap-3 text-xs text-ink/60">
      <span class="px-2.5 py-1 rounded-full bg-terra-soft text-terra font-medium">${esc(a.cat)}</span>
      <time datetime="${esc(a.date)}">${fmtDate(a.date)}</time><span>· ${Number(a.read) || 1} min</span>
    </div>
    <${h} class="font-serif text-2xl text-forest font-semibold mt-4 leading-snug"><a href="/blog/${esc(a.slug)}/" class="hover:text-terra">${esc(a.title)}</a></${h}>
    <p class="text-[15px] text-ink/70 mt-3 leading-relaxed flex-1">${esc(a.excerpt)}</p>
    <a href="/blog/${esc(a.slug)}/" class="mt-5 inline-flex items-center gap-2 text-terra font-medium group-hover:gap-3 transition-all">Lire l’article ${ic('arrow-right', 'w-4 h-4')}<span class="sr-only"> : ${esc(a.title)}</span></a>
  </div>
</article>`;

  /* ---------- Page liste du blog ---------- */
  function indexPage(posts) {
    const crumbs = [['Accueil', '/'], ['Blog', '/blog/']];
    const cats = ['Tous', ...new Set(posts.map((a) => a.cat).filter(Boolean))];
    const body = `
<section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 lg:pb-24">
  ${breadcrumb(crumbs)}
  <div class="text-center max-w-2xl mx-auto mt-10">
    <p class="eyebrow">Blog &amp; actualités</p>
    <h1 class="font-serif text-5xl text-forest font-semibold mt-3 leading-tight">Conseils pour une gestion administrative sereine</h1>
    <p class="mt-4 text-ink/70">Astuces, réglementation et bonnes pratiques pour les dirigeants de PME, artisans et entreprises du BTP.</p>
  </div>
  ${cats.length > 2 ? `<div class="mt-10 flex flex-wrap justify-center gap-2" id="blogFilters" role="group" aria-label="Filtrer par catégorie">
    ${cats.map((c, i) => `<button type="button" data-filter="${esc(c)}" aria-pressed="${i === 0}" class="px-4 py-2 rounded-full text-sm border transition ${i === 0 ? 'bg-forest text-cream border-forest' : 'border-forest/15 text-forest hover:border-terra hover:text-terra'}">${esc(c)}</button>`).join('\n    ')}
  </div>` : ''}
  ${posts.length ? `<div id="blogGrid" class="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-7">${posts.map((a) => card(a, 'h2')).join('')}</div>`
    : '<p class="mt-16 text-center text-ink/60">Les premiers articles arrivent très bientôt.</p>'}
</section>
${ctaBlock('Une question sur votre situation ?', 'Chaque entreprise est différente : parlons de la vôtre lors d’un premier échange gratuit.')}`;
    return {
      path: '/blog/',
      title: 'Blog : conseils en gestion administrative, ADV et appels d’offres BTP | Élméa Solutions',
      description: 'Conseils pratiques pour dirigeants de PME et du BTP : facturation, relances d’impayés, variables de paie, mémoire technique et dossiers d’appels d’offres.',
      body,
      ld: [breadcrumbLd(crumbs), {
        '@context': 'https://schema.org', '@type': 'Blog', name: 'Blog Élméa Solutions', url: abs('/blog/'), publisher: { '@id': SITE.url + '/#business' },
        blogPost: posts.map((a) => ({ '@type': 'BlogPosting', headline: a.title, url: abs('/blog/' + a.slug + '/'), datePublished: a.date }))
      }]
    };
  }

  /* ---------- Page article ---------- */
  function articlePage(a, all) {
    const ap = '/blog/' + a.slug + '/';
    const crumbs = [['Accueil', '/'], ['Blog', '/blog/'], [a.title, ap]];
    const related = all.filter((x) => x.slug !== a.slug).sort((x, y) => (y.cat === a.cat) - (x.cat === a.cat)).slice(0, 3);
    const body = `
<article>
  <header class="max-w-3xl mx-auto px-4 sm:px-6 pt-8">
    ${breadcrumb(crumbs)}
    <div class="mt-10 flex flex-wrap items-center gap-3 text-sm text-ink/60">
      <span class="px-3 py-1 rounded-full bg-terra-soft text-terra font-medium">${esc(a.cat)}</span>
      <time datetime="${esc(a.date)}">${fmtDate(a.date)}</time><span>· ${Number(a.read) || 1} min de lecture</span>
    </div>
    <h1 class="font-serif text-4xl sm:text-5xl text-forest font-semibold mt-4 leading-tight">${esc(a.title)}</h1>
    <p class="mt-5 text-lg text-ink/75 leading-relaxed">${esc(a.excerpt)}</p>
    <p class="mt-6 flex items-center gap-3 text-sm"><img src="/assets/img/logo-mark.png" alt="" width="40" height="40" class="w-10 h-10 rounded-full bg-white p-1 shadow-soft"><span>Par <strong class="text-forest">${esc(SITE.owner)}</strong>, ${esc(SITE.role.toLowerCase())}</span></p>
  </header>
  ${a.image ? `<div class="max-w-5xl mx-auto px-4 sm:px-6 mt-10"><div class="aspect-[16/8] rounded-[2rem] overflow-hidden shadow-soft img-fallback">${img(a.image, 1200, a.title, 'w-full h-full object-cover', true)}</div></div>` : ''}
  <div class="max-w-3xl mx-auto px-4 sm:px-6 py-14">
    <div class="prose-elmea">${a.body}</div>
    <aside class="mt-14 rounded-3xl bg-forest text-cream p-8 sm:p-10 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
      <div class="flex-1"><p class="font-script text-terra-light text-4xl">Besoin d’un coup de main ?</p><p class="mt-2 text-cream/85">Vous gérez votre activité, je m’occupe du reste. Premier échange gratuit et sans engagement.</p></div>
      <a href="/contact/" class="shrink-0 bg-terra text-white px-6 py-3 rounded-full font-medium hover:bg-white hover:text-forest transition inline-flex items-center gap-2">Me contacter ${ic('arrow-right', 'w-4 h-4')}</a>
    </aside>
    <p class="mt-8"><a href="/blog/" class="inline-flex items-center gap-2 text-terra font-medium">${ic('arrow-left', 'w-4 h-4')} Retour au blog</a></p>
  </div>
</article>
${related.length ? `<section class="bg-white/60 py-16" aria-labelledby="related-title">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <h2 id="related-title" class="font-serif text-3xl text-forest font-semibold">À lire aussi</h2>
    <div class="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-7">${related.map((r) => card(r)).join('')}</div>
  </div>
</section>` : ''}`;
    const image = a.image ? (a.image.startsWith('http') ? a.image : abs(a.image)) : abs('/assets/img/og-image.jpg');
    return {
      path: ap,
      title: a.title + ' | Élméa Solutions',
      description: a.description || a.excerpt,
      body, ogType: 'article', ogImage: image,
      head: `\n  <meta property="article:published_time" content="${esc(a.date)}">\n  <meta property="article:section" content="${esc(a.cat)}">`,
      ld: [breadcrumbLd(crumbs), {
        '@context': 'https://schema.org', '@type': 'BlogPosting', headline: a.title, description: a.description || a.excerpt, image,
        datePublished: a.date, dateModified: a.updated || a.date, inLanguage: 'fr-FR', mainEntityOfPage: abs(ap),
        author: { '@type': 'Person', name: SITE.owner, jobTitle: SITE.role },
        publisher: { '@type': 'Organization', name: SITE.name, logo: { '@type': 'ImageObject', url: abs('/assets/img/logo-elmea.png') } }
      }]
    };
  }

  return { breadcrumb, breadcrumbLd, ctaBlock, card, indexPage, articlePage, contactUrl };
}
