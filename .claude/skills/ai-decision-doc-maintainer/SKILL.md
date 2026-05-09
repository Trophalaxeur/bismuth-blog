---
name: ai-decision-doc-maintainer
description: Maintient à jour la documentation de décision Claude Code / GitHub Copilot / homelab dans docs/ai-agent-decision-tree/. À utiliser quand il faut mettre à jour la matrice Markdown, vérifier les tarifs/quotas en ligne, modifier le diagramme D2, ajouter ou régénérer l’image du diagramme, ou rafraîchir les sources.
---

# AI Decision Documentation Maintainer

Ce skill maintient à jour `docs/ai-agent-decision-tree/` — choix entre Claude Code CLI homelab, Claude Code via GitHub Actions, GitHub Copilot Cloud Agent, Copilot Agent self-hosted, et script homelab + Claude ponctuel.

Fichiers à maintenir : matrice Markdown, diagramme D2, images SVG/PNG générées.

## Fichiers cibles par défaut

Utiliser ces chemins par défaut sauf si le repository utilise une autre convention :

```text
docs/ai-agent-decision-tree/matrice-decision-claude-copilot-homelab.md
docs/ai-agent-decision-tree/decision-tree.d2
docs/ai-agent-decision-tree/decision-tree.svg
docs/ai-agent-decision-tree/decision-tree.png
```

Le fichier Markdown doit contenir une référence à l’image du diagramme :

```md
![Arbre de décision Claude Code / Copilot / homelab](./decision-tree.svg)
```

Préférer le SVG dans le Markdown pour une documentation GitHub lisible et nette. Générer aussi le PNG si possible pour les exports ou intégrations externes.

## Quand utiliser ce skill

Utiliser ce skill si la demande concerne :

- la mise à jour de la matrice de décision ;
- un changement de tarifs GitHub Copilot, Claude, Claude Code, Anthropic API ou GitHub Actions ;
- un changement de quotas, limites, premium requests, crédits ou usage inclus ;
- une modification de l’arbre de décision ;
- la régénération d’une image depuis un fichier D2 ;
- l’ajout du diagramme dans le Markdown ;
- la vérification des sources officielles.

## Règles de recherche

Avant de modifier les tarifs, quotas ou limitations, rechercher en ligne les informations actuelles.

Priorité des sources :

1. documentation officielle GitHub ;
2. documentation officielle Anthropic / Claude ;
3. documentation officielle Claude Code ;
4. pages de pricing officielles ;
5. annonces officielles ;
6. sources tierces seulement si elles permettent de contextualiser une annonce officielle.

Ne pas utiliser d’anciens chiffres sans vérification.

Sources à vérifier en priorité :

```text
https://docs.github.com/en/copilot/concepts/billing/individual-plans
https://docs.github.com/copilot/concepts/agents/coding-agent/about-coding-agent
https://docs.github.com/billing/managing-billing-for-github-actions/about-billing-for-github-actions
https://docs.github.com/copilot/how-tos/administer-copilot/manage-for-organization/configure-runner-for-coding-agent
https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan
https://support.claude.com/en/articles/11647753-how-do-usage-and-length-limits-work
https://platform.claude.com/docs/en/about-claude/pricing
https://docs.anthropic.com/en/docs/claude-code/overview
```

## Workflow obligatoire

### 1. Inspecter l’existant

Lire au minimum :

```text
docs/ai-agent-decision-tree/matrice-decision-claude-copilot-homelab.md
docs/ai-agent-decision-tree/decision-tree.d2
```

Si les fichiers n’existent pas, les créer.

### 2. Vérifier les informations mouvantes

Vérifier en ligne :

- quotas GitHub Copilot Pro / Pro+ ;
- modèle de premium requests ou crédits ;
- conditions du Copilot coding agent ;
- consommation éventuelle de GitHub Actions minutes ;
- tarifs GitHub Actions pour repos privés si pertinent ;
- limites Claude Code avec plan Pro/Max ;
- contexte Claude ;
- tarifs API Anthropic / Claude ;
- limites ou contraintes self-hosted runners pour Copilot coding agent.

### 3. Mettre à jour le Markdown

Le Markdown doit rester en première personne :

```text
je, mon, ma, mes
```

Ne pas utiliser :

```text
tu, ton, ta, tes
```

Le Markdown doit conserver les sections suivantes, sauf demande contraire :

```text
1. Matrice de décision rapide
2. Matrice de décision détaillé
3. Matrice par besoin
4. Différence entre “Claude Code CLI homelab” et “script homelab + Claude”
5. Grille de coût pratique
6. Limitations spécifiques de Claude Code CLI sur homelab
7. Ce que change Copilot Pro au lieu de Copilot Pro+
8. Règle de choix simple
9. Sources
```

Le Markdown doit inclure l’image du diagramme après le contexte ou juste avant la matrice :

```md
## Diagramme de décision

![Arbre de décision Claude Code / Copilot / homelab](./decision-tree.svg)
```

### 4. Mettre à jour le diagramme D2

Le diagramme doit refléter la matrice de décision actuelle.

Interdiction d’utiliser :

```d2
shape: note
```

Certains environnements D2 ne supportent pas `note`. Utiliser à la place :

```d2
shape: rectangle
style.stroke-dash: 4
```

### 5. Générer les images après chaque modification D2

Après toute modification de `docs/ai-agent-decision-tree/decision-tree.d2`, lancer :

```bash
d2 docs/ai-agent-decision-tree/decision-tree.d2 docs/ai-agent-decision-tree/decision-tree.svg
```

Puis, si possible :

```bash
d2 docs/ai-agent-decision-tree/decision-tree.d2 docs/ai-agent-decision-tree/decision-tree.png
```

Si `d2` n’est pas installé, ne pas inventer l’image. Signaler clairement la commande à lancer.

### 6. Vérifier le résultat

Avant de terminer :

```bash
test -f docs/ai-agent-decision-tree/matrice-decision-claude-copilot-homelab.md
test -f docs/ai-agent-decision-tree/decision-tree.d2
test -f docs/ai-agent-decision-tree/decision-tree.svg
```

Si PNG requis :

```bash
test -f docs/ai-agent-decision-tree/decision-tree.png
```

Vérifier aussi que le Markdown référence bien l’image :

```bash
grep -n "decision-tree.svg" docs/ai-agent-decision-tree/matrice-decision-claude-copilot-homelab.md
```

## Commande utilitaire fournie

Un script est fourni avec ce skill :

```bash
.claude/skills/ai-decision-doc-maintainer/scripts/update-ai-decision-doc.sh
```

Il permet de régénérer les images D2 et de vérifier que le Markdown contient la référence au diagramme.

## Règles de qualité

- Garder la matrice concise.
- Séparer clairement les usages “lecture/résumé/mail” des usages “modification/refactoring/PR”.
- Ne pas présenter Copilot Agent self-hosted comme une option simple pour usage personnel.
- Ne pas masquer les limites de Copilot Pro.
- Ne pas masquer les limites partagées de Claude Code avec Claude.
- Distinguer abonnement Claude et usage API Anthropic.
- Garder les tarifs sous forme d’ordres de grandeur.
- Ajouter une date de dernière vérification dans le Markdown.

## Sortie attendue

Quand le travail est terminé, résumer :

- les fichiers modifiés ;
- les tarifs/quotas mis à jour ;
- les sources vérifiées ;
- les images générées ;
- les éventuelles commandes qui n’ont pas pu être exécutées.
