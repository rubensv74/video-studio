import crypto from 'node:crypto';

export const roleRank = {
  viewer: 1,
  operator: 2,
  admin: 3,
};

export class ControlPlaneHttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const normalizeApiKeys = (apiKeys = {}) => {
  const result = new Map();

  for (const [token, config] of Object.entries(apiKeys)) {
    if (!token) continue;

    const normalized =
      typeof config === 'string'
        ? {role: config, subject: `${config}-api-key`}
        : {
            role: config?.role,
            subject: config?.subject ?? `${config?.role ?? 'unknown'}-api-key`,
          };

    if (!roleRank[normalized.role]) {
      throw new Error(`Unsupported API key role: ${String(normalized.role)}`);
    }

    result.set(token, normalized);
  }

  return result;
};

export const authenticate = ({
  request,
  authDisabled,
  credentials,
  requiredRole = 'viewer',
}) => {
  if (authDisabled) {
    return {role: 'admin', subject: 'local-development'};
  }

  const header = request.headers.authorization ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) {
    throw new ControlPlaneHttpError(401, 'Missing bearer token');
  }

  const actor = credentials.get(match[1]);
  if (!actor) {
    throw new ControlPlaneHttpError(401, 'Invalid bearer token');
  }

  if (roleRank[actor.role] < roleRank[requiredRole]) {
    throw new ControlPlaneHttpError(
      403,
      `Role ${actor.role} cannot perform this operation`,
    );
  }

  return actor;
};

export const requestFingerprint = ({method, pathname, body}) =>
  crypto
    .createHash('sha256')
    .update(
      JSON.stringify({
        method,
        pathname,
        body,
      }),
    )
    .digest('hex');
