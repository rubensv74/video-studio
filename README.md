# Video Studio

A multi-engine, code-first platform for product videos, technical explainers, motion graphics and data-driven rendering.

## Architecture

Video Studio separates **project intent** from **render engines**:

- **Remotion** — primary deterministic/headless renderer for React-driven UI, data, SVG, audio and 3D/WebGL scenes.
- **Motion Canvas** — specialist authoring engine for diagrammatic and technical animation.
- **FFmpeg** — post-production, muxing, transcode, audio normalization and format conversion.
- **Shared contracts** — a neutral project manifest, design tokens, media conventions and rendering profiles.

This avoids coupling a video project to a single engine.

## Capabilities targeted

- React + TypeScript + CSS
- SVG and vector animation
- Canvas / diagram animation
- WebGL / Three.js / React Three Fiber
- Images and screenshots
- Video clips
- Audio, music and voice-over
- Captions/subtitles
- Timelines, scenes and transitions
- Reusable motion components
- JSON / API-driven content
- Landscape, portrait and square formats
- MP4 / WebM / GIF / image sequences / stills
- Local rendering and CI-ready headless rendering
- FFmpeg post-production pipeline
- Multi-brand themes and multi-project reuse

See `docs/capability-matrix.md` for status and engine ownership.

## First run

Prerequisites:

- Node.js 20+
- npm
- FFmpeg available in PATH for post-processing and Motion Canvas video export

```bash
npm install
npm run check
npm run dev:remotion
```

Remotion Studio will show the included `ProductDemo` composition.

Render the reference composition:

```bash
npm run render:remotion
```

Expected output:

```text
output/remotion-demo.mp4
```

Motion Canvas specialist editor:

```bash
npm run dev:motion-canvas
```

Use its Render panel with the FFmpeg exporter. Headless Motion Canvas automation is deliberately **not** part of the foundation contract because the upstream project still lacks a documented stable CLI for it.

## Project manifests

Projects live under `projects/<project-id>/project.json` and describe output geometry, engine preference, theme, scenes, audio and data inputs independently from implementation.

```bash
npm run render -- projects/demo-product/project.json
```

The current orchestrator validates the manifest and dispatches to the selected engine. The reference Remotion composition consumes manifest output metadata, scene durations and semantic payloads; the demo project uses Remotion.

## Status

Foundation Gate `VS-G01`:

- [x] Engine-neutral project contract
- [x] Remotion reference composition source
- [x] Motion Canvas specialist workspace
- [x] FFmpeg post-processing entry point
- [x] Environment and manifest validation
- [x] CI workflow skeleton with PR validation
- [x] Capability and licensing documentation
- [ ] Install dependencies and execute first physical render on a network-enabled workstation/runner
- [ ] Generate and commit `package-lock.json` after the first successful install
- [x] Permanent repository established: `rubensv74/video-studio`

The next real gate is `VS-G02 — First Verified Render`.
