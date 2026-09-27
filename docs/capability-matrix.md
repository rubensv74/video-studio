# Capability matrix

| Capability | Foundation owner | Status |
|---|---|---|
| React / TypeScript | Remotion | Verified |
| CSS / HTML layout | Remotion | Verified |
| SVG animation | Remotion + Motion Canvas | Ready |
| Technical 2D diagrams | Motion Canvas | Ready for editor use |
| Canvas | Motion Canvas / browser | Ready for editor use |
| Three.js / WebGL | Remotion + `@remotion/three` | Architecture reserved |
| Images / screenshots | Shared assets + Remotion | Ready |
| Video clips | Remotion `@remotion/media` | VS-G03 implementation |
| Music / voice-over | Remotion `@remotion/media` | VS-G03 implementation |
| Captions / subtitles | `@remotion/captions` + Remotion | VS-G03 implementation |
| SRT import | `@remotion/captions` | VS-G03 implementation |
| Transitions | Shared patterns + engine implementation | Starter included |
| Reusable motion components | `apps/*/src/components` | Ready |
| JSON-driven video | Project manifest | Verified |
| API-driven data | Adapter layer | Contract reserved |
| 16:9 / 9:16 / 1:1 | Project manifest | Ready |
| MP4 | Remotion / FFmpeg | Verified |
| WebM | FFmpeg derivative | VS-G03 implementation |
| GIF | FFmpeg derivative | VS-G03 implementation |
| Loudness normalization | FFmpeg loudnorm | VS-G03 implementation |
| Stills | Remotion / Motion Canvas | Architecture ready |
| Image sequence | FFmpeg derivative / Remotion source | VS-G03 implementation |
| Local headless render | Remotion | Verified |
| CI render | Remotion | Verified |
| Motion Canvas headless CI | None | Blocked upstream / not foundational |
| Cloud distributed render | Remotion deployment adapter | Future extension |
| Multi-brand themes | Shared design system | Ready |
| AI-generated assets | External asset producer | Pluggable, not coupled |
| TTS voice generation | External audio producer | Pluggable, not coupled |
| Automatic subtitles | External transcription producer | Pluggable, not coupled |
