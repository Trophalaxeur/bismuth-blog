---
name: full-review
description: Analyse complète du repository Bismuth (Astro 6 / React / Tailwind v4). Détecte le code mort, fichiers inutilisés, mauvaises pratiques, problèmes qualité, SEO et accessibilité. Produit un fichier Markdown avec liens VSCode cliquables.
---

# Full Review — Bismuth

Analyse complète du repository. Stack : Astro 6, React, TypeScript, Tailwind CSS v4, Expressive Code. Output statique, hosting Vercel.

## Fichiers à ignorer

```text
node_modules/
.git/
dist/
.astro/
src/content/
```

## Résultat attendu

Générer un fichier `review-YYYY-MM-DD.md` **à la racine du repo**.

### Format du fichier

```markdown
# Review — YYYY-MM-DD

## Verdict
✅ / ⚠️ / 🚧 / ❌ — une phrase de synthèse

## 🚫 Bloquants
- [1.3.1] [src/components/Foo.astro](src/components/Foo.astro) — description + correction
- [2.3.5] [src/pages/blog/[slug].astro](src/pages/blog/[slug].astro#L42) — description + correction

## ⚠️ Importants
...

## 🧹 Nettoyage recommandé
...

## ❓ Questions
...
```

### Liens VSCode cliquables

Chaque référence à un fichier doit utiliser un lien Markdown relatif à la racine du repo :

```markdown
[src/components/Foo.astro](src/components/Foo.astro)
[src/pages/index.astro:12](src/pages/index.astro#L12)
```

Ces liens s'ouvrent directement dans VSCode depuis l'aperçu Markdown.

Ne pas utiliser de chemins absolus. Ne pas utiliser de backticks seuls sans lien pour les fichiers.

### Verdicts

- `✅ Merge possible`
- `⚠️ Merge possible après petites corrections`
- `🚧 Corrections importantes recommandées avant merge`
- `❌ Ne pas merger en l'état`

---

## Règles

### Partie 1 — Code inutile, mort ou redondant

#### 1.1 Objectif

Identifier tout ce qui ne sert à rien dans le repo. Prioriser les suppressions sûres. Quand une suppression n'est pas certaine, formuler une hypothèse vérifiable.

#### 1.2 Fichiers inutilisés

- 1.2.1 Composants Astro jamais importés
- 1.2.2 Composants React jamais importés
- 1.2.3 Fichiers CSS non importés
- 1.2.4 Scripts inutilisés
- 1.2.5 Images non référencées
- 1.2.6 Icônes non référencées
- 1.2.7 Polices non référencées
- 1.2.8 Fichiers de configuration obsolètes
- 1.2.9 Anciens composants remplacés mais non supprimés
- 1.2.10 Pages Astro non atteignables
- 1.2.11 Layouts Astro non utilisés
- 1.2.13 Hooks inutilisés
- 1.2.14 Helpers inutilisés
- 1.2.15 Fonctions utilitaires inutilisées
- 1.2.16 Constantes inutilisées
- 1.2.17 Types TypeScript non référencés
- 1.2.23 Pour chaque fichier suspect : pourquoi il semble inutile, comment vérifier, risque de suppression

#### 1.3 Code mort

- 1.3.1 Branches conditionnelles impossibles
- 1.3.2 Variables déclarées mais jamais utilisées
- 1.3.3 Fonctions jamais appelées
- 1.3.4 Props jamais lues
- 1.3.5 Paramètres inutilisés
- 1.3.6 Imports inutilisés
- 1.3.7 Exports inutilisés
- 1.3.8 Code commenté obsolète
- 1.3.9 `console.log` temporaires
- 1.3.10 `debugger` oubliés
- 1.3.12 Fallbacks impossibles à atteindre
- 1.3.13 Conditions redondantes
- 1.3.15 Anciennes implémentations conservées "au cas où"

#### 1.4 Redondances

- 1.4.1 Logique dupliquée entre composants
- 1.4.2 Classes Tailwind copiées partout sans abstraction raisonnable
- 1.4.3 Fonctions similaires avec de légères différences
- 1.4.5 Composants trop proches qui pourraient être fusionnés
- 1.4.6 Constantes magiques répétées
- 1.4.8 Mappings de navigation répétés
- 1.4.9 Métadonnées SEO répétées sans helper ou layout
- 1.4.10 Ne pas proposer de factorisation excessive
- 1.4.12 Proposer une factorisation si la duplication crée un risque de divergence

#### 1.5 Dépendances inutiles

