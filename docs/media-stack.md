# Media Stack

VS-G03 turns media into a first-class part of the neutral project manifest.

## Timed tracks

A project can declare:

- audio tracks with roles: voice-over, music, SFX and ambient;
- video clips with timeline placement, duration, fit, opacity and layout;
- caption tracks from SRT or inline cues.

The Remotion adapter maps these neutral tracks to `@remotion/media` and `@remotion/captions`.

## CI fixtures

The reference project does not depend on copyrighted media or external services.

`scripts/generate-media-fixtures.mjs` creates deterministic technical fixtures at CI/runtime:

- AAC music tone;
- AAC voice-over placeholder tone;
- H.264 video test pattern;
- SRT caption file.

The voice-over fixture verifies routing, timing and mixing only. It is not intended to simulate speech quality or TTS.

Generated fixture binaries are ignored by Git.

## Derivatives

`scripts/render-derivatives.mjs` reads the manifest and produces:

- VP9/Opus WebM;
- GIF preview;
- numbered PNG image sequence;
- audio-normalized MP4.

The normalization target is project-configurable. The reference project uses -16 LUFS, -1.5 dB true peak and LRA 11 for the technical validation fixture.

## Verification

`scripts/verify-media-stack.mjs` verifies:

- the primary render contains audio;
- WebM uses VP9 + Opus;
- GIF uses the GIF video codec;
- normalized output contains audio;
- measured integrated loudness is within tolerance of the configured target.

A missing source asset or caption file causes the Remotion render to fail rather than silently omit the track.
