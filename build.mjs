/* ==========================================================
   Élméa Solutions – générateur du site statique
   Usage : npm run build   (génère dist/ + functions/_lib/generated.js)
   Coordonnées, réseaux, formulaire, mentions légales : src/config.mjs
   ========================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { icons } from 'lucide';
import { ARTICLES } from './src/articles.mjs';
import { SITE, PHOTO_SOURCES, PHOTO_WIDTHS, PHOTO_LABELS } from './src/config.mjs';
import { createBlogRenderer } from './src/blog-render.mjs';

/* ---------- Adresse officielle (variable SITE_URL dans Cloudflare) ---------- */
SITE.url = (process.env.SITE_URL || SITE.url).trim().replace(/\/+$/, '');
const SITE_HOST = new URL(SITE.url).host;
/* Version des fichiers CSS/JS : change à chaque déploiement pour que les navigateurs
   ne gardent jamais une ancienne mise en page en cache */
const ASSET_V = (process.env.CF_PAGES_COMMIT_SHA || '').slice(0, 10) || Date.now().toString(36);

/* ---------- Photos : téléchargées une fois en WebP puis servies localement ---------- */
const PHOTO_DIR = 'public/assets/img/photos';
const unsplash = (id, w, fm = '') => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=72${fm ? '&fm=' + fm : ''}`;
const LOCAL = {};
async function fetchPhotos() {
  fs.mkdirSync(PHOTO_DIR, { recursive: true });
  const jobs = [];
  for (const [key, id] of Object.entries(PHOTO_SOURCES)) {
    for (const w of PHOTO_WIDTHS) {
      const file = path.join(PHOTO_DIR, `${key}-${w}.webp`);
      if (fs.existsSync(file) && fs.statSync(file).size > 1000) continue;
      jobs.push((async () => {
        try {
          const res = await fetch(unsplash(id, w, 'webp'), { signal: AbortSignal.timeout(20000) });
          if (!res.ok) throw new Error('HTTP ' + res.status);
          fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
        } catch (e) { console.warn(`⚠ Photo ${key}-${w} non téléchargée (${e.message}) : lien Unsplash utilisé en secours.`); }
      })());
    }
  }
  await Promise.all(jobs);
  for (const key of Object.keys(PHOTO_SOURCES)) {
    LOCAL[key] = PHOTO_WIDTHS.every((w) => fs.existsSync(path.join(PHOTO_DIR, `${key}-${w}.webp`)));
  }
}
await fetchPhotos();
const nearestW = (w) => PHOTO_WIDTHS.find((x) => x >= w) || PHOTO_WIDTHS[PHOTO_WIDTHS.length - 1];
const PHOTOS = Object.fromEntries(Object.keys(PHOTO_SOURCES).map((k) => [k,
  (w) => LOCAL[k] ? `/assets/img/photos/${k}-${nearestW(w)}.webp` : unsplash(PHOTO_SOURCES[k], w)]));
const ANY_REMOTE = Object.values(LOCAL).some((v) => !v);

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

/* Catalogue des missions pour l'outil « Composez votre formule » */
const MISSIONS = [
  { group: 'Ventes & facturation', icon: 'receipt-euro', items: ['Devis', 'Facturation', 'Tableau d’échéances', 'Relances clients', 'Suivi des règlements', 'Reporting mensuel'] },
  { group: 'Administratif & RH', icon: 'folder-open', items: ['Gestion des mails', 'Gestion administrative courante', 'Assurances & mutuelles', 'Plannings salariés', 'Variables de paie', 'Réservations de déplacements'] },
  { group: 'Appels d’offres', icon: 'file-text', ao: true, items: ['Veille & suivi des échéances', 'Montage du dossier (DC1, DC2…)', 'Mémoire technique', 'Suivi des réponses'] }
];

/* Pages locales (référencement « secrétariat indépendant + ville ») */
const CITIES = [
  {
    slug: 'monteux', name: 'Monteux', prep: 'à', path: '/secretariat-independant-monteux/', photo: 'office',
    title: 'Secrétariat indépendant à Monteux (84) – gestion administrative & ADV | Élméa Solutions',
    description: 'Assistante administrative indépendante basée à Monteux : facturation, relances, variables de paie, appels d’offres BTP. Intervention sur site dans les Sorgues du Comtat ou à distance.',
    h1: 'Secrétariat indépendant à Monteux',
    lead: 'Élméa Solutions est installée à <strong class="text-forest">Monteux</strong>. Je prends en charge l’administratif des TPE, PME et artisans de la commune et des environs, directement dans vos locaux ou à distance.',
    local: [
      ['Une assistante à deux pas', 'Basée à Monteux, je me déplace facilement dans les communes voisines des Sorgues du Comtat : Pernes-les-Fontaines, Sorgues, Althen-des-Paluds, Bédarrides… Une présence physique quand c’est utile, un suivi à distance le reste du temps.'],
      ['Spécialisée BTP et PME', 'J’accompagne notamment les entreprises du bâtiment : facturation des situations de travaux, suivi des paniers repas et des déplacements des équipes, dossiers d’appels d’offres. Je connais vos contraintes de chantier.'],
      ['Un fonctionnement souple', 'Par exemple une demi-journée par semaine sur site, quelques heures à distance, ou un renfort ponctuel en période chargée : la formule s’adapte à votre rythme.']
    ],
    faq: [
      { q: 'Vous déplacez-vous dans nos locaux à Monteux ?', a: 'Oui. Étant basée à Monteux, j’interviens sur site dans la commune et les environs, selon une fréquence définie ensemble. Une partie du travail peut aussi se faire à distance.' },
      { q: 'Travaillez-vous avec les entreprises des communes voisines ?', a: 'Oui : Pernes-les-Fontaines, Sorgues, Althen-des-Paluds, Bédarrides, Entraigues-sur-la-Sorgue, mais aussi Carpentras et Avignon. Au-delà, je travaille à distance.' }
    ]
  },
  {
    slug: 'carpentras', name: 'Carpentras', prep: 'à', path: '/secretariat-independant-carpentras/', photo: 'docs',
    title: 'Secrétariat indépendant à Carpentras – assistante administrative externalisée | Élméa Solutions',
    description: 'Gestion administrative externalisée pour les entreprises de Carpentras et du Comtat Venaissin : ADV, facturation, relances, suivi RH, appels d’offres. Sur site ou à distance.',
    h1: 'Secrétariat indépendant à Carpentras',
    lead: 'Vous dirigez une entreprise à <strong class="text-forest">Carpentras</strong> ou dans le Comtat Venaissin ? Je vous libère de la facturation, des relances, du suivi RH et des dossiers d’appels d’offres, en intervenant dans vos locaux ou à distance.',
    local: [
      ['Tout près de chez vous', 'Basée à Monteux, commune voisine de Carpentras, je peux venir régulièrement dans vos locaux pour faire le point, récupérer les documents et organiser le classement.'],
      ['Commerces, artisans, PME', 'Du commerce de centre-ville à l’entreprise du bâtiment, les besoins varient : devis et factures, relances clients, suivi des échéances, gestion des mails. Vous ne déléguez que ce qui vous fait perdre du temps.'],
      ['Marchés publics du territoire', 'Les collectivités du Comtat Venaissin publient régulièrement des consultations. Je monte vos dossiers de candidature et rédige votre mémoire technique, toujours avec votre validation avant envoi.']
    ],
    faq: [
      { q: 'Combien coûte une assistante administrative externalisée à Carpentras ?', a: 'Les formules présentées sur le site vont de 490 à 1 200 € HT par mois à titre indicatif. Tout est modulable : le devis est établi selon les missions retenues et votre volume.' },
      { q: 'Pouvez-vous intervenir uniquement à distance ?', a: 'Oui. De nombreuses missions (facturation, relances, appels d’offres) se gèrent très bien à distance, avec des outils de partage de documents sécurisés.' }
    ]
  },
  {
    slug: 'avignon', name: 'Avignon', prep: 'à', path: '/secretariat-independant-avignon/', photo: 'sign',
    title: 'Secrétariat indépendant à Avignon – gestion administrative, ADV, appels d’offres | Élméa Solutions',
    description: 'Assistante administrative indépendante pour les PME et entreprises du BTP d’Avignon et du Grand Avignon : facturation, relances, variables de paie, mémoire technique et appels d’offres.',
    h1: 'Secrétariat indépendant à Avignon',
    lead: 'Pour les PME, artisans et entreprises du BTP d’<strong class="text-forest">Avignon</strong> et du Grand Avignon, je prends en charge l’administration des ventes, la gestion administrative et RH et la réponse aux appels d’offres.',
    local: [
      ['Sur site ou à distance', 'Avignon est dans ma zone d’intervention régulière depuis Monteux. Je viens dans vos locaux quand c’est nécessaire et je gère le reste à distance.'],
      ['Appels d’offres publics', 'Ville, intercommunalité, département, bailleurs sociaux : les acheteurs publics du bassin avignonnais publient de nombreux marchés de travaux. Je prépare les pièces administratives (DC1, DC2, attestations) et rédige votre mémoire technique à partir de vos informations.'],
      ['Un vrai relais administratif', 'Ancienne assistante de direction, forte de 15 ans d’expérience dans l’administratif, je m’intègre à votre organisation : vos outils, vos process, votre façon de travailler.']
    ],
    faq: [
      { q: 'Intervenez-vous dans tout le Grand Avignon ?', a: 'Oui, sur site à Avignon et dans les communes environnantes selon les besoins, et à distance partout ailleurs.' },
      { q: 'Pouvez-vous nous aider à répondre à un marché public à Avignon ?', a: 'Oui : analyse du dossier de consultation, montage du dossier de candidature et rédaction du mémoire technique. Vous apportez l’expertise chantier et rien n’est envoyé sans votre accord.' }
    ]
  }
];

const FAQ = [
  { q: 'Qu’est-ce qu’une gestionnaire administrative externalisée ?',
    a: 'C’est une professionnelle indépendante qui prend en charge tout ou partie de votre administratif (facturation, relances, suivi RH, appels d’offres…) sans être salariée de votre entreprise. Vous recevez une facture mensuelle, sans charges sociales ni contrat de travail.' },
  { q: 'Intervenez-vous sur site ou uniquement à distance ?',
    a: 'Les deux. J’interviens sur site à Monteux, Carpentras, Avignon et alentours, et à distance partout en France grâce à des outils sécurisés de partage de documents. Les frais de déplacement sont facturés selon la distance, jusqu’à 100 km pour les missions ponctuelles.' },
  { q: 'Combien coûte l’externalisation de mon administratif ?',
    a: 'Les formules présentées (Essentiel 490 € HT, Sérénité 790 € HT, Expert 1 200 € HT par mois) sont des exemples indicatifs. Tout est modulable : vous ne gardez que les missions dont vous avez besoin – par exemple sans suivi RH, ou avec un seul dossier d’appel d’offres par mois – et le tarif est ajusté en conséquence sur devis. Toutes les missions sont aussi possibles ponctuellement : décrivez votre besoin pour recevoir un devis personnalisé.' },
  { q: 'Mes données sont-elles en sécurité ?',
    a: 'La confidentialité est l’un de mes engagements fondamentaux. Vos documents, données clients et données salariés ne sont jamais partagés, et un engagement de confidentialité peut être signé dès le début de la collaboration.' },
  { q: 'Pouvez-vous répondre à un appel d’offres à ma place ?',
    a: 'Je monte le dossier administratif et rédige le mémoire technique à partir de vos informations. Une collaboration étroite est nécessaire : vous apportez votre expertise chantier, je m’occupe de l’administratif, et rien n’est envoyé sans votre accord préalable.' }
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

const USED_ICONS = {};
function ic(name, cls = 'w-5 h-5') {
  const node = icons[pascal(name)];
  if (!node) throw new Error('Icône inconnue : ' + name);
  const children = Array.isArray(node[0]) ? node : node[2];
  const inner = children.map(([tag, a]) => `<${tag} ${attrs(a)}/>`).join('');
  USED_ICONS[name] = inner;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${cls}" aria-hidden="true">${inner}</svg>`;
}

