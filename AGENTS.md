# AGENTS.md

## Scope

Applies to the whole `/home/drj/nerve` repo.

## Contribution Workflow

- Treat `dev` as the persistent local integration branch for exploratory implementation and manual testing.
- Manual QA happens on `dev` first. Do not assume `dev` matches upstream `master`.
- Before preparing an upstream contribution, fetch `origin` and fast-forward local `master` to `origin/master`.
- Create a fresh contribution branch from the updated `master`, preferably in an isolated worktree under `~/.config/superpowers/worktrees/nerve/<branch>`.
- Port only the intended fix from `dev` into that fresh master-based branch. Do not drag unrelated `dev` state into the contribution branch.
- Prefer the narrowest porting method that preserves review clarity:
  - committed fix on `dev`: `git cherry-pick -x <commit>`
  - uncommitted fix on `dev`: copy the minimal patch or file slice surgically
- Run the full contributor verification suite in the master-based contribution branch before publishing:
  - `npm run lint`
  - `npm run build`
  - `npm run build:server`
  - `npm test -- --run`
- Push contribution branches to `fork`, not directly to `origin`.
- Default review lane:
  1. Open a draft PR from the contribution branch into `fork/master` for bot review.
  2. Address review feedback on the same branch.
  3. If the branch has more than 2 meaningful commits, squash/rebase it before the upstream PR.
  4. Merge the reviewed branch into `fork/master`.
  5. Open the upstream PR from `DrJLabs:master` to `daggerhashimoto:master`.
- Keep `fork/master` clean:
  - sync it to upstream before starting a new upstreamable fix
  - use it for one active upstream candidate at a time
  - after the upstream PR merges or is abandoned, re-sync `fork/master` to upstream `master`

## Practical Rules

- Follow `CONTRIBUTING.md` for commit style, validation, and PR template requirements.
- Use conventional commits.
- Bug fixes should include a regression test when feasible.
- Keep PRs focused. If the contribution branch starts collecting unrelated edits, stop and split them out before pushing.
- Do not rewrite or clean up `dev` as part of preparing an upstream branch unless the user explicitly asks for that cleanup.

## References

- Human-facing workflow: `docs/CONTRIBUTION-WORKFLOW.md`
- Upstream contributor rules: `CONTRIBUTING.md`
