# Rendering

## End-to-end local validation

Windows PowerShell:

```powershell
./scripts/bootstrap-windows.ps1
```

Linux/macOS:

```bash
./scripts/bootstrap-unix.sh
```

The bootstrap:

1. checks Node/npm/FFmpeg/ffprobe;
2. installs dependencies from `package-lock.json`;
3. generates deterministic media fixtures;
4. runs source-contract and TypeScript checks;
5. renders the primary Remotion MP4;
6. verifies the primary media contract;
7. generates WebM, GIF, PNG sequence and normalized MP4 derivatives;
8. verifies the complete media stack.

## Manual flow

```bash
npm ci
npm run fixtures:media
npm run check
npm run render -- projects/demo-product/project.json
npm run verify:render -- projects/demo-product/project.json
npm run render:derivatives -- projects/demo-product/project.json
npm run verify:media-stack -- projects/demo-product/project.json
```

## Remotion Studio

```bash
npm run dev:remotion
```

## Motion Canvas

```bash
npm run dev:motion-canvas
```

Use its Render controls with the FFmpeg exporter for specialist technical-animation work.

## Diagnostics

Inspect a single file:

```bash
npm run probe -- output/remotion-demo.mp4
```

The strict project verifiers should be used for gates instead of relying on a manual probe.
