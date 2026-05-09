# Interaction diary

> Personal log of Claude Code sessions — focused on interaction dynamics, not results.
> Goal: identify patterns, improve future prompting, reduce back-and-forth.

---

## 2026-05-05 (pm) — Astro 6 + TW4 migration (continuation)

_Source: Claude Code CLI — session in `/home/flefevre/Project/perso/personal-blog`._

### Resuming without context, again

**What I said:** "Reprenons là où nous en étions."

**What happened:** this time memory had been saved in the right directory (lesson learned that morning). Claude found context immediately and picked up at the right point: migrating the content config.

**What I could have done better:** even though it worked, "pick up where we stopped this morning: content config migration" would have been more direct. "Let's resume" without a hint forces Claude to read memory and infer the restart point.

---

### nvm default not applying

**What happened:** Node 20 still active despite `nvm alias default 22`. Three exchanges to identify it as a known nvm bug with partial version numbers, and that the current shell doesn't reload the alias. Fix: full version string in alias + `nvm use default --silent` in `.zshrc`.

**What I could have done better:** paste the output of `nvm ls`, `cat ~/.nvm/alias/default`, and `which node` in the very first message. Claude asked for them one by one, whereas a full state dump upfront would have halved the back-and-forth.

**Pattern to remember:** for any environment issue (node, python, PATH), give a full state dump in the first message: `nvm ls`, `which node`, `node --version`, `cat ~/.zshrc | grep nvm`.

---

### Clean migration (finally)

**What happened:** once Node was sorted, Claude chained everything without back-and-forth: `LegacyContentConfigError` → content config migration → Astro v6 API changes (`render()`, `slug→id`, `z` from zod) → TW4 migration of `app.css`. Clean build at 17 pages.

**What worked well:** having saved the exact state before the morning reboot. Claude knew exactly where to resume and in what order.

---

### "use yay instead of pacman" — second time

**What happened:** I had to correct this a second time in the same day.

**Why:** the morning correction had been made in `~/.claude/CLAUDE.md`, but the sub-shell hadn't picked up the update — and the correction had been made conversationally, not written to the file promptly enough.

**What I could have done better:** nothing on my end, it's a persistence timing issue. But note that changes to the global CLAUDE.md only apply to new sessions.

---

### Patterns observed

| Pattern                          | Recommendation                                                                      |
| -------------------------------- | ----------------------------------------------------------------------------------- |
| "Let's resume where we left off" | Add a word on the exact restart point — confirms Claude is reading the right memory |
| Environment issue                | Full state dump immediately: `nvm ls`, `which node`, `cat ~/.zshrc \| grep nvm`     |
| Repeated correction (yay/pacman) | Verify the correction is written to CLAUDE.md, not just said in conversation        |

---

## 2026-05-05 (am) — Reset + theme choice + migration start

_Source: Claude Code CLI — session in `/home/flefevre/Project/perso/personal-blog`._

### Resuming without context

**What I said:** "Reprenons notre session d'hier concernant le personal-blog."

**What happened:** Claude found nothing. Response: "No saved memory. Can you remind me where we left off?" I was surprised — Claude had told me yesterday it had saved context. The cause: memories are indexed by working directory. Yesterday I was in `/home/flefevre/Project/perso`, today I was in the subdirectory. Claude found the memory by searching the parent directory.

**What I could have done better:** either launch from the same directory as yesterday, or say "yesterday's session from `/perso`" so Claude knows where to look.

**Pattern to remember:** Claude Code memory is scoped to the working directory. If you change folders between sessions, say so explicitly or always launch from the same directory.

---

### "Why did you clone AstroWind?"

**What I asked:** why Claude had cloned AstroWind instead of following the official install.

**What happened:** Claude didn't know — memory captured what was done, not why. Claude reconstructed a justification after the fact. That felt off.

**What Claude should have done:** explain the choice at the time it was made. A proactive "I'm cloning rather than using `npm create` because X" would have avoided this question the next day.

**What I could have done better:** my initial prompt said "choose the cleanest and most reproducible approach" — I delegated the decision without asking for an explanation. Adding "and explain your choice" would have forced transparency.

---

### "Wipe it, reinstall properly"

**What I said:** "We didn't weigh the alternatives. I want clean npm updates. Wipe everything, show me the official procedure, and install it."

**What happened:** Claude wiped and reinstalled. Then had to deliver bad news: the premise was wrong. AstroWind is not an npm package — `npm create` does exactly the same as a clone, copying the code once. There's no `npm update astrowind`. The clone vs template distinction was a non-issue.

