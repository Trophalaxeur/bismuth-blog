<img align="left" src="docs/bismuth-thumb.png" style="margin-right:20px" height="186" />

```
 mmmmmm     mmmmmm     mmmm    mmm  mmm  mm    mm  mmmmmmmm  mm    mm 
 ##""""##   ""##""   m#""""#   ###  ###  ##    ##  """##"""  ##    ## 
 ##    ##     ##     ##m       ########  ##    ##     ##     ##    ## 
 #######      ##      "####m   ## ## ##  ##    ##     ##     ######## 
 ##    ##     ##          "##  ## "" ##  ##    ##     ##     ##    ## 
 ##mmmm##   mm##mm   #mmmmm#"  ##    ##  "##mm##"     ##     ##    ## 
 """""""    """"""    """""    ""    ""    """"       ""     ""    "" 
```
<br />
<!-- https://patorjk.com/software/taag/#p=display&f=ASCII+12&t=BISMUTH&x=none&v=4&h=0&w=80&we=false -->


> Named after **Bismuth (Bi, 83)** — the element that forms spectacular iridescent crystals when it oxidizes.
> Because a personal site that doesn't catch your eye is just entropy. (#Haha)

---

## What it is

Personal website of [@Trophalaxeur](https://github.com/Trophalaxeur).

A blog born out of frustration: too many cool things to explore, never enough time. And out of a simple idea — what if I used AI to finally do, right now, everything I've been putting off?

CV, dev experiments, homelab documentation. **Written for me, open to outside eyes.**

## Goals

- **Professional showcase** — shareable CV with a recruiter-friendly short version and a full competency dossier
- **Dev blog** — technical adventures, experiments, and lessons learned
- **Homelab docs** — *(coming later)* home infrastructure documentation

## Stack

| Layer | Tech |
|---|---|
| Framework | [Astro 6](https://astro.build/) — static output |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) via `@tailwindcss/vite` |
| Content | Astro Content Layer (glob loader + Zod schemas) |
| Syntax highlighting | [Expressive Code](https://expressive-code.com/) |
| Hosting | [Vercel](https://vercel.com/) — static |
| Domain | [flefevre.fr](https://flefevre.fr) |

## Claude Code in the workflow

This project is built with [Claude Code](https://claude.ai/code) as a first-class tool in the development loop:

- **Pair programming** — architecture decisions, component design, content modeling
- **PR reviews** — GitHub Actions triggers a Claude review on every pull request
- **Living documentation** — `CLAUDE.md` is maintained alongside the code to give Claude full context on conventions and stack choices
- **Content drafting** — blog posts and CV content iterated with Claude assistance

## Claude Code Skills

Custom skills live in `.claude/skills/`. Install a skill by copying its folder there.

### `ai-decision-doc-maintainer`

Maintains the AI agent decision documentation under `docs/ai-agent-decision-tree/`.

Invoke it in Claude Code:

```text
Use the ai-decision-doc-maintainer skill to update the decision matrix and D2 diagram in docs/ai-agent-decision-tree/.
Check current pricing and quotas online, update sources, then regenerate SVG and PNG.
```

Manual image regeneration:

```bash
.claude/skills/ai-decision-doc-maintainer/scripts/update-ai-decision-doc.sh
```

The script runs:

```bash
d2 docs/ai-agent-decision-tree/decision-tree.d2 docs/ai-agent-decision-tree/decision-tree.svg
d2 docs/ai-agent-decision-tree/decision-tree.d2 docs/ai-agent-decision-tree/decision-tree.png
```

### `full-review`

Full codebase audit — dead code, unused files, quality, SEO, accessibility, React/Astro/Tailwind best practices.

Invoke it in Claude Code:

```text
/full-review
```

Produces `review-YYYY-MM-DD.md` at the repo root with VSCode-clickable file links.

## Copilot PR Review

`.github/copilot-instructions.md` contains lightweight rules for GitHub Copilot to use when reviewing pull requests. It covers only changed files, ignores `src/content/`, `node_modules/` and hidden folders, and outputs a PR comment.
