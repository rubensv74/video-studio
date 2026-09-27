# Project manifest contract

The project manifest is the engine-neutral source of truth for a video.

## Core

Every project declares:

- `id`;
- `title`;
- `engine`;
- `compositionId`;
- `theme`;
- `output`;
- ordered semantic `scenes`.

## Media stack

`media.audioTracks` supports roles:

- `voiceover`;
- `music`;
- `sfx`;
- `ambient`.

Audio tracks can declare source, timeline start, duration, source trims, volume, loop and enabled state.

`media.videoTracks` can declare source, timeline start, duration, trims, volume/mute, loop, object fit, opacity and layout.

`media.captionTracks` supports:

- external SRT sources;
- inline caption cues;
- timeline offset;
- presentation settings.

Local media paths are resolved through Remotion `staticFile()`. HTTP(S), data and blob sources remain direct URLs.

## Derivatives

`derivatives` can request:

- `webm`;
- `gif`;
- `png-sequence`.

Each derivative declares its own output path and may specify output FPS/width where applicable.

## Audio normalization

`audioNormalization` declares:

- enabled state;
- output file;
- integrated loudness target;
- true-peak target;
- loudness-range target.

The reference implementation maps this contract to FFmpeg `loudnorm`.

## Backwards compatibility

The original `audio.voiceover/music/captions` fields remain in the TypeScript contract for VS-G01 compatibility, but new projects should use `media`.

The manifest stays neutral: it declares media intent, not Remotion component syntax or FFmpeg command lines.
