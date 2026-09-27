import {getRuntimeProfile} from './runtime-profile.mjs';
import {createSecretResolver} from './secret-resolver.mjs';
import {
  createExternalOperationalStore,
  createExternalWorkerRuntime,
} from './external-runtime-adapter.mjs';
import {createSupabaseOperationalStore} from './supabase-operational-store.mjs';

const required = (env, key) => {
  const value = String(env[key] ?? '').trim();
  if (!value) throw new Error(`${key} is required in production runtime`);
  return value;
};

export const createRuntimeBindingsFromEnv = ({
  env = process.env,
  fetchImpl = globalThis.fetch,
  secretProvider,
} = {}) => {
  const runtimeProfile = getRuntimeProfile({env});
  const secretResolver = createSecretResolver({env, secretProvider});

  if (!runtimeProfile.externalProvidersRequired) {
    return {
      runtimeProfile,
      workerRuntime: undefined,
      operationalStore: undefined,
      runtimeSummary: {
        profile: runtimeProfile.id,
        worker: 'local',
        store: 'local',
      },
    };
  }

  const workerUrl = required(env, 'VIDEO_STUDIO_WORKER_URL');
  const workerCredentialRef = required(
    env,
    'VIDEO_STUDIO_WORKER_CREDENTIAL_REF',
  );
  const storeProvider = String(
    env.VIDEO_STUDIO_STORE_PROVIDER ?? 'http',
  ).trim().toLowerCase();

  const workerRuntime = createExternalWorkerRuntime({
    baseUrl: workerUrl,
    credentialRef: workerCredentialRef,
    secretResolver,
    fetchImpl,
  });

  let operationalStore;

  if (storeProvider === 'supabase') {
    operationalStore = createSupabaseOperationalStore({
      baseUrl: required(env, 'VIDEO_STUDIO_SUPABASE_URL'),
      secretRef: required(env, 'VIDEO_STUDIO_SUPABASE_SECRET_REF'),
      schema: String(
        env.VIDEO_STUDIO_SUPABASE_SCHEMA ?? 'video_studio_api',
      ).trim(),
      secretResolver,
      fetchImpl,
    });
  } else if (storeProvider === 'http') {
    operationalStore = createExternalOperationalStore({
      baseUrl: required(env, 'VIDEO_STUDIO_STORE_URL'),
      credentialRef: required(env, 'VIDEO_STUDIO_STORE_CREDENTIAL_REF'),
      secretResolver,
      fetchImpl,
    });
  } else {
    throw new Error(
      `Unsupported VIDEO_STUDIO_STORE_PROVIDER: ${storeProvider}. Expected http or supabase.`,
    );
  }

  return {
    runtimeProfile,
    workerRuntime,
    operationalStore,
    runtimeSummary: {
      profile: runtimeProfile.id,
      worker: 'external-http-worker',
      store:
        operationalStore.type === 'supabase-operational-store'
          ? 'supabase-operational-store'
          : 'external-http-store',
    },
  };
};
