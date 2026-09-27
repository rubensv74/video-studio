# Video Studio

A multi-engine, code-first platform for product videos, technical explainers, motion graphics and data-driven rendering.

## Architecture

Video Studio separates **project intent** from **render engines**:

- **Remotion** — primary deterministic/headless renderer for React-driven UI, data, SVG, audio and 3D/WebGL scenes.
- **Motion Canvas** — specialist authoring engine for diagrammatic and technical animation.
- **FFmpeg** — post-production, muxing, transcode, loudness normalization and derivative generation.
- **Shared contracts** — a neutral project manifest, design tokens, media conventions and rendering profiles.

This avoids coupling a video project to a single engine.

## Verified capabilities

- React + TypeScript + CSS
- Manifest-driven scenes
- Timed music and voice-over tracks
- Timed video clips
- SRT captions
- MP4 H.264 output
- WebM VP9/Opus derivatives
- GIF derivatives
- Numbered PNG image sequences
- Configurable FFmpeg loudness normalization
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

The bootstrap generates deterministic technical media fixtures, performs `npm ci`, type-checks both engines, renders the primary MP4, generates derivatives and verifies the full media stack.

Manual path:

```bash
npm ci
npm run fixtures:media
npm run check
npm run render -- projects/demo-product/project.json
npm run verify:render -- projects/demo-product/project.json
npm run render:derivatives -- projects/demo-product/project.json
npm run verify:media-stack -- projects/demo-product/project.json
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

A manifest can now define:

- primary output;
- semantic scenes;
- audio tracks by role;
- video tracks;
- captions;
- derivative outputs;
- loudness-normalization policy;
- data inputs.

The manifest remains the anti-lock-in boundary: render-engine code maps this neutral intent to Remotion, Motion Canvas or FFmpeg.

## Delivery status

- **VS-G01 — Multi-engine foundation:** VERIFIED
- **VS-G02 — First Verified Render:** VERIFIED
- **VS-G03 — Media Stack:** VERIFIED
- **VS-G04 — Advanced Visuals:** NEXT

Reference evidence:

- `docs/vs-g02-evidence.md`
- `docs/vs-g03-evidence.md`
