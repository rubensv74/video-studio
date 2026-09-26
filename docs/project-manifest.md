# Project manifest contract

Each video project declares rendering intent in JSON.

Required fields:

- `id`: stable identifier.
- `title`: human-readable name.
- `engine`: `remotion` or `motion-canvas`.
- `compositionId`: engine composition/project identifier.
- `output`: width, height, fps, format and destination.
- `theme`: shared theme identifier.
- `scenes`: ordered semantic scene definitions.

The contract is deliberately richer than the current demo so later AI tooling can generate a manifest without editing renderer internals.

A scene may contain semantic `payload` data. Engine-specific code maps that payload to a visual implementation.

This is the anti-lock-in boundary of Video Studio.
