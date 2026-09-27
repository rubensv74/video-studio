import {getRuntimeProfile} from './runtime-profile.mjs';
import {createSecretResolver} from './secret-resolver.mjs';
import {
  createExternalOperationalStore,
  createExternalWorkerRuntime,
} from './external-runtime-adapter.mjs';

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
  const storeUrl = required(env, 'VIDEO_STUDIO_STORE_URL');
  const storeCredentialRef = required(
    env,
    'VIDEO_STUDIO_STORE_CREDENTIAL_REF',
  );

  const workerRuntime = createExternalWorkerRuntime({
    baseUrl: workerUrl,
    credentialRef: workerCredentialRef,
    secretResolver,
    fetchImpl,
  });

  const operationalStore = createExternalOperationalStore({
    baseUrl: storeUrl,
    credentialRef: storeCredentialRef,
    secretResolver,
    fetchImpl,
  });

  return {
    runtimeProfile,
    workerRuntime,
    operationalStore,
    runtimeSummary: {
      profile: runtimeProfile.id,
      worker: 'external-http-worker',
      store: 'external-http-store',
    },
  };
};
