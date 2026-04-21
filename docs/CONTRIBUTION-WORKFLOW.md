# Contribution Workflow

This is the maintained fork workflow for `/home/drj/nerve`.

Use it when a fix or feature is first developed and tested on local `dev`, but the final upstream contribution needs to be rebuilt on a clean branch based on freshly updated upstream `master`.

## Goals

- keep day-to-day local work fast on `dev`
- keep upstream PRs based on fresh upstream `master`
- give bot reviews a stable lane on the fork before opening upstream PRs
- keep `fork/master` usable as a clean integration branch instead of a pile of unrelated local work

## Branch Roles

- `dev`
  - long-lived local integration branch
  - may intentionally drift from upstream `master`
  - safe place for exploratory implementation and manual testing
- `master`
  - local mirror of `origin/master`
  - should be fast-forwarded from upstream before new contribution branches are created
- `fork/master`
  - temporary fork integration branch for bot-reviewed candidates
  - should stay synced to upstream except while a single candidate contribution is active
- contribution branch, for example `fix/mobile-inline-select-clickthrough`
  - short-lived branch created from freshly updated local `master`
  - contains only the upstreamable fix

## Standard Flow

### 1. Build and test on `dev`

Implement the fix on `dev` and test it manually there first.

Examples:

```bash
git switch dev
npm run build
systemctl --user restart nerve.service
```

At this stage, optimize for local iteration and manual validation, not upstream branch purity.

### 2. Refresh `master` from upstream

Before preparing the real contribution branch:

```bash
git fetch origin master
git branch -f master origin/master
```

Confirm `master` and `origin/master` match before branching.

### 3. Create a fresh contribution branch from updated `master`

Prefer an isolated worktree so local `dev` work stays untouched:

```bash
git worktree add ~/.config/superpowers/worktrees/nerve/<branch-name> -b <branch-name> master
cd ~/.config/superpowers/worktrees/nerve/<branch-name>
```

Examples:

```bash
git worktree add ~/.config/superpowers/worktrees/nerve/fix/mobile-inline-select-clickthrough \
  -b fix/mobile-inline-select-clickthrough master
```

### 4. Port only the intended fix from `dev`

Use the narrowest porting path that keeps the branch reviewable:

- If the fix is already committed cleanly on `dev`:

```bash
git cherry-pick -x <commit-from-dev>
```

- If the fix is still uncommitted on `dev`:
  - copy only the touched file slices
  - or generate/apply a narrow patch

Do not bring unrelated `dev` changes into the contribution branch.

### 5. Run the full contributor verification suite

Run this in the fresh master-based contribution branch:

```bash
npm run lint
npm run build
npm run build:server
npm test -- --run
```

If any command fails, fix it here before publishing.

### 6. Commit cleanly

Follow upstream contributor guidance:

- use Conventional Commits
- keep the branch focused
- add a regression test for bug fixes when feasible

Example:

```bash
git commit -m "fix(ui): prevent mobile dropdown click-through"
```

### 7. Push to the fork and open a review PR against `fork/master`

Default bot-review lane:

```bash
git push -u fork <branch-name>
```

Then open a draft PR:

- base: `DrJLabs/openclaw-nerve:master`
- head: `DrJLabs:<branch-name>`

This gives the fork PR a stable place for bot review and incremental fixes before the upstream PR exists.

### 8. Clean up the commit stack before upstream PR

If the branch has more than 2 meaningful commits, squash/rebase before the upstream PR:

```bash
git rebase -i fork/master
git push --force-with-lease
```

Target state:

- one clean fix commit when practical
- two commits max if separating prod code and tests/doc updates materially improves review clarity

### 9. Merge into `fork/master`

Once the fork PR is reviewed and the branch is clean, merge it into `fork/master`.

Recommended:

- squash merge if the branch still has multiple commits
- regular merge only when preserving a small, well-structured commit stack is useful

### 10. Open the upstream PR

After `fork/master` contains exactly the reviewed candidate delta, open:

- base: `daggerhashimoto/openclaw-nerve:master`
- head: `DrJLabs:master`

At this stage, follow `CONTRIBUTING.md` closely:

- keep the PR focused
- fill out the PR template fully
- include tests
- include screenshots for UI changes when useful

## Fork Master Hygiene

`fork/master` should not become a second long-lived development branch.

Rules:

- sync `fork/master` to upstream before starting a new candidate contribution
- keep only one active upstream candidate on `fork/master` at a time
- after the upstream PR merges or is abandoned, re-sync `fork/master` to upstream `master`

Typical cleanup:

```bash
git fetch origin master
git branch -f master origin/master
git push fork master:master
```

## Decision Rules

Use this quick chooser:

- Need fast local iteration or manual UI validation? Work on `dev`.
- Need a clean upstreamable branch? Start from freshly updated `master`.
- Need bot review before upstream? Open the fork PR into `fork/master`.
- Need the final upstream contribution? Open it from `DrJLabs:master` into upstream `master` after `fork/master` contains only the reviewed candidate.

## References

- Upstream contribution rules: [`../CONTRIBUTING.md`](../CONTRIBUTING.md)
- Docs index: [`./README.md`](./README.md)
- Agent-facing workflow rules: [`../AGENTS.md`](../AGENTS.md)
