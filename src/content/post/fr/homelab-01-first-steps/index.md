---
title: "Homelab #1 — Premiers pas avec Claude Code"
description: "Je me lance dans un homelab pour apprendre le DevOps : objectifs, choix techniques, et premiers retours sur Claude Code comme assistant."
publishDate: "05 May 2026"
tags: ["homelab", "devops", "claude-code", "proxmox", "terraform", "ansible"]
---

Développeur web depuis quelques années, avec quelques compétences en infra, je voulais améliorer mes compétences en DevOps et en IA — pas en lisant des tutos, mais en manipulant sur un vrai serveur avec de vraies contraintes.

J'ai créé ce blog pour être le journal de bord de cette montée en compétence mais aussi un témoignage de mes premiers pas avec une utilisation avancée de l'IA.


## Pourquoi un homelab ?

Il y a plusieurs raisons derrière ce projet, certaines pratiques, d'autres plus expérimentales.

La principale : apprendre le DevOps sur un environnement réel. Pas de sandbox cloud avec des limites artificielles, pas de VM jetable — un serveur physique qui tourne chez moi, avec les contraintes qui vont avec.

Concrètement, ça me donne :

- **Plex** — pour faire tourner un serveur multimédia maison, ce qui impliquait de toute façon d'avoir un serveur qui tourne en permanence
- **Home Assistant** — pour centraliser toute ma domotique dans un seul outil extensible
- **Une alternative à Google Photos** — avec des fonctionnalités qui me manquent : recherche par description, albums éphémères partagés
- **Faire tourner mes propres apps** — pour pouvoir expérimenter sur mes projets perso et mes POCs, sans payer une infra cloud au mois
- **Le coût** — sur le moyen terme, un serveur physique qu'on amortit coûte moins cher qu'une accumulation d'abonnements cloud