**What Claude should have done:** surface this misunderstanding before wiping. A "hold on — AstroWind isn't an installable npm package, both approaches are identical. What you want is to be able to update Astro itself, which works either way. Still want to redo everything?" would have potentially saved a full reinstall.

**Pattern to remember:** when a request is based on a wrong premise, correct it before executing — even if the request is clear and direct.

---

### Theme choice

**What I asked:** list Astro themes available as npm packages, CV-first, out-of-the-box.

**What happened:** Claude had to explain that doesn't exist — all Astro themes are copied templates, not installable packages. Two exchanges to get there. Then a text comparison between `astro-theme-resume` and `Astrofy`, followed by a 3-word "go, let's switch."

**What I could have done better:** ask directly "compare the best Astro themes for CV + blog" without the npm constraint, which was based on a misunderstanding of the ecosystem. The constraint generated an unnecessary detour.

---

### Cloudflare silently carried over

**What happened:** I interrupted an action and asked "why would Cloudflare be better than Vercel here?" Claude admitted it had just carried over the previous session's choice without questioning it, and that there was no strong technical reason. We switched to Vercel (already configured in the theme).

**What Claude should have done:** at the start of the session, proactively flag that the theme is pre-configured for Vercel and ask to confirm the hosting choice. A structural decision like deployment target deserves an explicit "still going with Cloudflare?" rather than a silent carry-over.

**Pattern to remember:** architecture and deployment choices carried over from a previous session must be confirmed explicitly at the start, not silently renewed.

---

### "Why are you targeting Astro 5?"

**What happened:** Claude had started downgrading to Astro 5 due to an incompatibility with `@astrojs/tailwind`. I stopped it. Claude explained the real issue: TW4 doesn't use the adapter, the migration path is `@tailwindcss/vite`. My response: "Astro 6 + TW4, if the theme isn't compatible we change themes."

**What Claude should have done:** not quietly downgrade. When an upgrade hits a compatibility wall, present the options (downgrade vs migrate) and ask which direction to take — don't decide alone.

**Pattern to remember:** an undiscussed major version downgrade is a red flag. If Claude drops a major version without mentioning it, stop and ask why.

---

### Patterns observed

| Pattern                                    | Recommendation                                                                                      |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Prompt with no explanation asked           | Add "and explain your choice" for structural decisions (clone vs template, adapter vs plugin, etc.) |
| Request based on wrong premise             | Claude should correct before executing — I could have avoided a full reinstall                      |
| Ecosystem constraint without understanding | Ask "what themes fit my needs best" rather than imposing vague technical constraints                |
| Architecture choice silently carried over  | Deployment target must be re-confirmed, not just renewed                                            |
| Undiscussed major version downgrade        | Always stop and ask for options when Claude changes a major version without explanation             |

---

## 2026-05-04 — Project creation + AstroWind setup

_Source: Claude Code CLI — session in `/home/flefevre/Project/perso`. Hugo vs Astro decision was made earlier in Claude.ai (not logged here)._

### Well-structured initial prompt

**What I did:** sent a detailed prompt with project context, tech stack, numbered task list, and the full content of the `CLAUDE.md` file to create — everything in one message.

**What happened:** zero back-and-forth. Claude executed in order, made implementation choices on its own (clone vs `npm create`), verified the build, clean commit.

**What worked well:** providing the frontmatter schema and CLAUDE.md content inline in the prompt. Claude had no need to guess conventions or ask for clarification. This is the most effective format for a bootstrap session.

---

### One interruption, "nevermind carry on"

**What happened:** one interruption mid-session (likely a permission prompt), followed by "nevermind carry on." Session resumed without any loss.

---

### Clean ending

**What I said:** "Call it a day we'll resume tomorrow."

**What Claude did:** saved memory. But in the wrong context — because the next day I was in the subdirectory and memory wasn't found automatically.

**What I could have done better:** explicitly ask Claude to note the working directory in memory, or always resume from the same directory.

---

### Patterns observed

| Pattern                                | Recommendation                                                                                        |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Structured bootstrap prompt            | Provide context, numbered tasks, and file contents inline — most effective format                     |
| "We'll resume tomorrow" session ending | Ask Claude to explicitly save the working directory in memory, so context is findable from any folder |
| Silent implementation choice           | Ask for an explanation on structural choices — "and explain why" goes a long way                      |
