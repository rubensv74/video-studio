# Runner diagnostic — CI-G01

## Purpose

This document records the evidence for the GitHub Actions runner-allocation blocker affecting VS-G02.

The goal is to distinguish:

- a project/workflow defect;
- an operating-system runner-image defect;
- a GitHub platform incident;
- a repository/account-level restriction.

## Evidence

The normal `Render demo` workflow repeatedly triggers but terminates before any step begins.

Observed job state:

```text
runner_id = 0
runner_name = ""
steps = []
conclusion = failure
```

Because `actions/checkout` never starts, these failures cannot be attributed to:

- npm;
- TypeScript;
- FFmpeg;
- Remotion;
- Motion Canvas;
- repository source code.

## Cross-platform control test

PR #3 adds `.github/workflows/runner-diagnostic.yml`.

It runs two deliberately minimal jobs:

- `ubuntu-latest`;
- `windows-latest`.

Both jobs fail before runner allocation with the same signature:

```text
runner_id = 0
runner_name = ""
steps = []
```

This rules out an Ubuntu-specific image problem.

## Platform-status control

At the time of this investigation, GitHub's public status summary reports GitHub Actions as operational.

That does not prove the user account is correctly configured. It does reduce the likelihood that this repository is merely observing a platform-wide Actions outage.

## Most likely remaining boundary

The unresolved boundary is repository/account-level eligibility for hosted runners.

Check in the GitHub UI:

1. Repository → **Settings**.
2. **Actions → General**.
3. Confirm Actions are enabled for the repository.
4. Confirm the repository may use GitHub-hosted runners/actions required by the workflow.
5. Account → **Settings → Billing and licensing / Billing**.
6. Review Actions usage, included minutes, budgets/spending limits, payment restrictions and any account-level usage block.
7. If an organization owns the repository in the future, also review organization Actions policies and runner policies.

Do not treat any of these as the root cause until the UI shows evidence.

## Recovery proof

The blocker is considered resolved only when a diagnostic job shows:

```text
runner_id > 0
steps.length > 0
```

The first step must actually start.

After that, rerun the VS-G02 render workflow and continue with the next real failure, if any.

## VS-G02 remains stricter

Restoring runner allocation alone does not close VS-G02.

VS-G02 requires:

1. `npm install`;
2. generated `package-lock.json`;
3. `npm run check`;
4. physical Remotion H.264 render;
5. `npm run verify:render -- projects/demo-product/project.json`;
6. workflow artifacts containing the real MP4 and lockfile.