function photo(key, w, alt, cls = 'w-full h-full object-cover', eager = false) {
  const src = PHOTOS[key];
  const small = nearestW(Math.round(w / 2)), big = nearestW(w);
  const srcset = small !== big ? ` srcset="${src(small)} ${small}w, ${src(big)} ${big}w" sizes="(max-width: 768px) 100vw, ${big}px"` : '';
  return `<img src="${src(w)}"${srcset} alt="${esc(alt)}" class="${cls}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" data-fallback>`;
}

/* Photos de Manon (public/assets/img/manon) */
const MANON = {
  'rendez-vous': { widths: [480, 800, 1200], alt: 'Manon Samain, gestionnaire administrative, en rendez-vous avec une cliente' },
  telephone: { widths: [480, 800], alt: 'Manon Samain au téléphone, devant son ordinateur' },
  dossier: { widths: [480, 800], alt: 'Manon Samain relisant un dossier administratif' }
};
function manon(key, cls, sizes = '(max-width: 1024px) 100vw, 600px', eager = false) {
  const m = MANON[key], big = m.widths[m.widths.length - 1];
  return `<img src="/assets/img/manon/${key}-${big}.webp" srcset="${m.widths.map((w) => `/assets/img/manon/${key}-${w}.webp ${w}w`).join(', ')}" sizes="${sizes}" alt="${esc(m.alt)}" class="${cls}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}

const fmtDate = (d) => new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const euro = (n) => n.toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, '&nbsp;') + '&nbsp;€';
const abs = (p) => SITE.url + p;
const BLOG = createBlogRenderer({ ic, SITE });
const { breadcrumb, breadcrumbLd, ctaBlock, contactUrl } = BLOG;
const toPost = (a) => ({ ...a, image: PHOTOS[a.photo](1200) });
const POSTS = [...ARTICLES].map(toPost).sort((a, b) => b.date.localeCompare(a.date));
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
  legalName: SITE.legal.publisher,
  foundingDate: SITE.legal.created,
  identifier: { '@type': 'PropertyValue', propertyID: 'SIRET', value: SITE.legal.siret.replace(/\s/g, '') },
  address: { '@type': 'PostalAddress', streetAddress: SITE.legal.street, addressLocality: SITE.city, postalCode: SITE.postalCode, addressRegion: SITE.region, addressCountry: 'FR' },
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
      <p class="text-cream font-semibold mt-6 mb-3">Zones d’intervention</p>
      <ul class="space-y-2 text-sm">
        ${CITIES.map((c) => `<li><a href="${c.path}" class="hover:text-terra-light">Secrétariat indépendant ${c.prep} ${c.name}</a></li>`).join('\n        ')}
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
      <p>© ${new Date().getFullYear()} ${SITE.name} – ${SITE.legal.publisher}. Tous droits réservés.</p>
      <p class="flex flex-wrap gap-x-4 gap-y-1"><a href="/mentions-legales/" class="hover:text-cream">Mentions légales</a><a href="/confidentialite/" class="hover:text-cream">Politique de confidentialité</a><a href="/cgv/" class="hover:text-cream">CGV</a><button type="button" data-consent-open class="hover:text-cream underline-offset-2">Gérer les cookies</button><a href="/sitemap.xml" class="hover:text-cream">Plan du site</a></p>
    </div>
  </div>
</footer>

<a href="https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent('Bonjour Manon, je souhaiterais en savoir plus sur vos services de gestion administrative.')}"
   target="_blank" rel="noopener" aria-label="Discuter sur WhatsApp"
   class="wa-btn fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-xl hover:scale-110 transition-transform group">
  <svg viewBox="0 0 32 32" class="w-8 h-8 fill-white" aria-hidden="true"><path d="M16.04 3C9 3 3.3 8.7 3.3 15.73c0 2.25.59 4.44 1.7 6.37L3.2 28.8l6.9-1.8a12.7 12.7 0 0 0 5.93 1.5h.01c7.03 0 12.74-5.7 12.74-12.73C28.78 8.7 23.07 3 16.04 3Zm0 23.3h-.01a10.6 10.6 0 0 1-5.39-1.48l-.39-.23-4.1 1.07 1.1-3.99-.25-.41a10.54 10.54 0 0 1-1.62-5.62c0-5.84 4.75-10.6 10.6-10.6 2.83 0 5.49 1.1 7.49 3.11a10.52 10.52 0 0 1 3.1 7.5c0 5.84-4.76 10.6-10.53 10.6Zm5.81-7.94c-.32-.16-1.88-.93-2.17-1.03-.29-.11-.5-.16-.71.16-.21.32-.82 1.03-1 1.24-.19.21-.37.24-.69.08-.32-.16-1.34-.5-2.56-1.58-.95-.85-1.58-1.89-1.77-2.21-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.71-1.71-.97-2.34-.26-.62-.52-.53-.71-.54h-.61c-.21 0-.56.08-.85.4-.29.32-1.11 1.09-1.11 2.65 0 1.56 1.14 3.07 1.3 3.28.16.21 2.24 3.42 5.43 4.8.76.33 1.35.52 1.81.67.76.24 1.45.21 2 .13.61-.09 1.88-.77 2.14-1.51.27-.74.27-1.38.19-1.51-.08-.13-.29-.21-.61-.37Z"/></svg>
  <span class="hidden sm:block absolute right-16 whitespace-nowrap bg-white text-forest text-sm px-3 py-2 rounded-lg shadow-soft opacity-0 group-hover:opacity-100 transition pointer-events-none">Une question ? Écrivez-moi !</span>
</a>
<div id="consent" class="hidden fixed z-50 inset-x-3 bottom-3 sm:inset-x-auto sm:left-5 sm:bottom-5 sm:w-[420px] bg-white rounded-3xl shadow-2xl border border-forest/10" role="dialog" aria-modal="false" aria-labelledby="consent-title">
  <div class="p-6">
    <p id="consent-title" class="font-serif text-2xl text-forest font-semibold flex items-center gap-2">${ic('cookie', 'w-6 h-6 text-terra')} Vos données, votre choix</p>
    <p class="mt-3 text-sm text-ink/75 leading-relaxed">Ce site mesure son audience de façon anonyme, <strong class="text-forest">sans cookie</strong> ni adresse IP, et ne dépose aucun cookie publicitaire. Vous pouvez accepter ou refuser cette mesure, et changer d’avis à tout moment via « Gérer les cookies » en bas de page. <a href="/confidentialite/" class="text-terra underline underline-offset-2">En savoir plus</a></p>
    <div id="consentPrefs" class="hidden mt-4 space-y-3">
      <div class="flex items-start justify-between gap-4 rounded-xl bg-cream p-3">
        <div><p class="text-sm font-semibold text-forest">Fonctionnement du site</p><p class="text-xs text-ink/60">Mémorise vos choix. Toujours actif.</p></div>
        <span class="text-xs font-semibold text-forest mt-0.5">Requis</span>
      </div>
      <label class="flex items-start justify-between gap-4 rounded-xl bg-cream p-3 cursor-pointer">
        <span><span class="block text-sm font-semibold text-forest">Mesure d’audience</span><span class="block text-xs text-ink/60">Statistiques anonymes, sans cookie ni adresse IP.</span></span>
        <input type="checkbox" id="cStats" class="mt-1 w-5 h-5 accent-[#1F3A2E] shrink-0">
      </label>
    </div>
    <div class="mt-5 grid grid-cols-2 gap-2">
      <button type="button" data-consent="refuse" class="py-3 rounded-full border border-forest text-forest text-sm font-semibold hover:bg-forest hover:text-cream transition">Tout refuser</button>
      <button type="button" data-consent="accept" class="py-3 rounded-full border border-forest bg-forest text-cream text-sm font-semibold hover:bg-terra hover:border-terra transition">Tout accepter</button>
      <button type="button" data-consent="custom" class="col-span-2 py-2 text-sm text-terra font-medium underline underline-offset-4">Personnaliser</button>
      <button type="button" data-consent="save" class="hidden col-span-2 py-3 rounded-full bg-terra text-white text-sm font-semibold hover:bg-forest transition">Enregistrer mes choix</button>
    </div>
  </div>
</div>
<button id="toTop" type="button" class="fixed bottom-5 left-5 z-40 w-11 h-11 rounded-full bg-white text-forest shadow-soft hidden items-center justify-center hover:text-terra" aria-label="Retour en haut">${ic('arrow-up')}</button>`;
}

