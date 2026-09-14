# Contributing

## Workflow
- Branch off `main`: `feature/short-name` or `fix/short-name`.
- One PR per issue. Put `Closes #12` in the PR description so merging auto-closes it.
- Small PRs over big ones — easier to review with two people.

## Issues
- File one for anything non-trivial: bug, feature, chore.
- Label priority: `priority:high` (blocks launch), `priority:medium`, `priority:low`.
- Put launch-blocking work in the `Launch` milestone.

## Board
Track work on the repo's [Project board](../../projects) — columns: Backlog, In Progress, Review, Done. Drag issues across as they move; linked PRs update them automatically on merge.

## Local dev
Site is static HTML/CSS/JS, deployed via GitHub Pages. Open `index.html` directly or serve the folder locally — no build step.
