# Architecture

## Principle

A video project declares **what** it needs. Rendering, post-production and scale layers decide **how** to produce it.

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
                |
                v
              FFmpeg
                |
                v
        MP4 / WebM / GIF / Audio / Stills

Batch Contract
      |
      v
Queue Executor
      |
      +---------------------------+
      |                           |
      v                           v
Local Worker                HTTP Worker Boundary
      |                           |
      +------------+--------------+
                   |
                   v
          Deterministic Cache
                   |
                   v
         Reports / Retention
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

It is intentionally not the CI-critical renderer.

### FFmpeg

Final media layer.

Use it for:

- codec/container conversion;
- concatenation;
- muxing;
- loudness normalization;
- trimming;
- audio extraction;
- GIF/WebM/PNG derivatives;
- QA frame extraction;
- inspection with ffprobe.

## Productization layer

`presets/` defines format profiles.

`themes/` defines reusable brand/theme packs.

`scripts/create-project.mjs` scaffolds neutral project manifests.

Shared scene registry and transition primitives prevent composition-specific dispatch from becoming duplicated infrastructure.

Data adapters resolve:

- inline JSON;
- local JSON files;
- explicit HTTP JSON endpoints.

## Scale layer

The scale layer is intentionally separate from the project manifest.

`batches/` defines queue intent:

- job ids;
- project manifests;
- controlled concurrency;
- cache policy;
- retention policy;
- worker type.

### Queue

The queue executor:

- preserves result order;
- limits active work to configured concurrency;
- isolates failed jobs;
- records duration/status/cache/output metadata.

### Cache

The render cache key includes:

- project input directory fingerprint;
- rendering source fingerprint;
- design-system/theme/preset sources;
- package-lock dependency fingerprint.

Cache hits are accepted only when:

- the record exists;
- it has not expired;
- the output exists;
- the output SHA-256 still matches the stored record.

### Worker boundary

Two worker adapters are defined:

- `local` — executes the repository renderer directly;
- `http` — provider-neutral POST boundary for a future external/cloud worker.

The external boundary is verified with a deterministic HTTP test, but no concrete cloud provider is mandatory.

## Control Plane layer

The Control Plane is an operational surface above the verified engine; it is not a replacement for the rendering contracts.

```text
React Control Plane
      |
      v
HTTP API
      |
      +-------------------+-------------------+
      |                   |                   |
      v                   v                   v
Project Catalog      Project Scaffolder   Run History
      |                   |                   |
      +-------------------+-------------------+
                          |
                          v
                 Validated Submission
                          |
                  +-------+-------+
                  |               |
                  v               v
             Single Render     Batch Render
                  |               |
                  +-------+-------+
                          v
                    Worker Layer
```

The browser never executes FFmpeg, npm or shell commands.

The API constrains targets to approved repository roots, requires JSON contracts, validates manifests/batches, and launches engine scripts with `shell: false`.

This keeps UI deployment independent from future worker deployment. A later cloud control plane can replace only the API/worker transport while retaining manifests, batches and render contracts.

## Shared layers

`packages/contracts` owns neutral TypeScript contracts.

`packages/design-system` owns visual tokens shared by renderers.

`projects/` owns declarative video definitions.

`assets/` stores reusable media. Large generated outputs never belong in Git.

## Explicit non-goals

- A full drag-and-drop NLE/editor.
- A proprietary timeline UI.
- Coupling the manifest to AWS, Azure, Vercel or another provider.
- AI service credentials committed to the repository.
- Hiding third-party licensing requirements.


## External runtime

The production runtime is selected outside project manifests.

```text
Environment / deployment profile
            |
            v
      Runtime Bootstrap
       /           \
      v             v
Secret Resolver   Runtime Profile
      |             |
      +------+------+ 
             |
     +-------+--------+
     |                |
     v                v
External Worker   External Store
     |                |
     +-------+--------+
             |
             v
       Control Plane
             |
             v
   Neutral project manifests
```

The external worker contract provides:

- health;
- capabilities;
- job submission;
- retries;
- timeout;
- circuit state.

The external store contract provides:

- health;
- run list/upsert;
- audit list/append;
- snapshot;
- retries;
- timeout;
- circuit state.

No provider credential is serialized into project manifests or runtime diagnostics.


## Concrete cloud provider pack

The first concrete deployment mapping preserves the G10 boundaries:

```text
Vercel
  |
  +-- static Control Plane UI
          |
          | HTTPS + Bearer token
          v
External Control Plane backend
          |
          +------> External render worker
          |
          +------> Supabase PostgREST
                        |
                        v
              video_studio_api
                runs / audit_events
```

Supabase credentials are resolved only in the trusted backend runtime. The
browser receives neither the Supabase project secret nor a direct operational
database route.

The render worker is intentionally not assigned to Vercel by this gate.
Remotion/Chromium/FFmpeg execution remains a separate compute-provider decision.