function layout({ path: p, navPath, title, description, body, ld = [], ogType = 'website', ogImage = '/assets/img/og-image.jpg', noindex = false, extraHead = '' }) {
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
  <meta property="og:image" content="${/^(https?:|%%)/.test(ogImage) ? ogImage : abs(ogImage)}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/img/icon-32.png">
  <link rel="apple-touch-icon" href="/assets/img/icon-180.png">
  <link rel="manifest" href="/site.webmanifest">
  <link rel="preload" href="/assets/fonts/cormorant-garamond-latin-600-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/fonts/plus-jakarta-sans-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
${ANY_REMOTE ? '  <link rel="preconnect" href="https://images.unsplash.com">\n' : ''}${SITE.verification.google ? `  <meta name="google-site-verification" content="${esc(SITE.verification.google)}">\n` : ''}${SITE.verification.bing ? `  <meta name="msvalidate.01" content="${esc(SITE.verification.bing)}">\n` : ''}  <link rel="stylesheet" href="/assets/css/style.css?v=${ASSET_V}">
  ${ld.map(jsonld).join('\n  ')}${extraHead}
</head>
<body>
${header(navPath || p)}
<main id="contenu">
${body}
</main>
${footer()}
<script src="/assets/js/main.js?v=${ASSET_V}" defer></script>
</body>
</html>
`;
}

/* ---------------------------------------------------------
   4. BLOCS RÉUTILISABLES
--------------------------------------------------------- */
const personLd = () => ({
  '@context': 'https://schema.org', '@type': 'Person', name: SITE.owner, jobTitle: SITE.role,
  worksFor: { '@id': BUSINESS_ID }, url: SITE.url + '/', image: abs('/assets/img/manon/telephone-800.webp'),
  knowsAbout: ['Gestion administrative', 'Administration des ventes', 'Facturation', 'Variables de paie', 'Appels d’offres', 'Marchés publics', 'Mémoire technique BTP', ...SITE.tools],
  hasCredential: { '@type': 'EducationalOccupationalCredential', name: 'BTS Gestion de la PME' },
  sameAs: [SITE.social.linkedin].filter(Boolean)
});

const socialSection = () => {
  const fb = SITE.social.facebook;
  const nets = [
    ['facebook', 'Facebook', fb, 'Élméa Solutions'],
    ['instagram', 'Instagram', SITE.social.instagram, SITE.social.instagramHandle],
    ['linkedin', 'LinkedIn', SITE.social.linkedin, 'Manon Samain']
  ].filter(([, , u]) => u);
  const right = `
      <div class="mx-auto w-full max-w-[460px] rounded-3xl bg-white shadow-soft p-8 sm:p-10">
        <div class="flex items-center gap-4">
          <img src="/assets/img/logo-mark.png" alt="" width="64" height="64" class="w-16 h-16 rounded-full bg-cream p-1">
          <div><p class="font-serif text-2xl text-forest font-semibold leading-tight">${SITE.name}</p><p class="text-sm text-ink/60">Gestion administrative externalisée</p></div>
        </div>
        <ul class="mt-7 space-y-3">
          ${nets.map(([i, n, u, h]) => `<li><a href="${esc(u)}" target="_blank" rel="noopener" class="group flex items-center gap-4 rounded-2xl border border-forest/10 p-4 hover:border-terra hover:bg-terra-soft/40 transition">
            <span class="w-11 h-11 rounded-full bg-forest text-cream flex items-center justify-center shrink-0 group-hover:bg-terra transition">${ic(i, 'w-5 h-5')}</span>
            <span class="min-w-0 flex-1"><span class="block font-semibold text-forest">${n}</span><span class="block text-sm text-ink/60 truncate">${esc(h)}</span></span>
            ${ic('arrow-up-right', 'w-5 h-5 text-ink/40 group-hover:text-terra shrink-0')}
          </a></li>`).join('\n          ')}
        </ul>
      </div>`;
  return `
<section class="bg-white/60 py-20" aria-labelledby="social-title">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
    <div class="reveal">
      <p class="eyebrow">Réseaux sociaux</p>
      <h2 id="social-title" class="h-section mt-3">Suivez l’actualité d’Élméa</h2>
      <p class="mt-5 text-ink/75 leading-relaxed">Conseils pratiques, astuces d’organisation, nouveautés réglementaires et coulisses du métier : retrouvez-moi sur les réseaux sociaux.</p>
    </div>
    <div class="reveal">${right}
    </div>
  </div>
</section>`;
};

const valuesBand = () => `
<section class="bg-forest text-cream py-12" aria-label="Mes valeurs">
  <div class="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
    ${[['folder-check', 'Organisation'], ['target', 'Rigueur'], ['shield', 'Confidentialité'], ['clock', 'Réactivité']].map(([i, l]) =>
      `<div>${ic(i, 'w-8 h-8 mx-auto text-terra-light')}<p class="mt-3 tracking-[.2em] text-sm uppercase">${l}</p></div>`).join('\n    ')}
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
  <article class="reveal relative ${dark ? 'bg-forest text-cream shadow-soft' : 'bg-white border border-forest/10'} rounded-3xl p-8 flex flex-col">
    <div class="flex items-center justify-between gap-3">
      <span class="w-12 h-12 rounded-full ${dark ? 'bg-terra text-white' : f.id === 'expert' ? 'bg-terra-soft text-terra' : 'bg-forest text-cream'} flex items-center justify-center">${ic(f.icon, 'w-6 h-6')}</span>
      <span class="text-[11px] tracking-[.15em] uppercase font-semibold px-3 py-1 rounded-full ${dark ? 'bg-white/10 text-cream/85' : 'bg-cream text-ink/60'}">Exemple de formule</span>
    </div>
    <h3 class="font-serif text-3xl font-semibold mt-5 ${dark ? '' : 'text-forest'}">${f.name}</h3>
    <p class="text-sm mt-1 ${dark ? 'text-cream/75' : 'text-ink/60'}">${f.tagline}</p>
    <p class="mt-6 text-xs uppercase tracking-[.15em] ${dark ? 'text-cream/60' : 'text-ink/50'}">Tarif indicatif</p>
    <p class="mt-1"><span class="font-serif text-5xl font-semibold ${dark ? '' : 'text-forest'}">${euro(f.price)}</span> <span class="${dark ? 'text-cream/75' : 'text-ink/60'}">HT / mois</span></p>
    <ul class="mt-6 space-y-3 text-[15px] flex-1">${li}</ul>
    ${f.note ? `<p class="text-xs mt-6 ${dark ? 'text-cream/60' : 'text-ink/55'}">${f.note}</p>` : ''}
    <p class="mt-5 text-xs flex gap-2 ${dark ? 'text-cream/75' : 'text-ink/60'}">${ic('sliders-horizontal', 'w-4 h-4 shrink-0 ' + (dark ? 'text-terra-light' : 'text-terra'))}<span>Retirez ou ajoutez des missions : le prix s’ajuste.</span></p>
    <a href="${contactUrl('Forfait ' + f.name)}" class="mt-5 text-center py-3 rounded-full font-medium transition ${dark ? 'bg-terra text-white hover:bg-white hover:text-forest' : f.id === 'expert' ? 'border border-terra text-terra hover:bg-terra hover:text-white' : 'border border-forest text-forest hover:bg-forest hover:text-cream'}">Adapter cette formule</a>
  </article>`;
};

const composer = () => `
<div id="composer" class="reveal mt-16 rounded-[2rem] bg-white shadow-soft overflow-hidden scroll-mt-24">
  <div class="p-6 sm:p-10">
    <div class="max-w-2xl">
      <p class="eyebrow">Sur mesure</p>
      <h3 class="font-serif text-3xl sm:text-4xl text-forest font-semibold mt-2">Composez votre formule</h3>
      <p class="mt-3 text-ink/70">Cochez uniquement les missions qui vous intéressent : je vous envoie un devis adapté à votre volume réel.</p>
    </div>
    <div class="mt-8 grid md:grid-cols-3 gap-6">
      ${MISSIONS.map((g) => `
      <fieldset class="rounded-2xl bg-cream/70 p-5">
        <legend class="sr-only">${g.group}</legend>
        <p class="flex items-center gap-2 font-semibold text-forest">${ic(g.icon, 'w-5 h-5 text-terra')}${g.group}</p>
        <div class="mt-4 flex flex-wrap gap-2">
          ${g.items.map((m) => `<label class="mission cursor-pointer select-none"><input type="checkbox" class="sr-only peer" value="${esc(m)}"${g.ao ? ' data-ao="1"' : ''}><span class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-forest/15 bg-white text-sm text-forest transition peer-checked:bg-forest peer-checked:text-cream peer-checked:border-forest peer-focus-visible:ring-2 peer-focus-visible:ring-terra hover:border-terra">${ic('plus', 'w-3.5 h-3.5 mission-plus')}${ic('check', 'w-3.5 h-3.5 mission-check hidden')}${m}</span></label>`).join('\n          ')}
        </div>
        ${g.ao ? `<div id="aoVolume" class="mt-4 hidden">
          <label for="aoCount" class="block text-sm text-ink/70 mb-1.5">Combien de dossiers par mois ?</label>
          <select id="aoCount" class="field !py-2 !bg-white text-sm">
            <option>1 dossier par mois</option><option>2 dossiers par mois</option><option>3 dossiers par mois</option><option>Plus de 3 dossiers par mois</option><option>Ponctuellement, selon les consultations</option>
          </select>
        </div>` : ''}
      </fieldset>`).join('')}
    </div>
  </div>
  <div class="bg-forest text-cream px-6 sm:px-10 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <p id="composerCount" class="text-sm text-cream/85" aria-live="polite">Aucune mission sélectionnée pour l’instant.</p>
    <a id="composerCta" href="${contactUrl('Autre / besoin sur mesure')}" class="inline-flex items-center justify-center gap-2 bg-terra text-white px-6 py-3 rounded-full font-medium hover:bg-white hover:text-forest transition">Demander mon devis sur mesure ${ic('arrow-right', 'w-4 h-4')}</a>
  </div>
</div>`;

const articleCard = (a, h) => BLOG.card(a, h);

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
  const latest = POSTS.slice(0, 3);
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
      <div class="aspect-[5/4] lg:aspect-[4/5] rounded-[2rem] overflow-hidden shadow-soft img-fallback">${manon('rendez-vous', 'w-full h-full object-cover object-[48%_30%]', '(max-width: 1024px) 100vw, 600px', true)}</div>
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

<section class="bg-forest text-cream py-20 overflow-hidden" aria-labelledby="ao-home-title">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
    <div class="reveal">
      <p class="text-terra-light text-xs tracking-[.25em] uppercase font-semibold">Ma spécialité</p>
      <h2 id="ao-home-title" class="font-serif text-4xl sm:text-5xl font-semibold mt-3 leading-tight">Les appels d’offres, un service encore rare</h2>
      <p class="mt-5 text-cream/85 leading-relaxed">Peu d’assistantes indépendantes accompagnent les entreprises du BTP sur les marchés publics. C’est pourtant là que beaucoup d’artisans et de PME laissent passer des chantiers, faute de temps pour monter le dossier.</p>
      <ul class="mt-6 space-y-3">
        ${['Veille et suivi des dates limites de remise des offres', 'Dossier de candidature complet : DC1, DC2, attestations, références', 'Mémoire technique rédigé pour chaque consultation, à partir de vos informations', 'Rien n’est déposé sans votre validation'].map((t) => `<li class="flex gap-3">${ic('check', 'w-5 h-5 text-terra-light shrink-0 mt-0.5')}<span>${t}</span></li>`).join('')}
      </ul>
      <div class="mt-8 flex flex-col sm:flex-row sm:flex-wrap gap-3">
        <a href="/appels-offres/" class="inline-flex items-center justify-center gap-2 bg-terra text-white px-7 py-4 rounded-full font-medium hover:bg-white hover:text-forest transition sm:whitespace-nowrap">Découvrir l’accompagnement ${ic('arrow-right')}</a>
        <a href="${contactUrl('Appels d’offres / mémoire technique')}" class="inline-flex items-center justify-center gap-2 border border-cream/40 px-7 py-4 rounded-full font-medium hover:bg-white/10 transition sm:whitespace-nowrap">J’ai une consultation en cours</a>
      </div>
    </div>
    <ol class="reveal grid sm:grid-cols-2 gap-4">
      ${[['Analyse', 'Lecture du dossier de consultation et des critères de notation'], ['Échange', 'Vous m’apportez votre expertise chantier et vos prix'], ['Rédaction', 'Montage du dossier et du mémoire technique'], ['Validation', 'Relecture commune, puis dépôt sur la plateforme']].map(([t, d], i) =>
        `<li class="rounded-2xl bg-white/5 border border-white/10 p-6"><p class="font-serif text-4xl text-terra-light">${i + 1}</p><p class="font-semibold mt-2">${t}</p><p class="text-sm text-cream/75 mt-1">${d}</p></li>`).join('')}
    </ol>
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
        ['map-pin', 'Sur site ou à distance', 'Intervention à <a href="/secretariat-independant-monteux/" class="underline underline-offset-2 hover:text-terra">Monteux</a>, <a href="/secretariat-independant-carpentras/" class="underline underline-offset-2 hover:text-terra">Carpentras</a>, <a href="/secretariat-independant-avignon/" class="underline underline-offset-2 hover:text-terra">Avignon</a> et alentours, ou 100 % à distance.']
      ].map(([i, t, d]) => `<div class="reveal card p-6">${ic(i, 'w-7 h-7 text-terra')}<h3 class="font-semibold text-forest mt-4">${t}</h3><p class="text-sm text-ink/70 mt-2">${d}</p></div>`).join('\n      ')}
    </div>
  </div>
</section>

${valuesBand()}

<section class="py-20" aria-labelledby="about-title">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-[340px,1fr] gap-10 lg:gap-14 items-center">
    <div class="reveal mx-auto w-full flex justify-center">
      <div class="relative w-full max-w-[340px]">
        <div class="aspect-[4/5] rounded-[2rem] overflow-hidden shadow-soft img-fallback">${manon('telephone', 'w-full h-full object-cover object-[55%_20%]', '(max-width: 768px) 90vw, 340px')}</div>
        <span class="hidden md:block absolute -bottom-5 -right-3 w-20 h-20 rounded-full bg-white shadow-soft p-2"><img src="/assets/img/logo-mark.png" alt="" width="80" height="80" class="w-full h-full" loading="lazy"></span>
      </div>
    </div>
    <div class="reveal">
      <p class="eyebrow">Qui suis-je ?</p>
      <h2 id="about-title" class="h-section mt-3">${SITE.owner}, votre partenaire administrative</h2>
      <p class="mt-5 text-ink/75 leading-relaxed">Forte de <strong class="text-forest">15 ans d’expérience dans l’administratif</strong>, titulaire d’un <strong class="text-forest">BTS Gestion de la PME</strong> et ancienne <strong class="text-forest">assistante de direction</strong>, j’ai créé Élméa Solutions pour offrir aux dirigeants de PME et aux entreprises du BTP un soutien administratif fiable, réactif et sur mesure.</p>
      <p class="mt-4 text-ink/75 leading-relaxed">J’ai travaillé auprès de <strong class="text-forest">TPE, PME et artisans, notamment du BTP</strong>. Ma vision à la fois globale et opérationnelle de l’entreprise me permet de comprendre rapidement vos enjeux et de m’intégrer à votre organisation, sur site comme à distance.</p>
      <p class="mt-4 text-ink/75 leading-relaxed">Je travaille dans vos outils (${SITE.tools.join(', ')}…) et, si vous n’avez pas encore de logiciel de facturation, je mets le mien à votre disposition.</p>
      <p class="font-script text-terra text-4xl mt-5">Manon</p>
      <h3 class="sr-only">Élméa Solutions en bref</h3>
      <dl class="mt-8 grid sm:grid-cols-2 gap-x-8 gap-y-4 text-sm border-t border-forest/10 pt-6">
        <div><dt class="text-ink/50">Activité</dt><dd class="text-forest font-medium mt-0.5">Gestion administrative externalisée, ADV, appels d’offres</dd></div>
        <div><dt class="text-ink/50">Pour qui</dt><dd class="text-forest font-medium mt-0.5">TPE, PME, artisans et entreprises du BTP</dd></div>
        <div><dt class="text-ink/50">Basée à</dt><dd class="text-forest font-medium mt-0.5">${SITE.city} (Vaucluse, 84)</dd></div>
        <div><dt class="text-ink/50">Intervention</dt><dd class="text-forest font-medium mt-0.5">Sur site (Monteux, Carpentras, Avignon) ou à distance</dd></div>
        <div><dt class="text-ink/50">Tarifs</dt><dd class="text-forest font-medium mt-0.5">Formules modulables, à titre indicatif de 490 à 1 200 € HT/mois</dd></div>
        <div><dt class="text-ink/50">Outils maîtrisés</dt><dd class="text-forest font-medium mt-0.5">${SITE.tools.join(', ')}</dd></div>
        <div><dt class="text-ink/50">Déplacements</dt><dd class="text-forest font-medium mt-0.5">Jusqu’à 100 km pour les missions ponctuelles</dd></div>
        <div><dt class="text-ink/50">Contact</dt><dd class="text-forest font-medium mt-0.5"><a href="tel:${SITE.phoneIntl}" class="hover:text-terra">${SITE.phone}</a></dd></div>
      </dl>
    </div>
  </div>
</section>

<section id="forfaits" class="py-20 bg-white/60 scroll-mt-24" aria-labelledby="forfaits-title">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-3xl mx-auto reveal">
      <p class="eyebrow">Forfaits &amp; tarifs</p>
      <h2 id="forfaits-title" class="h-section mt-3">Des formules 100 % modulables</h2>
      <p class="font-script text-terra text-4xl mt-1">pensées pour vous donner des idées</p>
      <p class="mt-5 text-ink/75 leading-relaxed">Ces trois formules sont des <strong class="text-forest">exemples de missions</strong> que je peux prendre en charge. Pas besoin de suivi RH ? Un seul dossier d’appel d’offres par mois vous suffit ? On retire, on ajoute, et <strong class="text-forest">le prix s’ajuste à votre besoin réel</strong>.</p>
      <ul class="mt-6 flex flex-wrap justify-center gap-2 text-sm">
        <li class="chip bg-white shadow-soft">${ic('puzzle', 'w-4 h-4 text-terra')}Missions à la carte</li>
        <li class="chip bg-white shadow-soft">${ic('sliders-horizontal', 'w-4 h-4 text-terra')}Prix ajusté à votre volume</li>
        <li class="chip bg-white shadow-soft">${ic('calendar-clock', 'w-4 h-4 text-terra')}Missions ponctuelles</li>
        <li class="chip bg-white shadow-soft">${ic('file-signature', 'w-4 h-4 text-terra')}Devis gratuit</li>
      </ul>
      <p class="mt-5 text-sm text-ink/65">Besoin ponctuel ? Toutes les missions sont aussi possibles à la demande : décrivez votre besoin pour recevoir un devis personnalisé. ${SITE.travel}</p>
    </div>
    <div class="mt-14 grid lg:grid-cols-3 gap-6 items-stretch">${FORFAITS.map(forfaitCard).join('')}</div>
    ${composer()}
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

${socialSection()}

<section class="py-20" aria-labelledby="blog-title">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 reveal">
      <div><p class="eyebrow">Blog</p><h2 id="blog-title" class="font-serif text-4xl text-forest font-semibold mt-2">Derniers conseils</h2></div>
      <a href="/blog/" class="inline-flex items-center gap-2 text-terra font-medium">Tous les articles ${ic('arrow-right', 'w-4 h-4')}</a>
    </div>
    <div id="latestPosts" class="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-7">${latest.map((a) => articleCard(a)).join('')}</div>
  </div>
</section>

${ctaBlock()}`;
  add('/', layout({
    path: '/',
    title: 'Gestion administrative externalisée, ADV & appels d’offres BTP | Élméa Solutions – Monteux',
    description: 'Secrétariat indépendant et gestion administrative externalisée pour PME et BTP : ADV, facturation, relances, variables de paie, mémoire technique et appels d’offres. Monteux, Carpentras, Avignon.',
    body, ld: [businessLd(), faqLd(FAQ), personLd(), { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE.name, url: SITE.url + '/', inLanguage: 'fr-FR', publisher: { '@id': BUSINESS_ID } }],
    extraHead: `\n  <link rel="preload" as="image" href="/assets/img/manon/rendez-vous-1200.webp" imagesrcset="/assets/img/manon/rendez-vous-480.webp 480w, /assets/img/manon/rendez-vous-800.webp 800w, /assets/img/manon/rendez-vous-1200.webp 1200w" imagesizes="(max-width: 1024px) 100vw, 600px" fetchpriority="high">`
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
    { q: 'Utilisez-vous mon logiciel de facturation ?', a: 'Oui, je travaille directement dans vos outils (logiciel de devis-factures, logiciel métier BTP, Excel, Sage…) pour que vous gardiez la main sur vos données. Si vous n’avez pas encore de logiciel de facturation, je mets le mien à votre disposition.' },
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
  <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 lg:pb-28">
    <nav aria-label="Fil d’Ariane" class="text-sm text-cream/70"><a href="/" class="hover:text-white">Accueil</a> <span aria-hidden="true">›</span> <span aria-current="page" class="text-white">Appels d’offres BTP</span></nav>
    <div class="mt-12 grid lg:grid-cols-[1fr,380px] gap-12 items-center">
    <div class="max-w-3xl">
      <p class="text-terra-light text-xs tracking-[.25em] uppercase font-semibold">Spécialisé BTP &amp; PME</p>
      <h1 class="font-serif text-5xl sm:text-6xl font-semibold mt-3 leading-tight">Appels d’offres &amp; mémoire technique BTP</h1>
      <div class="divider my-6"></div>
      <p class="text-lg text-cream/85 leading-relaxed">Répondre aux marchés publics et privés prend un temps considérable. Je monte vos dossiers de candidature et rédige votre <strong class="text-white">mémoire technique</strong> pour multiplier vos chances de remporter des marchés.</p>
      <a href="${contactUrl('Appels d’offres / mémoire technique')}" class="mt-8 btn-primary">J’ai un appel d’offres en cours ${ic('arrow-right')}</a>
    </div>
    <div class="hidden lg:block aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl img-fallback">${manon('dossier', 'w-full h-full object-cover object-[50%_25%]', '380px', true)}</div>
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
      <div class="mt-5 flex items-center gap-3"><img src="/assets/img/manon/avatar-240.webp" alt="Manon Samain" width="56" height="56" class="w-14 h-14 rounded-full object-cover shadow-soft"><p class="text-sm text-ink/70 leading-snug"><strong class="text-forest">Manon Samain</strong><br>Je réponds personnellement à chaque demande.</p></div>
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
        <p class="text-xs text-ink/55">Prestations réservées aux professionnels, régies par nos <a href="/cgv/" class="text-terra underline underline-offset-2">conditions générales de vente</a>.</p>
        <button id="submitBtn" type="submit" class="w-full sm:w-auto btn-primary disabled:opacity-60"><span>Envoyer ma demande</span> ${ic('send')}</button>
        <div id="formStatus" class="hidden" role="status" aria-live="polite"></div>
      </form>
    </div>
  </div>
</section>`;
  add(p, layout({ path: p, title: 'Contact & devis gratuit – Secrétariat indépendant à Monteux (84) | Élméa Solutions', description: 'Demandez votre devis gratuit pour externaliser votre gestion administrative, votre ADV ou vos appels d’offres. Réponse sous 24 h. Monteux, Carpentras, Avignon.', body,
    ld: [{ ...businessLd(), '@context': 'https://schema.org' }, breadcrumbLd(crumbs), { '@context': 'https://schema.org', '@type': 'ContactPage', name: 'Contact Élméa Solutions', url: abs(p) }] }));
}

