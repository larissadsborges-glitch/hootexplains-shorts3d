# Skills and plugins review (5 Nov 2026)

Read-only review of five public repos (READMEs, SKILL.md files, hook manifests and some source were fetched from GitHub). Nothing was installed or run.

| Repo | What it is | Installs / changes | Risk | Fit for us | Verdict |
|---|---|---|---|---|---|
| vercel-labs/skills (Find Skills) | `npx skills` package manager + a skill that tells the agent to search and install skills | Skill folders in `.claude/skills` or global; no hooks | Medium: telemetry on by default; the skill installs with `-g -y` | Low | **Skip** |
| obra/superpowers | Methodology plugin: brainstorm, plan, subagents, TDD, code review | SessionStart hook injects a skill on every start/clear/compact | Low data risk; heavy process, context cost | Medium (ideas) | **Borrow ideas** |
| thedotmack/claude-mem | Automatic cross-session memory | 7 lifecycle hooks, Bun worker + local HTTP UI, SQLite + Chroma, MCP tools, PATH edit, auto-installs Bun/uv | High: captures every tool call; hosted observer/cloud by default after sign-in | Medium need, poor fit | **Skip** |
| pbakaus/impeccable | Web UI design skill + 62-rule "slop" detector | Detector binary in `~/.impeccable/bin`, PostToolUse hook in `.claude/settings.local.json`, `.impeccable/` folder | Medium: catalog fetch + telemetry; live mode can spawn `claude` with bypassed permissions | Low (web, not video) | **Borrow ideas** |
| rebelytics/one-skill-to-rule-them-all (Task Observer) | Meta-skill that logs friction and proposes skill updates | Skill + bash/Python helpers; optional experimental turn-end hook plugin | Low: no network in normal use | High (ideas), heavy to run | **Borrow ideas** (trial later) |

## 1. vercel-labs/skills ("Find Skills")
**How it works:** an npm CLI (MIT, Node 22.20+) that copies skills from GitHub/npm into each agent's skills folder. The `find-skills` skill triggers on "how do I do X" and tells the agent to search skills.sh, judge by install count and stars, then run `npx skills add <pkg> -g -y` (global, no prompt).
**Risk:** install/find events (including your search query) go to `skills.sh/tele` unless `DISABLE_TELEMETRY=1` or `DO_NOT_TRACK=1`. The bigger risk is supply chain: popularity is not a security review, and `-y` skips the user.
**For us:** we need few skills and already pick them by hand. **Skip.** Browse skills.sh in a browser if needed.

## 2. obra/superpowers
**How it works:** MIT plugin (very popular, actively maintained). A SessionStart hook (`run-hook.cmd`, bash, on start/clear/compact) injects the `using-superpowers` skill wrapped in `<EXTREMELY_IMPORTANT>`, making its workflows mandatory: brainstorming, git worktrees, bite-sized plans, a fresh subagent per task with spec review then quality review, strict TDD (it deletes code written before tests), branch finishing.
**Risk:** no data leaves the machine except the optional brainstorm "visual companion", which runs a local server and loads a logo carrying the plugin version. The cost is context and ceremony on every session.
**For us:** TDD and worktrees do not fit a render-and-look loop, and it would compete with karpathy-guidelines. **Borrow ideas:** `verification-before-completion` and the reviewer prompt template (practices 1 and 5), plus its Windows polyglot-hook notes if we ever add hooks.

## 3. thedotmack/claude-mem
**How it works:** Apache-2.0 core (hosted features reserved). Hooks on Setup, SessionStart, UserPromptSubmit, Pre/PostToolUse, Stop and SessionEnd capture tool activity; a model summarises it into "observations" stored in SQLite + Chroma and re-injected next session. Search uses MCP tools in three layers: `search` (index) → `timeline` → `get_observations` (full detail).
**Changes:** auto-installs Bun and uv, adds `%LOCALAPPDATA%\claude-mem\bin` to the user PATH, runs a background worker with a web viewer, writes `~/.claude-mem/`.
**Risk:** the installer asks for an email sign-in and defaults to the hosted "claude-mem observer" (your session content is processed off-machine); otherwise it spends your Anthropic plan or an OpenRouter/Gemini key. Cloud Sync to cmem.ai is optional. Everything a tool sees, including file contents, is captured unless wrapped in `<private>`.
**For us:** it targets our pain point, but the footprint is far larger than the problem, and a background worker on the i7-7700K/1050 Ti competes with renders. **Skip.** Copy the three-layer progressive-disclosure idea into LEARNINGS.md.

