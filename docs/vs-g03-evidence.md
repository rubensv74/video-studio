# VS-G03 — Media Stack evidence

## Status

**VERIFIED**

## Reference pipeline

GitHub Actions run `36300093257` completed the VS-G03 pipeline from a hosted Ubuntu runner.

Reference commit:

```text
cde2c33b2bcfbb6f8a4d56fe230f8036ed4d11a6
```

## Primary render

The primary MP4 was produced by Remotion with the manifest-driven media stack active.

Verified audio:

```text
codec: aac
sample rate: 48000 Hz
```

The successful render consumed:

- music track;
- voice-over technical fixture;
- video overlay;
- SRT caption track.

## Visual QA

A frame was extracted at 4.000 s from the VS-G03 artifact.

Observed simultaneously:

- the base `CapabilityGrid` scene;
- the generated test-pattern video overlay;
- the active subtitle:
  `Video, music and voice-over tracks render together.`

This confirms the video and caption layers are visually composited, rather than merely present in the source contract.

## Derivatives

The verifier reported:

```text
PASS derivative webm-preview: vp9
PASS derivative gif-preview: gif
PASS derivative png-sequence: 10 PNG frames @ 640px
```

The WebM verifier also requires an Opus audio stream.

## Loudness normalization

Reference configuration:

```text
target integrated loudness: -16 LUFS
true peak: -1.5 dB
loudness range: 11
```

Measured normalized output:

```text
-15.98 LUFS
```

Result:

```text
PASS VS-G03 media stack contract
```

## Artifact

Artifact name:

```text
video-studio-demo
```

Artifact ID:

```text
10925034371
```

Artifact ZIP digest:

```text
sha256:e96ad28413f630b5a1c70fbc1824d2b7594c179287d334b6b0fa755317abdaf8
```

Artifact contents include:

- primary H.264 MP4;
- VP9/Opus WebM;
- GIF preview;
- loudness-normalized MP4;
- numbered PNG image sequence;
- npm lockfile.

## Fixture limitation

The voice-over fixture is a generated tone. It proves the voice-over track path, timing and audio mixing contract. It does not evaluate speech synthesis, voice quality or narration generation.