/* ===== BLOG (version statique : sert de repli si la base D1 n'est pas branchée) ===== */
{
  const idx = BLOG.indexPage(POSTS);
  add(idx.path, layout(idx));
  POSTS.forEach((a) => {
    const pg = BLOG.articlePage(a, POSTS);
    add(pg.path, layout({ ...pg, extraHead: pg.head }), { lastmod: a.date });
  });
}

/* ===== PAGES LOCALES ===== */
CITIES.forEach((c) => {
  const crumbs = [['Accueil', '/'], [c.h1, c.path]];
  const others = CITIES.filter((x) => x.slug !== c.slug);
  const body = `
${pageHero({ crumbs, eyebrow: 'Zone d’intervention · Vaucluse', h1: c.h1, lead: c.lead, photoKey: c.photo, alt: 'Gestion administrative externalisée – ' + c.name, cta: 'Parler de mon besoin', service: 'Autre / besoin sur mesure' })}
<section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
  <div class="grid md:grid-cols-3 gap-6">
    ${c.local.map(([t, d]) => `<div class="reveal card p-8"><h2 class="font-serif text-2xl text-forest font-semibold">${t}</h2><p class="mt-3 text-ink/75 leading-relaxed">${d}</p></div>`).join('\n    ')}
  </div>
  <div class="mt-16 text-center max-w-2xl mx-auto reveal">
    <p class="eyebrow">Mes services ${c.prep} ${c.name}</p>
    <h2 class="h-section mt-3">Ce que je peux prendre en charge</h2>
  </div>
  <div class="mt-10 grid md:grid-cols-3 gap-6">
    ${[['/adv/', 'receipt-euro', 'ADV &amp; facturation', 'Devis, factures, situations de travaux, échéancier et relances d’impayés.'],
       ['/gestion-administrative/', 'folder-open', 'Gestion administrative &amp; RH', 'Mails, assurances, mutuelles, plannings, déplacements et variables de paie.'],
       ['/appels-offres/', 'file-text', 'Appels d’offres BTP', 'Dossier de candidature, DC1, DC2 et mémoire technique, avec votre validation.']].map(([h, i, t, d]) =>
      `<a href="${h}" class="reveal card p-7 group hover:-translate-y-0.5 transition">${ic(i, 'w-7 h-7 text-terra')}<h3 class="font-semibold text-forest text-lg mt-4">${t}</h3><p class="text-sm text-ink/70 mt-2">${d}</p><span class="mt-4 inline-flex items-center gap-2 text-terra text-sm font-medium">En savoir plus ${ic('arrow-right', 'w-4 h-4')}</span></a>`).join('\n    ')}
  </div>
  <p class="mt-10 text-center text-ink/70 reveal">Formules modulables, à titre indicatif de 490 à 1 200 € HT par mois – <a href="/#forfaits" class="text-terra underline underline-offset-4">voir les formules et composer la vôtre</a>.</p>
</section>
<section class="max-w-3xl mx-auto px-4 sm:px-6 pb-4"><h2 class="font-serif text-3xl text-forest font-semibold text-center mb-8 reveal">Questions fréquentes</h2>${faqBlock(c.faq)}
  <p class="mt-10 text-center text-sm text-ink/60">J’interviens aussi ${others.map((o) => `<a href="${o.path}" class="text-terra underline underline-offset-2">${o.prep} ${o.name}</a>`).join(' et ')}.</p>
</section>
${ctaBlock('Parlons de votre entreprise', 'Premier échange gratuit et sans engagement, ' + c.prep + ' ' + c.name + ' ou par téléphone.', 'Autre / besoin sur mesure')}`;
  add(c.path, layout({ path: c.path, title: c.title, description: c.description, body,
    ld: [breadcrumbLd(crumbs), faqLd(c.faq), {
      '@context': 'https://schema.org', '@type': 'Service', name: 'Secrétariat indépendant et gestion administrative externalisée ' + c.prep + ' ' + c.name,
      serviceType: 'Gestion administrative externalisée', provider: { '@id': BUSINESS_ID }, url: abs(c.path),
      areaServed: { '@type': 'City', name: c.name, containedInPlace: { '@type': 'AdministrativeArea', name: 'Vaucluse' } }
    }] }), { priority: '0.8' });
});

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
<p>Crédits photos : <a href="https://unsplash.com" target="_blank" rel="noopener">Unsplash</a> (licence Unsplash). Logo et charte graphique : propriété d’${SITE.name}.</p>
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
<h2>Mesure d’audience</h2>
<p>Ce site utilise une mesure d’audience interne, <strong>sans cookie</strong> et anonyme : pages consultées, site de provenance, type d’appareil et pays. Votre adresse IP n’est jamais enregistrée ; un identifiant technique non réversible, renouvelé chaque jour, permet seulement de compter les visites. Ces statistiques ne sont ni partagées ni croisées avec d’autres données, et sont supprimées au bout de 13 mois.</p>
<h2>Cookies et contenus tiers</h2>
<p>Ce site ne dépose aucun cookie publicitaire. Les polices de caractères sont hébergées sur le site lui-même. ${ANY_REMOTE ? 'Certaines images d’illustration sont chargées depuis le service Unsplash, qui peut recevoir votre adresse IP lors de leur affichage.' : 'Les images sont également hébergées sur le site : aucune donnée n’est transmise à un service tiers lors de votre navigation.'}</p>
<p>Les liens vers Facebook, Instagram et LinkedIn sont de simples liens : aucun contenu de ces réseaux n’est chargé sur le site. Votre choix concernant la mesure d’audience est mémorisé sur votre appareil pendant 6 mois.</p><h2>Gérer vos choix</h2>
<p>Lors de votre première visite, un bandeau vous permet d’accepter ou de refuser la mesure d’audience, aussi simplement l’un que l’autre. Vous pouvez modifier vos choix à tout moment :</p>
<p><button type="button" data-consent-open class="btn-primary">Gérer les cookies</button></p>
<p>Vos préférences sont enregistrées uniquement dans votre navigateur (stockage local), sans cookie.</p>
<h2>Vos droits</h2>
<p>Conformément au RGPD et à la loi Informatique et Libertés, vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité de vos données. Pour les exercer, écrivez à <a href="mailto:${SITE.email}">${SITE.email}</a>.</p>
<p>Vous pouvez également introduire une réclamation auprès de la CNIL : <a href="https://www.cnil.fr" target="_blank" rel="noopener">www.cnil.fr</a>.</p>`);

/* ===== CGV (prestations de services entre professionnels) ===== */
legalPage('/cgv/', 'Conditions générales de vente', 'Conditions générales de vente | Élméa Solutions', 'Conditions générales de vente des prestations de gestion administrative externalisée d’Élméa Solutions, réservées aux professionnels.', `
<h2>1. Champ d’application</h2>
<p>Les présentes conditions générales de vente (CGV) s’appliquent à toutes les prestations réalisées par <strong>${SITE.legal.publisher}</strong>, exerçant sous le nom commercial ${SITE.name}, ${SITE.legal.address}, SIRET ${SITE.legal.siret} (ci-après « le Prestataire »), pour le compte de clients professionnels (ci-après « le Client »).</p>
<p>Les prestations sont exclusivement destinées aux professionnels (entreprises, artisans, associations, collectivités). Toute commande implique l’acceptation sans réserve des présentes CGV, qui prévalent sur les conditions générales d’achat du Client, sauf accord écrit contraire. Les CGV sont communiquées à tout Client qui en fait la demande et sont consultables en permanence sur ce site.</p>

