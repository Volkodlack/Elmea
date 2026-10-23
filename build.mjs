/* ==========================================================
   Élméa Solutions – générateur du site statique
   Usage : npm run build   (génère le dossier dist/)
   Toutes les infos modifiables sont dans SITE et PHOTOS ci-dessous.
   ========================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { icons } from 'lucide';
import { ARTICLES } from './src/articles.mjs';

/* ---------------------------------------------------------
   1. CONFIGURATION – à adapter avant la mise en ligne
--------------------------------------------------------- */
const SITE = {
  name: 'Élméa Solutions',
  url: 'https://www.elmea-solutions.fr',          // domaine définitif, sans / final
  owner: 'Manon Samain',
  role: 'Gestionnaire administrative externalisée',
  phone: '06 32 24 63 11',
  phoneIntl: '+33632246311',
  whatsapp: '33632246311',
  email: 'elmea.solutions@outlook.fr',
  city: 'Monteux',
  postalCode: '84170',
  region: 'Provence-Alpes-Côte d’Azur',
  geo: { lat: 44.0361, lng: 4.9967 },
  areas: ['Monteux', 'Carpentras', 'Avignon', 'Pernes-les-Fontaines', 'Sorgues', 'L’Isle-sur-la-Sorgue'],
  hours: 'Du lundi au vendredi, 8 h 30 – 18 h',
  social: {
    instagram: 'https://www.instagram.com/elmea.solutions',   // à vérifier
    instagramHandle: '@elmea.solutions',
    linkedin: '',   // laisser vide = icône masquée
    facebook: ''
  },
  /* Formulaire : sans endpoint, le formulaire ouvre la messagerie (mailto).
     Web3Forms (gratuit) : endpoint 'https://api.web3forms.com/submit' + accessKey.
     Formspree : endpoint 'https://formspree.io/f/xxxxxxx', accessKey ''. */
  form: { endpoint: '', accessKey: '' },
  legal: {
    status: 'Entrepreneur individuel (micro-entreprise)',
    siret: '[SIRET À COMPLÉTER]',
    address: '[Adresse professionnelle à compléter], 84170 Monteux',
    vat: 'TVA non applicable, art. 293 B du CGI [à confirmer selon le régime]',
    host: '[Nom de l’hébergeur – adresse – téléphone]',
    publisher: 'Manon Samain'
  },
  buildDate: new Date().toISOString().slice(0, 10)
};

/* Photos : remplacer par des fichiers locaux (ex. '/assets/img/photos/bureau.jpg')
   dès que la cliente fournit ses propres visuels. */
const U = (id) => (w) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;
const PHOTOS = {
  office:   U('photo-1497366216548-37526070297c'),
  calc:     U('photo-1554224155-6726b3ff858f'),
  docs:     U('photo-1586281380349-632531db7ed4'),
  btp:      U('photo-1541888946425-d81bb19240f5'),
  worker:   U('photo-1504307651254-35680f356dfd'),
  sign:     U('photo-1450101499163-c8848c66ca85'),
  desk:     U('photo-1484480974693-6ca0a78fb36b'),
  notebook: U('photo-1517842645767-c639042777db')
};

const FORFAITS = [
  { id: 'essentiel', name: 'Essentiel', price: 490, icon: 'leaf', tagline: 'Le suivi de vos factures, sans avoir à y penser.',
    items: ['Facturation', 'Tableau d’échéance facture', 'Relance facture', 'Reporting'],
    note: 'Jusqu’à 30 factures suivies/mois. Au-delà : forfait adapté sur devis.' },
  { id: 'serenite', name: 'Sérénité', price: 790, icon: 'feather', featured: true, tagline: 'Déléguez l’essentiel et gagnez en sérénité.',
    items: ['Gestion des mails', 'Gestion administrative courante', 'Tableau d’échéance facture', 'Suivi des règlements', 'Relances clients', 'Gestion des plannings salariés', 'Gestion des variables fiches de paie'] },
  { id: 'expert', name: 'Expert', price: 1200, icon: 'star', tagline: 'Externalisez une partie du back-office et concentrez-vous sur l’essentiel.',
    items: ['Gestion administrative complète', 'Facturation', 'Gestion des plannings salariés', 'Gestion des variables de fiche de paie', 'Appels d’offres : jusqu’à 3 dossiers standards/mois*', 'Préparation et vérification des pièces', 'Suivi des échéances des appels d’offres', 'Suivi administratif des réponses'],
    note: '* Dossiers complexes ou supplémentaires : sur devis.' }
];

const FAQ = [
  { q: 'Qu’est-ce qu’une gestionnaire administrative externalisée ?',
    a: 'C’est une professionnelle indépendante qui prend en charge tout ou partie de votre administratif (facturation, relances, suivi RH, appels d’offres…) sans être salariée de votre entreprise. Vous recevez une facture mensuelle, sans charges sociales ni contrat de travail.' },
  { q: 'Intervenez-vous sur site ou uniquement à distance ?',
    a: 'Les deux. J’interviens sur site à Monteux, Carpentras, Avignon et alentours, et à distance partout en France grâce à des outils sécurisés de partage de documents.' },
  { q: 'Combien coûte l’externalisation de mon administratif ?',
    a: 'Trois forfaits mensuels existent : Essentiel à 490 € HT, Sérénité à 790 € HT et Expert à 1 200 € HT. Ils sont modulables, et un devis sur mesure est possible pour les besoins ponctuels.' },
  { q: 'Mes données sont-elles en sécurité ?',
    a: 'La confidentialité est l’un de mes engagements fondamentaux. Vos documents, données clients et données salariés ne sont jamais partagés, et un engagement de confidentialité peut être signé dès le début de la collaboration.' },
  { q: 'Pouvez-vous répondre à un appel d’offres à ma place ?',
    a: 'Je monte le dossier administratif et rédige le mémoire technique à partir de vos informations. Une collaboration étroite est nécessaire : vous apportez votre expertise chantier, je m’occupe de l’administratif, et rien n’est envoyé sans votre accord préalable.' }
];

const IG_POSTS = [
  { photo: 'desk',     caption: 'Ma to-do du lundi : prioriser, déléguer, respirer 🌿', likes: 48 },
  { photo: 'calc',     caption: 'Relances clients : 4 étapes pour être payé plus vite 💶', likes: 62 },
  { photo: 'btp',      caption: 'Mémoire technique BTP : vos chantiers méritent d’être bien racontés 🏗️', likes: 71 },
  { photo: 'docs',     caption: 'Un classement clair, c’est du temps gagné chaque jour 📁', likes: 39 },
  { photo: 'office',   caption: 'Sur site ou à distance, je m’adapte à votre organisation ✨', likes: 55 },
  { photo: 'sign',     caption: 'Variables de paie : le récap mensuel qui change tout 📋', likes: 44 },
  { photo: 'notebook', caption: 'Facture électronique : on fait le point ensemble ? 🧾', likes: 58 }
];

const NAV = [
  { href: '/', label: 'Accueil' },
  { href: '/adv/', label: 'ADV' },
  { href: '/gestion-administrative/', label: 'Gestion administrative' },
  { href: '/appels-offres/', label: 'Appels d’offres' },
  { href: '/blog/', label: 'Blog' }
];

/* ---------------------------------------------------------
   2. OUTILS
--------------------------------------------------------- */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pascal = (n) => n.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('');
const attrs = (o) => Object.entries(o).map(([k, v]) => `${k}="${v}"`).join(' ');

function ic(name, cls = 'w-5 h-5') {
  const node = icons[pascal(name)];
  if (!node) throw new Error('Icône inconnue : ' + name);
  const children = Array.isArray(node[0]) ? node : node[2];
  const inner = children.map(([tag, a]) => `<${tag} ${attrs(a)}/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${cls}" aria-hidden="true">${inner}</svg>`;
}

function photo(key, w, alt, cls = 'w-full h-full object-cover', eager = false) {
  const src = PHOTOS[key];
  const s = typeof src === 'function' ? src(w) : src;
  const s2 = typeof src === 'function' ? ` srcset="${src(Math.round(w / 2))} ${Math.round(w / 2)}w, ${s} ${w}w" sizes="(max-width: 768px) 100vw, ${w}px"` : '';
  return `<img src="${s}"${s2} alt="${esc(alt)}" class="${cls}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" onerror="this.remove()">`;
}

const fmtDate = (d) => new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const euro = (n) => n.toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, '&nbsp;') + '&nbsp;€';
const abs = (p) => SITE.url + p;
const contactUrl = (service) => '/contact/' + (service ? '?service=' + encodeURIComponent(service) : '');
const jsonld = (o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;

/* ---------------------------------------------------------
   3. GABARIT COMMUN
--------------------------------------------------------- */
const BUSINESS_ID = SITE.url + '/#business';
const businessLd = () => ({
  '@context': 'https://schema.org',
  '@type': ['LocalBusiness', 'ProfessionalService'],
  '@id': BUSINESS_ID,
  name: SITE.name,
  description: 'Secrétariat indépendant et gestion administrative externalisée : ADV, facturation, relances, suivi RH et variables de paie, rédaction de mémoires techniques et montage de dossiers d’appels d’offres pour PME et entreprises du BTP.',
  url: SITE.url + '/',
  image: abs('/assets/img/og-image.jpg'),
  logo: abs('/assets/img/logo-elmea.png'),
  telephone: SITE.phoneIntl,
  email: SITE.email,
  founder: { '@type': 'Person', name: SITE.owner, jobTitle: SITE.role },
  address: { '@type': 'PostalAddress', addressLocality: SITE.city, postalCode: SITE.postalCode, addressRegion: SITE.region, addressCountry: 'FR' },
  geo: { '@type': 'GeoCoordinates', latitude: SITE.geo.lat, longitude: SITE.geo.lng },
  areaServed: [...SITE.areas.map((a) => ({ '@type': 'City', name: a })), { '@type': 'AdministrativeArea', name: 'Vaucluse' }, { '@type': 'Country', name: 'France' }],
  priceRange: '490 € – 1 200 € HT / mois',
  openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '08:30', closes: '18:00' }],
  knowsAbout: ['Gestion administrative', 'Secrétariat indépendant', 'ADV', 'Facturation', 'Relances clients', 'Variables de paie', 'Mémoire technique BTP', 'Appels d’offres', 'DC1', 'DC2'],
  hasOfferCatalog: {
    '@type': 'OfferCatalog', name: 'Forfaits de gestion administrative',
    itemListElement: FORFAITS.map((f) => ({
      '@type': 'Offer', name: 'Forfait ' + f.name, price: String(f.price), priceCurrency: 'EUR',
      priceSpecification: { '@type': 'UnitPriceSpecification', price: f.price, priceCurrency: 'EUR', unitText: 'MON', valueAddedTaxIncluded: false }
    }))
  },
  sameAs: [SITE.social.instagram, SITE.social.linkedin, SITE.social.facebook].filter(Boolean)
});

