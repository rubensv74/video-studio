# Rendering

## One-command local validation

Windows PowerShell:

```powershell
./scripts/bootstrap-windows.ps1
```

Linux/macOS:

```bash
./scripts/bootstrap-unix.sh
```

The bootstrap performs, in order:

1. Node/npm/FFmpeg/ffprobe environment checks.
2. `npm install`.
3. source-contract and TypeScript checks.
4. Remotion render from `projects/demo-product/project.json`.
5. rendered-media verification with ffprobe.
6. lockfile presence check.

A successful run must leave:

```text
output/remotion-demo.mp4
package-lock.json
```

## Remotion — production path

Preview:

```bash
npm run dev:remotion
```

Render demo:

```bash
npm run render:remotion
```

Or dispatch from manifest:

```bash
npm run render -- projects/demo-product/project.json
```

Verify the physical output against the manifest:

```bash
npm run verify:render -- projects/demo-product/project.json
```

The verifier asserts codec, width, height, FPS, duration tolerance and non-zero file size. It fails the process if the media contract is violated.

For diagnostics only:

```bash
npm run probe -- output/remotion-demo.mp4
```

## Motion Canvas — specialist path

```bash
npm run dev:motion-canvas
```

Use the editor's Video Settings / Render controls and select the FFmpeg exporter.

This foundation does not pretend Motion Canvas has a stable documented headless CLI. If a future upstream version introduces one, the engine adapter can be upgraded without changing project manifests.

## FFmpeg post-processing

Create a WebM derivative:

```bash
npm run postprocess -- output/remotion-demo.mp4 output/remotion-demo.webm webm
```

Create a GIF derivative:

```bash
npm run postprocess -- output/remotion-demo.mp4 output/remotion-demo.gif gif
```
