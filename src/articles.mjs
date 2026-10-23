/* ==========================================================
   Articles du blog
   Pour ajouter un article : copier un bloc, changer le slug,
   puis relancer « npm run build ». Le sitemap se met à jour seul.
   body : HTML (h2, h3, p, ul, ol, blockquote, strong, a)
   photo : clé de PHOTOS dans build.mjs
   ========================================================== */
export const ARTICLES = [
  {
    slug: 'externaliser-gestion-administrative-signes',
    cat: 'Gestion administrative',
    date: '2026-10-14',
    read: 5,
    photo: 'desk',
    title: 'Externaliser sa gestion administrative : 5 signes qu’il est temps de déléguer',
    description: 'Factures en retard, mails qui s’accumulent, soirées sur la paperasse : 5 signes qui montrent qu’un secrétariat indépendant ferait gagner du temps à votre PME.',
    excerpt: 'Factures en retard, mails qui s’accumulent, soirées passées sur la paperasse… Voici comment savoir si le moment est venu de faire appel à un secrétariat indépendant.',
    body: `
<p>Pour beaucoup de dirigeants de TPE et de PME, l’administratif se fait le soir ou le week-end, au détriment du repos et de la vie de famille. Pourtant, ces tâches conditionnent directement la santé de l’entreprise : trésorerie, relation client, conformité. Voici cinq signaux qui ne trompent pas.</p>
<h2>1. Vos factures partent en retard</h2>
<p>Chaque jour de retard dans la facturation repousse d’autant l’encaissement. Quand la facture d’un chantier terminé attend une semaine dans un coin du bureau, c’est votre trésorerie qui en fait les frais.</p>
<h2>2. Vous ne savez plus qui vous doit quoi</h2>
<p>Sans tableau d’échéancier à jour, les impayés passent inaperçus jusqu’au jour où le compte bancaire vous les rappelle. Un suivi régulier permet de relancer au bon moment, avec le bon ton.</p>
<h2>3. Votre boîte mail déborde</h2>
<p>Demandes de devis, questions de fournisseurs, courriers d’organismes : quand les messages s’accumulent, des opportunités se perdent et des échéances sont manquées.</p>
<h2>4. Vous renoncez à des appels d’offres</h2>
<p>Monter un dossier de candidature et rédiger un mémoire technique demande du temps. Beaucoup d’entreprises du BTP passent à côté de marchés à leur portée, simplement faute de disponibilité.</p>
<h2>5. Vous n’avez pas le volume pour embaucher</h2>
<p>Un poste d’assistante à temps plein représente un coût important. Un forfait mensuel externalisé vous apporte les compétences d’une assistante de direction expérimentée, sans charges sociales ni contrat de travail, et s’ajuste à votre activité.</p>
<blockquote>Si vous vous êtes reconnu dans au moins deux de ces situations, un premier échange sans engagement permet de faire le point sur ce qui peut être délégué.</blockquote>`
  },
  {
    slug: 'memoire-technique-btp-conseils',
    cat: 'Appels d’offres',
    date: '2026-10-02',
    read: 7,
    photo: 'btp',
    title: 'Mémoire technique BTP : les clés pour convaincre l’acheteur',
    description: 'Structure, contenu, erreurs à éviter : comment rédiger un mémoire technique BTP qui obtient une bonne note sur la valeur technique d’un appel d’offres.',
    excerpt: 'Le mémoire technique pèse souvent lourd dans la note finale d’un appel d’offres. Structure, contenu, erreurs à éviter : le guide pour les entreprises du BTP.',
    body: `
<p>Dans la plupart des marchés de travaux, l’offre est jugée sur le prix <strong>et</strong> sur la valeur technique. Le mémoire technique est le document qui porte cette valeur technique : c’est souvent lui qui départage des entreprises aux prix proches.</p>
<h2>Suivre le plan du règlement de consultation</h2>
<p>L’acheteur note critère par critère, sous-critère par sous-critère. Reprenez exactement la structure annoncée dans le règlement de consultation (RC) : vous lui facilitez la lecture et vous évitez d’oublier un point noté.</p>
<h2>Personnaliser chaque réponse</h2>
<p>Un mémoire « copier-coller » se repère immédiatement. Parlez du chantier concerné : accès, contraintes du site, phasage, co-activité, voisinage. Montrez que vous avez visité ou étudié les lieux.</p>
<h2>Valoriser vos moyens</h2>
<ul>
<li><strong>Moyens humains</strong> : organigramme du chantier, qualifications, encadrement.</li>
<li><strong>Moyens matériels</strong> : engins, outillage, véhicules adaptés.</li>
<li><strong>Références</strong> : chantiers similaires récents, avec photos si possible.</li>
</ul>
<h2>Détailler la méthodologie</h2>
<p>Décrivez l’enchaînement des tâches, le planning prévisionnel, la gestion des déchets, les mesures de sécurité et les contrôles qualité. Un planning visuel vaut souvent mieux qu’une longue page de texte.</p>
<h2>Soigner la forme</h2>
<p>Sommaire, pagination, titres clairs, photos légendées : un document soigné inspire confiance et se lit plus vite. Respectez aussi le nombre de pages éventuellement imposé.</p>
<blockquote>C’est tout l’intérêt d’une collaboration étroite : vous apportez votre expertise chantier, je la mets en forme dans un dossier clair et complet. Rien n’est envoyé sans votre accord préalable.</blockquote>`
  },
  {
    slug: 'relances-impayes-methode',
    cat: 'ADV',
    date: '2026-09-18',
    read: 4,
    photo: 'calc',
    title: 'Relances d’impayés : la méthode en 4 étapes pour être payé plus vite',
    description: 'Relancer un client sans abîmer la relation : une méthode de relance progressive et courtoise pour réduire vos retards de paiement.',
    excerpt: 'Relancer un client sans abîmer la relation, c’est possible. Découvrez une méthode de relance progressive, courtoise et efficace.',
    body: `
<p>Les retards de paiement fragilisent la trésorerie des petites entreprises. Bonne nouvelle : une relance structurée et régulière permet de récupérer la grande majorité des sommes à l’amiable.</p>
<h2>Avant tout : une facture irréprochable</h2>
<p>Date d’échéance visible, conditions de paiement, pénalités de retard et indemnité forfaitaire pour frais de recouvrement : ces mentions sont obligatoires et facilitent les relances. Une facture incomplète est souvent… une facture qui attend.</p>
<h2>Étape 1 – Le rappel courtois</h2>
<p>Dès le lendemain de l’échéance, un mail simple avec la facture en pièce jointe. Dans bien des cas, il s’agit d’un oubli ou d’une facture égarée.</p>
<h2>Étape 2 – L’appel téléphonique</h2>
<p>Une dizaine de jours plus tard, un échange direct permet d’identifier un blocage : facture non reçue, litige, validation interne en attente.</p>
<h2>Étape 3 – La relance écrite ferme</h2>
<p>Un courrier ou mail plus formel rappelle les sommes dues, les pénalités prévues et propose, si besoin, un échéancier.</p>
<h2>Étape 4 – La mise en demeure</h2>
<p>Dernière étape amiable avant une procédure de recouvrement : la mise en demeure par lettre recommandée fixe un délai précis de règlement.</p>
<blockquote>Externaliser ces relances, c’est la garantie qu’elles soient faites à temps, avec le bon ton, sans y consacrer votre énergie ni tendre la relation avec vos clients.</blockquote>`
  },
  {
    slug: 'variables-de-paie-btp',
    cat: 'RH & paie',
    date: '2026-09-05',
    read: 5,
    photo: 'sign',
    title: 'Paniers repas, indemnités kilométriques : bien suivre les variables de paie',
    description: 'Paniers repas, indemnités kilométriques, notes de frais : comment collecter les variables de paie chaque mois sans erreur dans une PME du BTP.',
    excerpt: 'Dans le BTP, les éléments variables de paie sont nombreux. Comment les collecter chaque mois sans erreur et faciliter le travail de votre comptable ?',
    body: `
<p>Paniers repas, indemnités de trajet et de transport, indemnités kilométriques, notes de frais, heures supplémentaires, absences : chaque mois, ces éléments doivent être collectés et transmis au gestionnaire de paie ou à l’expert-comptable. Une erreur, et c’est un bulletin à refaire… ou un salarié mécontent.</p>
<h2>Centraliser les informations</h2>
<p>Un tableau unique, par salarié et par chantier, évite les oublis et les doubles saisies. Il sert aussi de base en cas de question d’un salarié ou de contrôle.</p>
<h2>Récupérer les justificatifs au fil de l’eau</h2>
<p>Attendre la fin du mois, c’est s’exposer aux tickets perdus et aux souvenirs approximatifs. Une collecte hebdomadaire, même rapide, change tout.</p>
<h2>Vérifier avant de transmettre</h2>
<ul>
<li>Cohérence avec les plannings et les feuilles d’heures ;</li>
<li>Application des barèmes en vigueur et de votre convention collective ;</li>
<li>Respect des plafonds d’exonération de cotisations.</li>
</ul>
<h2>Transmettre dans les temps</h2>
<p>Un récapitulatif clair, envoyé à date fixe, permet à votre gestionnaire de paie de travailler sereinement et de produire des bulletins justes.</p>
<blockquote>Un suivi rigoureux des variables, c’est des bulletins justes, des salariés satisfaits et une entreprise sereine face à un contrôle.</blockquote>`
  },
  {
    slug: 'dc1-dc2-dossier-candidature-marche-public',
    cat: 'Appels d’offres',
    date: '2026-08-22',
    read: 6,
    photo: 'docs',
    title: 'DC1, DC2 : s’y retrouver dans le dossier de candidature',
    description: 'DC1, DC2, attestations, Kbis : les pièces du dossier de candidature à un marché public expliquées simplement, et les pièges à éviter.',
    excerpt: 'Les formulaires de candidature aux marchés publics peuvent dérouter. Tour d’horizon des documents à fournir et des pièges à éviter.',
    body: `
<p>Le dossier de candidature permet à l’acheteur de vérifier que votre entreprise a la capacité juridique, économique et technique d’exécuter le marché. Une pièce manquante ou périmée peut suffire à écarter une offre, même excellente.</p>
<h2>Le DC1 – lettre de candidature</h2>
<p>Il identifie le candidat, seul ou en groupement, et précise le ou les lots concernés. En cas de groupement, il désigne le mandataire.</p>
<h2>Le DC2 – déclaration du candidat</h2>
<p>Il détaille la situation de l’entreprise : chiffre d’affaires, effectifs, moyens, références, éventuels sous-traitants.</p>
<h2>Le DUME</h2>
<p>Lorsque l’acheteur l’accepte, le document unique de marché européen peut remplacer le DC1 et le DC2. Le règlement de consultation précise toujours les formats acceptés.</p>
<h2>Les pièces complémentaires</h2>
<ul>
<li>Extrait Kbis ou inscription au répertoire des métiers ;</li>
<li>Attestations de régularité fiscale et sociale ;</li>
<li>Attestations d’assurance (responsabilité civile, décennale) ;</li>
<li>Certificats de qualification professionnelle le cas échéant.</li>
</ul>
<h2>Les pièges à éviter</h2>
<p>Attestations expirées, signature manquante, mauvais lot coché, dépôt à la dernière minute sur une plateforme saturée : un contrôle méthodique avant chaque dépôt évite ces mauvaises surprises.</p>
<blockquote>Je prépare et vérifie chaque pièce de votre dossier, et je tiens à jour vos documents récurrents pour gagner du temps à chaque nouvelle consultation.</blockquote>`
  },
  {
    slug: 'facturation-electronique-pme',
    cat: 'ADV',
    date: '2026-08-08',
    read: 5,
    photo: 'notebook',
    title: 'Facturation électronique : ce qui change pour les PME',
    description: 'La facture électronique se généralise entre entreprises en France. Ce que les PME, artisans et entreprises du BTP doivent anticiper.',
    excerpt: 'La généralisation de la facture électronique entre entreprises arrive progressivement. Ce que les PME et artisans doivent anticiper dès maintenant.',
    body: `
<p>La France généralise progressivement la facturation électronique entre entreprises assujetties à la TVA. Le calendrier distingue la <strong>réception</strong> des factures électroniques, qui concerne toutes les entreprises en premier, et leur <strong>émission</strong>, dont l’obligation arrive selon la taille de l’entreprise.</p>
<h2>Ce qui change concrètement</h2>
<p>Les factures entre entreprises ne s’échangeront plus en PDF par mail, mais dans un format structuré, via des plateformes agréées. Certaines données de transaction seront transmises à l’administration fiscale.</p>
<h2>Choisir sa plateforme</h2>
<p>C’est le moment de vérifier que votre logiciel de facturation est compatible, ou de choisir une plateforme agréée adaptée à votre volume et à votre budget.</p>
<h2>Fiabiliser ses données clients</h2>
<p>Numéros SIREN, adresses de facturation, mentions obligatoires : un fichier clients propre facilite grandement la transition.</p>
<h2>Adapter ses process</h2>
<p>Qui émet, qui valide, qui suit les statuts des factures ? Formaliser ces étapes dès maintenant évite les blocages le jour J.</p>
<blockquote>Les dates exactes d’application dépendent de la taille de votre entreprise : consultez le calendrier officiel sur <a href="https://www.impots.gouv.fr" target="_blank" rel="noopener">impots.gouv.fr</a>. Je vous accompagne pour préparer ce passage sereinement.</blockquote>`
  }
];
