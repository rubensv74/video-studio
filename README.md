# Video Studio

A multi-engine, code-first platform for product videos, technical explainers, motion graphics and data-driven rendering.

## Architecture

Video Studio separates **project intent** from **render engines**:

- **Remotion** — primary deterministic/headless renderer for React-driven UI, data, SVG, audio and 3D/WebGL scenes.
- **Motion Canvas** — specialist authoring engine for diagrammatic and technical animation.
- **FFmpeg** — post-production, muxing, transcode, loudness normalization and derivative generation.
- **Shared contracts** — a neutral project manifest, design tokens, media conventions and rendering profiles.
- **Scale layer** — provider-neutral batch queue, deterministic cache, retention metadata and worker adapters.

This avoids coupling a video project to a single engine or cloud provider.

## Verified capabilities

- React + TypeScript + CSS
- Manifest-driven scenes
- Timed music and voice-over tracks
- Timed video clips
- SRT captions
- Animated SVG system diagrams
- Deterministic HTML Canvas scenes
- Three.js / React Three Fiber / WebGL rendering
- MP4 H.264 output
- WebM VP9/Opus derivatives
- GIF derivatives
- Numbered PNG image sequences
- Configurable FFmpeg loudness normalization
- Scene-level QA still extraction
- Project scaffolding from presets
- 16:9, 9:16 and 1:1 physical render presets
- Runtime theme packs
- Reusable scene registry and transitions
- Inline, local JSON and HTTP JSON data adapters
- Manifest-driven batch rendering
- Controlled queue concurrency
- Failure isolation
- Deterministic render cache
- Cache integrity verification
- Retention/expiry metadata
- Local and provider-neutral HTTP worker adapters
- JSON batch reporting
- CI-ready headless rendering
- Multi-engine source architecture

See `docs/capability-matrix.md` for the complete capability map.

## First run

Prerequisites:

- Node.js 20+
- npm
- FFmpeg and ffprobe available in PATH

Windows PowerShell:

```powershell
./scripts/bootstrap-windows.ps1
```

Linux/macOS:

```bash
./scripts/bootstrap-unix.sh
```

## Create a new project

```bash
npm run create:project -- \
  --id my-video \
  --title "My Video" \
  --preset portrait-9x16 \
  --theme blueprint-cyan
```

Available presets:

- `landscape-16x9` — 1920x1080
- `portrait-9x16` — 1080x1920
- `square-1x1` — 1080x1080

Available verified themes:

- `default-dark`
- `blueprint-cyan`

## Batch rendering and cache

A batch is independent from the project manifest contract.

Example:

```bash
npm run render:batch -- batches/productization-ci.json \
  --clear-cache \
  --report output/scale/batch-first.json

npm run render:batch -- batches/productization-ci.json \
  --report output/scale/batch-second.json

npm run verify:scale-report -- \
  output/scale/batch-first.json \
  output/scale/batch-second.json
```

The first execution physically renders cache misses. A repeated execution with unchanged inputs verifies output integrity and reuses deterministic cache records.

## Rendering

Manual media-stack path:

```bash
npm ci
npm run fixtures:media
npm run check
npm run render -- projects/demo-product/project.json
npm run verify:render -- projects/demo-product/project.json
npm run render:derivatives -- projects/demo-product/project.json
npm run verify:media-stack -- projects/demo-product/project.json
```

Advanced visual demo:

```bash
npm run render:advanced
npm run verify:render -- projects/advanced-visuals-demo/project.json
npm run extract:advanced-qa
npm run verify:advanced-qa
```

## Studios

Remotion Studio:

```bash
npm run dev:remotion
```

Motion Canvas specialist editor:

```bash
npm run dev:motion-canvas
```

Motion Canvas is retained as the specialist editor for technical/diagrammatic motion. It is not the CI-critical renderer because the upstream project does not currently expose the same stable headless contract as Remotion.

## Project manifests

Projects live under `projects/<project-id>/project.json`.

A manifest can define:

- primary output;
- semantic scenes;
- theme;
- audio tracks by role;
- video tracks;
- captions;
- derivative outputs;
- loudness-normalization policy;
- inline data;
- local JSON data;
- HTTP JSON endpoints.

The manifest remains the anti-lock-in boundary.

## Delivery status

- **VS-G01 — Multi-engine foundation:** VERIFIED
- **VS-G02 — First Verified Render:** VERIFIED
- **VS-G03 — Media Stack:** VERIFIED
- **VS-G04 — Advanced Visuals:** VERIFIED
- **VS-G05 — Productization:** VERIFIED
- **VS-G06 — Scale:** VERIFIED

The original foundation roadmap G01–G06 is now closed.

Reference evidence:

- `docs/vs-g02-evidence.md`
- `docs/vs-g03-evidence.md`
- `docs/vs-g04-evidence.md`
- `docs/vs-g05-evidence.md`
- `docs/vs-g06-evidence.md`
