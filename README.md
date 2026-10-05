# Yet another ambitious project  
> It's a simulation! An ambitious one! Yay!

## CI workflow policy

Normal development branches, pull requests and pushes to `main` do not run CI automatically. Repository workflows are `workflow_dispatch` only.

Each repository has exactly one persistent CI branch named `CI`. The same branch is reused for every CI run, regardless of which development branch or commit is being tested.

When a CI run is wanted:

1. Force-update `CI` to the exact commit that should be tested, discarding any previous CI-only workflow commit.
2. On `CI` only, add one workflow commit that enables a `push` trigger scoped only to `CI`.
3. Run and inspect CI.
4. For the next validation run, repeat the process from the new target commit.

Do not create feature-specific, numbered or throwaway CI branches. Do not merge the CI-only workflow commit into `main` or any development branch. The `CI` branch is persistent and is not deleted after feature merges.

This keeps one stable CI branch per repository while making the tested revision explicit and preventing CI-branch sprawl.
