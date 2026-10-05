# Yet another ambitious project  
> It's a simulation! An ambitious one! Yay!

## CI workflow policy

Normal development branches, pull requests and pushes to `main` do not run CI automatically. The repository workflow is `workflow_dispatch` only.

When a CI run is wanted, create a temporary `ci/<purpose>` branch from the exact commit or branch to validate. On that CI branch only, add a `push` trigger scoped to that branch, push the CI-only workflow commit, and let GitHub Actions validate the code. Do not merge the CI-only workflow change into `main`; delete the temporary CI branch after the result has been inspected.

This keeps feature branches free of one-run-per-commit CI noise while still making the tested code revision explicit.
