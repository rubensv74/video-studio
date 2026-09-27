# Capability matrix

| Capability | Foundation owner | Status |
|---|---|---|
| React / TypeScript | Remotion | Verified |
| CSS / HTML layout | Remotion | Verified |
| SVG animation | Remotion + Motion Canvas | Verified physically |
| Technical 2D diagrams | Motion Canvas | Type-checked specialist path |
| HTML Canvas | Remotion / browser | Verified physically |
| Three.js / WebGL | Remotion + `@remotion/three` | Verified physically |
| Video clips | Remotion `@remotion/media` | Verified |
| Music / voice-over tracks | Remotion `@remotion/media` | Verified |
| Captions / subtitles | `@remotion/captions` + Remotion | Verified |
| SRT import | `@remotion/captions` | Verified |
| Reusable transitions | Shared `SceneTransition` | Verified physically |
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
| Batch rendering | Scale layer | Verified physically |
| Queue validation | Scale layer | Verified |
| Controlled concurrency | Scale layer | Verified |
| Failure isolation | Scale layer | Verified |
| Deterministic render cache | Scale layer | Verified physically |
| Output-integrity cache check | SHA-256 | Verified |
| Retention/expiry metadata | Scale layer | Verified |
| Batch reports | Scale layer | Verified |
| Local worker adapter | Scale layer | Verified |
| Provider-neutral HTTP worker | Scale layer | Boundary verified |
| Concrete cloud distributed worker | External provider adapter | Not yet bound to a provider |
| Motion Canvas headless CI | None | Blocked upstream / not foundational |
| AI-generated assets | External asset producer | Pluggable, not coupled |
| TTS voice generation | External audio producer | Pluggable, not coupled |
| Automatic subtitles | External transcription producer | Pluggable, not coupled |

| React Control Plane | `apps/control-plane` | Verified build |
| Control Plane health/catalog API | Node HTTP service | Verified |
| Safe project scaffolding API | Control Plane service | Verified |
| Safe render/batch submission API | Control Plane service | Verified contract |
| Path traversal protection | Control Plane service | Verified |
| Shell-free process delegation | Node `spawn` boundary | Verified design + tests |
| Run/report history | Control Plane service | Verified |

| Generated image tracks | Neutral media stack | Verified physically in VS-G08 |
| AI/media asset registry | Provider layer | Verified |
| Image provider contract | Media adapter | Verified |
| TTS provider contract | Media adapter | Verified |
| Transcription provider contract | Media adapter | Verified |
| Provider-neutral HTTP media adapter | Media adapter | Verified boundary |
| Control Plane Media Lab | `apps/control-plane` | Verified build/API |
| Production AI provider | External provider adapter | Not bound to vendor |
