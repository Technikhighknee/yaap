# Yet another ambitious project  
> It's a simulation! An ambitious one! Yay!

## CI workflow policy

Normal development branches, pull requests and pushes to `main` do not run CI automatically. Repository workflows are `workflow_dispatch` only.

Each active feature branch may have exactly one companion CI branch. For example, `feat/embedded-place-layers` uses `ci/embedded-place-layers`.

When a CI run is wanted:

1. Force-update that existing CI branch to the exact current feature-branch head.
2. On the CI branch only, add one workflow commit that enables a `push` trigger scoped only to that CI branch.
3. Run and inspect CI.
4. For the next validation run, reuse the same CI branch: force-update it again to the new feature head, discarding the previous CI-only commit, then add the single CI workflow commit again.
5. After the feature branch is merged, delete its CI branch.

Do not create numbered or throwaway CI branches for subsequent runs. Do not merge the CI-only workflow commit into `main`.

This keeps the tested revision explicit while avoiding one-run-per-commit CI noise and CI-branch sprawl.