const breadcrumbLd = (items) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, p], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(p) }))
});

function breadcrumb(items) {
  return `<nav aria-label="Fil d’Ariane" class="text-sm text-ink/60">
    <ol class="flex flex-wrap items-center gap-1.5">${items.map(([name, p], i) =>
      i < items.length - 1
        ? `<li><a href="${p}" class="hover:text-terra">${esc(name)}</a></li><li aria-hidden="true">${ic('chevron-right', 'w-3.5 h-3.5')}</li>`
        : `<li aria-current="page" class="text-forest font-medium">${esc(name)}</li>`).join('')}</ol></nav>`;
}

function header(current) {
  const isActive = (href) => href === '/' ? current === '/' : current.startsWith(href);
  const desk = NAV.map((n) => `<a href="${n.href}" class="nav-link"${isActive(n.href) ? ' aria-current="page"' : ''}>${n.label}</a>`).join('\n      ');
  const mob = NAV.map((n) => `<a href="${n.href}" class="py-3 border-b border-forest/5${isActive(n.href) ? ' text-terra' : ''}"${isActive(n.href) ? ' aria-current="page"' : ''}>${n.label}</a>`).join('\n      ');
  return `
<a href="#contenu" class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 bg-forest text-white px-4 py-2 rounded-lg">Aller au contenu</a>
<header class="sticky top-0 z-40 bg-cream/90 backdrop-blur border-b border-forest/5">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
    <a href="/" class="flex items-center gap-3" aria-label="${SITE.name} – Accueil">
      <img src="/assets/img/logo-mark.png" alt="" width="48" height="48" class="w-12 h-12">
      <span class="leading-tight">
        <span class="block font-serif text-2xl tracking-[.25em] text-forest">ÉLMÉA</span>
        <span class="block text-[10px] tracking-[.35em] text-terra font-medium">SOLUTIONS</span>
      </span>
    </a>
    <nav class="hidden lg:flex items-center gap-8 text-[15px] font-medium text-forest" aria-label="Navigation principale">
      ${desk}
      <a href="/contact/" class="ml-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-full transition ${current === '/contact/' ? 'bg-forest text-white' : 'bg-terra text-white hover:bg-forest'}"${current === '/contact/' ? ' aria-current="page"' : ''}>Contact &amp; devis ${ic('arrow-right', 'w-4 h-4')}</a>
    </nav>
    <button id="menuBtn" type="button" class="lg:hidden p-2 rounded-lg text-forest" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="mobileMenu">${ic('menu', 'w-7 h-7')}</button>
  </div>
  <div id="mobileMenu" class="lg:hidden hidden border-t border-forest/10 bg-cream">
    <nav class="px-4 py-4 flex flex-col text-forest font-medium" aria-label="Navigation mobile">
      ${mob}
      <a href="/contact/" class="mt-4 text-center bg-terra text-white py-3 rounded-full">Contact &amp; devis</a>
    </nav>
  </div>
</header>`;
}

function footer() {
  const socials = [
    ['instagram', SITE.social.instagram, 'Instagram'],
    ['linkedin', SITE.social.linkedin, 'LinkedIn'],
    ['facebook', SITE.social.facebook, 'Facebook']
  ].filter(([, u]) => u).map(([i, u, l]) => `<a href="${u}" target="_blank" rel="noopener" aria-label="${l}" class="w-11 h-11 rounded-full bg-white/10 hover:bg-terra flex items-center justify-center transition">${ic(i)}</a>`).join('');
  return `
<footer class="bg-forest-900 text-cream/80">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
    <div>
      <div class="flex items-center gap-3">
        <span class="bg-cream rounded-full p-1.5"><img src="/assets/img/logo-mark.png" alt="" width="44" height="44" class="w-11 h-11" loading="lazy"></span>
        <span class="font-serif text-2xl tracking-[.25em] text-cream">ÉLMÉA</span>
      </div>
      <p class="mt-4 text-sm leading-relaxed">Gestion administrative externalisée pour PME, artisans et entreprises du BTP.</p>
      <p class="font-script text-terra-light text-3xl mt-3">Votre administratif, ma priorité.</p>
    </div>
    <div>
      <p class="text-cream font-semibold mb-4">Services</p>
      <ul class="space-y-2 text-sm">
        <li><a href="/adv/" class="hover:text-terra-light">ADV &amp; facturation</a></li>
        <li><a href="/gestion-administrative/" class="hover:text-terra-light">Gestion administrative &amp; RH</a></li>
        <li><a href="/appels-offres/" class="hover:text-terra-light">Appels d’offres &amp; mémoire technique BTP</a></li>
        <li><a href="/#forfaits" class="hover:text-terra-light">Forfaits &amp; tarifs</a></li>
        <li><a href="/blog/" class="hover:text-terra-light">Blog</a></li>
      </ul>
    </div>
    <div>
      <p class="text-cream font-semibold mb-4">Contact</p>
      <ul class="space-y-2 text-sm">
        <li><a href="tel:${SITE.phoneIntl}" class="hover:text-terra-light">${SITE.phone}</a></li>
        <li><a href="mailto:${SITE.email}" class="hover:text-terra-light break-all">${SITE.email}</a></li>
        <li>${SITE.city} (84) · Carpentras · Avignon</li>
        <li>${SITE.hours}</li>
      </ul>
    </div>
    <div>
      <p class="text-cream font-semibold mb-4">Suivez-moi</p>
      <div class="flex gap-3">${socials}</div>
      <a href="/contact/" class="mt-6 inline-flex items-center gap-2 bg-terra text-white px-5 py-3 rounded-full text-sm hover:bg-white hover:text-forest transition">Demander un devis ${ic('arrow-right', 'w-4 h-4')}</a>
    </div>
  </div>
  <div class="border-t border-white/10">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row justify-between gap-3 text-xs text-cream/60">
      <p>© ${new Date().getFullYear()} ${SITE.name} – ${SITE.owner}. Tous droits réservés.</p>
      <p class="flex flex-wrap gap-x-4 gap-y-1"><a href="/mentions-legales/" class="hover:text-cream">Mentions légales</a><a href="/confidentialite/" class="hover:text-cream">Politique de confidentialité</a><a href="/sitemap.xml" class="hover:text-cream">Plan du site</a></p>
    </div>
  </div>
</footer>

<a href="https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent('Bonjour Manon, je souhaiterais en savoir plus sur vos services de gestion administrative.')}"
   target="_blank" rel="noopener" aria-label="Discuter sur WhatsApp"
   class="wa-btn fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-xl hover:scale-110 transition-transform group">
  <svg viewBox="0 0 32 32" class="w-8 h-8 fill-white" aria-hidden="true"><path d="M16.04 3C9 3 3.3 8.7 3.3 15.73c0 2.25.59 4.44 1.7 6.37L3.2 28.8l6.9-1.8a12.7 12.7 0 0 0 5.93 1.5h.01c7.03 0 12.74-5.7 12.74-12.73C28.78 8.7 23.07 3 16.04 3Zm0 23.3h-.01a10.6 10.6 0 0 1-5.39-1.48l-.39-.23-4.1 1.07 1.1-3.99-.25-.41a10.54 10.54 0 0 1-1.62-5.62c0-5.84 4.75-10.6 10.6-10.6 2.83 0 5.49 1.1 7.49 3.11a10.52 10.52 0 0 1 3.1 7.5c0 5.84-4.76 10.6-10.53 10.6Zm5.81-7.94c-.32-.16-1.88-.93-2.17-1.03-.29-.11-.5-.16-.71.16-.21.32-.82 1.03-1 1.24-.19.21-.37.24-.69.08-.32-.16-1.34-.5-2.56-1.58-.95-.85-1.58-1.89-1.77-2.21-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.71-1.71-.97-2.34-.26-.62-.52-.53-.71-.54h-.61c-.21 0-.56.08-.85.4-.29.32-1.11 1.09-1.11 2.65 0 1.56 1.14 3.07 1.3 3.28.16.21 2.24 3.42 5.43 4.8.76.33 1.35.52 1.81.67.76.24 1.45.21 2 .13.61-.09 1.88-.77 2.14-1.51.27-.74.27-1.38.19-1.51-.08-.13-.29-.21-.61-.37Z"/></svg>
  <span class="hidden sm:block absolute right-16 whitespace-nowrap bg-white text-forest text-sm px-3 py-2 rounded-lg shadow-soft opacity-0 group-hover:opacity-100 transition pointer-events-none">Une question ? Écrivez-moi !</span>
</a>
<button id="toTop" type="button" class="fixed bottom-5 left-5 z-40 w-11 h-11 rounded-full bg-white text-forest shadow-soft hidden items-center justify-center hover:text-terra" aria-label="Retour en haut">${ic('arrow-up')}</button>`;
}

