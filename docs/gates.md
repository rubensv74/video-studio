# Delivery gates

## VS-G01 — Multi-engine foundation

**Status: VERIFIED — merged through PR #1**

Verified:

- neutral project manifest;
- Remotion production renderer;
- Motion Canvas specialist workspace;
- FFmpeg/ffprobe tooling;
- source-contract smoke tests;
- dependency alignment;
- CI workflow.

## VS-G02 — First verified render

**Status: VERIFIED — merged through PR #3**

Verified from a clean GitHub-hosted runner:

- committed npm lockfile;
- deterministic `npm ci`;
- both TypeScript workspaces;
- physical H.264 render;
- strict 1920x1080 / 30 FPS / 10 s media contract;
- GitHub Actions artifact.

See `docs/vs-g02-evidence.md`.

## VS-G03 — Media stack

**Status: VERIFIED — merged through PR #5**

Verified:

- timed audio tracks;
- timed video track;
- SRT captions;
- WebM VP9/Opus;
- GIF;
- PNG sequence;
- loudness-normalized MP4;
- strict media-stack verification;
- retained CI artifacts.

See `docs/vs-g03-evidence.md`.

## VS-G04 — Advanced visuals

**Status: VERIFIED — merged through PR #9**

Verified:

- animated SVG;
- deterministic HTML Canvas;
- Three.js / React Three Fiber / WebGL;
- specialist Motion Canvas TypeScript path;
- physical H.264 advanced-visual render;
- scene-level PNG QA evidence.

See `docs/vs-g04-evidence.md`.

## VS-G05 — Productization

**Status: VERIFIED — merged through PR #11**

Verified:

- project scaffolder CLI;
- manifest validation for generated projects;
- physical 16:9 render;
- physical 9:16 render;
- physical 1:1 render;
- `default-dark` and `blueprint-cyan` theme packs;
- runtime theme application;
- physical theme-pixel verification;
- reusable scene registry;
- reusable transition primitive used in physical renders;
- inline + local JSON data adapter;
- HTTP JSON API adapter;
- deterministic local API test;
- CI artifact retention for generated projects.

Reference run: `36309618945`.

Theme evidence:

```text
PASS runtime theme: blueprint-cyan
PASS expected accent: rgb(0,200,255)
PASS sampled accent: rgb(0,202,255)
```

Artifact:

- ID: `10928189933`;
- size: `14,797,687 bytes`;
- digest: `sha256:080e83ae68de91c0b75f5882fea773c56488ff19f4cca3c8d7d2f606a165770f`.

See `docs/vs-g05-evidence.md`.

## VS-G06 — Scale

**Status: NEXT**

Add and verify:

- manifest-driven batch rendering;
- render queue contract;
- deterministic cache keys;
- cache-aware render execution;
- controlled concurrency;
- artifact-retention metadata;
- cloud-worker adapter boundary;
- batch summary/reporting;
- regression-proof operation without changing the neutral project manifest.
