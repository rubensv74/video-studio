# VS-G02 — First Verified Render evidence

## Status

**VERIFIED**

## Runner recovery

The repository was made public, allowing standard GitHub-hosted runners to execute without depending on the exhausted private-repository Actions allowance.

The cross-platform diagnostic passed on:

- `ubuntu-latest`;
- `windows-latest`.

## First successful physical render

A complete GitHub Actions run passed:

- source smoke;
- FFmpeg installation;
- npm installation;
- Remotion TypeScript;
- Motion Canvas TypeScript;
- Remotion render;
- strict ffprobe validation;
- artifact publication.

The first verified media result was:

```text
codec: h264
geometry: 1920x1080
fps: 30
duration: 10s
size: 839383 bytes
```

That run generated the npm lockfile, which was then committed by the CI workflow.

## Lockfile replay

A fresh runner subsequently detected the committed `package-lock.json` and executed:

```bash
npm ci --no-audit --no-fund
```

The workflow confirmed that the lockfile was tracked and unchanged.

The lockfile-based run again passed:

- source smoke;
- both TypeScript workspaces;
- Remotion render;
- strict media validation;
- artifact publication.

Verified media:

```text
codec: h264
geometry: 1920x1080
fps: 30
duration: 10s
size: 838188 bytes
```

## Reference execution

- workflow run: `36299172711`
- commit: `0826ebd04d1c046944b8f2225dc00c6262d7124a`
- artifact: `video-studio-demo`
- artifact ID: `10925245396`
- artifact size: `866276 bytes`
- artifact ZIP SHA-256: `0719007c5f9f126e3535a8a51e82a1133281cd45e01632deea5781042fed8ce2`

The artifact contains:

```text
output/remotion-demo.mp4
package-lock.json
```

## Reproducibility definition

VS-G02 proves:

- dependency resolution can be reproduced from the committed lockfile;
- source contracts compile;
- the project renders successfully from a clean hosted runner;
- the output satisfies the declared codec, geometry, FPS and duration contract.

It does not claim bit-for-bit H.264 identity across separate encoding executions. Encoded file size may vary while the validated media contract remains identical.