<h2>2. Prestations</h2>
<p>Le Prestataire propose des prestations de gestion administrative externalisée : administration des ventes (devis, facturation, suivi des échéances, relances), gestion administrative et suivi des salariés (courrier, assurances, mutuelles, plannings, réservations de déplacements, collecte des éléments variables de paie) et accompagnement aux appels d’offres (veille, montage du dossier de candidature, rédaction du mémoire technique, suivi des échéances).</p>
<p>Les prestations sont proposées sous forme de forfaits mensuels modulables ou de missions ponctuelles. Leur contenu précis, leur volume et leurs modalités d’exécution (sur site ou à distance) sont définis dans le devis accepté par le Client.</p>
<p>Le Prestataire n’exerce aucune activité réglementée : il ne tient pas la comptabilité, n’établit pas les bulletins de paie et ne délivre aucun conseil juridique, fiscal ou social. Ces missions relèvent des professionnels habilités (expert-comptable, avocat…) auxquels le Prestataire transmet, le cas échéant, les éléments préparés.</p>

<h2>3. Devis et commande</h2>
<p>Toute prestation fait l’objet d’un devis gratuit et personnalisé, établi à partir des besoins exprimés par le Client. Sauf mention contraire, le devis est valable 30 jours. La commande devient ferme à réception du devis accepté par le Client, par signature ou par acceptation écrite (y compris par email).</p>

