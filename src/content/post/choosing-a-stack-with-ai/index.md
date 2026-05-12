---
title: "Choisir sa stack avec une IA : Hugo ou Astro ?"
description: "Comment j'ai utilisé une IA pour choisir entre Hugo et Astro — moins un choix de stack qu'une méthode pour affiner un problème par itération."
publishDate: "11 May 2026"
tags: ["homelab", "astro", "hugo", "ai", "devops"]
---

Au départ, l'objectif était simple : avoir une appli pour documenter mon homelab, pour parler de mes retours d'expériences sur un dev blog, avec CV intégré, le tout écrit en Markdown.
En pratique, ça voulait dire trouver un équilibre entre simplicité, rendu visuel, automatisation et budget.

Très vite, la discussion a révélé autre chose : une méthode pour affiner une décision en itérant avec une IA. Et c'est ce retour que je veux partager ici.

Concrètement, on a avancé par petites touches :
- une idée de départ avec un contexte relativement simpliste
- des contraintes que j'ai ajoutées progressivement
- des réponses de l'IA que j'ai challengées et recalibrées au fur et à mesure

## Exemple d'un échange avec *JeanMichelGPT*

*JeanMichelGPT, désigne ici ChatGPT en l'occurrence, mais la démarche serait identique avec n'importe quel autre modèle.*

- Au début, je voulais quelque chose de simple, tout en Markdown, tout automatisable →  
  JeanMichelGPT m'a proposé **Hugo** (logique : rapide, efficace, zéro friction)

- Puis j'ai ajouté une contrainte importante :  
  *"je veux un rendu moderne et stylé, sans avoir à faire de design moi-même"* →  
  JeanMichelGPT m'a fait basculer vers **Astro** (plus adapté à une vraie "vitrine")

- Ensuite j'ai resserré encore :  
  *budget serré + thèmes gratuits + zéro effort* →  
  JeanMichelGPT m'a de nouveau orienté vers Hugo (plus de thèmes plug & play)

- Et enfin, en précisant que je voulais **un site unique CV + dev blog + image pro** →  
  JeanMichelGPT m'a ramené vers Astro comme choix plus cohérent globalement

Au-delà du changement de suggestion, on a affaire ici à un vrai **raffinement progressif du problème**.

## Ce que j'en retiens

- **L'IA ne donne pas "la bonne réponse" immédiatement.** Elle s'adapte au contexte qu'on lui fournit — plus il est précis, plus la réponse est pertinente.

- **La prise de décision est une exploration guidée**, pas un choix instantané. Chaque échange affine le problème autant que la solution.

- **Un critère non formulé reste une opportunité.** Si je ne mentionne pas la méthode de déploiement, l'IA n'en tient pas forcément compte dans ses premières propositions. Mais si elle l'aborde d'elle-même dans un comparatif, c'est un signal : ce critère a de l'importance, même si je n'y avais pas pensé. Ne pas le définir dès le départ ne le fait pas disparaître — ça laisse à l'IA la liberté d'en évaluer l'importance, et parfois de nous convaincre qu'il mérite d'en être un.

- **Les données de l'IA ne sont pas toujours à jour.** Vérifier les versions avant de s'engager.


## Ce qui a bien fonctionné dans cette interaction

- expliciter un maximum le contexte (moi, le dev blog, mon homelab, etc.)
- ajouter les contraintes au fur et à mesure de l'avancée (budget, design, automatisation) pour initier un dialogue / des aller-retour
- challenger les réponses plutôt que les accepter

## Pistes d'amélioration

- Définir ses **critères principaux** avant de commencer — sans chercher à être exhaustif (ex : rendu visuel, budget, automatisation). Les critères secondaires émergeront au fil de la discussion.
- Demander des **tableaux comparatifs pondérés**, avec les justifications associées

- Avancer en mode **hypothèse → validation** plutôt qu'en simple question/réponse (par exemple : "Cette solution est mieux car elle me permettrait aussi de faire ça. Correct ?")
- Faire valider les contraintes techniques et les versions / modèles utilisés (ex : vérifie que le thème est compatible avec la dernière version d'Astro)

> [!NOTE]
> C'est parce que je n'avais pas tout défini en amont que la discussion a pu s'ouvrir sur des angles inattendus. Le déploiement n'était pas dans mes critères initiaux — c'est l'IA qui l'a introduit dans son comparatif, et c'est ce moment qui m'a incité à en faire un critère. Un dialogue, c'est aussi une façon de laisser l'IA révéler ce qu'on n'a pas encore identifié. Préparer son contexte, oui — mais rester ouvert à ce qui en émerge.


## Fin de journée

Au final, ce qui m'a aidé, ce n'est pas juste Hugo ou Astro. C'est d'avoir transformé une question vague en une décision argumentée, étape par étape — et c'est probablement la compétence la plus utile à entraîner avec une IA.

J'ai choisi Astro. L'installation a été moins évidente que prévu — le thème recommandé n'était compatible qu'avec une ancienne version du framework.

Lors de ma prochaine interaction avec l'IA, si un pattern se dégage, peut-être que je pourrais en tirer un skill.
