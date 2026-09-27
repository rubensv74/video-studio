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

**Status: VERIFIED — PR #9**

### Physical rendering paths

The independent `advanced-visuals-demo` composition proves three advanced paths in one H.264 render:

1. animated SVG system-flow scene;
2. deterministic HTML Canvas telemetry scene;
3. Three.js / React Three Fiber / WebGL industrial-asset scene.

The project remains manifest-driven through:

```text
projects/advanced-visuals-demo/project.json
```

### Specialist Motion Canvas path

The Motion Canvas workspace remains inside the normal TypeScript gate and continues to provide the specialist authoring path for engineering diagrams. It is intentionally not required for CI-critical headless video rendering.

### Verified media contract

Reference run `36304477408` produced:

- H.264 High profile;
- 1920x1080;
- 30 FPS;
- 9.00 s duration;
- physical render from Remotion 4.0.528.

### Scene QA evidence

CI extracts one midpoint PNG from each scene and verifies PNG codec, 1920x1080 geometry and non-trivial file size.

Reference QA sizes:

- `svg-flow.png`: 428,767 bytes;
- `canvas-telemetry.png`: 732,439 bytes;
- `three-asset.png`: 358,239 bytes.

Artifact:

- ID: `10926876837`;
- size: `7,846,606 bytes`;
- digest: `sha256:c2ddbf50401407f6128519a3a977bcb69805f3e7863cf376a3b45efcfd7786b0`.

See `docs/vs-g04-evidence.md`.

## VS-G05 — Productization

**Status: NEXT**

Add and verify:

- reusable project templates;
- brand/theme packs;
- reusable motion-component registry;
- project scaffolder;
- data/API adapters;
- manifest presets for 16:9 / 9:16 / 1:1;
- stronger transition primitives.

## VS-G06 — Scale

Add batch rendering, render queues, caching, cloud workers and artifact retention without changing the project manifest contract.
