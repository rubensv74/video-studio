# Firulais meme vertical template

Reusable Remotion template for short, mobile-first meme videos.

## Goal

Produce deterministic 9:16 videos for WhatsApp and similar mobile sharing without coupling the Firulais format to one story.

Current reference project:

`projects/firulais-protocol-barca/project.json`

Composition:

`FirulaisMemeVertical`

## Output contract

- 1080x1920
- 30 fps
- H.264 MP4 primary output
- optional GIF derivative
- scene-driven copy and timing
- optional audio/captions through the existing Video Studio media stack

## Scene types

### `firulais-meme`

Image-led scene with headline, body and optional callout.

Payload:

```json
{
  "imageSrc": "firulais/my-image.png",
  "kicker": "SALA DE CRISIS",
  "headline": "Headline",
  "body": "Supporting copy",
  "callout": "Optional bottom strip",
  "motion": "zoom-in",
  "accent": "#FFD21F",
  "emoji": "🐶"
}
```

Supported motion values:

- `none`
- `zoom-in`
- `zoom-out`
- `pan-left`
- `pan-right`
- `shake`
- `pulse`

If `imageSrc` is omitted, the scene falls back to the configured emoji.

### `firulais-alert`

Emergency-button scene.

Payload:

```json
{
  "headline": "¡ACTIVAR PROTOCOLO BARÇA!",
  "body": "Hay que cambiar de tema.",
  "buttonLabel": "BARÇA",
  "accent": "#FFD21F"
}
```

### `firulais-outro`

Final punchline scene.

Payload:

```json
{
  "headline": "Final punchline",
  "body": "Secondary line",
  "emoji": "🐶",
  "accent": "#FFD21F"
}
```

## Asset contract

Final Firulais stills belong under:

`apps/remotion-studio/public/firulais/`

Manifest references are relative to Remotion's public directory, for example:

`firulais/firulais-protocol-barca-01.png`

A deterministic SVG placeholder is committed only so CI can render and verify the complete pipeline. It is not the visual source of truth for the character.

## Render

```bash
npm run validate:firulais
npm run render:firulais
npm run verify:render -- projects/firulais-protocol-barca/project.json
npm run render:derivatives -- projects/firulais-protocol-barca/project.json
```

Primary output:

`output/firulais-protocol-barca.mp4`

GIF preview:

`output/firulais-protocol-barca.gif`

## First production swap

Replace the placeholder `imageSrc` values in the project manifest with approved Firulais PNG/JPEG stills. No composition code should need to change.

The next enhancement after real stills are connected is the audio pass: alarm SFX, short voice-over, and a low-volume music bed using the existing `media.audioTracks` contract.
