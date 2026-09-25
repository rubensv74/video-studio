# Delivery gates

## VS-G01 — Multi-engine foundation

**Status: IMPLEMENTED — repository integration in progress**

Validated locally without third-party dependency installation:

- repository structure;
- JSON manifests;
- neutral engine contract;
- manifest-driven Remotion reference composition metadata and scene timing;
- Motion Canvas specialist project source;
- FFmpeg and ffprobe availability;
- manifest validation and render dispatcher scripts;
- CI workflow structure.

Pending repository/CI evidence:

- npm dependency resolution;
- TypeScript compilation against installed packages;
- first physical MP4 render;
- generated `package-lock.json` committed after dependency resolution.

## VS-G02 — First verified render

Exit criteria:

1. `npm install` succeeds.
2. A lockfile is generated and committed.
3. `npm run check` passes, including both TypeScript workspaces.
4. `npm run render:remotion` produces `output/remotion-demo.mp4`.
5. `npm run probe -- output/remotion-demo.mp4` verifies H.264, 1920x1080 and the expected duration.
6. The GitHub Actions workflow reproduces the render and stores the MP4 as an artifact.

## VS-G03 — Media stack

Add and verify voice-over, music, captions, video clips, image sequences, WebM/GIF derivatives and loudness normalization.

## VS-G04 — Advanced visuals

Add and verify SVG motion primitives, technical diagrams, Canvas scenes and Three.js/WebGL scenes.

## VS-G05 — Productization

Add project templates, brand packs, reusable motion components, data/API adapters and a project scaffolder.

## VS-G06 — Scale

Add batch rendering, render queues, caching, cloud workers and artifact retention without changing the project manifest contract.