- 1.5.1 Dépendances npm non utilisées
- 1.5.2 Dépendances trop lourdes pour un besoin simple
- 1.5.3 Librairies remplaçables par une API native
- 1.5.4 Dépendances côté client inutiles dans un site majoritairement statique
- 1.5.5 Packages redondants avec Astro, Vite, Tailwind ou Node

---

### Partie 2 — Qualité React, JavaScript, HTML et CSS

#### 2.1 Principes

KISS, DRY (sans prématurité), YAGNI. Lisibilité > astuces. Explicite > magique.

#### 2.2 JavaScript / TypeScript

- 2.2.1 Noms de variables explicites
- 2.2.4 Absence de mutation inutile
- 2.2.5 Gestion correcte de `null` et `undefined`
- 2.2.7 Usage raisonnable de `map`, `filter`, `reduce`
- 2.2.8 `reduce` illisibles quand une boucle serait plus claire
- 2.2.9 Promesses oubliées
- 2.2.10 `any` injustifiés
- 2.2.13 Valeurs magiques
- 2.2.15 Fonctions asynchrones inutiles
- 2.2.16 Calculs coûteux répétés inutilement
- 2.2.19 Préférer `??` à `||` quand la valeur vide est valide
- 2.2.20 Erreurs gérées ou volontairement propagées

#### 2.3 React

- 2.3.3 State inutile
- 2.3.4 `useEffect` inutiles
- 2.3.5 `useEffect` utilisés pour dériver une valeur calculable au rendu
- 2.3.6 Dépendances de hooks
- 2.3.8 Composants client quand un composant Astro statique suffit
- 2.3.12 Clés React stables dans les listes
- 2.3.13 Index de tableau comme key si l'ordre peut changer
- 2.3.17 Accessibilité des éléments interactifs
- 2.3.18 Lien pour navigation, bouton pour action
- 2.3.20 Éviter les composants React pour du contenu purement statique

#### 2.4 Hydratation React dans Astro

- 2.4.2 Signaler `client:load` si `client:idle` suffit
- 2.4.3 Signaler `client:load` si `client:visible` suffit
- 2.4.6 Trop de logique envoyée au navigateur
- 2.4.7 Île interactive trop grosse
- 2.4.8 Dépendance lourde dans une île React

#### 2.5 HTML

- 2.5.1 Structure sémantique (header, main, nav, article, section, aside, footer)
- 2.5.9 Un seul `h1` par page sauf justification
- 2.5.10 Hiérarchie des titres
- 2.5.11 Liens descriptifs
- 2.5.13 Attributs `alt`
- 2.5.18 ARIA seulement si nécessaire
- 2.5.19 ARIA incorrect qui contredit le HTML natif

#### 2.6 CSS

- 2.6.2 Règles globales agressives
- 2.6.4 Éviter `!important` sauf cas exceptionnel documenté
- 2.6.5 Duplication de styles
- 2.6.16 Focus clavier visible
- 2.6.18 Respecter `prefers-reduced-motion`
- 2.6.19 CSS mort
- 2.6.21 Conflits entre CSS custom et Tailwind

#### 2.7 Conventions de nommage

- 2.7.1 `PascalCase.astro` pour composants Astro
- 2.7.2 `PascalCase.tsx` pour composants React
- 2.7.3 `camelCase.ts` pour utilitaires
- 2.7.6 `kebab-case` pour les dossiers
- 2.7.7 Noms vagues (`utils.ts`, `helpers.ts`) quand le fichier grossit
- 2.7.10 Fonctions nommées avec un verbe et une intention claire

---

### Partie 3 — Bonnes pratiques Astro 6 et Tailwind CSS v4

#### 3.1 Architecture Astro

- 3.1.1 Composants `.astro` pour le rendu statique
- 3.1.2 Limiter React aux zones réellement interactives
- 3.1.4 Éviter le JavaScript client inutile
- 3.1.6 Éviter la logique complexe directement dans les pages
- 3.1.11 Compatibilité avec le mode de rendu : static, server ou hybrid

#### 3.2 Content Layer

- 3.2.1 Approche moderne Astro 6 (Content Layer API)
- 3.2.2 Éviter les anciennes APIs Content Collections dépréciées
- 3.2.4 Frontmatter typé et cohérent
- 3.2.7 Gestion claire des brouillons
- 3.2.14 Filtres `draft` oubliés
- 3.2.16 Frontmatter incohérent entre contenus
- 3.2.17 Tags écrits différemment selon les articles

#### 3.3 Routing

