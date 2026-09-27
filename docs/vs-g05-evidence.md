# VS-G05 — Productization Evidence

## Result

**VERIFIED**

VS-G05 converts Video Studio from a set of reference compositions into a reusable project factory.

## Reference run

- Workflow: `Render demo`
- Run ID: `36309618945`
- Branch: `program/vs-g05-productization`
- PR: #11
- Result: PASS

## Scaffolder

The project scaffolder creates manifests without manual JSON editing.

Verified presets:

```text
PASS scaffold landscape-16x9: 1920x1080
PASS scaffold portrait-9x16: 1080x1920
PASS scaffold square-1x1: 1080x1080
```

All generated projects pass the shared manifest validator.

## Physical preset renders

CI renders and verifies all three generated projects:

- landscape: 1920x1080;
- portrait: 1080x1920;
- square: 1080x1080;
- H.264;
- 30 FPS;
- non-zero media size.

Result:

```text
PASS VS-G05 scaffolded preset renders
```

## Runtime themes

Two theme packs are available:

- `default-dark`;
- `blueprint-cyan`.

The portrait preset uses `blueprint-cyan`. CI samples a deterministic accent strip from the physical H.264 output and compares it with the declared theme color.

Evidence:

```text
PASS runtime theme: blueprint-cyan
PASS expected accent: rgb(0,200,255)
PASS sampled accent: rgb(0,202,255)
PASS VS-G05 runtime theme render contract
```

The small difference is consistent with H.264 color conversion/compression and remains inside the verifier tolerance.

## Reusable composition primitives

Verified in the same physical rendering pipeline:

- shared scene registry;
- shared fade/translate scene transition;
- theme provider;
- theme-aware cards/stages.

Both the primary and advanced-visual compositions remain green after the refactor.

## Data adapters

Verified data sources:

```text
PASS JSON data adapter
PASS HTTP JSON data adapter
PASS VS-G05 productization source contract
```

The HTTP adapter is tested against an ephemeral `127.0.0.1` JSON server during CI, avoiding external network dependencies while still exercising a real HTTP request/response path.

## Artifact

- Name: `video-studio-demo`
- Artifact ID: `10928189933`
- Size: `14,797,687 bytes`
- Digest:
  `sha256:080e83ae68de91c0b75f5882fea773c56488ff19f4cca3c8d7d2f606a165770f`

The artifact includes the existing regression outputs plus the generated productization MP4s.

## Gate conclusion

VS-G05 is closed. The next delivery gate is:

**VS-G06 — Scale**
