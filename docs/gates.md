# Delivery gates

## VS-G01 — Multi-engine foundation

**Status: SOURCE CONTRACT VERIFIED — PR #1 open; physical render pending**

Verified at repository/source level:

- repository structure;
- JSON manifests;
- neutral engine contract;
- Remotion input-prop path from `project.json`;
- manifest-driven Remotion metadata: width, height, FPS and total duration;
- manifest-driven Remotion semantic scene payloads;
- local-vs-global frame timing reconciled for sequenced scenes;
- Motion Canvas project aligned with the official `@motion-canvas/2d/tsconfig.project.json` base;
- Motion Canvas FFmpeg exporter configuration;
- FFmpeg and ffprobe tooling scripts;
- manifest validation and render dispatcher scripts;
- dependency alignment contract;
- dependency-free source smoke gate;
- strict rendered-media verifier;
- Windows and Unix end-to-end bootstrap scripts;
- CI workflow structure.

### Reproduced source-contract evidence

The current PR source was reconstructed outside GitHub Actions and the following passed:

- `node scripts/smoke-foundation.mjs`;
- `node scripts/verify-dependency-contract.mjs`.

Verified assertions include:

- manifest validation;
- demo timing = 10 seconds / 300 frames;
- manifest -> Remotion `--props` render plan;
- `calculateMetadata()` owns width, height, FPS and duration;
- `ProductDemo` consumes manifest scenes;
- Remotion family alignment at 4.0.528;
- Remotion official 3D dependency baseline;
- Motion Canvas family alignment at 3.17.2;
- official Motion Canvas TypeScript base;
- Motion Canvas FFmpeg exporter configuration.

### Render-verifier evidence

`scripts/verify-render.mjs` was exercised independently with FFmpeg-generated fixtures:

**Positive fixture**

- H.264;
- 1920x1080;
- 30 FPS;
- 10.000 s;
- non-zero file size.

Result: **PASS**.

**Negative fixture**

- 1280x720;
- 24 FPS;
- 2.000 s.

Result: **FAIL**, correctly reporting width, height, FPS and duration mismatches.

This proves the verifier is not a permissive probe; it rejects media that violates the manifest contract. It does **not** substitute for the required Remotion render.

### Dependency evidence

The Remotion 4.0.528 package family exists upstream and the 3D pins match Remotion's official `template-three` at `v4.0.528`.

The Motion Canvas 3.17.2 baseline exists upstream; its official starter uses Vite 4.x.

See `docs/dependency-baseline.md`.

### Current CI infrastructure observation

GitHub Actions runs #1 through #5 were triggered successfully by PR #1, but terminated before a runner was assigned: `runner_id=0`, empty runner name and no workflow steps. Therefore those failures are not evidence of a source, npm, TypeScript or render failure.

Tracked separately in issue #2: **CI-G01 — GitHub Actions runner not allocated**.

Runtime evidence still required:

- npm dependency resolution;
- TypeScript compilation against installed packages;
- first physical Remotion MP4 render;
- rendered-media contract verification against that Remotion output;
- generated `package-lock.json` committed after dependency resolution.

## VS-G02 — First verified render

Exit criteria:

1. `npm install` succeeds.
2. A lockfile is generated and committed.
3. `npm run check` passes, including both TypeScript workspaces.
4. `npm run render -- projects/demo-product/project.json` produces `output/remotion-demo.mp4`.
5. `npm run verify:render -- projects/demo-product/project.json` passes:
   - H.264;
   - 1920x1080;
   - 30 FPS;
   - expected duration within tolerance;
   - non-zero media size.
6. The GitHub Actions workflow reproduces the render and stores the MP4 as an artifact.

The local bootstrap scripts execute steps 1, 3, 4 and 5 automatically and verify that the lockfile was produced.

## VS-G03 — Media stack

Add and verify voice-over, music, captions, video clips, image sequences, WebM/GIF derivatives and loudness normalization.

## VS-G04 — Advanced visuals

Add and verify SVG motion primitives, technical diagrams, Canvas scenes and Three.js/WebGL scenes.

## VS-G05 — Productization

Add project templates, brand packs, reusable motion components, data/API adapters and a project scaffolder.

## VS-G06 — Scale

Add batch rendering, render queues, caching, cloud workers and artifact retention without changing the project manifest contract.
