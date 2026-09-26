# Dependency baseline

## Why dependencies are pinned

Video Studio uses exact versions for rendering-critical packages. Reproducible video output is more important than automatically drifting to the newest package release.

The source contract is enforced by:

```bash
npm run verify:deps
```

and is also part of:

```bash
npm run smoke
```

## Remotion baseline

All Remotion packages must share one exact version:

- `remotion` — 4.0.528
- `@remotion/cli` — 4.0.528
- `@remotion/media` — 4.0.528
- `@remotion/player` — 4.0.528
- `@remotion/three` — 4.0.528

This follows Remotion's own requirement to keep `remotion` and `@remotion/*` packages version-aligned.

The 3D dependency baseline is intentionally the same as Remotion's official `template-three` at tag `v4.0.528`:

- React — 19.2.3
- React DOM — 19.2.3
- React Three Fiber — 9.2.0
- Three.js — 0.178.0
- `@types/react` — 19.2.7
- `@types/three` — 0.170.0
- TypeScript — 5.9.3

Upstream evidence:

- https://github.com/remotion-dev/remotion/tree/v4.0.528/packages/template-three
- https://github.com/remotion-dev/remotion/blob/v4.0.528/packages/three/package.json
- https://github.com/remotion-dev/remotion/blob/v4.0.528/packages/media/package.json
- https://github.com/remotion-dev/remotion/blob/v4.0.528/packages/cli/package.json

## Motion Canvas baseline

Motion Canvas engine packages are pinned together at 3.17.2:

- `@motion-canvas/core`
- `@motion-canvas/2d`
- `@motion-canvas/ui`
- `@motion-canvas/vite-plugin`
- `@motion-canvas/ffmpeg`

Vite remains on 4.x for the VS-G01 baseline. Motion Canvas' official 3.17.2 starter declares Vite `^4.0.0`.

Upstream evidence:

- https://github.com/motion-canvas/motion-canvas/tree/v3.17.2
- https://github.com/motion-canvas/motion-canvas/blob/v3.17.2/packages/create/template-2d-ts/package.json
- https://github.com/motion-canvas/motion-canvas/blob/v3.17.2/packages/docs/docs/getting-started/rendering/video.mdx

## Upgrade rule

Do not update one rendering package in isolation.

A dependency upgrade must:

1. update the whole aligned engine family;
2. pass `npm run verify:deps`;
3. pass `npm run smoke`;
4. pass both TypeScript workspaces;
5. reproduce the reference MP4;
6. compare `ffprobe` metadata;
7. only then update the lockfile baseline.
