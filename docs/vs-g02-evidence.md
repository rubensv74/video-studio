# VS-G02 — First Verified Render evidence

## Purpose

This record captures the evidence used to close the first end-to-end Video Studio render gate.

## Verified before deterministic replay

A GitHub-hosted Ubuntu runner has already completed the full pipeline successfully:

- source-contract smoke gate;
- FFmpeg installation;
- npm dependency installation;
- Remotion TypeScript check;
- Motion Canvas TypeScript check;
- Remotion render;
- strict ffprobe verification;
- artifact upload.

The first verified media result was:

```text
codec: h264
geometry: 1920x1080
fps: 30
duration: 10s
size: 839383 bytes
```

The workflow artifact contained:

- `output/remotion-demo.mp4`;
- `package-lock.json`.

The generated npm lockfile has now been persisted to the branch.

## Deterministic replay

The next workflow run must detect the committed lockfile and execute:

```bash
npm ci --no-audit --no-fund
```

instead of `npm install`.

VS-G02 is considered reproducible when that lockfile-based run also passes type-check, render, media verification and artifact publication.
