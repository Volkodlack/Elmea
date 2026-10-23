/* ==========================================================
   Configuration du site – partagée par le générateur (build.mjs)
   et par les fonctions Cloudflare (functions/).
   ========================================================== */
export const SITE = {
  name: 'Élméa Solutions',
  /* Adresse officielle du site (canonical, sitemap, Google, IA).
     Avec un nom de domaine : ajouter la variable SITE_URL dans Cloudflare
     (ex. https://www.elmea-solutions.fr) – elle remplace cette valeur au build. */
  url: 'https://elmea-solutions.com',
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
  travel: 'Frais de déplacement facturés selon la distance, jusqu’à 100 km pour les missions ponctuelles.',
  tools: ['Excel', 'Sage', 'OpenConcerto', 'plateformes de marchés publics'],
  social: {
    instagram: 'https://www.instagram.com/elmea.solutions',
    instagramHandle: '@elmea.solutions',
    /* Lien de la page Facebook (ex. 'https://www.facebook.com/elmea.solutions').
       Renseigné = icône + fil d'actualité Facebook sur l'accueil. */
    facebook: 'https://www.facebook.com/profile.php?id=61594719788587',
    linkedin: 'https://www.linkedin.com/in/%C3%A9lm%C3%A9a-solutions-manon-samain-86399043a/'
  },
  /* Formulaire : sans endpoint, le formulaire ouvre la messagerie (mailto).
     Web3Forms (gratuit) : endpoint 'https://api.web3forms.com/submit' + accessKey. */
  form: { endpoint: '', accessKey: '' },
  /* Codes de vérification (facultatif si vérification par DNS) */
  verification: { google: '', bing: '' },
  /* Clé IndexNow : signale instantanément les nouveaux articles à Bing (source de ChatGPT) */
  indexNowKey: '5f3c9a1e7b2d4c8a9e6f0b1d2c3a4e5f',
  legal: {
    status: 'Entrepreneur individuel (EI) – micro-entreprise',
    siret: '130 686 918 00017',
    created: '2026-10-01',
    street: '132 avenue de l’Europe',
    address: '132 avenue de l’Europe, 84170 Monteux',
    vat: 'TVA non applicable, art. 293 B du CGI',
    host: 'Cloudflare, Inc. – 101 Townsend St, San Francisco, CA 94107, États-Unis – www.cloudflare.com',
    publisher: 'Manon Samain EI'
  },
  buildDate: new Date().toISOString().slice(0, 10)
};

/* Photos d'illustration (identifiants Unsplash, licence libre).
   Au build, elles sont téléchargées en WebP et servies depuis le site :
   aucun appel à un service tiers chez le visiteur (RGPD + rapidité). */
export const PHOTO_SOURCES = {
  office:   'photo-1497366216548-37526070297c',
  calc:     'photo-1554224155-6726b3ff858f',
  docs:     'photo-1586281380349-632531db7ed4',
  btp:      'photo-1541888946425-d81bb19240f5',
  worker:   'photo-1504307651254-35680f356dfd',
  sign:     'photo-1450101499163-c8848c66ca85',
  desk:     'photo-1484480974693-6ca0a78fb36b',
  notebook: 'photo-1517842645767-c639042777db'
};
export const PHOTO_WIDTHS = [400, 800, 1200, 1600];

export const PHOTO_LABELS = {
  office: 'Bureau lumineux', calc: 'Factures & calculatrice', docs: 'Classeurs', btp: 'Chantier BTP',
  worker: 'Ouvrier BTP', sign: 'Signature de documents', desk: 'To-do & bureau', notebook: 'Carnet & stylo'
};