La souveraineté des données, j'y pense aussi — mais honnêtement, c'est une raison secondaire.
Et puis ça me donne l'occasion d'assouvir mes principales passions : bidouiller, galérer (sur des problèmes de code ou d'archi, hein !) et apprendre.

## Le matériel choisi : un mini-PC NUC

J'ai écarté les autres options classiques assez vite :
- Un NAS, c'est trop verrouillé et pas assez flexible pour ce que je veux faire.
- Un Raspberry Pi, les performances sont trop limitées pour faire tourner plusieurs services en parallèle.
- Le mini-PC était le bon compromis : compact, silencieux, suffisamment puissant, et on peut y installer ce qu'on veut.

Je suis parti sur un mini-PC Asus NUC 13 Pro Core i7, 32Go de RAM et 1To de données. Suffisant pour l'instant, et il me reste plein de place pour l'upgrade plus tard.

> [!NOTE]
> L'IA m'a beaucoup aidé ici dans la prise de décision — beaucoup d'explications, de listings de specs et de tableaux comparatifs ont été générés en cours de ce processus de prise de décision.

> [!WARNING]
> Les références ne sont pas toujours à jour. Par exemple, quand je lui ai demandé la meilleure option entre deux mini-PC, il m'a affirmé que le NUC que je ciblais supportait la DDR5. Ce qui n'était pas le cas, évidemment.

## La stack : Proxmox, Terraform, Ansible

Pour l'hyperviseur, j'ai choisi Proxmox. Pour provisionner les VMs, Terraform. Pour déployer les services dessus, Ansible. Tout en infrastructure as code.

Ce choix n'est pas arbitraire. Être full IaC m'apporte trois choses concrètes :

- **Claude Code peut lire l'ensemble du projet** et m'assister en contexte — impossible quand la config est dans une interface graphique
- **C'est reproductible** : si je casse tout, ou si j'upgrade le disque de ma machine, je peux tout recréer à l'identique depuis le dépôt git
- Écrire du code, c'est aussi plus fun que cliquer sur des boutons (Bon, surtout ça.)


## Claude Code comme assistant DevOps

J'ai utilisé Claude Code tout au long du projet et je vous donne ici un retour honnête sur mes premières impressions.

Pour l'installation de Proxmox, j'ai utilisé Claude.ai (l'app mobile, pas Claude Code) — pratique pour photographier les écrans des moments clés de l'installation et demander des explications en temps réel. Une fois Proxmox en place, j'ai basculé sur Claude Code dans le terminal sur ma machine principale pour générer la base `terraform`, `ansible` et tout déployer sur `GitHub`

Le premier service déployé : AdGuard Home, un serveur DNS local qui, bonus non prévu, filtre aussi les publicités sur tout le réseau. Le déploiement a été l'étape la plus longue. Claude Code ne connaissait pas mon environnement : specs de la box, config réseau, contraintes locales. Il a fait des suppositions qui ont engendré des erreurs en cascade. Mais il a pu me guider pour les corriger, étape par étape — sans me laisser face à un mur.

Au total : 0,5 jours pour mettre en place une première config fonctionnelle, puis 1 jour de debug. Une bonne partie de ce temps était due à mon environnement perso — notamment des règles DNS que j'avais configurées il y a longtemps sur mon résolveur et complètement oubliées. Évidemment. Claude Code n'avait aucun moyen de le deviner, ni aucune raison d'aller chercher ces informations.

Un comportement que je n'avais pas anticipé : il a suggéré des étapes que je n'avais pas envisagées. Il ne s'est pas contenté d'exécuter mes instructions, il a proposé les prochaines étapes.

## Ce que j'ai appris sur la méthode

Après ce premier déploiement, quelques habitudes se sont mises en place naturellement. Je les documente ici parce qu'elles ont changé la façon dont je travaille avec l'IA.

### Donner du contexte explicitement

Claude Code ne connaît pas mon environnement, mon contexte : mon setup réseau, mon hardware, mes contraintes locales — rien n'est dans sa tête par défaut. L'exemple le plus parlant : suite à un problème réseau, il m'a demandé d'agir sur l'interface `wlan0`. J'étais branché en ethernet sur `enp57s0u2u4`. Il avait supposé que j'étais en Wi-Fi et je n'avais jamais laissé supposer le contraire.

Depuis, je documente tout dans des fichiers `CLAUDE.md` : un global (mes préférences, mon environnement, mon matériel), un par projet (les conventions, les choix techniques, les contraintes spécifiques). Ça évite de réexpliquer à chaque nouvelle session, et ça force à clarifier des choses qu'on laisse habituellement implicites.

> [!TIP]
> Pour reprendre l'exemple de mon problème réseau : j'ai ajouté dans le `CLAUDE.md` une étape de vérification pour savoir sur quelle interface il se trouve en cas de problème réseau.

> [!NOTE]
> Est-ce que l'IA pourra supporter une montée en charge du nombre d'instructions dans le `CLAUDE.md` ?
> On le découvrira dans les prochains jours...


### Relire chaque commande avant d'exécuter

Du coup, si le contexte est incomplet, les commandes générées peuvent être cohérentes avec ce que Claude Code sait — mais incorrectes pour ma situation réelle. Je relis donc systématiquement, et surtout je pose des questions quand quelque chose me semble bizarre. C'est quelques secondes de vérification qui évitent des minutes de debug.

> [!TIP]
> Par exemple, quand le flow d'actions inclut une demande d'installation d'une application, je l'arrête, lui demande pourquoi c'est nécessaire et attends qu'il me propose des alternatives.


### Challenger les choix

Quand je ne comprends pas le raisonnement derrière une décision, je demande une explication et la liste des alternatives. C'est souvent là que j'apprends le plus : pas dans l'exécution, mais dans la discussion autour du pourquoi.

### Maintenir un `next-steps.md`

Entre deux sessions, Claude Code ne se souvient de rien. Pour ne pas perdre le fil des prochaines étapes, je lui demande de maintenir un fichier `next-steps.md` à jour à chaque fin de session. C'est une mémoire partagée minimale qui évite de recommencer chaque conversation avec une longue phase de remise en contexte.

> [!NOTE]
> En plus de ça, j'ai créé un projet GitHub pour rassembler et piloter toutes ces étapes, planifications, tickets.

### Faire un bilan en fin de session

Ce qui a bien fonctionné, ce qui a déraillé, ce que je ferais différemment. Je demande ce bilan à Claude Code lui-même — il a accès à l'ensemble de la session et peut identifier des patterns que j'aurais ratés. C'est là que l'IA devient intéressante : pas comme générateur de code, mais comme outil de réflexion sur le processus de travail.

> [!NOTE]
> Cette partie était très intéressante sur les deux ou trois premiers jours — j'ai beaucoup appris. Maintenant ça devient redondant et assez lourd à maintenir. Je vais plutôt regarder pour lancer un agent qui parsera régulièrement ces logs pour me faire un retour.


## Fin de journée

Premier service déployé, premières habitudes en place — et l'impression que c'est plus accessible qu'il n'y paraît. Pas besoin d'être expert en infra pour se lancer (en tout cas à cette échelle). La suite au prochain épisode.