<h2>4. Prix</h2>
<p>Les prix sont exprimés en euros hors taxes. ${SITE.legal.vat}. Les tarifs affichés sur le site sont donnés à titre indicatif ; seul le prix figurant sur le devis accepté engage les parties.</p>
<p>Les frais de déplacement liés aux interventions sur site sont facturés en fonction de la distance parcourue, dans un rayon de 100 km maximum pour les missions ponctuelles. Leur montant ou leur mode de calcul est précisé dans le devis.</p>
<p>Toute modification des tarifs d’un forfait en cours est notifiée au Client par écrit au moins un mois avant son application. Le Client peut alors résilier le forfait dans les conditions de l’article 7.</p>

<h2>5. Facturation et paiement</h2>
<p>Les forfaits mensuels sont facturés à la fin de chaque mois. Les missions ponctuelles sont facturées à leur achèvement ; un acompte peut être demandé au devis pour les missions importantes.</p>
<p>Sauf délai différent indiqué sur la facture, les factures sont payables à 30 jours à compter de leur date d’émission, par virement bancaire. Aucun escompte n’est accordé en cas de paiement anticipé.</p>

<h2>6. Retard de paiement</h2>
<p>Conformément à l’article L. 441-10 du Code de commerce, tout retard de paiement entraîne de plein droit, sans rappel préalable, l’application de pénalités de retard calculées au taux égal à trois fois le taux d’intérêt légal, ainsi qu’une indemnité forfaitaire pour frais de recouvrement de 40 € (article D. 441-5 du Code de commerce). Si les frais de recouvrement réellement engagés dépassent ce montant, une indemnisation complémentaire peut être demandée sur justificatif.</p>
<p>En cas de non-paiement à l’échéance, le Prestataire peut suspendre l’exécution des prestations huit jours après une mise en demeure restée sans effet.</p>

