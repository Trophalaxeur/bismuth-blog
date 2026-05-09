# Instructions Copilot — Review PR Bismuth
<!-- test/02-copilot-review-ready-for-review — vérifie le trigger "ready_for_review" (draft → ready) -->

Blog personnel : Astro 6, React, TypeScript, Tailwind CSS v4, Expressive Code. Output statique, Vercel.

## Périmètre

Analyser uniquement les **fichiers modifiés dans la PR**.

Ignorer sans exception :

- `src/content/` — contenu éditorial, hors scope technique
- `node_modules/`
- tout dossier commençant par `.` (`.astro/`, `.git/`, etc.)
- `dist/`

## Format de réponse

Poster un commentaire de PR en Markdown structuré :

```markdown
## Review

**Verdict :** ✅ / ⚠️ / 🚧 / ❌ — une phrase

### 🚫 Bloquants
- `src/components/Foo.astro` — problème + correction

### ⚠️ Importants
...

### 💡 Suggestions
...

### ❓ Questions
...
```

Verdicts : `✅ Merge possible` · `⚠️ Merge possible après petites corrections` · `🚧 Corrections importantes recommandées` · `❌ Ne pas merger`

Chaque retour : chemin du fichier, problème, correction ou vérification suggérée. Pas de longs paragraphes. Pas de répétitions.

---

## Règles

### Code mort dans les fichiers modifiés

- Variables, fonctions, paramètres, imports déclarés mais jamais utilisés
- Branches conditionnelles impossibles ou redondantes
- `console.log`, `debugger` oubliés
- Code commenté obsolète
- Exports inutiles dans les fichiers touchés

### Duplications

- Logique copiée entre deux composants modifiés dans la même PR
- Classes Tailwind identiques répétées sans extraction raisonnable
- Constantes magiques répétées

### JavaScript / TypeScript

- `any` injustifié en TypeScript
- `useEffect` utilisé pour dériver une valeur calculable au rendu
- Promesses non gérées (`await` manquant, `.catch` absent)
- Préférer `??` à `||` quand la valeur vide est valide
- Variables à noms vagues ou abréviations obscures
- Calculs coûteux dans une boucle ou répétés inutilement

### React

- State inutile (valeur dérivable depuis les props ou le contexte)
- `useEffect` inutile ou avec dépendances incorrectes
- `client:load` quand `client:idle` ou `client:visible` suffit
- Composant React pour du contenu purement statique (préférer Astro)
- Index de tableau comme `key` React si l'ordre peut changer
- Bouton pour une action, lien `<a>` pour une navigation

### Astro

- Logique métier complexe directement dans une page Astro
- Ancienne API Content Collections (`getCollection` v1, `slug` direct) au lieu du Content Layer Astro 6
- `draft` non filtré dans les requêtes de contenus
- `getStaticPaths` illisible ou fragile
- Composant `.astro` qui pourrait remplacer un composant React inutilement hydraté

### Tailwind CSS v4

- Valeurs arbitraires non justifiées (`mt-[17px]`, `w-[calc(...)]` sans raison)
- Anciens patterns Tailwind v3 conservés (`tailwind.config.js` actif, `@tailwind` au lieu de `@import "tailwindcss"`)
- Classes qui s'annulent dans la même chaîne (`flex block`)
- `@apply` abusif — préférer les classes directement dans le markup
- Outline supprimé sans `focus-visible` de remplacement

### HTML et accessibilité

- Un seul `h1` par page
- Hiérarchie de titres respectée
- `alt` manquant ou vide sur image significative
- Bouton utilisé comme lien ou vice versa
- Contenu porté uniquement par la couleur
- Focus clavier absent sur un élément interactif

### SEO

- Page sans `<title>` ou avec titre générique
- Métadonnées Open Graph absentes sur une nouvelle page
- Filtre `draft: true` oublié (risque de publier un brouillon)

### Images

- Image Astro sans dimensions (risque de layout shift)
- Image non optimisée via le composant `<Image>` d'Astro
- `alt` absent

### Sécurité

- Contenu HTML injecté sans sanitisation (`innerHTML`, `dangerouslySetInnerHTML`)
- Variable d'environnement exposée côté client alors qu'elle devrait rester serveur (`import.meta.env.PUBLIC_*` vs secrets)
- Lien externe `target="_blank"` sans `rel="noopener noreferrer"`
- Données non validées injectées dans une URL ou un sélecteur

---

## Niveau d'exigence

Blog personnel solo. Ne pas sur-architecturer. Accepter les duplications bénignes et locales. Refuser le code mort. Refuser le JavaScript client inutile. Proportionner les suggestions à la taille réelle de la PR.

Répondre en français. Être concis et direct.
