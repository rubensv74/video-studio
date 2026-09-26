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
- FFmpeg and ffprobe available in PATH

The recommended path is the end-to-end bootstrap because it does not stop at compilation: it renders and verifies the media file.

Windows PowerShell:

```powershell
./scripts/bootstrap-windows.ps1
```

Linux/macOS:

```bash
./scripts/bootstrap-unix.sh
```

Manual path:

```bash
npm install
npm run check
npm run render -- projects/demo-product/project.json
npm run verify:render -- projects/demo-product/project.json
```

Expected output:

```text
output/remotion-demo.mp4
package-lock.json
```

Remotion Studio:

```bash
npm run dev:remotion
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

The orchestrator validates the manifest and dispatches to the selected engine. For Remotion, the manifest is passed through `--props`, `calculateMetadata()` derives physical video metadata from it, and scene implementations consume the same semantic payload.

## Status

### VS-G01 — Multi-engine foundation

Source contract verified:

- [x] Engine-neutral project contract
- [x] Manifest-driven Remotion metadata and scene payloads
- [x] Motion Canvas specialist workspace
- [x] FFmpeg post-processing entry point
- [x] Environment, manifest and dependency validation
- [x] Dependency-free smoke gate
- [x] Rendered-media verifier tested with positive and negative FFmpeg fixtures
- [x] CI workflow defined
- [x] Capability, licensing, dependency and gate documentation
- [x] Permanent repository established: `rubensv74/video-studio`

### VS-G02 — First Verified Render

Still required:

- [ ] Resolve GitHub-hosted runner allocation or use a network-enabled local runner
- [ ] `npm install`
- [ ] Generate and commit `package-lock.json`
- [ ] TypeScript checks against installed dependencies
- [ ] Physical Remotion H.264 render
- [ ] Media-contract verification against the real Remotion output
- [ ] GitHub Actions artifact

Current CI blocker is tracked in issue #2.

See `docs/gates.md` and `docs/rendering.md` for the exact exit criteria.