<h2>7. Durée et résiliation</h2>
<p>Les forfaits mensuels sont conclus pour une durée indéterminée. Chaque partie peut y mettre fin à tout moment par écrit (email ou courrier), moyennant un préavis d’un mois. Les missions ponctuelles prennent fin à la livraison de la prestation.</p>
<p>En cas de manquement grave de l’une des parties à ses obligations, non réparé dans les quinze jours suivant une mise en demeure, l’autre partie peut résilier le contrat sans préavis. Les prestations réalisées jusqu’à la date de fin restent dues.</p>

<h2>8. Obligations du Client</h2>
<p>Le Client s’engage à transmettre au Prestataire, dans des délais compatibles avec les échéances, des informations et documents complets, exacts et à jour, et à lui donner les accès nécessaires à ses outils. Le Client reste seul responsable de l’exactitude des informations transmises, des décisions prises et des documents qu’il valide ou signe.</p>

<h2>9. Appels d’offres</h2>
<p>L’accompagnement aux appels d’offres repose sur une collaboration étroite : le Client apporte son expertise technique, ses prix, ses références et ses moyens ; le Prestataire assure le montage administratif du dossier et la rédaction du mémoire technique à partir de ces éléments. Aucun dossier n’est déposé sans la validation préalable et expresse du Client.</p>
<p>Le Prestataire est tenu à une obligation de moyens : il ne peut garantir l’attribution d’un marché, qui relève de la seule décision de l’acheteur. Le respect des dates limites de remise suppose que le Client transmette les éléments demandés suffisamment à l’avance ; le Prestataire ne saurait être tenu responsable d’un dépôt hors délai dû à une transmission tardive.</p>

<h2>10. Responsabilité</h2>
<p>Le Prestataire exécute ses prestations avec soin et selon les règles de l’art, dans le cadre d’une obligation de moyens. Sa responsabilité ne peut être engagée qu’en cas de faute prouvée et pour les seuls dommages directs. Sauf faute lourde ou intentionnelle, elle est limitée au montant hors taxes facturé au Client au titre des trois derniers mois de prestations précédant le fait générateur.</p>

<h2>11. Confidentialité</h2>
<p>Le Prestataire s’engage à garder strictement confidentielles toutes les informations et tous les documents dont il a connaissance dans le cadre de sa mission, pendant toute la durée de la relation et après sa fin. Un engagement de confidentialité spécifique peut être signé à la demande du Client.</p>

<h2>12. Données personnelles</h2>
<p>Lorsqu’il traite des données personnelles pour le compte du Client (données des salariés, clients ou fournisseurs du Client), le Prestataire agit en qualité de sous-traitant au sens de l’article 28 du Règlement général sur la protection des données (RGPD). Il ne traite ces données que sur instruction du Client et pour les besoins de la mission, en assure la sécurité et la confidentialité, n’en fait aucun autre usage et, au terme de la mission, les restitue au Client ou les supprime selon son choix. Les données des prospects et clients du Prestataire sont traitées conformément à la <a href="/confidentialite/">politique de confidentialité</a>.</p>

<h2>13. Propriété des documents</h2>
<p>Les documents et données fournis par le Client restent sa propriété et lui sont restitués sur simple demande. Les documents produits pour le Client dans le cadre de la mission (dossiers, mémoires techniques, tableaux de suivi) lui appartiennent dès leur complet paiement. Les méthodes, trames et modèles propres au Prestataire restent sa propriété.</p>

<h2>14. Force majeure</h2>
<p>Aucune des parties ne peut être tenue responsable d’un manquement à ses obligations résultant d’un cas de force majeure au sens de l’article 1218 du Code civil. La partie concernée en informe l’autre sans délai ; les obligations sont suspendues pendant la durée de l’empêchement.</p>

<h2>15. Droit applicable et litiges</h2>
<p>Les présentes CGV sont soumises au droit français. En cas de différend, les parties recherchent d’abord une solution amiable. À défaut, le litige est porté devant la juridiction compétente selon les règles de droit commun.</p>`);

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
/* robots.txt : moteurs de recherche ET assistants IA explicitement autorisés */
const AI_BOTS = ['Googlebot', 'Bingbot', 'OAI-SearchBot', 'ChatGPT-User', 'GPTBot', 'Google-Extended', 'PerplexityBot', 'Perplexity-User', 'ClaudeBot', 'Claude-SearchBot', 'Applebot', 'Applebot-Extended', 'DuckAssistBot', 'MistralAI-User'];
const DISALLOW = 'Allow: /\nDisallow: /admin/\nDisallow: /api/\nDisallow: /merci/\n';
fs.writeFileSync(path.join(OUT, 'robots.txt'),
  `# ${SITE.name} – ${SITE.url}\n# Moteurs de recherche et assistants IA bienvenus.\n\n` +
  AI_BOTS.map((b) => `User-agent: ${b}\n${DISALLOW}`).join('\n') +
  `\nUser-agent: *\n${DISALLOW}\nSitemap: ${abs('/sitemap.xml')}\n`);

/* En-têtes HTTP : sécurité (CSP stricte) + non-indexation des adresses techniques */
const formOrigin = SITE.form.endpoint ? new URL(SITE.form.endpoint).origin : '';
const CSP = [
  "default-src 'self'", "script-src 'self'", "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${ANY_REMOTE ? ' https://images.unsplash.com' : ''}`, "font-src 'self'",
  `connect-src 'self'${formOrigin ? ' ' + formOrigin : ''}`, "frame-src 'none'",
  `form-action 'self' mailto:${formOrigin ? ' ' + formOrigin : ''}`, "base-uri 'self'", "object-src 'none'",
  "frame-ancestors 'none'", 'upgrade-insecure-requests'
].join('; ');
let headers = fs.readFileSync(path.join(OUT, '_headers'), 'utf8').replace('/*\n', `/*\n  Content-Security-Policy: ${CSP}\n  Strict-Transport-Security: max-age=31536000; includeSubDomains\n  Cross-Origin-Opener-Policy: same-origin\n`);
headers += `\n# Déploiements de test : jamais indexés\nhttps://:version.:project.pages.dev/*\n  X-Robots-Tag: noindex\n`;
if (!SITE_HOST.endsWith('.pages.dev')) headers += `\n# Adresse technique : le site officiel est ${SITE.url}\nhttps://:project.pages.dev/*\n  X-Robots-Tag: noindex\n`;
fs.writeFileSync(path.join(OUT, '_headers'), headers);

/* security.txt (RFC 9116) */
fs.mkdirSync(path.join(OUT, '.well-known'), { recursive: true });
fs.writeFileSync(path.join(OUT, '.well-known/security.txt'),
  `Contact: mailto:${SITE.email}\nExpires: ${new Date(Date.now() + 365 * 86400000).toISOString()}\nPreferred-Languages: fr, en\nCanonical: ${abs('/.well-known/security.txt')}\n`);

/* IndexNow : fichier de clé (Bing, Yandex… → ChatGPT s'appuie sur l'index Bing) */
fs.writeFileSync(path.join(OUT, `${SITE.indexNowKey}.txt`), SITE.indexNowKey);

/* llms.txt : résumé structuré pour les assistants IA (ChatGPT, Gemini, Perplexity, Claude) */
const strip = (h) => h.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');
fs.writeFileSync(path.join(OUT, 'llms.txt'), `# ${SITE.name}

> ${SITE.name} est une entreprise de gestion administrative externalisée (secrétariat indépendant) fondée par ${SITE.owner}, basée à ${SITE.city} (Vaucluse, 84, France). Elle prend en charge l’administration des ventes (ADV), la gestion administrative et RH et la réponse aux appels d’offres pour les TPE, PME, artisans et entreprises du BTP, sur site (Monteux, Carpentras, Avignon et alentours) ou à distance partout en France.

## Informations clés
- Fondatrice : ${SITE.owner} – ${SITE.role.toLowerCase()} ; 15 ans d’expérience dans l’administratif, BTS Gestion de la PME, ancienne assistante de direction
- Localisation : ${SITE.city} (${SITE.postalCode}), Vaucluse, Provence-Alpes-Côte d’Azur
- Zone d’intervention : ${SITE.areas.join(', ')} ; à distance dans toute la France
- Clients : TPE, PME, artisans, entreprises du BTP
- Contact : ${SITE.phone} · ${SITE.email} · ${abs('/contact/')}
- Horaires : ${SITE.hours}
- Valeurs : organisation, rigueur, confidentialité, réactivité
- Outils maîtrisés : ${SITE.tools.join(', ')} ; logiciel de facturation mis à disposition si besoin
- Déplacements : ${SITE.travel}
- Spécialité rare : accompagnement complet des TPE/PME du BTP sur les appels d’offres et marchés publics
- SIRET : ${SITE.legal.siret} – ${SITE.legal.publisher}, ${SITE.legal.address}

## Services
- [ADV & facturation](${abs('/adv/')}) : devis, facturation, suivi des échéances, relances d’impayés
- [Gestion administrative & RH](${abs('/gestion-administrative/')}) : mails, assurances, mutuelles, formalités, réservations de déplacements, plannings, variables de paie (indemnités kilométriques, paniers repas, notes de frais)
- [Appels d’offres BTP](${abs('/appels-offres/')}) : rédaction du mémoire technique, montage du dossier (DC1, DC2), suivi des échéances ; collaboration étroite, rien n’est envoyé sans l’accord du client

## Tarifs (indicatifs, formules 100 % modulables)
${FORFAITS.map((f) => `- ${f.name} : ${f.price} € HT/mois – ${f.items.map(strip).join(', ')}`).join('\n')}
- Toutes les formules sont adaptables : le client choisit uniquement les missions utiles (ex. sans suivi RH, un seul dossier d’appel d’offres par mois) et le prix est ajusté sur devis gratuit.
- Missions ponctuelles et tarif horaire : sur devis personnalisé.
- Conditions générales de vente : ${abs('/cgv/')}

## Pages locales
${CITIES.map((c) => `- [${c.h1}](${abs(c.path)})`).join('\n')}

## Questions fréquentes
${FAQ.map((f) => `- **${f.q}** ${f.a}`).join('\n')}

## Blog
${POSTS.map((a) => `- [${a.title}](${abs('/blog/' + a.slug + '/')}) : ${a.excerpt}`).join('\n')}
`);
fs.writeFileSync(path.join(OUT, 'site.webmanifest'), JSON.stringify({
  name: SITE.name, short_name: 'Élméa', start_url: '/', display: 'standalone', background_color: '#FAF6F1', theme_color: '#1F3A2E', lang: 'fr',
  icons: [{ src: '/assets/img/icon-180.png', sizes: '180x180', type: 'image/png' }, { src: '/assets/img/icon-512.png', sizes: '512x512', type: 'image/png' }]
}, null, 2));

