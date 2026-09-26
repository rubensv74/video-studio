# Delivery gates

## VS-G01 — Multi-engine foundation

**Status: IMPLEMENTED — PR #1 open; runtime validation pending**

Validated at repository/source level:

- repository structure;
- JSON manifests;
- neutral engine contract;
- Remotion input-prop path from `project.json`;
- manifest-driven Remotion metadata: width, height, FPS and total duration;
- manifest-driven Remotion semantic scene payloads;
- Motion Canvas project aligned with the official `@motion-canvas/2d/tsconfig.project.json` base;
- Motion Canvas specialist project source;
- FFmpeg and ffprobe tooling scripts;
- manifest validation and render dispatcher scripts;
- CI workflow structure.

Runtime evidence still required:

- npm dependency resolution;
- TypeScript compilation against installed packages;
- first physical MP4 render;
- generated `package-lock.json` committed after dependency resolution.

### Current CI infrastructure observation

GitHub Actions run #1 was triggered successfully by PR #1, but attempts 1 and 2 both terminated before a runner was assigned: `runner_id=0` and no workflow steps were started. Therefore those failures do **not** yet constitute evidence of a source, npm, TypeScript or render failure. The runner-level condition must be resolved or bypassed before VS-G02 can be evaluated in GitHub Actions.

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
