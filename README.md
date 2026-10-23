# Élméa Solutions – site vitrine

Site statique multi-pages, sans framework côté navigateur et sans cookie : HTML généré, Tailwind compilé, polices hébergées localement, JS vanilla (~6 Ko).

## Déploiement Cloudflare Pages
Workers & Pages → Create → Pages → *Connect to Git* → dépôt `Volkodlack/elmea`, puis :

| Réglage | Valeur |
|---|---|
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Variable d'environnement | `NODE_VERSION` = `20` |

Chaque `git push` sur `main` redéploie le site automatiquement. La page 404 et les en-têtes (`public/_headers`) sont pris en charge nativement. Le domaine personnalisé et la redirection www se règlent dans l'onglet *Custom domains*.

## Autre hébergeur
`npm run build` génère le dossier **`dist/`** : en envoyer le **contenu** à la racine de l'hébergement (FTP, OVH, o2switch…). Sur Apache, le fichier `.htaccess` gère le HTTPS, le www, le cache et la page 404.

> Le site utilise des URL propres (`/adv/`, `/blog/…/`). Il faut le tester via un serveur, pas en double-cliquant sur les fichiers :
> `npm run preview` → http://localhost:4321

## Modifier le site
```bash
npm install
# éditer build.mjs (textes, coordonnées) ou src/articles.mjs (blog)
npm run build      # régénère dist/
npm run preview
```

| Fichier | Contenu |
|---|---|
| `build.mjs` | **Bloc `SITE`** : coordonnées, réseaux, formulaire, mentions légales. Toutes les pages. |
| `src/articles.mjs` | Articles du blog (le sitemap se met à jour seul) |
| `src/styles.css` | Polices et styles personnalisés |
| `src/main.js` | Menu mobile, animations, carrousel Instagram, filtres du blog, formulaire |
| `tailwind.config.cjs` | Couleurs de la charte (vert forêt, terracotta, crème, sauge) |
| `public/` | Logo, favicon, image de partage, polices, `.htaccess` |

## ✅ À faire avant la mise en ligne
1. **Domaine** : `SITE.url` dans `build.mjs` (canonical, sitemap, Open Graph, JSON-LD).
2. **Formulaire** : créer une clé gratuite sur [web3forms.com](https://web3forms.com) avec elmea.solutions@outlook.fr, puis
   `form: { endpoint: 'https://api.web3forms.com/submit', accessKey: 'LA_CLÉ' }`.
   Sans configuration, le formulaire ouvre la messagerie du visiteur avec la demande pré-remplie.
3. **Mentions légales** : SIRET, adresse, régime de TVA et hébergeur dans `SITE.legal` (ils apparaissent entre crochets).
4. **Réseaux** : vérifier le compte Instagram ; renseigner LinkedIn/Facebook (vides = icônes masquées).
5. **Photos** : ce sont des photos Unsplash hébergées chez Unsplash. Pour de meilleures performances, les télécharger dans `public/assets/img/photos/` et remplacer les URL dans `PHOTOS`.
6. **Google** : déclarer le site dans Google Search Console, envoyer `sitemap.xml`, créer la fiche Google Business Profile (même nom, téléphone et adresse que le site).

## SEO inclus
Balises title/description uniques par page, Open Graph, canonical, sitemap.xml, robots.txt, fil d'Ariane, données structurées (LocalBusiness, Service, FAQPage, BreadcrumbList, Blog, BlogPosting), titres h1/h2/h3 travaillés sur les mots-clés : gestion administrative, secrétariat indépendant, ADV, mémoire technique BTP, appels d'offres, Monteux / Carpentras / Avignon.
