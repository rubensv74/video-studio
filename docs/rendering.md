# Rendering

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

## Motion Canvas — specialist path

```bash
npm run dev:motion-canvas
```

Use the editor's Video Settings / Render controls and select the FFmpeg exporter.

This foundation does not pretend Motion Canvas has a stable documented headless CLI. If a future upstream version introduces one, the engine adapter can be upgraded without changing project manifests.

## FFmpeg post-processing

Inspect a rendered file:

```bash
npm run probe -- output/remotion-demo.mp4
```

Create a WebM derivative:

```bash
npm run postprocess -- output/remotion-demo.mp4 output/remotion-demo.webm webm
```

Create a GIF derivative:

```bash
npm run postprocess -- output/remotion-demo.mp4 output/remotion-demo.gif gif
```
