# Contributing

Open a pull request for every change and keep the merge decision with the
repository maintainer. Bots may prepare changes and evidence; the human performs
review and merge manually. Leave auto-merge disabled.

The `MVP validation` workflow runs on every pull request, including changes only
to documentation. Before merging, wait for both GitHub Actions checks:

- `validate`: validates the pull request's head commit.
- `validate (merge)`: validates its temporary merge with the base branch.

Both checks run the existing MVP tests, lint, build, typecheck, local HTTP checks,
and Chromium browser tests. After updating a pull request, check the results for
its latest commit. Resolve merge conflicts and outstanding review conversations
before merging; update the branch when GitHub requires it.

Green CI is evidence for review, not permission for a bot to merge or deploy.
The manual isolated preview workflow and path-filtered speaker-site checks are
separate checks and should not be required for every pull request.
