import {CircuitBreaker, fetchWithTimeout, withRetry} from './resilience.mjs';

const ensureUrl = (value, label) => {
  if (!/^https?:\/\//i.test(value ?? '')) {
    throw new Error(`${label} must be http/https`);
  }
  return String(value).replace(/\/$/, '');
};

const jsonResponse = async (response, label) => {
  if (!response.ok) {
    const error = new Error(`${label} returned HTTP ${response.status}`);
    error.statusCode = response.status;
    throw error;
  }
  const body = await response.json();
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error(`${label} must return a JSON object`);
  }
  return body;
};

const retryable = (error) =>
  error?.code === 'TIMEOUT' ||
  error?.name === 'TypeError' ||
  Number(error?.statusCode) >= 500;

const authHeaders = async ({credentialRef, secretResolver}) => {
  if (!credentialRef) return {};
  if (!secretResolver?.resolve) {
    throw new Error('credentialRef requires a secret resolver');
  }
  const token = await secretResolver.resolve(credentialRef);
  return {authorization: `Bearer ${token}`};
};

export const createExternalWorkerRuntime = ({
  baseUrl,
  credentialRef,
  secretResolver,
  fetchImpl = globalThis.fetch,
  timeoutMs = 15_000,
  retry = {},
  breaker = new CircuitBreaker(),
} = {}) => {
  const base = ensureUrl(baseUrl, 'worker baseUrl');
  if (typeof fetchImpl !== 'function') {
    throw new Error('No fetch implementation is available');
  }

  const request = async (pathname, options = {}) =>
    breaker.execute(() =>
      withRetry(
        async () => {
          const authorization = await authHeaders({credentialRef, secretResolver});
          const response = await fetchWithTimeout(
            fetchImpl,
            `${base}${pathname}`,
            {
              ...options,
              headers: {
                accept: 'application/json',
                ...authorization,
                ...(options.body ? {'content-type': 'application/json'} : {}),
                ...(options.headers ?? {}),
              },
            },
            timeoutMs,
          );
          return jsonResponse(response, `worker ${pathname}`);
        },
        {
          attempts: retry.attempts ?? 3,
          baseDelayMs: retry.baseDelayMs ?? 50,
          maxDelayMs: retry.maxDelayMs ?? 500,
          shouldRetry: retry.shouldRetry ?? retryable,
          sleep: retry.sleep,
        },
      ),
    );

  return {
    type: 'external-http-worker',
    health: () => request('/health'),
    capabilities: () => request('/capabilities'),
    submit: (payload) =>
      request('/jobs', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    circuitStatus: () => breaker.status(),
  };
};

export const createExternalOperationalStore = ({
  baseUrl,
  credentialRef,
  secretResolver,
  fetchImpl = globalThis.fetch,
  timeoutMs = 10_000,
  retry = {},
  breaker = new CircuitBreaker(),
} = {}) => {
  const base = ensureUrl(baseUrl, 'store baseUrl');
  if (typeof fetchImpl !== 'function') {
    throw new Error('No fetch implementation is available');
  }

  const request = async (pathname, options = {}) =>
    breaker.execute(() =>
      withRetry(
        async () => {
          const authorization = await authHeaders({credentialRef, secretResolver});
          const response = await fetchWithTimeout(
            fetchImpl,
            `${base}${pathname}`,
            {
              ...options,
              headers: {
                accept: 'application/json',
                ...authorization,
                ...(options.body ? {'content-type': 'application/json'} : {}),
                ...(options.headers ?? {}),
              },
            },
            timeoutMs,
          );
          return jsonResponse(response, `store ${pathname}`);
        },
        {
          attempts: retry.attempts ?? 3,
          baseDelayMs: retry.baseDelayMs ?? 50,
          maxDelayMs: retry.maxDelayMs ?? 500,
          shouldRetry: retry.shouldRetry ?? retryable,
          sleep: retry.sleep,
        },
      ),
    );

  return {
    type: 'external-http-store',
    health: () => request('/health'),
    listRuns: async () => (await request('/runs')).runs ?? [],
    upsertRun: (record) =>
      request(`/runs/${encodeURIComponent(record.id)}`, {
        method: 'PUT',
        body: JSON.stringify(record),
      }),
    listAudit: async ({limit = 100} = {}) =>
      (await request(`/audit?limit=${encodeURIComponent(limit)}`)).events ?? [],
    appendAudit: (event) =>
      request('/audit', {
        method: 'POST',
        body: JSON.stringify(event),
      }),
    snapshot: () => request('/snapshot'),
    circuitStatus: () => breaker.status(),
  };
};

export const createRuntimeDiagnostics = ({
  profile,
  workerRuntime,
  operationalStore,
} = {}) => ({
  inspect: async () => {
    const services = {};

    if (workerRuntime?.health) {
      try {
        services.worker = {
          status: 'available',
          health: await workerRuntime.health(),
          capabilities: workerRuntime.capabilities
            ? await workerRuntime.capabilities()
            : null,
          circuit: workerRuntime.circuitStatus?.() ?? null,
        };
      } catch (error) {
        services.worker = {
          status: 'unavailable',
          error: error instanceof Error ? error.message : String(error),
          circuit: workerRuntime.circuitStatus?.() ?? null,
        };
      }
    } else {
      services.worker = {status: 'local'};
    }

    if (operationalStore?.health) {
      try {
        services.store = {
          status: 'available',
          health: await operationalStore.health(),
          circuit: operationalStore.circuitStatus?.() ?? null,
        };
      } catch (error) {
        services.store = {
          status: 'unavailable',
          error: error instanceof Error ? error.message : String(error),
          circuit: operationalStore.circuitStatus?.() ?? null,
        };
      }
    } else {
      services.store = {status: 'local'};
    }

    return {
      profile: profile?.id ?? 'local',
      production: Boolean(profile?.production),
      services,
    };
  },
});
