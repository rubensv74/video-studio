# VS-G07 — Control Plane Evidence

## Result

**VERIFIED**

VS-G07 adds a provider-neutral web operations layer above the verified Video Studio rendering foundation.

## Reference run

- Workflow: `Render demo`
- Run ID: `36313713092`
- Branch: `program/vs-g07-control-plane`
- PR: #15
- Result: PASS

The run also persisted the updated workspace lockfile in commit `5e2be1a0b53ca114c3617d1c206589577c03117b`.

## API contract

Verified:

```text
PASS control-plane health
PASS control-plane catalog
PASS control-plane project scaffolding
PASS control-plane path traversal rejection
PASS control-plane shell-injection-shaped target rejection
PASS control-plane batch submission contract
PASS control-plane project render submission contract
PASS control-plane run history
PASS VS-G07 control-plane API contract
```

## UI build

The React/Vite workspace builds as a production artifact:

```text
vite v4.5.14 building for production...
✓ built in 1.27s
```

The generated `apps/control-plane/dist` directory is retained inside the workflow artifact.

## Control Plane responsibilities

The UI provides:

- project catalog;
- project creation form;
- preset/theme selection;
- batch catalog;
- batch launch control;
- recent run/report view;
- engine health/capability status.

The API provides:

- `GET /api/health`;
- `GET /api/catalog`;
- `GET /api/runs`;
- `POST /api/projects`;
- `POST /api/renders`.

## Safety boundary

The browser has no direct process execution capability.

The API:

- requires JSON targets;
- restricts project targets to the configured project root;
- restricts batch targets to `batches/`;
- rejects traversal outside approved roots;
- rejects shell-injection-shaped filenames because they are not valid JSON paths;
- validates project and batch contracts before execution;
- delegates using Node `spawn` with `shell: false`.

## Regression evidence

The same workflow continued through all established rendering gates after Control Plane validation:

- primary render;
- derivatives/media stack;
- advanced SVG/Canvas/WebGL;
- scaffolded 16:9 / 9:16 / 1:1 projects;
- runtime theme verification;
- scale batch execution;
- cache replay;
- artifact upload.

No earlier gate was weakened to add the Control Plane.

## Artifact

- Name: `video-studio-demo`
- Artifact ID: `10929952093`
- Size: `15,075,265 bytes`
- Digest:
  `sha256:665411b34252474c0d3d05d622a238511d343f87e662f249dd0c9be969b8c217`

## Conclusion

VS-G07 establishes the browser-based operational surface.

Authentication, persistent multi-user state and concrete cloud workers remain separate extension gates rather than hidden dependencies of the Control Plane foundation.