function layout({ path: p, title, description, body, ld = [], ogType = 'website', ogImage = '/assets/img/og-image.jpg', noindex = false, extraHead = '' }) {
  return `<!DOCTYPE html>
<html lang="fr" class="no-js">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="${noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}">
  <link rel="canonical" href="${abs(p)}">
  <meta name="author" content="${SITE.owner} – ${SITE.name}">
  <meta name="theme-color" content="#1F3A2E">
  <meta name="geo.region" content="FR-84">
  <meta name="geo.placename" content="${SITE.city}">
  <meta property="og:type" content="${ogType}">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:site_name" content="${SITE.name}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${abs(p)}">
  <meta property="og:image" content="${ogImage.startsWith('http') ? ogImage : abs(ogImage)}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/img/icon-32.png">
  <link rel="apple-touch-icon" href="/assets/img/icon-180.png">
  <link rel="manifest" href="/site.webmanifest">
  <link rel="preload" href="/assets/fonts/cormorant-garamond-latin-600-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/fonts/plus-jakarta-sans-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preconnect" href="https://images.unsplash.com">
  <link rel="stylesheet" href="/assets/css/style.css?v=${SITE.buildDate}">
  ${ld.map(jsonld).join('\n  ')}${extraHead}
</head>
<body>
${header(p)}
<main id="contenu">
${body}
</main>
${footer()}
<script src="/assets/js/main.js?v=${SITE.buildDate}" defer></script>
</body>
</html>
`;
}

/* ---------------------------------------------------------
   4. BLOCS RÉUTILISABLES
--------------------------------------------------------- */
const valuesBand = () => `
<section class="bg-forest text-cream py-12" aria-label="Mes valeurs">
  <div class="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
    ${[['folder-check', 'Organisation'], ['target', 'Rigueur'], ['shield', 'Confidentialité'], ['clock', 'Réactivité']].map(([i, l]) =>
      `<div>${ic(i, 'w-8 h-8 mx-auto text-terra-light')}<p class="mt-3 tracking-[.2em] text-sm uppercase">${l}</p></div>`).join('\n    ')}
  </div>
</section>`;

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

const pageHero = ({ crumbs, eyebrow, h1, lead, photoKey, alt, cta, service, reverse = false }) => `
<section class="relative overflow-hidden bg-cream-dark">
  <div class="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-terra-soft blur-3xl opacity-60" aria-hidden="true"></div>
  <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 lg:pb-24">
    ${breadcrumb(crumbs)}
    <div class="mt-8 grid lg:grid-cols-2 gap-12 items-center">
      <div class="${reverse ? 'lg:order-2' : ''}">
        <p class="eyebrow">${eyebrow}</p>
        <h1 class="font-serif text-5xl sm:text-6xl text-forest font-semibold mt-3 leading-[1.05]">${h1}</h1>
        <div class="divider my-6"></div>
        <p class="text-lg text-ink/80 leading-relaxed">${lead}</p>
        <div class="mt-8 flex flex-col sm:flex-row gap-3">
          <a href="${contactUrl(service)}" class="btn-primary">${cta} ${ic('arrow-right')}</a>
          <a href="/#forfaits" class="btn-outline">Voir les forfaits</a>
        </div>
      </div>
      <div class="rounded-[2rem] overflow-hidden shadow-soft aspect-[4/3] img-fallback ${reverse ? 'lg:order-1' : ''}">${photo(photoKey, 1100, alt, 'w-full h-full object-cover', true)}</div>
    </div>
  </div>
</section>`;

const forfaitCard = (f) => {
  const dark = f.featured;
  const li = f.items.map((i) => `<li class="flex gap-3">${ic('circle-check', 'w-5 h-5 shrink-0 mt-0.5 ' + (dark ? 'text-terra-light' : f.id === 'expert' ? 'text-terra' : 'text-forest'))}<span>${i}</span></li>`).join('');
  return `
  <article class="reveal relative ${dark ? 'bg-forest text-cream shadow-soft lg:-my-4' : 'bg-white border border-forest/10'} rounded-3xl p-8 flex flex-col">
    ${dark ? '<span class="absolute -top-3 left-8 bg-terra text-white text-xs tracking-wider px-3 py-1 rounded-full">LE PLUS CHOISI</span>' : ''}
    <span class="w-12 h-12 rounded-full ${dark ? 'bg-terra text-white' : f.id === 'expert' ? 'bg-terra-soft text-terra' : 'bg-forest text-cream'} flex items-center justify-center">${ic(f.icon, 'w-6 h-6')}</span>
    <h3 class="font-serif text-3xl font-semibold mt-5 ${dark ? '' : 'text-forest'}">Forfait ${f.name}</h3>
    <p class="text-sm mt-1 ${dark ? 'text-cream/75' : 'text-ink/60'}">${f.tagline}</p>
    <p class="mt-6"><span class="font-serif text-5xl font-semibold ${dark ? '' : 'text-forest'}">${euro(f.price)}</span> <span class="${dark ? 'text-cream/75' : 'text-ink/60'}">HT / mois</span></p>
    <ul class="mt-6 space-y-3 text-[15px] flex-1">${li}</ul>
    ${f.note ? `<p class="text-xs mt-6 ${dark ? 'text-cream/60' : 'text-ink/55'}">${f.note}</p>` : ''}
    <a href="${contactUrl('Forfait ' + f.name)}" class="mt-6 text-center py-3 rounded-full font-medium transition ${dark ? 'bg-terra text-white hover:bg-white hover:text-forest' : f.id === 'expert' ? 'border border-terra text-terra hover:bg-terra hover:text-white' : 'border border-forest text-forest hover:bg-forest hover:text-cream'}">Choisir ${f.name}</a>
  </article>`;
};

const articleCard = (a, h = 'h3') => `
<article class="group bg-white rounded-3xl overflow-hidden shadow-soft flex flex-col reveal" data-cat="${esc(a.cat)}">
  <a href="/blog/${a.slug}/" class="block h-52 img-fallback overflow-hidden" tabindex="-1" aria-hidden="true">${photo(a.photo, 700, '', 'w-full h-full object-cover group-hover:scale-105 transition duration-500')}</a>
  <div class="p-7 flex flex-col flex-1">
    <div class="flex flex-wrap items-center gap-3 text-xs text-ink/60">
      <span class="px-2.5 py-1 rounded-full bg-terra-soft text-terra font-medium">${a.cat}</span>
      <time datetime="${a.date}">${fmtDate(a.date)}</time><span>· ${a.read} min</span>
    </div>
    <${h} class="font-serif text-2xl text-forest font-semibold mt-4 leading-snug"><a href="/blog/${a.slug}/" class="hover:text-terra">${a.title}</a></${h}>
    <p class="text-[15px] text-ink/70 mt-3 leading-relaxed flex-1">${a.excerpt}</p>
    <a href="/blog/${a.slug}/" class="mt-5 inline-flex items-center gap-2 text-terra font-medium group-hover:gap-3 transition-all">Lire l’article ${ic('arrow-right', 'w-4 h-4')}<span class="sr-only"> : ${a.title}</span></a>
  </div>
</article>`;

const faqBlock = (items) => `
<div class="space-y-3">${items.map((f, i) => `
  <details class="reveal bg-white rounded-2xl shadow-soft group"${i === 0 ? ' open' : ''}>
    <summary class="flex items-center justify-between gap-4 p-6 font-semibold text-forest">${f.q}<span class="faq-icon shrink-0 w-8 h-8 rounded-full bg-terra-soft text-terra flex items-center justify-center transition-transform">${ic('plus', 'w-4 h-4')}</span></summary>
    <p class="px-6 pb-6 -mt-2 text-ink/75 leading-relaxed">${f.a}</p>
  </details>`).join('')}
</div>`;

const faqLd = (items) => ({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }))
});

const serviceLd = (name, desc, p, type) => ({
  '@context': 'https://schema.org', '@type': 'Service', name, serviceType: type, description: desc,
  url: abs(p), provider: { '@id': BUSINESS_ID }, areaServed: { '@type': 'AdministrativeArea', name: 'Vaucluse' }
});

/* ---------------------------------------------------------
   5. PAGES
--------------------------------------------------------- */
const pages = [];
const add = (p, html, opts = {}) => pages.push({ path: p, html, ...opts });