/* ---------------------------------------------------------
   7. ESPACE ADMIN (/admin/)
--------------------------------------------------------- */
fs.copyFileSync('src/admin.js', path.join(OUT, 'assets/js/admin.js'));
fs.mkdirSync(path.join(OUT, 'admin'), { recursive: true });
fs.writeFileSync(path.join(OUT, 'admin/index.html'), `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Administration | ${SITE.name}</title>
  <meta name="robots" content="noindex, nofollow">
  <meta name="theme-color" content="#1F3A2E">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="stylesheet" href="/assets/css/style.css?v=${ASSET_V}">
</head>
<body class="min-h-screen">
<div id="boot" class="min-h-screen flex items-center justify-center text-ink/50 text-sm">Chargement…</div>

<div id="login" class="hidden min-h-screen flex items-center justify-center px-4 py-10">
  <form id="loginForm" class="w-full max-w-sm bg-white rounded-3xl shadow-soft p-8 sm:p-10 text-center" novalidate>
    <img src="/assets/img/logo-elmea-560.png" alt="Élméa Solutions" width="560" height="504" class="w-40 h-auto mx-auto">
    <h1 class="font-serif text-3xl text-forest font-semibold mt-6">Espace administration</h1>
    <p class="text-sm text-ink/60 mt-2">Statistiques du site et rédaction des articles.</p>
    <label for="pwd" class="sr-only">Mot de passe</label>
    <input id="pwd" type="password" autocomplete="current-password" required class="field mt-6 text-center" placeholder="Mot de passe">
    <p id="loginErr" class="hidden text-sm text-red-600 mt-3" role="alert"></p>
    <button type="submit" class="btn-primary w-full mt-5">${ic('lock', 'w-4 h-4')} Se connecter</button>
    <p class="mt-6 text-xs"><a href="/" class="text-ink/50 hover:text-terra">← Retour au site</a></p>
  </form>
</div>

<div id="app" class="hidden min-h-screen">
  <header class="bg-forest text-cream sticky top-0 z-30 shadow-soft">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-x-6 gap-y-3">
      <a href="/admin/" class="flex items-center gap-3 mr-auto">
        <span class="bg-cream rounded-full p-1"><img src="/assets/img/logo-mark.png" alt="" width="32" height="32" class="w-8 h-8"></span>
        <span class="leading-tight"><span class="block font-serif text-xl tracking-[.25em]">ÉLMÉA</span><span class="block text-[10px] tracking-[.3em] text-terra-light">ADMINISTRATION</span></span>
      </a>
      <nav id="tabs" class="order-3 sm:order-none w-full sm:w-auto flex gap-1 bg-white/10 rounded-full p-1" aria-label="Sections">
        <button type="button" data-tab="stats" class="flex-1 sm:flex-none px-4 py-2 rounded-full text-sm font-medium transition inline-flex items-center justify-center gap-2">${ic('chart-column', 'w-4 h-4')} Statistiques</button>
        <button type="button" data-tab="posts" class="flex-1 sm:flex-none px-4 py-2 rounded-full text-sm font-medium transition inline-flex items-center justify-center gap-2">${ic('pen-line', 'w-4 h-4')} Articles</button>
      </nav>
      <div class="flex items-center gap-2 text-sm">
        <a href="/" target="_blank" rel="noopener" class="px-3 py-2 rounded-full hover:bg-white/10 inline-flex items-center gap-1.5">${ic('external-link', 'w-4 h-4')}<span class="hidden md:inline">Voir le site</span></a>
        <button type="button" id="logout" class="px-3 py-2 rounded-full hover:bg-white/10 inline-flex items-center gap-1.5">${ic('log-out', 'w-4 h-4')}<span class="hidden md:inline">Déconnexion</span></button>
      </div>
    </div>
  </header>
  <main id="view" class="max-w-7xl mx-auto px-4 sm:px-6 py-8"></main>
</div>

<div id="toast" class="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 hidden px-5 py-3 rounded-full shadow-soft text-sm font-medium" role="status" aria-live="polite"></div>

<script type="application/json" id="adminConfig">${JSON.stringify({
  photos: Object.keys(PHOTOS).map((k) => ({ key: k, label: PHOTO_LABELS[k] || k, url: PHOTOS[k](1200), thumb: PHOTOS[k](300) })),
  categories: [...new Set(ARTICLES.map((a) => a.cat))],
  pages: Object.fromEntries(pages.filter((p) => !p.file).map((p) => [p.path, ((p.html.match(/<title>([^<|]+)/) || [])[1] || p.path).trim().replace(/&amp;/g, '&')])),
  site: { name: SITE.name, url: SITE.url },
  icons: Object.fromEntries(['plus', 'pencil', 'trash-2', 'eye', 'arrow-left', 'image', 'bold', 'italic', 'heading-2', 'heading-3', 'list', 'list-ordered', 'quote', 'link', 'pilcrow', 'upload', 'check', 'x', 'users', 'file-text', 'mouse-pointer-click', 'message-circle', 'phone', 'mail', 'send', 'globe', 'smartphone', 'monitor', 'tablet', 'refresh-cw', 'external-link', 'eye-off', 'calendar', 'facebook', 'instagram', 'save', 'remove-formatting', 'database', 'layers', 'arrow-up-right', 'arrow-down-right', 'minus', 'search', 'chart-column', 'pen-line', 'circle-alert'].map((n) => (ic(n), [n, USED_ICONS[n]])))
}).replace(/</g, '\\u003c')}</script>
<script src="/assets/js/admin.js?v=${ASSET_V}" defer></script>
</body>
</html>
`);

/* ---------------------------------------------------------
   8. FICHIER POUR LES FONCTIONS CLOUDFLARE
   Gabarit de page + icônes + articles de départ, utilisés
   par le blog dynamique (functions/blog) et le sitemap.
--------------------------------------------------------- */
const TEMPLATE = layout({
  path: '%%PATH%%', navPath: '/blog/', title: '%%TITLE%%', description: '%%DESC%%', body: '%%BODY%%',
  ogType: '%%OGTYPE%%', ogImage: '%%OGIMAGE%%', extraHead: '%%HEAD%%', ld: []
});
const staticPages = pages.filter((p) => p.sitemap !== false && !p.path.startsWith('/blog/'))
  .map((p) => ({ path: p.path, lastmod: p.lastmod || SITE.buildDate, priority: p.priority || prio(p.path) }));
fs.mkdirSync('functions/_lib', { recursive: true });
fs.writeFileSync('functions/_lib/generated.js', `// Fichier généré automatiquement par build.mjs – ne pas modifier à la main.
export const TEMPLATE = ${JSON.stringify(TEMPLATE)};
export const ICONS = ${JSON.stringify(USED_ICONS)};
export const SEED_POSTS = ${JSON.stringify(POSTS.map(({ photo, ...p }) => ({ ...p, body: p.body.trim() })))};
export const STATIC_PAGES = ${JSON.stringify(staticPages)};
export const SITE_URL = ${JSON.stringify(SITE.url)};
export const PHOTO_MAP = ${JSON.stringify(Object.fromEntries(Object.entries(PHOTO_SOURCES).filter(([k]) => LOCAL[k]).map(([k, id]) => [id, PHOTOS[k](1200)])))};
`);

const todo = JSON.stringify(SITE.legal).match(/\[[^\]]+\]/g);
if (todo) console.warn('⚠ Mentions légales à compléter dans src/config.mjs : ' + todo.join(', '));
console.log(`✔ ${pages.length} pages + admin générées dans dist/ – adresse officielle : ${SITE.url}`);
