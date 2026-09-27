# AI / Generated Media Architecture

## Boundary

AI/media generation is intentionally outside the renderer.

```text
Prompt / Text / Audio
        |
        v
Media Provider Adapter
        |
        +---------------------+
        |                     |
        v                     v
Fixture Provider         HTTP Provider
(CI/local)               (real vendor)
        |                     |
        +----------+----------+
                   v
           Generated Asset
        SVG / WAV / SRT / ...
                   |
                   v
             Asset Registry
                   |
                   v
          Normal Media Stack
                   |
                   v
               Remotion
```

## Fixture provider

The fixture provider creates deterministic media for contract testing:

- generated SVG imagery;
- deterministic synthetic WAV audio;
- deterministic SRT transcript output.

These outputs validate plumbing only. They are not production AI outputs.

## HTTP provider boundary

A real provider receives:

```json
{
  "version": 1,
  "kind": "image | tts | transcription",
  "request": {}
}
```

and returns provider-owned JSON metadata describing the generated asset.

Provider credentials are deliberately not part of project manifests.

## Control Plane

The Control Plane exposes:

- `GET /api/media`;
- `POST /api/media`.

The current local service uses the fixture provider by default. A production deployment can inject a different provider without changing the browser, project manifest or renderer.

## Security rule

Provider secrets belong in deployment/runtime secret stores, never:

- project manifests;
- Git history;
- browser bundles;
- generated asset metadata.