/* ===== ACCUEIL ===== */
{
  const latest = [...ARTICLES].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const body = `
<section class="relative overflow-hidden">
  <div class="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-terra-soft blur-3xl opacity-70" aria-hidden="true"></div>
  <div class="absolute bottom-0 -left-24 w-72 h-72 rounded-full bg-sage-light blur-3xl opacity-70" aria-hidden="true"></div>
  <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 lg:pt-20 lg:pb-28 grid lg:grid-cols-2 gap-12 items-center">
    <div>
      <p class="inline-flex items-center gap-2 eyebrow mb-6">${ic('leaf', 'w-4 h-4')} Secrétariat indépendant · Vaucluse &amp; à distance</p>
      <h1 class="font-serif text-forest text-5xl sm:text-6xl lg:text-7xl font-semibold leading-[1.02]">
        Vous gérez<br>votre activité,
        <span class="block font-script font-normal text-terra mt-2 pl-2">je m’occupe du reste.</span>
        <span class="sr-only"> – Gestion administrative externalisée, ADV et appels d’offres pour PME et BTP à Monteux</span>
      </h1>
      <div class="divider my-7"></div>
      <p class="text-lg text-ink/80 max-w-xl leading-relaxed">Votre <strong class="text-forest">gestion administrative externalisée</strong>, en toute confiance : ADV, facturation, suivi RH et <strong class="text-forest">appels d’offres</strong> pour les PME et entreprises du BTP de Monteux, Carpentras, Avignon et alentours.</p>
      <div class="mt-8 flex flex-col sm:flex-row gap-3">
        <a href="/contact/" class="btn-primary">Parlons de vos besoins ${ic('arrow-right')}</a>
        <a href="#forfaits" class="btn-outline">Voir les forfaits</a>
      </div>
      <dl class="mt-10 grid grid-cols-3 gap-4 max-w-md">
        <div><dt class="sr-only">Expérience</dt><dd class="font-serif text-3xl text-forest font-semibold">15 ans</dd><dd class="text-xs text-ink/60">d’expérience administrative</dd></div>
        <div><dt class="sr-only">Diplôme</dt><dd class="font-serif text-3xl text-forest font-semibold">BTS</dd><dd class="text-xs text-ink/60">Gestion de la PME</dd></div>
        <div><dt class="sr-only">Parcours</dt><dd class="font-serif text-3xl text-forest font-semibold">Ex-AD</dd><dd class="text-xs text-ink/60">Assistante de direction</dd></div>
      </dl>
    </div>
    <div class="relative">
      <div class="aspect-[5/4] lg:aspect-[4/5] rounded-[2rem] overflow-hidden shadow-soft img-fallback">${photo('office', 1100, 'Bureau lumineux dédié à la gestion administrative externalisée', 'w-full h-full object-cover', true)}</div>
      <div class="absolute -bottom-6 left-4 sm:left-6 bg-white rounded-2xl shadow-soft p-5 flex items-center gap-4 max-w-xs">
        <span class="w-12 h-12 rounded-full bg-terra-soft flex items-center justify-center text-terra shrink-0">${ic('shield-check', 'w-6 h-6')}</span>
        <p class="text-sm"><strong class="text-forest">Confidentialité garantie</strong><br><span class="text-ink/60">Vos données restent les vôtres.</span></p>
      </div>
    </div>
  </div>
</section>

<section class="bg-white/60 py-20" aria-labelledby="services-title">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-2xl mx-auto reveal">
      <p class="eyebrow">Mes services</p>
      <h2 id="services-title" class="h-section mt-3">Trois piliers pour alléger votre quotidien</h2>
      <p class="mt-4 text-ink/70">Un soutien administratif fiable et réactif pour vous faire gagner du temps et avancer plus sereinement.</p>
    </div>
    <div class="mt-14 grid md:grid-cols-3 gap-6">
      ${[
        ['/adv/', 'receipt-euro', 'bg-terra-soft text-terra', 'ADV &amp; facturation', 'Devis, factures, suivi des échéances et relances clients pour une trésorerie maîtrisée.', 'calc', 'Calculatrice et factures'],
        ['/gestion-administrative/', 'folder-open', 'bg-sage-light text-forest', 'Gestion administrative &amp; RH', 'Assurances, mutuelles, formalités, déplacements des équipes et variables de paie.', 'docs', 'Classeurs de dossiers administratifs'],
        ['/appels-offres/', 'file-text', 'bg-terra-soft text-terra', 'Appels d’offres BTP', 'Montage des dossiers de candidature et rédaction du mémoire technique à partir de vos informations.', 'btp', 'Chantier de bâtiment']
      ].map(([href, i, c, t, d, ph, alt]) => `
      <article class="reveal group bg-cream rounded-3xl overflow-hidden border border-forest/5 hover:shadow-soft transition flex flex-col">
        <div class="p-8 flex-1">
          <span class="w-14 h-14 rounded-full ${c} flex items-center justify-center">${ic(i, 'w-7 h-7')}</span>
          <h3 class="font-serif text-2xl text-forest font-semibold mt-5">${t}</h3>
          <div class="divider my-4 !w-10"></div>
          <p class="text-ink/70 text-[15px] leading-relaxed">${d}</p>
          <a href="${href}" class="mt-6 inline-flex items-center gap-2 text-terra font-medium group-hover:gap-3 transition-all">Découvrir ${ic('arrow-right', 'w-4 h-4')}<span class="sr-only"> ${t}</span></a>
        </div>
        <div class="h-44 img-fallback">${photo(ph, 700, alt)}</div>
      </article>`).join('')}
    </div>
  </div>
</section>

<section class="py-20" aria-labelledby="why-title">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-5 gap-12 items-start">
    <div class="lg:col-span-2 reveal lg:sticky lg:top-28">
      <p class="eyebrow">Pourquoi externaliser ?</p>
      <h2 id="why-title" class="h-section mt-3">Les avantages de la sous-traitance administrative</h2>
      <p class="mt-5 text-ink/70 leading-relaxed">Externaliser votre administratif, c’est bénéficier des compétences d’une assistante de direction expérimentée, sans les contraintes d’un recrutement. Vous ne payez que le temps dont vous avez besoin.</p>
      <p class="font-script text-terra text-4xl mt-6">Votre administratif, ma priorité.</p>
    </div>
    <div class="lg:col-span-3 grid sm:grid-cols-2 gap-5">
      ${[
        ['piggy-bank', 'Zéro charge salariale', 'Pas de contrat, pas de cotisations, pas de congés à gérer : une facture mensuelle claire.'],
        ['sliders-horizontal', 'Flexibilité totale', 'Des forfaits modulables qui s’adaptent aux pics d’activité et à la saisonnalité.'],
        ['hourglass', 'Du temps retrouvé', 'Concentrez-vous sur vos clients, vos chantiers et le développement de votre entreprise.'],
        ['trending-up', 'Trésorerie améliorée', 'Factures envoyées à temps, relances régulières : vos délais de paiement raccourcissent.'],
        ['lock', 'Confidentialité', 'Discrétion absolue sur vos données clients, salariés et financières.'],
        ['map-pin', 'Sur site ou à distance', 'Intervention à Monteux, Carpentras, Avignon et alentours, ou 100 % à distance.']
      ].map(([i, t, d]) => `<div class="reveal card p-6">${ic(i, 'w-7 h-7 text-terra')}<h3 class="font-semibold text-forest mt-4">${t}</h3><p class="text-sm text-ink/70 mt-2">${d}</p></div>`).join('\n      ')}
    </div>
  </div>
</section>

${valuesBand()}

<section class="py-20" aria-labelledby="about-title">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-[280px,1fr] gap-10 items-center">
    <div class="reveal mx-auto">
      <div class="w-64 h-64 rounded-full bg-white shadow-soft flex items-center justify-center p-8"><img src="/assets/img/logo-elmea-560.png" alt="Logo Élméa Solutions" width="560" height="504" class="w-full h-auto" loading="lazy"></div>
    </div>
    <div class="reveal">
      <p class="eyebrow">Qui suis-je ?</p>
      <h2 id="about-title" class="h-section mt-3">${SITE.owner}, votre partenaire administrative</h2>
      <p class="mt-5 text-ink/75 leading-relaxed">Forte de <strong class="text-forest">15 ans d’expérience dans l’administratif</strong>, titulaire d’un <strong class="text-forest">BTS Gestion de la PME</strong> et ancienne <strong class="text-forest">assistante de direction</strong>, j’ai créé Élméa Solutions pour offrir aux dirigeants de PME et aux entreprises du BTP un soutien administratif fiable, réactif et sur mesure.</p>
      <p class="mt-4 text-ink/75 leading-relaxed">Ma vision à la fois globale et opérationnelle de l’entreprise me permet de comprendre rapidement vos enjeux et de m’intégrer à votre organisation, sur site comme à distance.</p>
      <p class="font-script text-terra text-4xl mt-5">Manon</p>
    </div>
  </div>
</section>

<section id="forfaits" class="py-20 bg-white/60 scroll-mt-24" aria-labelledby="forfaits-title">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-2xl mx-auto reveal">
      <p class="font-script text-terra text-4xl">Trois forfaits, une même ambition :</p>
      <h2 id="forfaits-title" class="h-section mt-1">vous simplifier la vie</h2>
    </div>
    <div class="mt-16 grid lg:grid-cols-3 gap-6 items-stretch">${FORFAITS.map(forfaitCard).join('')}</div>
    <p class="text-center mt-12 text-ink/65 reveal">${ic('puzzle', 'inline w-4 h-4 text-terra')} Des forfaits modulables selon vos besoins – <a href="${contactUrl('Autre / besoin sur mesure')}" class="text-terra underline underline-offset-4">demandez un devis personnalisé</a>.</p>
  </div>
</section>

<section class="py-20" aria-labelledby="faq-title">
  <div class="max-w-3xl mx-auto px-4 sm:px-6">
    <div class="text-center reveal">
      <p class="eyebrow">Questions fréquentes</p>
      <h2 id="faq-title" class="h-section mt-3">Vous vous posez des questions ?</h2>
    </div>
    <div class="mt-10">${faqBlock(FAQ)}</div>
  </div>
</section>

<section class="bg-white/60 py-20" aria-labelledby="ig-title">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 reveal">
      <div>
        <p class="eyebrow">Instagram</p>
        <h2 id="ig-title" class="font-serif text-4xl text-forest font-semibold mt-2">Les coulisses d’Élméa</h2>
        <p class="text-ink/60 mt-2">Conseils, astuces d’organisation et actualités administratives.</p>
      </div>
      <div class="flex items-center gap-2">
        <button type="button" class="ig-prev w-11 h-11 rounded-full border border-forest/20 text-forest hover:border-terra hover:text-terra flex items-center justify-center" aria-label="Publications précédentes">${ic('chevron-left')}</button>
        <button type="button" class="ig-next w-11 h-11 rounded-full border border-forest/20 text-forest hover:border-terra hover:text-terra flex items-center justify-center" aria-label="Publications suivantes">${ic('chevron-right')}</button>
        <a href="${SITE.social.instagram}" target="_blank" rel="noopener" class="ml-2 inline-flex items-center gap-2 bg-forest text-cream px-5 py-3 rounded-full text-sm hover:bg-terra transition">${ic('instagram', 'w-4 h-4')} ${SITE.social.instagramHandle}</a>
      </div>
    </div>
    <div id="igTrack" class="ig-track mt-10 flex gap-4 overflow-x-auto pb-2">
      ${IG_POSTS.map((p) => `
      <a href="${SITE.social.instagram}" target="_blank" rel="noopener" class="group relative shrink-0 w-[72%] sm:w-[44%] md:w-[30%] lg:w-[23%] aspect-square rounded-2xl overflow-hidden img-fallback">
        ${photo(p.photo, 500, p.caption, 'w-full h-full object-cover group-hover:scale-105 transition duration-500')}
        <span class="absolute inset-0 bg-gradient-to-t from-forest/85 via-forest/10 to-transparent sm:opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition flex flex-col justify-end p-4 text-cream">
          <span class="text-sm leading-snug">${p.caption}</span>
          <span class="text-xs mt-2 flex items-center gap-1 text-cream/80">${ic('heart', 'w-3.5 h-3.5')}${p.likes}</span>
        </span>
        <span class="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 text-terra flex items-center justify-center">${ic('instagram', 'w-4 h-4')}</span>
      </a>`).join('')}
    </div>
  </div>
</section>

<section class="py-20" aria-labelledby="blog-title">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 reveal">
      <div><p class="eyebrow">Blog</p><h2 id="blog-title" class="font-serif text-4xl text-forest font-semibold mt-2">Derniers conseils</h2></div>
      <a href="/blog/" class="inline-flex items-center gap-2 text-terra font-medium">Tous les articles ${ic('arrow-right', 'w-4 h-4')}</a>
    </div>
    <div class="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-7">${latest.map((a) => articleCard(a)).join('')}</div>
  </div>
</section>

${ctaBlock()}`;
  add('/', layout({
    path: '/',
    title: 'Gestion administrative externalisée, ADV & appels d’offres BTP | Élméa Solutions – Monteux',
    description: 'Secrétariat indépendant et gestion administrative externalisée pour PME et BTP : ADV, facturation, relances, variables de paie, mémoire technique et appels d’offres. Monteux, Carpentras, Avignon.',
    body, ld: [businessLd(), faqLd(FAQ), { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE.name, url: SITE.url + '/', inLanguage: 'fr-FR' }]
  }));
}