- 3.3.2 `getStaticPaths` lisible et robuste
- 3.3.5 Page 404 si pertinent
- 3.3.8 Cohérence des URLs finales
- 3.3.10 Liens internes

#### 3.4 Images et assets

- 3.4.1 Optimisation d'images Astro
- 3.4.2 Dimensions définies pour éviter le layout shift
- 3.4.3 Textes alternatifs
- 3.4.9 Favicon et OG image

#### 3.5 SEO

- 3.5.1 `title` unique par page
- 3.5.2 `description` pertinente
- 3.5.4 Balises Open Graph
- 3.5.7 Sitemap
- 3.5.9 Flux RSS pour le blog
- 3.5.13 Balises `meta` centralisées dans un composant ou layout

#### 3.6 Sécurité

- 3.6.S1 Contenu HTML injecté sans sanitisation (`innerHTML`, `dangerouslySetInnerHTML`)
- 3.6.S2 Variables d'environnement exposées côté client au lieu de rester serveur (`import.meta.env.PUBLIC_*` vs secrets)
- 3.6.S3 Liens externes `target="_blank"` sans `rel="noopener noreferrer"`
- 3.6.S4 Données non validées injectées dans une URL ou un sélecteur
- 3.6.S5 Secrets ou tokens hardcodés dans le code source

#### 3.8 Performance

- 3.8.1 Réduire le JavaScript client non nécessaire
- 3.8.2 Hydratation différée
- 3.8.5 Optimiser les images
- 3.8.9 Éviter les dépendances lourdes

#### 3.9 Accessibilité

- 3.9.1 HTML sémantique
- 3.9.2 Navigation clavier
- 3.9.4 Focus visible
- 3.9.6 Contraste probable
- 3.9.10 Contenu porté uniquement par la couleur
- 3.9.11 Réduction d'animations

#### 3.10 Tailwind CSS v4 — Configuration

- 3.10.1 Configuration compatible Tailwind CSS v4
- 3.10.4 Éviter les anciens patterns Tailwind v3
- 3.10.7 Centraliser les tokens de design
- 3.10.8–3.10.12 Cohérence des couleurs, espacements, radius, shadows, typographies

#### 3.11 Tailwind CSS v4 — Qualité des classes

- 3.11.2 Chaînes de classes énormes et dupliquées
- 3.11.5 Abus de valeurs arbitraires
- 3.11.6 Valeurs arbitraires non justifiées (`mt-[17px]`)
- 3.11.7 Cohérence responsive
- 3.11.8 Cohérence du dark mode si présent
- 3.11.14 Conflits entre classes
- 3.11.15 Classes qui s'annulent dans la même chaîne

#### 3.12 Tailwind CSS v4 — Organisation

- 3.12.2 `@apply` avec parcimonie
- 3.12.3 Éviter de recréer une seconde API CSS au-dessus de Tailwind
- 3.12.5 Extraire des composants quand les blocs deviennent répétitifs

#### 3.13 Responsive

- 3.13.1 Mobile-first
- 3.13.2 Cohérence des breakpoints
- 3.13.3 Le design desktop ne casse pas sur mobile

#### 3.14 Tailwind — Accessibilité

- 3.14.1 `focus-visible` sur les éléments interactifs custom
- 3.14.2 Contraste suffisant
- 3.14.5 Ne pas supprimer l'outline sans remplacement accessible

---

### Partie 4 — Format et priorités

#### 4.1 Format de réponse

Produire le fichier `review-YYYY-MM-DD.md` à la racine du repo. Résumé de 3 à 8 lignes + verdict. Lister bloquants, importants, nettoyage, questions. Références de règle + lien fichier VSCode pour chaque retour.

#### 4.11 Niveau d'exigence

Être exigeant mais pragmatique. Ne pas proposer une architecture trop lourde pour un blog personnel solo. Préférer la simplicité. Accepter les duplications bénignes. Refuser le code mort et le JavaScript client inutile.

#### 4.12 Priorité bloquante

Bug probable, régression, build cassé, contenu brouillon publié, faille de sécurité, accessibilité cassée sur élément majeur, SEO très dégradé, hydratation incorrecte, dépendance inutile très lourde.

#### 4.13 Priorité importante

Dette technique claire, duplication risquée, composant trop complexe, mauvaise convention, performance améliorable.

#### 4.14 Priorité mineure

Nom améliorable, micro-duplication, style perfectible, petit souci de lisibilité.

#### 4.15 Style

Répondre en français. Être direct. Ne pas faire de compliments creux. Toujours inclure la référence de règle et un lien fichier dans chaque retour.
