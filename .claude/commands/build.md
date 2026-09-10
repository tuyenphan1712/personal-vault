---
description: Plan a vertical-slice feature, then on your approval build it slice-by-slice with TDD in the same session — no separate /continue needed until a PR merges
argument-hint: [feature or work to plan and build]
allowed-tools: Read, Glob, Grep, Write, Edit, Bash(git:*), Bash(gh:*), Bash(npm:*), Bash(pnpm:*), Bash(yarn:*), Bash(npx:*), Bash(cargo:*), Bash(go:*), Bash(python:*), Bash(pytest:*)
---

Current branch state:
!`git log --oneline -5`

Current branch:
!`git branch --show-current`

Working tree:
!`git status --porcelain`

Plan, then build, the requested work: $ARGUMENTS

This command has two phases in one session. **Do not start Phase 2 until the
human has explicitly approved the plan in Phase 1.** Everything else about
slice discipline, TDD, and PR shape is inherited from the skills below —
this command only sequences them; it does not restate their rules. Every
skill named below (`planning`, `story-splitting`, `find-gaps`,
`stack-pull-requests`, `mutation-testing`, `reduce-system-complexity`, `tdd`,
`testing`) must exist under `.claude/skills/` for that step to work — this
project does not have a `grill-me` skill installed, so step 3 below has an
inline fallback instead of depending on it.

---

## Phase 1 — Plan (no code)

1. Detect the default branch. If currently on it, create a feature branch first.
2. Explore the codebase for the relevant areas.
3. If product/design decisions are unresolved, ask one focused question at a time, with a recommended answer and its trade-off, until the decision tree is resolved. (No `grill-me` skill is installed in this project — if one is added later, prefer it here instead.)
4. If the request is still a large story/epic/backlog item, use `story-splitting` first to get independently valuable child stories.
5. Define known-good vertical slices via the `planning` skill. Default each to one trunk-based PR; load `stack-pull-requests` only when one slice needs review layers or later slices must start on the same evolving baseline before lower PRs merge.
6. If acceptance criteria or mocks are ambiguous, tighten with `find-gaps`.
7. For mechanism-reduction work, load `reduce-system-complexity` first to define the conserved contract, ledger, terminal state, and gates.
8. Write the plan into the repository's declared planning workflow, or `plans/<feature-name>.md` as the explicit fallback.
9. **Do not write any production/test code in this phase.**

**STOP.** Present the plan (goal, acceptance criteria, slice list with class and delivery shape). Ask explicitly:

> "Approve this plan? If yes, I'll start building Slice 1 now."

Do not proceed to Phase 2 on an implicit or partial yes — the human must confirm the plan itself, separately from any later commit approval.

---

## Phase 2 — Build (only after the plan is approved)

For each slice, in plan order:

1. **Delivery check** — confirm the slice's delivery mode (independent PR, or a `stack-pull-requests` member/layer) before touching code. If the working tree is dirty from something unrelated, stop and ask.
2. **Load skills for this slice's class** — behavior change → `tdd` + `testing` (+ refactoring guidance); pure refactor → applicable testing/refactoring only; reduction transition/terminal → `reduce-system-complexity` + evidence skills. Never load the full RED workflow for a pure preservation slice.
3. **Confirm acceptance criteria** — present this slice's specific, observable criteria and wait for approval before writing any code.
4. **RED → GREEN → REFACTOR** (or preservation baseline → mechanism-only change → verify) in fast increments, per `tdd`/`planning`. Run only the affected tests per increment — do not run the full suite or the mutation harness after every step.
5. **PR-readiness gate** — once this slice's boundary is otherwise done, run `mutation-testing` once for the accumulated scope (or record `N/A` with proportionate alternate evidence per `planning`).
6. **STOP.** Present what was implemented and the evidence. Ask explicitly for commit approval — never commit on an assumed yes.
7. After commit, follow the repository's PR workflow for this slice's delivery shape (open PR / push to stack layer).
8. **Between slices**: if the next slice depends on this one's PR merging first, stop and tell the human that — do not guess or fabricate a merge. Once they confirm it merged, switch to the updated default branch yourself (pull latest, branch for the next slice from there) before continuing; there is no separate `/continue` command in this project to hand off to. If the next slice can start now (unmerged sibling explicitly stacked, or fully independent of this one), say so and proceed straight into step 1 for it without waiting to be re-prompted.

Repeat until every slice in the approved plan is complete, or the human interrupts.

---

## Constraints

- Never skip: plan approval, per-slice acceptance-criteria confirmation, or commit approval. These are three distinct approval points, not one.
- Never combine two slices into one commit or one PR without the human explicitly approving that plan change first.
- No layer-cake: horizontal-only work is allowed mid-build only if the approved plan already named it as unlocking the next vertical slice, or as part of a selected reduction program's terminal state.
- If reality diverges from the plan (a slice turns out bigger, a dependency was missed), stop, explain the divergence, propose the updated plan, and wait for approval before continuing to build — do not silently adapt.
- Do not restate `planning`, `tdd`, `testing`, `mutation-testing`, `stack-pull-requests`, or `continue` logic here — load and follow them.