/* ===== ADV ===== */
{
  const p = '/adv/';
  const crumbs = [['Accueil', '/'], ['ADV & facturation', p]];
  const steps = [
    ['01', 'Devis', 'Mise en forme et envoi de vos devis à partir de vos éléments chiffrés, suivi des acceptations et relance des devis en attente.'],
    ['02', 'Facturation', 'Émission des factures, acomptes et situations de travaux, avoirs, conformité des mentions légales et préparation à la facturation électronique.'],
    ['03', 'Suivi des échéances', 'Tableau d’échéancier clair, rapprochement des règlements et reporting régulier de votre encours clients.'],
    ['04', 'Relances d’impayés', 'Relances amiables graduées (mail, téléphone, courrier) avec un ton courtois qui préserve la relation client.']
  ];
  const faq = [
    { q: 'Utilisez-vous mon logiciel de facturation ?', a: 'Oui. Je travaille directement dans vos outils (logiciel de devis-factures, logiciel métier BTP, tableur) pour que vous gardiez la main sur vos données à tout moment.' },
    { q: 'Comment se passent les relances clients ?', a: 'Selon un calendrier défini ensemble : rappel courtois après l’échéance, appel téléphonique, puis relance écrite. Aucune mise en demeure n’est envoyée sans votre accord.' },
    { q: 'Quel forfait choisir pour l’ADV ?', a: 'Le forfait Essentiel (490 € HT/mois) couvre la facturation, l’échéancier, les relances et le reporting jusqu’à 30 factures par mois. Au-delà, ou avec la gestion des mails, le forfait Sérénité est plus adapté.' }
  ];
  const body = `
${pageHero({ crumbs, eyebrow: 'Administration des ventes', h1: 'ADV &amp; facturation externalisées', lead: 'De l’établissement du devis jusqu’à l’encaissement, je prends en charge votre <strong class="text-forest">administration des ventes</strong> pour sécuriser votre chiffre d’affaires et votre trésorerie.', photoKey: 'calc', alt: 'Facturation et suivi des paiements clients', cta: 'Externaliser mon ADV', service: 'ADV & facturation' })}
<section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
  <div class="text-center max-w-2xl mx-auto reveal"><p class="eyebrow">Prestations</p><h2 class="h-section mt-3">Mes prestations ADV</h2></div>
  <div class="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
    ${steps.map(([n, t, d]) => `<div class="reveal card p-7"><span class="text-terra font-serif text-4xl font-semibold">${n}</span><h3 class="font-semibold text-forest text-lg mt-3">${t}</h3><p class="text-sm text-ink/70 mt-2 leading-relaxed">${d}</p></div>`).join('\n    ')}
  </div>
  <div class="mt-16 grid lg:grid-cols-2 gap-8 items-center">
    <div class="reveal bg-forest text-cream rounded-3xl p-10">
      <h2 class="font-serif text-3xl font-semibold">Ce que vous y gagnez</h2>
      <ul class="mt-6 space-y-4">${['Des factures envoyées dans les temps, sans oubli', 'Des délais de paiement réduits', 'Une vision claire de votre trésorerie', 'Plus de temps pour vos clients et vos chantiers'].map((t) => `<li class="flex gap-3">${ic('check', 'w-5 h-5 text-terra-light shrink-0 mt-0.5')}${t}</li>`).join('')}</ul>
    </div>
    <div class="reveal">
      <p class="font-script text-terra text-4xl">Le saviez-vous ?</p>
      <p class="mt-3 text-ink/75 leading-relaxed">Les retards de paiement pèsent lourdement sur la trésorerie des petites entreprises. Une facturation rapide et des relances régulières suffisent souvent à accélérer nettement les encaissements.</p>
      <p class="mt-4 text-ink/75">Inclus dans les forfaits <a href="/#forfaits" class="text-terra underline underline-offset-4">Essentiel, Sérénité et Expert</a>. À lire aussi : <a href="/blog/relances-impayes-methode/" class="text-terra underline underline-offset-4">la méthode de relance en 4 étapes</a>.</p>
    </div>
  </div>
</section>
<section class="max-w-3xl mx-auto px-4 sm:px-6 pb-4"><h2 class="font-serif text-3xl text-forest font-semibold text-center mb-8 reveal">Questions sur l’ADV</h2>${faqBlock(faq)}</section>
${ctaBlock('Prêt à être payé plus vite ?', 'Parlons de votre volume de factures et de vos outils actuels : je vous propose une organisation sur mesure.', 'ADV & facturation')}`;
  add(p, layout({ path: p, title: 'ADV externalisée : devis, facturation & relances d’impayés | Élméa Solutions', description: 'Administration des ventes externalisée pour PME et BTP : devis, facturation, suivi des échéances et relances d’impayés. Monteux, Carpentras, Avignon et à distance.', body,
    ld: [serviceLd('ADV et facturation externalisées', 'Devis, facturation, suivi des échéances et relances d’impayés pour PME et entreprises du BTP.', p, 'Administration des ventes'), breadcrumbLd(crumbs), faqLd(faq)] }));
}

/* ===== GESTION ADMINISTRATIVE ===== */
{
  const p = '/gestion-administrative/';
  const crumbs = [['Accueil', '/'], ['Gestion administrative & RH', p]];
  const blocks = [
    ['clipboard-list', 'bg-sage-light text-forest', 'Suivi administratif global', 'Gestion des mails et du courrier, classement et archivage, suivi des contrats d’assurance (RC pro, décennale, flotte automobile), adhésions et mouvements de mutuelle et prévoyance, formalités administratives courantes.',
      `<div class="mt-5 flex flex-wrap gap-2 text-sm">${['Assurances', 'Mutuelles', 'Formalités', 'Classement', 'Courrier &amp; mails', 'Plannings'].map((t) => `<span class="chip">${t}</span>`).join('')}</div>`],
    ['car', 'bg-terra-soft text-terra', 'Logistique des déplacements', 'Vos équipes partent en chantier ou en rendez-vous ? Je m’occupe de la réservation des hôtels, des taxis et des véhicules de location, et je centralise les justificatifs pour la comptabilité.',
      `<div class="mt-5 flex flex-wrap gap-2 text-sm"><span class="chip">${ic('hotel', 'w-4 h-4')}Hôtels</span><span class="chip">${ic('car-taxi-front', 'w-4 h-4')}Taxis</span><span class="chip">${ic('key-round', 'w-4 h-4')}Véhicules</span><span class="chip">${ic('receipt', 'w-4 h-4')}Justificatifs</span></div>`],
    ['wallet', 'bg-sage-light text-forest', 'Suivi des variables de paie', 'Collecte et contrôle des éléments variables chaque mois, transmis proprement à votre expert-comptable ou gestionnaire de paie : indemnités kilométriques, paniers repas, notes de frais, absences, heures supplémentaires.',
      `<div class="mt-5 grid sm:grid-cols-3 gap-3 text-sm">${[['Indemnités kilométriques', 'Calcul selon le barème en vigueur'], ['Paniers repas', 'Suivi par salarié et par chantier'], ['Notes de frais', 'Collecte et vérification des justificatifs']].map(([t, d]) => `<div class="rounded-xl bg-cream p-4"><p class="font-semibold text-forest">${t}</p><p class="text-ink/60 mt-1">${d}</p></div>`).join('')}</div>`]
  ];
  const faq = [
    { q: 'Établissez-vous les bulletins de paie ?', a: 'Non : je collecte, contrôle et transmets les éléments variables à votre expert-comptable ou gestionnaire de paie, qui établit les bulletins. Vous gagnez en fiabilité sans changer de prestataire.' },
    { q: 'Pouvez-vous gérer les plannings de mes salariés ?', a: 'Oui, la gestion des plannings salariés est incluse dans les forfaits Sérénité et Expert.' }
  ];
  const body = `
${pageHero({ crumbs, eyebrow: 'Gestion administrative &amp; salariés', h1: 'Gestion administrative &amp; RH externalisée', lead: 'Un <strong class="text-forest">secrétariat indépendant</strong> qui prend en charge le suivi administratif de votre entreprise et de vos équipes, pour que rien ne passe entre les mailles du filet.', photoKey: 'sign', alt: 'Gestion des dossiers administratifs et RH', cta: 'Me faire accompagner', service: 'Gestion administrative & RH', reverse: true })}
<section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-8">
  ${blocks.map(([i, c, t, d, extra]) => `
  <div class="reveal grid md:grid-cols-[auto,1fr] gap-6 card p-8 sm:p-10">
    <span class="w-16 h-16 rounded-2xl ${c} flex items-center justify-center">${ic(i, 'w-8 h-8')}</span>
    <div><h2 class="font-serif text-3xl text-forest font-semibold">${t}</h2><p class="mt-3 text-ink/70 leading-relaxed">${d}</p>${extra}</div>
  </div>`).join('')}
</section>
<section class="max-w-3xl mx-auto px-4 sm:px-6 pb-4"><h2 class="font-serif text-3xl text-forest font-semibold text-center mb-8 reveal">Questions fréquentes</h2>${faqBlock(faq)}</section>
${ctaBlock('Libérez-vous de la paperasse', 'Décrivez-moi votre organisation : je vous propose un accompagnement adapté à la taille de vos équipes.', 'Gestion administrative & RH')}`;
  add(p, layout({ path: p, title: 'Gestion administrative & RH externalisée : variables de paie, déplacements | Élméa Solutions', description: 'Secrétariat indépendant pour PME et BTP : suivi administratif, assurances, mutuelles, réservations de déplacements, variables de paie et notes de frais. Vaucluse et à distance.', body,
    ld: [serviceLd('Gestion administrative et RH externalisée', 'Suivi administratif global, logistique des déplacements et suivi des variables de paie pour PME.', p, 'Secrétariat indépendant'), breadcrumbLd(crumbs), faqLd(faq)] }));
}

