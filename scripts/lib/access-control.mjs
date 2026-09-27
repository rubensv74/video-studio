const roleRank = {
  viewer: 1,
  operator: 2,
  admin: 3,
};

export class AccessError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'AccessError';
    this.statusCode = statusCode;
  }
}

export const hasRole = (principal, requiredRole) => {
  if (!principal || !roleRank[requiredRole]) return false;
  return (roleRank[principal.role] ?? 0) >= roleRank[requiredRole];
};

export const requireRole = (principal, requiredRole) => {
  if (!principal) throw new AccessError('Authentication required', 401);
  if (!hasRole(principal, requiredRole)) {
    throw new AccessError(`Role ${requiredRole} is required`, 403);
  }
  return principal;
};

const bearerToken = (request) => {
  const header = request.headers?.authorization;
  if (typeof header !== 'string') return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1] ?? null;
};

export const createDevelopmentAccessProvider = ({
  subject = 'local-development',
  role = 'admin',
} = {}) => {
  if (!roleRank[role]) throw new Error(`Unsupported role: ${role}`);
  return {
    mode: 'development',
    authenticate: async () => ({subject, role, provider: 'development'}),
  };
};

export const createStaticTokenAccessProvider = ({
  tokens,
  name = 'static-token',
} = {}) => {
  if (!tokens || typeof tokens !== 'object' || Array.isArray(tokens)) {
    throw new Error('tokens map is required');
  }

  const entries = new Map(
    Object.entries(tokens).map(([token, principal]) => {
      if (!token) throw new Error('token cannot be empty');
      if (!principal?.subject) throw new Error('token principal subject is required');
      if (!roleRank[principal.role]) {
        throw new Error(`Unsupported token role: ${String(principal.role)}`);
      }
      return [token, {...principal, provider: name}];
    }),
  );

  return {
    mode: 'required',
    authenticate: async (request) => {
      const token = bearerToken(request);
      if (!token) return null;
      return entries.get(token) ?? null;
    },
  };
};

export const createAccessProviderFromEnv = ({
  env = process.env,
  variable = 'VIDEO_STUDIO_TOKENS_JSON',
} = {}) => {
  const raw = env[variable];
  if (!raw) return createDevelopmentAccessProvider();

  const config = JSON.parse(raw);
  return createStaticTokenAccessProvider({tokens: config, name: 'runtime-token'});
};

export const validateCredentialRef = (value) => {
  if (typeof value !== 'string') return false;
  return /^(env:[A-Z][A-Z0-9_]*|secret:[a-z0-9][a-z0-9/_-]*)$/.test(value);
};
