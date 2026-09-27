# VS-G04 — Advanced Visuals Evidence

## Result

**VERIFIED**

VS-G04 physically demonstrates the advanced visual paths required by Video Studio without coupling projects to a renderer-specific manifest.

## Reference run

- Workflow: `Render demo`
- Run ID: `36304477408`
- Head commit: `e17274ac8d9dc31baa38335a490b44213e09009b`
- Runner: GitHub-hosted Ubuntu
- Runner ID: `1000004730`

All relevant steps completed successfully:

- source-contract smoke test;
- dependency install;
- foundation/type checks;
- VS-G03 regression render and media verification;
- advanced visual render;
- advanced media verification;
- QA frame extraction;
- QA frame verification;
- artifact upload.

## Advanced video

Output:

```text
output/advanced-visuals-demo.mp4
```

Observed media metadata:

```text
codec: h264 (High)
geometry: 1920x1080
fps: 30
duration: 9.00s
renderer: Remotion 4.0.528
```

## Scene coverage

### SVG

Scene: `svg-flow`

Demonstrates animated vector paths, nodes, labels and glow effects through native SVG.

QA frame:

```text
output/advanced-visuals-qa/svg-flow.png
428,767 bytes
1920x1080 PNG
```

### Canvas

Scene: `canvas-telemetry`

Demonstrates deterministic per-frame Canvas drawing for industrial telemetry/waveform rendering.

QA frame:

```text
output/advanced-visuals-qa/canvas-telemetry.png
732,439 bytes
1920x1080 PNG
```

### Three.js / WebGL

Scene: `three-asset`

Demonstrates `@remotion/three`, React Three Fiber and Three.js rendering with procedural industrial geometry, lighting and frame-driven rotation.

QA frame:

```text
output/advanced-visuals-qa/three-asset.png
358,239 bytes
1920x1080 PNG
```

## Artifact

- Name: `video-studio-demo`
- Artifact ID: `10926876837`
- Size: `7,846,606 bytes`
- ZIP digest:
  `sha256:c2ddbf50401407f6128519a3a977bcb69805f3e7863cf376a3b45efcfd7786b0`

The artifact retains both the advanced MP4 and the three QA stills.

## CI maintenance

After the first green VS-G04 run:

- GitHub workflow actions were aligned to the current v7 releases;
- single-image FFmpeg extraction was changed to use `-update 1` to avoid the image-sequence warning.

A subsequent reconciliation run must remain green before merge.