/* ===== APPELS D'OFFRES ===== */
{
  const p = '/appels-offres/';
  const crumbs = [['Accueil', '/'], ['Appels d’offres BTP', p]];
  const faq = [
    { q: 'Quels types de marchés traitez-vous ?', a: 'Principalement les marchés publics et privés de travaux du BTP pour les PME et artisans : gros œuvre, second œuvre, rénovation, aménagement. Les dossiers d’autres secteurs sont étudiés au cas par cas.' },
    { q: 'Combien de dossiers sont inclus dans le forfait Expert ?', a: 'Jusqu’à 3 dossiers standards par mois. Les dossiers complexes ou supplémentaires font l’objet d’un devis. Un dossier ponctuel est aussi possible hors forfait.' },
    { q: 'Qui dépose l’offre sur la plateforme ?', a: 'Je peux assurer le dépôt sur les plateformes de dématérialisation, mais uniquement après votre validation finale du dossier complet. Rien n’est envoyé sans votre accord préalable.' }
  ];
  const body = `
<section class="relative bg-forest text-cream overflow-hidden">
  <div class="absolute inset-0 opacity-20 img-fallback" aria-hidden="true">${photo('worker', 1600, '', 'w-full h-full object-cover', true)}</div>
  <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 lg:pb-28">
    <nav aria-label="Fil d’Ariane" class="text-sm text-cream/70"><a href="/" class="hover:text-white">Accueil</a> <span aria-hidden="true">›</span> <span aria-current="page" class="text-white">Appels d’offres BTP</span></nav>
    <div class="max-w-3xl mt-12">
      <p class="text-terra-light text-xs tracking-[.25em] uppercase font-semibold">Spécialisé BTP &amp; PME</p>
      <h1 class="font-serif text-5xl sm:text-6xl font-semibold mt-3 leading-tight">Appels d’offres &amp; mémoire technique BTP</h1>
      <div class="divider my-6"></div>
      <p class="text-lg text-cream/85 leading-relaxed">Répondre aux marchés publics et privés prend un temps considérable. Je monte vos dossiers de candidature et rédige votre <strong class="text-white">mémoire technique</strong> pour multiplier vos chances de remporter des marchés.</p>
      <a href="${contactUrl('Appels d’offres / mémoire technique')}" class="mt-8 btn-primary">J’ai un appel d’offres en cours ${ic('arrow-right')}</a>
    </div>
  </div>
</section>
<section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
  <div class="grid md:grid-cols-3 gap-6">
    ${[
      ['pen-line', 'Rédaction du mémoire technique', 'Présentation de l’entreprise, moyens humains et matériels, méthodologie d’intervention, planning, démarche qualité, sécurité et environnement : un document structuré qui répond précisément aux critères du règlement de consultation.'],
      ['files', 'Montage du dossier', 'Analyse du DCE, formulaires DC1, DC2, attestations fiscales et sociales, Kbis, assurances, références chantiers : je prépare et vérifie chaque pièce administrative.'],
      ['calendar-clock', 'Suivi des échéances', 'Veille des dates limites de remise des offres, questions à l’acheteur, dépôt sur les plateformes de dématérialisation et suivi administratif des réponses.']
    ].map(([i, t, d]) => `<div class="reveal card p-8">${ic(i, 'w-8 h-8 text-terra')}<h2 class="font-serif text-2xl text-forest font-semibold mt-4">${t}</h2><p class="text-ink/70 mt-3 text-[15px] leading-relaxed">${d}</p></div>`).join('\n    ')}
  </div>

  <div class="reveal mt-16 relative rounded-[2rem] border-2 border-terra bg-terra-soft/60 p-8 sm:p-12">
    <span class="absolute -top-5 left-8 bg-terra text-white w-10 h-10 rounded-full flex items-center justify-center">${ic('handshake')}</span>
    <h2 class="font-serif text-3xl sm:text-4xl text-forest font-semibold">Une collaboration étroite est nécessaire</h2>
    <p class="mt-4 text-lg sm:text-xl text-ink/85 leading-relaxed max-w-4xl">Vous apportez votre <strong class="text-forest">expertise chantier</strong>, je m’occupe de <strong class="text-forest">l’administratif</strong>.<span class="block mt-3 font-semibold text-terra">Rien n’est envoyé sans votre accord préalable.</span></p>
    <ol class="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
      ${[['Analyse', 'Lecture du DCE et des critères de notation'], ['Échange', 'Vous me transmettez vos informations techniques'], ['Rédaction', 'Montage du dossier et du mémoire technique'], ['Validation', 'Relecture commune et accord avant tout dépôt']].map(([t, d], i) => `<li class="bg-white rounded-xl p-4"><p class="text-terra font-semibold">${i + 1}. ${t}</p><p class="text-ink/70 mt-1">${d}</p></li>`).join('')}
    </ol>
  </div>

  <p class="mt-12 text-center text-ink/70 reveal">Jusqu’à 3 dossiers standards par mois inclus dans le <a href="/#forfaits" class="text-forest font-semibold underline underline-offset-4">forfait Expert</a>. Dossiers ponctuels ou complexes : sur devis.<br>À lire : <a href="/blog/memoire-technique-btp-conseils/" class="text-terra underline underline-offset-4">les clés d’un bon mémoire technique BTP</a>.</p>
</section>
<section class="max-w-3xl mx-auto px-4 sm:px-6 pb-4"><h2 class="font-serif text-3xl text-forest font-semibold text-center mb-8 reveal">Questions sur les appels d’offres</h2>${faqBlock(faq)}</section>
${ctaBlock('Un appel d’offres en vue ?', 'Envoyez-moi le lien de la consultation et la date limite : je vous dis rapidement ce qu’il faut préparer.', 'Appels d’offres / mémoire technique')}`;
  add(p, layout({ path: p, title: 'Appels d’offres BTP & rédaction de mémoire technique (DC1, DC2) | Élméa Solutions', description: 'Montage de dossiers d’appels d’offres et rédaction de mémoires techniques pour PME et entreprises du BTP : DC1, DC2, pièces administratives, suivi des échéances. Vaucluse.', body,
    ld: [serviceLd('Appels d’offres et mémoire technique BTP', 'Rédaction du mémoire technique, montage du dossier de candidature (DC1, DC2) et suivi des échéances pour les entreprises du BTP.', p, 'Réponse aux appels d’offres'), breadcrumbLd(crumbs), faqLd(faq)] }));
}

