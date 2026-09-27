# Delivery gates

## VS-G01 — Multi-engine foundation

**Status: VERIFIED — merged through PR #1**

Verified capabilities:

- repository structure;
- JSON manifests;
- neutral engine contract;
- Remotion input-prop path from `project.json`;
- manifest-driven width, height, FPS, duration and semantic scene payloads;
- local-vs-global frame timing for sequenced scenes;
- Motion Canvas specialist workspace;
- Motion Canvas FFmpeg exporter;
- FFmpeg/ffprobe tooling;
- dependency alignment contract;
- source smoke gate;
- strict rendered-media verifier;
- Windows and Unix bootstrap scripts;
- CI workflow.

## VS-G02 — First verified render

**Status: VERIFIED**

All exit criteria are satisfied.

### Dependency and type-check evidence

GitHub Actions successfully completed:

- standard hosted Ubuntu runner allocation;
- FFmpeg installation;
- npm dependency installation;
- committed npm lockfile generation;
- deterministic lockfile replay using `npm ci --no-audit --no-fund`;
- Remotion TypeScript workspace;
- Motion Canvas TypeScript workspace.

Motion Canvas required alignment with its official 3.17.2 TypeScript starter:

- `src/motion-canvas.d.ts` references `@motion-canvas/core/project`;
- Motion Canvas workspace TypeScript is pinned to 5.2.2;
- third-party WebCodecs declaration overlap is isolated with `skipLibCheck`.

### Physical render evidence

The lockfile-based verification run produced and validated:

```text
codec: h264
geometry: 1920x1080
fps: 30
duration: 10s
size: 838188 bytes
```

Validation command:

```bash
npm run verify:render -- projects/demo-product/project.json
```

Result:

```text
PASS VS-G02 rendered-media contract
```

The run uploaded a `video-studio-demo` artifact containing:

- `output/remotion-demo.mp4`;
- `package-lock.json`.

Reference run:

- workflow run: `36299172711`;
- commit: `0826ebd04d1c046944b8f2225dc00c6262d7124a`;
- artifact ID: `10925245396`.

The artifact ZIP digest reported by GitHub is:

```text
sha256:0719007c5f9f126e3535a8a51e82a1133281cd45e01632deea5781042fed8ce2
```

The earlier verified render produced a slightly different encoded byte size. VS-G02 guarantees the declared media contract and dependency reproducibility, **not bit-for-bit identity of H.264 output across separate encoding runs**.

### Runner blocker resolution

The original CI blocker occurred while the repository was private and the account had exhausted its 2,000 included private-repository Actions minutes with an Actions budget of $0 and stop-usage enabled.

After the repository became public, standard GitHub-hosted Ubuntu and Windows runners were allocated successfully.

The runner diagnostic remains available only through manual `workflow_dispatch`.

See `docs/runner-diagnostic.md`.

## VS-G03 — Media stack

**Status: NEXT**

Add and verify:

- voice-over;
- music;
- captions/subtitles;
- video clips;
- image sequences;
- WebM/GIF derivatives;
- loudness normalization;
- media timing/synchronization contracts.

## VS-G04 — Advanced visuals

Add and verify SVG motion primitives, technical diagrams, Canvas scenes and Three.js/WebGL scenes.

## VS-G05 — Productization

Add project templates, brand packs, reusable motion components, data/API adapters and a project scaffolder.

## VS-G06 — Scale

Add batch rendering, render queues, caching, cloud workers and artifact retention without changing the project manifest contract.
