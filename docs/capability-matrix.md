# Capability matrix

| Capability | Foundation owner | Status |
|---|---|---|
| React / TypeScript | Remotion | Verified |
| CSS / HTML layout | Remotion | Verified |
| SVG animation | Remotion + Motion Canvas | Verified physically in VS-G04 |
| Technical 2D diagrams | Motion Canvas | Type-checked specialist path |
| HTML Canvas | Remotion / browser | Verified physically in VS-G04 |
| Three.js / WebGL | Remotion + `@remotion/three` | Verified physically in VS-G04 |
| Images / screenshots | Shared assets + Remotion | Ready |
| Video clips | Remotion `@remotion/media` | Verified |
| Music / voice-over tracks | Remotion `@remotion/media` | Verified |
| Captions / subtitles | `@remotion/captions` + Remotion | Verified |
| SRT import | `@remotion/captions` | Verified |
| Inline caption cues | Manifest + Remotion | Supported |
| Reusable transitions | Shared `SceneTransition` | Verified in physical renders |
| Reusable scene registry | Shared `SceneRegistry` | Verified |
| JSON-driven video | Project manifest | Verified |
| Local JSON data | Data adapter | Verified |
| HTTP JSON API data | Data adapter | Verified |
| 16:9 preset | Scaffolder + manifest | Physically verified |
| 9:16 preset | Scaffolder + manifest | Physically verified |
| 1:1 preset | Scaffolder + manifest | Physically verified |
| Project scaffolder | CLI | Verified |
| Multi-brand themes | Shared design system | Verified physically |
| MP4 H.264 | Remotion / FFmpeg | Verified |
| WebM VP9/Opus | FFmpeg derivative | Verified |
| GIF | FFmpeg derivative | Verified |
| PNG image sequence | FFmpeg derivative | Verified |
| Loudness normalization | FFmpeg loudnorm | Verified |
| Scene QA stills | FFmpeg + ffprobe | Verified |
| Local headless render | Remotion | Verified |
| CI render | Remotion | Verified |
| Motion Canvas headless CI | None | Blocked upstream / not foundational |
| Batch rendering | Scale layer | VS-G06 |
| Render queue / concurrency | Scale layer | VS-G06 |
| Deterministic render cache | Scale layer | VS-G06 |
| Cloud distributed render | Worker adapter boundary | VS-G06 |
| AI-generated assets | External asset producer | Pluggable, not coupled |
| TTS voice generation | External audio producer | Pluggable, not coupled |
| Automatic subtitles | External transcription producer | Pluggable, not coupled |