/* ===== CONTACT ===== */
{
  const p = '/contact/';
  const crumbs = [['Accueil', '/'], ['Contact & devis', p]];
  const services = ['ADV & facturation', 'Gestion administrative & RH', 'Appels d’offres / mémoire technique', 'Forfait Essentiel', 'Forfait Sérénité', 'Forfait Expert', 'Autre / besoin sur mesure'];
  const field = (id, label, type, ac, ph, req, err) => `
        <div>
          <label for="${id}" class="block text-sm font-medium text-forest mb-1.5">${label}${req ? ' <span class="text-terra" aria-hidden="true">*</span>' : ''}</label>
          <input id="${id}" name="${id}" type="${type}" ${req ? 'required aria-required="true" ' : ''}autocomplete="${ac}" class="field" placeholder="${ph}"${err ? ` aria-describedby="err-${id}"` : ''}>
          ${err ? `<p id="err-${id}" class="hidden text-xs text-red-600 mt-1">${err}</p>` : ''}
        </div>`;
  const body = `
<section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 lg:pb-24">
  ${breadcrumb(crumbs)}
  <div class="mt-8 grid lg:grid-cols-5 gap-12">
    <div class="lg:col-span-2">
      <p class="eyebrow">Contact &amp; devis</p>
      <h1 class="font-serif text-5xl text-forest font-semibold mt-3 leading-tight">Discutons de vos besoins</h1>
      <p class="font-script text-terra text-4xl mt-2">premier échange offert</p>
      <div class="divider my-6"></div>
      <p class="text-ink/75 leading-relaxed">Décrivez-moi votre activité et ce que vous souhaitez déléguer : je vous réponds sous 24 h ouvrées avec une proposition adaptée.</p>
      <ul class="mt-8 space-y-4">
        <li><a href="tel:${SITE.phoneIntl}" class="flex items-center gap-4 group"><span class="w-12 h-12 rounded-full bg-terra text-white flex items-center justify-center shrink-0">${ic('phone')}</span><span><span class="block text-sm text-ink/60">Téléphone</span><span class="font-semibold text-forest group-hover:text-terra">${SITE.phone}</span></span></a></li>
        <li><a href="https://wa.me/${SITE.whatsapp}" target="_blank" rel="noopener" class="flex items-center gap-4 group"><span class="w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0">${ic('message-circle')}</span><span><span class="block text-sm text-ink/60">WhatsApp</span><span class="font-semibold text-forest group-hover:text-terra">Écrivez-moi directement</span></span></a></li>
        <li><a href="mailto:${SITE.email}" class="flex items-center gap-4 group"><span class="w-12 h-12 rounded-full bg-forest text-white flex items-center justify-center shrink-0">${ic('mail')}</span><span><span class="block text-sm text-ink/60">Email</span><span class="font-semibold text-forest group-hover:text-terra break-all">${SITE.email}</span></span></a></li>
        <li class="flex items-center gap-4"><span class="w-12 h-12 rounded-full bg-terra-soft text-terra flex items-center justify-center shrink-0">${ic('map-pin')}</span><span><span class="block text-sm text-ink/60">Zone d’intervention</span><span class="font-semibold text-forest">${SITE.city}, Carpentras, Avignon et alentours · à distance partout en France</span></span></li>
        <li class="flex items-center gap-4"><span class="w-12 h-12 rounded-full bg-sage-light text-forest flex items-center justify-center shrink-0">${ic('clock')}</span><span><span class="block text-sm text-ink/60">Disponibilités</span><span class="font-semibold text-forest">${SITE.hours}</span></span></li>
      </ul>
      <div class="mt-10 rounded-2xl bg-white p-6 shadow-soft">
        <p class="font-semibold text-forest">Mes engagements</p>
        <ul class="mt-4 space-y-3 text-sm text-ink/75">
          ${[['shield-check', 'Confidentialité absolue de vos données'], ['zap', 'Réponse sous 24 h ouvrées'], ['target', 'Rigueur et suivi régulier'], ['file-signature', 'Devis clair, sans engagement']].map(([i, t]) => `<li class="flex gap-3">${ic(i, 'w-5 h-5 text-terra shrink-0')}${t}</li>`).join('\n          ')}
        </ul>
      </div>
    </div>

    <div class="lg:col-span-3">
      <form id="contactForm" class="bg-white rounded-[2rem] p-6 sm:p-10 shadow-soft space-y-5" method="post"
            action="${SITE.form.endpoint || 'mailto:' + SITE.email}" data-endpoint="${SITE.form.endpoint}" data-email="${SITE.email}" data-success="/merci/" novalidate>
        <h2 class="font-serif text-3xl text-forest font-semibold">Demande de devis gratuit</h2>
        <p class="text-sm text-ink/60">Les champs marqués d’un <span class="text-terra">*</span> sont obligatoires.</p>
        ${SITE.form.accessKey ? `<input type="hidden" name="access_key" value="${SITE.form.accessKey}">` : ''}
        <input type="checkbox" name="botcheck" class="hidden" tabindex="-1" autocomplete="off" aria-hidden="true">
        <div class="grid sm:grid-cols-2 gap-5">
          ${field('nom', 'Nom &amp; prénom', 'text', 'name', 'Jean Dupont', true, 'Merci d’indiquer votre nom.')}
          ${field('societe', 'Entreprise', 'text', 'organization', 'SARL Dupont Bâtiment', false)}
          ${field('email', 'Email', 'email', 'email', 'vous@entreprise.fr', true, 'Merci d’indiquer un email valide.')}
          ${field('telephone', 'Téléphone', 'tel', 'tel', '06 12 34 56 78', true, 'Merci d’indiquer un numéro valide.')}
        </div>
        <div>
          <label for="service" class="block text-sm font-medium text-forest mb-1.5">Service concerné <span class="text-terra" aria-hidden="true">*</span></label>
          <select id="service" name="service" required aria-required="true" aria-describedby="err-service" class="field">
            <option value="">Sélectionnez un service…</option>
            ${services.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join('\n            ')}
          </select>
          <p id="err-service" class="hidden text-xs text-red-600 mt-1">Merci de choisir un service.</p>
        </div>
        <div>
          <label for="message" class="block text-sm font-medium text-forest mb-1.5">Votre message <span class="text-terra" aria-hidden="true">*</span></label>
          <textarea id="message" name="message" rows="6" required aria-required="true" aria-describedby="err-message" class="field" placeholder="Décrivez votre activité, le volume (factures, salariés, dossiers…) et ce que vous souhaitez déléguer."></textarea>
          <p id="err-message" class="hidden text-xs text-red-600 mt-1">Votre message doit contenir au moins 10 caractères.</p>
        </div>
        <div>
          <label class="flex items-start gap-3 text-sm text-ink/70">
            <input id="rgpd" name="rgpd" type="checkbox" required aria-describedby="err-rgpd" class="mt-1 accent-[#B5634B] w-4 h-4">
            <span>J’accepte que mes données soient utilisées pour répondre à ma demande, conformément à la <a href="/confidentialite/" class="text-terra underline underline-offset-2">politique de confidentialité</a>. Elles ne sont jamais cédées à des tiers.</span>
          </label>
          <p id="err-rgpd" class="hidden text-xs text-red-600 mt-1">Merci d’accepter pour envoyer votre demande.</p>
        </div>
        <button id="submitBtn" type="submit" class="w-full sm:w-auto btn-primary disabled:opacity-60"><span>Envoyer ma demande</span> ${ic('send')}</button>
        <div id="formStatus" class="hidden" role="status" aria-live="polite"></div>
      </form>
    </div>
  </div>
</section>`;
  add(p, layout({ path: p, title: 'Contact & devis gratuit – Secrétariat indépendant à Monteux (84) | Élméa Solutions', description: 'Demandez votre devis gratuit pour externaliser votre gestion administrative, votre ADV ou vos appels d’offres. Réponse sous 24 h. Monteux, Carpentras, Avignon.', body,
    ld: [{ ...businessLd(), '@context': 'https://schema.org' }, breadcrumbLd(crumbs), { '@context': 'https://schema.org', '@type': 'ContactPage', name: 'Contact Élméa Solutions', url: abs(p) }] }));
}

/* ===== BLOG ===== */
{
  const p = '/blog/';
  const crumbs = [['Accueil', '/'], ['Blog', p]];
  const sorted = [...ARTICLES].sort((a, b) => b.date.localeCompare(a.date));
  const cats = ['Tous', ...new Set(sorted.map((a) => a.cat))];
  const body = `
<section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 lg:pb-24">
  ${breadcrumb(crumbs)}
  <div class="text-center max-w-2xl mx-auto mt-10">
    <p class="eyebrow">Blog &amp; actualités</p>
    <h1 class="font-serif text-5xl text-forest font-semibold mt-3 leading-tight">Conseils pour une gestion administrative sereine</h1>
    <p class="mt-4 text-ink/70">Astuces, réglementation et bonnes pratiques pour les dirigeants de PME, artisans et entreprises du BTP.</p>
  </div>
  <div class="mt-10 flex flex-wrap justify-center gap-2" id="blogFilters" role="group" aria-label="Filtrer par catégorie">
    ${cats.map((c, i) => `<button type="button" data-filter="${esc(c)}" aria-pressed="${i === 0}" class="px-4 py-2 rounded-full text-sm border transition ${i === 0 ? 'bg-forest text-cream border-forest' : 'border-forest/15 text-forest hover:border-terra hover:text-terra'}">${c}</button>`).join('\n    ')}
  </div>
  <div id="blogGrid" class="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-7">${sorted.map((a) => articleCard(a, 'h2')).join('')}</div>
</section>
${ctaBlock('Une question sur votre situation ?', 'Chaque entreprise est différente : parlons de la vôtre lors d’un premier échange gratuit.')}`;
  add(p, layout({ path: p, title: 'Blog : conseils en gestion administrative, ADV et appels d’offres BTP | Élméa Solutions', description: 'Conseils pratiques pour dirigeants de PME et du BTP : facturation, relances d’impayés, variables de paie, mémoire technique et dossiers d’appels d’offres.', body,
    ld: [breadcrumbLd(crumbs), { '@context': 'https://schema.org', '@type': 'Blog', name: 'Blog Élméa Solutions', url: abs(p), publisher: { '@id': BUSINESS_ID },
      blogPost: sorted.map((a) => ({ '@type': 'BlogPosting', headline: a.title, url: abs('/blog/' + a.slug + '/'), datePublished: a.date })) }] }));

  /* Articles */
  sorted.forEach((a) => {
    const ap = '/blog/' + a.slug + '/';
    const ac = [['Accueil', '/'], ['Blog', '/blog/'], [a.title, ap]];
    const related = sorted.filter((x) => x.slug !== a.slug).sort((x, y) => (y.cat === a.cat) - (x.cat === a.cat)).slice(0, 3);
    const img = typeof PHOTOS[a.photo] === 'function' ? PHOTOS[a.photo](1200) : PHOTOS[a.photo];
    const abody = `
<article itemscope itemtype="https://schema.org/BlogPosting">
  <header class="max-w-3xl mx-auto px-4 sm:px-6 pt-8">
    ${breadcrumb(ac)}
    <div class="mt-10 flex flex-wrap items-center gap-3 text-sm text-ink/60">
      <span class="px-3 py-1 rounded-full bg-terra-soft text-terra font-medium">${a.cat}</span>
      <time datetime="${a.date}" itemprop="datePublished">${fmtDate(a.date)}</time><span>· ${a.read} min de lecture</span>
    </div>
    <h1 class="font-serif text-4xl sm:text-5xl text-forest font-semibold mt-4 leading-tight" itemprop="headline">${a.title}</h1>
    <p class="mt-5 text-lg text-ink/75 leading-relaxed" itemprop="description">${a.excerpt}</p>
    <p class="mt-6 flex items-center gap-3 text-sm"><img src="/assets/img/logo-mark.png" alt="" width="40" height="40" class="w-10 h-10 rounded-full bg-white p-1 shadow-soft"><span>Par <strong class="text-forest" itemprop="author">${SITE.owner}</strong>, ${SITE.role.toLowerCase()}</span></p>
  </header>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 mt-10"><div class="aspect-[16/8] rounded-[2rem] overflow-hidden shadow-soft img-fallback">${photo(a.photo, 1200, a.title, 'w-full h-full object-cover', true)}</div></div>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 py-14">
    <div class="prose-elmea" itemprop="articleBody">${a.body}</div>
    <aside class="mt-14 rounded-3xl bg-forest text-cream p-8 sm:p-10 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
      <div class="flex-1"><p class="font-script text-terra-light text-4xl">Besoin d’un coup de main ?</p><p class="mt-2 text-cream/85">Vous gérez votre activité, je m’occupe du reste. Premier échange gratuit et sans engagement.</p></div>
      <a href="/contact/" class="shrink-0 bg-terra text-white px-6 py-3 rounded-full font-medium hover:bg-white hover:text-forest transition inline-flex items-center gap-2">Me contacter ${ic('arrow-right', 'w-4 h-4')}</a>
    </aside>
    <p class="mt-8"><a href="/blog/" class="inline-flex items-center gap-2 text-terra font-medium">${ic('arrow-left', 'w-4 h-4')} Retour au blog</a></p>
  </div>
</article>
<section class="bg-white/60 py-16" aria-labelledby="related-title">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <h2 id="related-title" class="font-serif text-3xl text-forest font-semibold">À lire aussi</h2>
    <div class="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-7">${related.map((r) => articleCard(r)).join('')}</div>
  </div>
</section>`;
    add(ap, layout({ path: ap, title: a.title + ' | Élméa Solutions', description: a.description, body: abody, ogType: 'article', ogImage: img,
      extraHead: `\n  <meta property="article:published_time" content="${a.date}">\n  <meta property="article:section" content="${esc(a.cat)}">`,
      ld: [breadcrumbLd(ac), { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: a.title, description: a.description, image: img, datePublished: a.date, dateModified: a.date, inLanguage: 'fr-FR',
        mainEntityOfPage: abs(ap), author: { '@type': 'Person', name: SITE.owner, jobTitle: SITE.role }, publisher: { '@type': 'Organization', name: SITE.name, logo: { '@type': 'ImageObject', url: abs('/assets/img/logo-elmea.png') } } }] }), { lastmod: a.date });
  });
}

