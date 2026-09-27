# VS-G09 — Operational Persistence & Access Evidence

## Result

**VERIFIED**

VS-G09 adds durable operational state and a provider-neutral authorization boundary to the Video Studio Control Plane.

## Reference run

- Workflow: `Render demo`
- Run ID: `36321544133`
- PR: #22
- Result: PASS

## Persistence

```text
PASS operational store survives recreation
PASS audit events persist
PASS operational audit survives service restart
```

The local adapter writes through a temporary file and persists run/audit state outside project manifests.

## Authorization

Verified role ordering:

```text
viewer < operator < admin
```

Evidence:

```text
PASS viewer/operator/admin role ordering
PASS protected API rejects missing credentials
PASS protected API rejects invalid credentials
PASS viewer read access
PASS viewer mutation rejected
PASS operator mutation access
PASS admin audit access and denied-request evidence
```

## Credential boundary

```text
PASS credential-reference contract rejects secret-shaped values
```

Accepted reference forms include runtime environment references and abstract secret-store references. Raw provider secrets do not belong in manifests or repository content.

## Control Plane

The browser client supports Bearer tokens for authenticated deployments while development mode remains explicit.

The server exposes:

- `GET /api/session`;
- `GET /api/audit` for admin;
- role-protected existing API routes.

## Artifact

- ID: `10931933770`
- Size: `17,718,017 bytes`
- Digest: `sha256:6fbe25e70ed268074b67061a17c28ebb72750085c57fcf555294e8611ef8bb4d`

## Architectural conclusion

Authentication, authorization and operational state now sit outside the project manifest and rendering engine.

This allows future OIDC/SSO, databases and secret stores to be introduced as adapters without rewriting video projects.
