# Élméa Solutions – site vitrine + espace admin

Site multi-pages généré en statique (HTML + Tailwind compilé, polices locales, JS vanilla), hébergé sur **Cloudflare Pages**.
Des **Pages Functions** + une base **Cloudflare D1** (gratuite) ajoutent :
- un **espace admin** (`/admin/`) : statistiques de fréquentation et rédaction des articles du blog ;
- une **mesure d'audience interne sans cookie** (aucune IP stockée, pas de bandeau cookies nécessaire) ;
- un **blog dynamique** : un article publié depuis l'admin est en ligne immédiatement (pas besoin de redéployer).

## Déploiement Cloudflare Pages
Workers & Pages → Create → Pages → *Connect to Git* → dépôt `Volkodlack/elmea`, puis :

| Réglage | Valeur |
|---|---|
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Variable d'environnement | `NODE_VERSION` = `20` |

Chaque `git push` sur `main` redéploie le site automatiquement.

### Brancher la base D1 (obligatoire pour l'admin et les statistiques)
1. Cloudflare → **Storage & Databases → D1 SQL Database → Create** → nom : `elmea-db`.
2. Projet Pages **elmea → Settings → Bindings → Add → D1 database** → *Variable name* : `DB`, base : `elmea-db`.
3. **Deployments** → dernier déploiement → **Retry deployment**.

Les tables sont créées automatiquement au premier appel et les 6 articles d'origine y sont recopiés.
Tant que la base n'est pas branchée, le site fonctionne normalement avec le blog statique.

## Espace admin
Adresse : `https://<domaine>/admin/` — mot de passe défini dans `functions/_lib/auth.js` (empreinte PBKDF2, jamais en clair).
Pour changer le mot de passe sans toucher au code : **Settings → Variables and secrets → Add** → `ADMIN_PASSWORD` (type *Secret*), puis redéployer.
Sécurité : session de 7 jours (cookie HttpOnly signé), blocage 15 min après 8 essais ratés, HTML des articles nettoyé côté serveur.

- **Statistiques** : visites, pages vues, pages par visite, prises de contact (WhatsApp, téléphone, email, formulaire), évolution jour par jour, pages les plus vues, provenance (Google, Facebook…), appareils, pays. Données conservées 13 mois.
- **Articles** : créer, modifier, mettre en brouillon, supprimer ; éditeur avec titres, gras, listes, liens, encadrés, images ; image à la une (import ou photo d'illustration) ; aperçu ; champ SEO avec prévisualisation Google. Raccourci `Ctrl/Cmd + S`.

## Structure
| Fichier | Contenu |
|---|---|
| `src/config.mjs` | **Coordonnées, réseaux (dont la page Facebook), formulaire, mentions légales, photos** |
| `build.mjs` | Contenu et gabarit de toutes les pages, page admin |
| `src/blog-render.mjs` | Rendu du blog (partagé entre le build et les fonctions Cloudflare) |
| `src/articles.mjs` | Articles d'origine (repli statique + import initial dans D1) |
| `src/main.js` | Menu mobile, animations, fil Facebook, mesure d'audience, formulaire |
| `src/admin.js` | Interface de l'espace admin |
| `functions/` | API Cloudflare : `/api/track`, `/api/admin/*`, `/blog/*`, `/media/*`, `/sitemap.xml` |
| `functions/_lib/generated.js` | Généré par `npm run build` (gabarit, icônes, articles) – ne pas modifier |
| `public/` | Logo, favicon, polices, `_headers`, `.htaccess` |

## Développement local
```bash
npm install
npm run build
npx wrangler pages dev dist --d1 DB=elmea-db   # site + fonctions + base D1 locale → http://localhost:8788
```

## Sécurité
- En-têtes stricts générés au build dans `dist/_headers` : CSP (scripts du site uniquement), HSTS, anti-clickjacking, `nosniff`, COOP.
- Admin : mot de passe haché (PBKDF2), cookie de session signé HttpOnly/SameSite=Strict, blocage après 8 essais, contrôle de l'origine des requêtes (anti-CSRF), déconnexion = révocation de toutes les sessions, HTML des articles filtré, signature des images vérifiée.
- `/.well-known/security.txt` pour signaler une faille.
- Recommandé : protéger `/admin/` avec **Cloudflare Zero Trust → Access** (gratuit jusqu'à 50 utilisateurs) : code reçu par email en plus du mot de passe.

## SEO & IA
- `SITE_URL` (variable Cloudflare) = adresse officielle → canonical, sitemap, données structurées, llms.txt. Les adresses `*.pages.dev` passent automatiquement en `noindex` dès qu'un domaine est configuré.
- Pages locales : Monteux, Carpentras, Avignon. Données structurées : LocalBusiness, Person, Service, FAQPage, BreadcrumbList, BlogPosting.
- Photos téléchargées au build en WebP et servies depuis le site (rapidité + aucun appel tiers).
- `robots.txt` autorise explicitement Google, Bing, ChatGPT (OAI-SearchBot, GPTBot, ChatGPT-User), Gemini (Google-Extended), Perplexity, Claude, Apple.
- `llms.txt` : fiche d'identité de l'entreprise pour les assistants IA.
- IndexNow : chaque article publié depuis l'admin est signalé instantanément à Bing (index utilisé par ChatGPT).

## ✅ À faire avant la mise en ligne
1. **Domaine** : https://elmea-solutions.com (dans `src/config.mjs`, la variable Cloudflare `SITE_URL` peut le remplacer).
2. **Facebook** : `SITE.social.facebook` dans `src/config.mjs` → affiche le fil de la page sur l'accueil (chargé seulement après clic du visiteur, RGPD).
3. **Formulaire** : clé gratuite [web3forms.com](https://web3forms.com) → `form: { endpoint: 'https://api.web3forms.com/submit', accessKey: 'LA_CLÉ' }`.
4. **Mentions légales** : SIRET, adresse, régime de TVA dans `SITE.legal`.
5. **Google** : Search Console + envoi du `sitemap.xml`, fiche Google Business Profile.