/* ===== PAGES LÉGALES ===== */
const legalPage = (p, h1, title, description, inner) => {
  const crumbs = [['Accueil', '/'], [h1, p]];
  add(p, layout({ path: p, title, description, body: `
<section class="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-20">
  ${breadcrumb(crumbs)}
  <h1 class="font-serif text-5xl text-forest font-semibold mt-10">${h1}</h1>
  <div class="divider my-6"></div>
  <div class="prose-elmea">${inner}</div>
  <p class="mt-10 text-sm text-ink/50">Dernière mise à jour : ${fmtDate(SITE.buildDate)}</p>
</section>`, ld: [breadcrumbLd(crumbs)] }), { priority: '0.2' });
};

legalPage('/mentions-legales/', 'Mentions légales', 'Mentions légales | Élméa Solutions', 'Mentions légales du site Élméa Solutions, gestion administrative externalisée à Monteux (Vaucluse).', `
<h2>Éditeur du site</h2>
<p><strong>${SITE.name}</strong><br>${SITE.legal.publisher} – ${SITE.legal.status}<br>${SITE.legal.address}<br>SIRET : ${SITE.legal.siret}<br>${SITE.legal.vat}<br>Téléphone : <a href="tel:${SITE.phoneIntl}">${SITE.phone}</a><br>Email : <a href="mailto:${SITE.email}">${SITE.email}</a></p>
<p>Directrice de la publication : ${SITE.legal.publisher}</p>
<h2>Hébergement</h2>
<p>${SITE.legal.host}</p>
<h2>Propriété intellectuelle</h2>
<p>L’ensemble des contenus de ce site (textes, logo, charte graphique, mise en page) est la propriété exclusive d’${SITE.name}, sauf mention contraire. Toute reproduction, totale ou partielle, sans autorisation écrite préalable est interdite.</p>
<p>Crédits photos : <a href="https://unsplash.com" target="_blank" rel="noopener">Unsplash</a> (licence Unsplash).</p>
<h2>Responsabilité</h2>
<p>Les informations publiées sur ce site, notamment dans les articles du blog, sont fournies à titre indicatif et général. Elles ne constituent pas un conseil juridique, fiscal ou social personnalisé. ${SITE.name} ne saurait être tenue responsable de l’usage qui en est fait.</p>
<h2>Données personnelles</h2>
<p>Le traitement des données collectées via le formulaire de contact est décrit dans la <a href="/confidentialite/">politique de confidentialité</a>.</p>
<h2>Médiation de la consommation</h2>
<p>Les prestations d’${SITE.name} s’adressent aux professionnels. En cas de litige, une solution amiable sera recherchée en priorité avant toute action judiciaire.</p>`);

legalPage('/confidentialite/', 'Politique de confidentialité', 'Politique de confidentialité (RGPD) | Élméa Solutions', 'Comment Élméa Solutions collecte, utilise et protège vos données personnelles, conformément au RGPD.', `
<p>La confidentialité est au cœur de mon métier. Cette politique explique quelles données sont collectées sur ce site, pourquoi, et quels sont vos droits.</p>
<h2>Responsable du traitement</h2>
<p>${SITE.legal.publisher} – ${SITE.name}, ${SITE.legal.address}. Contact : <a href="mailto:${SITE.email}">${SITE.email}</a>.</p>
<h2>Données collectées</h2>
<p>Via le formulaire de contact uniquement : nom, entreprise (facultatif), email, téléphone, service concerné et contenu de votre message.</p>
<h2>Finalité et base légale</h2>
<p>Ces données servent exclusivement à répondre à votre demande et à établir un devis. Le traitement repose sur votre consentement, recueilli via la case à cocher du formulaire, et sur les mesures précontractuelles prises à votre demande.</p>
<h2>Durée de conservation</h2>
<p>Les données des demandes non suivies d’une collaboration sont conservées 3 ans au maximum à compter du dernier contact, puis supprimées.</p>
<h2>Destinataires</h2>
<p>Vos données sont destinées uniquement à ${SITE.owner}. Elles ne sont jamais vendues, louées ni cédées à des tiers. Le cas échéant, le prestataire technique d’envoi du formulaire agit en tant que sous-traitant.</p>
<h2>Cookies et mesure d’audience</h2>
<p>Ce site ne dépose aucun cookie publicitaire ni de mesure d’audience. Les polices de caractères sont hébergées sur le site lui-même. Certaines images d’illustration sont chargées depuis le service Unsplash, qui peut recevoir votre adresse IP lors de leur affichage.</p>
<h2>Vos droits</h2>
<p>Conformément au RGPD et à la loi Informatique et Libertés, vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité de vos données. Pour les exercer, écrivez à <a href="mailto:${SITE.email}">${SITE.email}</a>.</p>
<p>Vous pouvez également introduire une réclamation auprès de la CNIL : <a href="https://www.cnil.fr" target="_blank" rel="noopener">www.cnil.fr</a>.</p>`);

/* ===== MERCI & 404 ===== */
add('/merci/', layout({ path: '/merci/', noindex: true, title: 'Merci pour votre demande | Élméa Solutions', description: 'Votre demande a bien été envoyée.', body: `
<section class="max-w-2xl mx-auto px-4 py-24 text-center">
  <span class="w-20 h-20 mx-auto rounded-full bg-sage-light text-forest flex items-center justify-center">${ic('circle-check', 'w-10 h-10')}</span>
  <h1 class="font-serif text-5xl text-forest font-semibold mt-6">Merci pour votre demande !</h1>
  <p class="font-script text-terra text-4xl mt-2">je vous réponds très vite</p>
  <p class="mt-6 text-ink/75 leading-relaxed">Votre message a bien été envoyé. Je reviens vers vous sous 24 h ouvrées. Pour une demande urgente, appelez-moi au <a href="tel:${SITE.phoneIntl}" class="text-terra underline">${SITE.phone}</a>.</p>
  <div class="mt-10 flex flex-col sm:flex-row gap-3 justify-center"><a href="/" class="btn-primary">Retour à l’accueil</a><a href="/blog/" class="btn-outline">Lire le blog</a></div>
</section>` }), { sitemap: false });

pages.push({ path: '/404.html', file: '404.html', sitemap: false, html: layout({ path: '/404.html', noindex: true, title: 'Page introuvable | Élméa Solutions', description: 'Cette page n’existe pas ou a été déplacée.', body: `
<section class="max-w-2xl mx-auto px-4 py-24 text-center">
  <p class="font-serif text-8xl text-terra font-semibold">404</p>
  <h1 class="font-serif text-4xl text-forest font-semibold mt-4">Cette page s’est égarée…</h1>
  <p class="font-script text-terra text-4xl mt-2">mais pas vos dossiers !</p>
  <p class="mt-6 text-ink/75">La page demandée n’existe pas ou a été déplacée.</p>
  <div class="mt-10 flex flex-col sm:flex-row gap-3 justify-center"><a href="/" class="btn-primary">Retour à l’accueil</a><a href="/contact/" class="btn-outline">Me contacter</a></div>
</section>` }) });

/* ---------------------------------------------------------
   6. ÉCRITURE DU SITE
--------------------------------------------------------- */
const OUT = path.resolve('dist');
fs.rmSync(OUT, { recursive: true, force: true });
fs.cpSync('public', OUT, { recursive: true });
fs.mkdirSync(path.join(OUT, 'assets/js'), { recursive: true });
fs.copyFileSync('src/main.js', path.join(OUT, 'assets/js/main.js'));

for (const pg of pages) {
  const file = pg.file ? path.join(OUT, pg.file) : path.join(OUT, pg.path, 'index.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, pg.html);
}

const prio = (p) => p === '/' ? '1.0' : ['/adv/', '/gestion-administrative/', '/appels-offres/', '/contact/'].includes(p) ? '0.9' : p === '/blog/' ? '0.7' : '0.6';
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.filter((p) => p.sitemap !== false).map((p) => `  <url><loc>${abs(p.path)}</loc><lastmod>${p.lastmod || SITE.buildDate}</lastmod><priority>${p.priority || prio(p.path)}</priority></url>`).join('\n')}
</urlset>
`);
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /merci/\n\nSitemap: ${abs('/sitemap.xml')}\n`);
fs.writeFileSync(path.join(OUT, 'site.webmanifest'), JSON.stringify({
  name: SITE.name, short_name: 'Élméa', start_url: '/', display: 'standalone', background_color: '#FAF6F1', theme_color: '#1F3A2E', lang: 'fr',
  icons: [{ src: '/assets/img/icon-180.png', sizes: '180x180', type: 'image/png' }, { src: '/assets/img/icon-512.png', sizes: '512x512', type: 'image/png' }]
}, null, 2));

console.log(`✔ ${pages.length} pages générées dans dist/`);
