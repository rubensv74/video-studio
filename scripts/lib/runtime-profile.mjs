const profiles = {
  local: {
    id: 'local',
    production: false,
    externalProvidersRequired: false,
  },
  ci: {
    id: 'ci',
    production: false,
    externalProvidersRequired: false,
  },
  production: {
    id: 'production',
    production: true,
    externalProvidersRequired: true,
  },
};

export const getRuntimeProfile = ({
  env = process.env,
  variable = 'VIDEO_STUDIO_PROFILE',
} = {}) => {
  const requested = String(env[variable] ?? 'local').trim().toLowerCase();
  const profile = profiles[requested];
  if (!profile) {
    throw new Error(
      `Unsupported runtime profile: ${requested}. Expected local, ci or production.`,
    );
  }
  return {...profile};
};

export const listRuntimeProfiles = () =>
  Object.values(profiles).map((profile) => ({...profile}));
