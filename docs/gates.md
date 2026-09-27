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

**Status: VERIFIED — PR #5**

### Timed media tracks

The neutral project manifest now supports:

- voice-over;
- music;
- SFX;
- ambient audio;
- video clips;
- SRT captions;
- inline caption cues.

Track contracts include timeline placement and media-specific controls such as duration, trims, volume, looping, video fit/layout and caption styling.

### Deterministic fixture strategy

CI generates its own technical media:

- AAC music tone;
- AAC voice-over placeholder tone;
- H.264 test clip;
- SRT subtitle file.

The fixture strategy proves routing, timing, decoding, mixing and caption ingestion without external services or copyrighted media.

### Verified primary media

The reference Remotion render passed with:

- H.264 primary video;
- AAC audio stream;
- 48 kHz sample rate;
- manifest-driven video overlay;
- manifest-driven SRT captions.

Independent visual QA extracted a frame at 4 s from the successful artifact and confirmed that the base scene, generated video clip and active SRT subtitle were visible simultaneously.

### Verified derivatives

CI verified:

- WebM: VP9 video + Opus audio;
- GIF: GIF codec;
- PNG sequence: 10 numbered PNG frames at 640 px;
- normalized MP4 with measured integrated loudness of **-15.98 LUFS** for a configured target of **-16 LUFS**.

### Reference execution

- workflow run: `36300093257`;
- commit: `cde2c33b2bcfbb6f8a4d56fe230f8036ed4d11a6`;
- artifact: `video-studio-demo`;
- artifact ID: `10925034371`;
- artifact ZIP digest:
  `sha256:e96ad28413f630b5a1c70fbc1824d2b7594c179287d334b6b0fa755317abdaf8`.

See `docs/vs-g03-evidence.md`.

## VS-G04 — Advanced visuals

**Status: NEXT**

Add and verify:

- reusable SVG motion primitives;
- Canvas visual components;
- engineering/architecture diagram scenes;
- Three.js / React Three Fiber / WebGL scenes;
- still-frame visual QA;
- reusable transition primitives.

## VS-G05 — Productization

Add project templates, brand packs, reusable motion components, data/API adapters and a project scaffolder.

## VS-G06 — Scale

Add batch rendering, render queues, caching, cloud workers and artifact retention without changing the project manifest contract.
