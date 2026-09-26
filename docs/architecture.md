# Architecture

## Principle

A video project must not know how it is rendered. It declares **what** it needs; an engine adapter decides **how** to produce it.

```text
Project Manifest
      |
      v
Contract / Validation
      |
      +------------------+
      |                  |
      v                  v
Remotion Adapter     Motion Canvas Adapter
      |                  |
      v                  v
Headless Render      Specialist Editor/Exporter
      |                  |
      +---------+--------+
                v
              FFmpeg
                |
                v
        MP4 / WebM / GIF / Audio / Stills
```

## Engine responsibilities

### Remotion
Primary production renderer.

Use it for:
- product UI walkthroughs;
- SaaS animations;
- React component reuse;
- parameterized/data-driven video;
- SVG;
- HTML/CSS typography;
- deterministic timeline logic;
- audio/video composition;
- Three.js / WebGL via React Three Fiber;
- batch/headless rendering.

### Motion Canvas
Specialist engine.

Use it for:
- engineering diagrams;
- animated flows;
- architecture explainers;
- technical callouts;
- geometry-heavy 2D scenes;
- manually supervised authoring where its editor is valuable.

It is intentionally not the CI-critical renderer in this foundation.

### FFmpeg
Final media layer.

Use it for:
- codec/container conversion;
- concatenation;
- muxing;
- loudness normalization;
- trimming;
- audio extraction;
- GIF/WebM derivatives;
- inspection with ffprobe.

## Shared layers

`packages/contracts` owns neutral TypeScript contracts.

`packages/design-system` owns visual tokens shared by all engines.

`projects/` owns declarative video definitions and project-specific assets/configuration.

`assets/` stores reusable media. Large generated outputs never belong in Git.

## Non-goals at Foundation Gate

- A full drag-and-drop NLE/editor.
- A proprietary timeline UI.
- Cloud rendering tied to one provider.
- AI service credentials committed to the repository.
- Hiding third-party licensing requirements.
