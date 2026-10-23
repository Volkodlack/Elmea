/* ==========================================================
   Configuration du site – partagée par le générateur (build.mjs)
   et par les fonctions Cloudflare (functions/).
   ========================================================== */
export const SITE = {
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
    instagram: 'https://www.instagram.com/elmea.solutions',
    instagramHandle: '@elmea.solutions',
    /* Lien de la page Facebook (ex. 'https://www.facebook.com/elmea.solutions').
       Renseigné = icône + fil d'actualité Facebook sur l'accueil. */
    facebook: '',
    linkedin: ''    // laisser vide = icône masquée
  },
  /* Formulaire : sans endpoint, le formulaire ouvre la messagerie (mailto).
     Web3Forms (gratuit) : endpoint 'https://api.web3forms.com/submit' + accessKey. */
  form: { endpoint: '', accessKey: '' },
  legal: {
    status: 'Entrepreneur individuel (micro-entreprise)',
    siret: '[SIRET À COMPLÉTER]',
    address: '[Adresse professionnelle à compléter], 84170 Monteux',
    vat: 'TVA non applicable, art. 293 B du CGI [à confirmer selon le régime]',
    host: 'Cloudflare, Inc. – 101 Townsend St, San Francisco, CA 94107, États-Unis – www.cloudflare.com',
    publisher: 'Manon Samain'
  },
  buildDate: new Date().toISOString().slice(0, 10)
};

/* Photos d'illustration : remplacer par des fichiers locaux
   (ex. () => '/assets/img/photos/bureau.jpg') dès que la cliente fournit ses visuels. */
const U = (id) => (w) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;
export const PHOTOS = {
  office:   U('photo-1497366216548-37526070297c'),
  calc:     U('photo-1554224155-6726b3ff858f'),
  docs:     U('photo-1586281380349-632531db7ed4'),
  btp:      U('photo-1541888946425-d81bb19240f5'),
  worker:   U('photo-1504307651254-35680f356dfd'),
  sign:     U('photo-1450101499163-c8848c66ca85'),
  desk:     U('photo-1484480974693-6ca0a78fb36b'),
  notebook: U('photo-1517842645767-c639042777db')
};

export const PHOTO_LABELS = {
  office: 'Bureau lumineux', calc: 'Factures & calculatrice', docs: 'Classeurs', btp: 'Chantier BTP',
  worker: 'Ouvrier BTP', sign: 'Signature de documents', desk: 'To-do & bureau', notebook: 'Carnet & stylo'
};