## 4. pbakaus/impeccable
**How it works:** Apache-2.0 skill (forked from Anthropic's frontend-design) with 24 commands (`critique`, `audit`, `polish`, `bolder`...), `PRODUCT.md`/`DESIGN.md` context files and a deterministic detector for web "AI slop" (gradient text, nested cards, contrast).
**Changes/risk:** downloads an engine binary; its PostToolUse hook would scan every `.tsx` we edit (our Remotion scenes) with web-UI rules, mostly noise. New designs fetch directions from impeccable.style, plus opt-out telemetry. Live mode may launch `codex`/`claude` with approvals and sandbox off.
**For us:** built for web pages, not SVG cartoon frames. **Borrow ideas:** `critique` runs a judgement review and a deterministic scan as two isolated subagents, judgement first so the scan does not anchor it, and a single-context run must be labelled "DEGRADED"; an `ignore.md` of accepted findings; narrow targets; a "refuse" list of lazy defaults (practices 5–7).

## 5. rebelytics/one-skill-to-rule-them-all (Task Observer)
**How it works:** CC BY 4.0 (copying text requires credit to Eoghan Henn / rebelytics.com). A large skill (749-line core plus on-demand references) that watches sessions for corrections, repeated work and its own blind spots, writes one Markdown observation file per insight, and runs a scheduled review that stages skill updates for approval. It never edits live skills. It needs an activation block in CLAUDE.md; snippets are bash-only.
**Risk:** low: it states that normal operation uses no network and treats fetched text as data. The optional `task-observer-flush` turn-end hook is experimental.
**For us:** closest to our "lessons across sessions" need, but its README admits small setups may not need the full log/review cycle, and the weekly-review reference alone is ~25k words. **Borrow ideas now; trial it** if we pass ~10 skills.
**Best ideas:** see practices 3, 4 and 8 below.

## Practices to adopt now
1. **Evidence gate before "done".** Every claim ("beak fixed", "mix OK", "ready to send") must cite something produced in this turn: a contact sheet you actually viewed, a loudness/ffprobe readout, a `scripts/qa` exit code. "Should look fine" is not a status.
2. **Restructure LEARNINGS.md for progressive disclosure.** Top: a short "Active rules" index (one line each, with an ID such as `L-042`, grouped by Hoot/Jake/layout/audio/Windows). Below or in `docs/learnings/`: per-video detail, read on demand. Fix contradictions now (e.g. LEARNINGS "Standing rules" still says a 60% `bm_george` voice; CLAUDE.md says 70% `am_adam`).
3. **Generalisability test** before adding a lesson: would it apply to the next video? If not, it goes in that video's BRIEF.md, not LEARNINGS.
4. **Second violation → barrier.** When a rule breaks twice, turn it into code: a `scripts/qa` check (beak opening ≤ half, props above the caption band, nothing in the bottom 20%, labels ≥ 1.5 s), or set `PYTHONUTF8`/`encoding="utf-8"` inside the scripts instead of relying on memory.
5. **Standard reviewer brief** for independent agents: goal, rule files to read, exact frames/files, read-only, findings ranked P0–P3 (P0/P1 block delivery), a "declined to judge" list, no nested subagents. The reviewer judges the sheets before seeing `scripts/qa` output. Verify any agent's "done" by checking the files yourself.
6. **A "visual world" doc** (DESIGN.md-style, from `docs/project/hootexplains-style-guide.md`): palette hex values, stroke widths, character turnarounds, safe zones, plus a "cartoon slop" refuse list (detached limbs, sinking into furniture, hands missing props, wide beak). Review one shot at a time, not the whole video at a glance.
7. **Accepted-deviations file** (`docs/review_ignore.md`): owner-approved exceptions, so reviewers stop re-raising them.
8. **Context hygiene:** after two failed fix hypotheses, write a short problem report (symptom, ruled out, cheapest next test) and move on; use subagents for wide reading and fact checks; end each session with a 5-line handoff in the video's folder.
9. **Fix stale skill metadata:** `hootexplains-short` still describes "3D... Remotion + Three.js"; update the description to the 2D SVG house style so it triggers and guides correctly.
10. **Third-party skill intake rule (add to CLAUDE.md):** read every file first, pin a commit SHA, copy text rather than run installers, record the license (credit CC BY sources), never use `-y`/global installs, set `DO_NOT_TRACK=1`, and no hooks or MCP servers without the owner's approval.
