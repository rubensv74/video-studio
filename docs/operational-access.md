# Operational Access and Secret Boundaries

## Access modes

### Development

Development mode injects a local admin principal. It is intentionally explicit and is appropriate only for trusted local development.

### Required

When runtime token configuration is supplied, the Control Plane requires Bearer authentication for protected API routes.

## Roles

| Role | Read | Create / render | Audit |
|---|---:|---:|---:|
| viewer | yes | no | no |
| operator | yes | yes | no |
| admin | yes | yes | yes |

## Token configuration

The static-token adapter exists as a deployable boundary and test implementation. Tokens are supplied at runtime, not committed.

For production internet-facing deployment, replace or front this adapter with an external identity provider / OIDC-capable access adapter.

## Secrets

Never place provider secrets in:

- `project.json`;
- batch definitions;
- generated asset metadata;
- browser source;
- GitHub commits.

Use references such as:

- `env:VIDEO_STUDIO_MEDIA_TOKEN`;
- `secret:media/provider-token`.

The referenced secret is resolved only in trusted runtime infrastructure.

## Audit

Allowed and denied protected API access produces operational audit events containing:

- action;
- method;
- outcome;
- subject;
- role;
- provider;
- reason for denied requests.

Tokens and secret values are not included in audit events.
