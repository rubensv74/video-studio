# Runner diagnostic — CI-G01

## Status

**RESOLVED**

The repository was changed from private to public. After that change, GitHub-hosted standard runners were allocated successfully without relying on the exhausted private-repository Actions allowance.

## Original symptom

While the repository was private, the normal `Render demo` workflow repeatedly terminated before any step began:

```text
runner_id = 0
runner_name = ""
steps = []
conclusion = failure
```

The account had:

- 2,000 / 2,000 included private-repository Actions minutes consumed;
- Actions budget = $0;
- Stop usage = Yes.

## Recovery proof

After the repository became public, the same diagnostic was rerun without changing the job commands.

Both hosted runners were allocated and completed successfully:

- `ubuntu-latest` -> PASS;
- `windows-latest` -> PASS.

The render workflow then also received a hosted Ubuntu runner and progressed through checkout, dependency installation, TypeScript validation and physical rendering.

## Operational decision

`runner-diagnostic.yml` remains available only through `workflow_dispatch`.

It no longer runs on every pull request because runner availability has been proven and there is no value in consuming duplicate CI capacity.

## Public-repository operating model

Video Studio now uses standard GitHub-hosted runners for its public repository CI path.

The project should still keep:

- deterministic dependency pins;
- a committed lockfile;
- strict source-contract validation;
- strict rendered-media verification;
- artifacts for reference renders.

Runner availability is no longer part of the VS-G02 blocker.
