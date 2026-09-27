import type {
  CatalogResponse,
  HealthResponse,
  RunsResponse,
} from './types';

const storageKey = 'video-studio-control-plane-api-key';

let apiKey =
  typeof window === 'undefined'
    ? ''
    : window.sessionStorage.getItem(storageKey) ?? '';

const request = async <T>(
  url: string,
  options?: RequestInit,
): Promise<T> => {
  const response = await fetch(url, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(apiKey ? {authorization: `Bearer ${apiKey}`} : {}),
      ...(options?.headers ?? {}),
    },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof body?.error === 'string'
        ? body.error
        : `Request failed: ${response.status}`,
    );
  }
  return body as T;
};

const mutationHeaders = () => ({
  'idempotency-key': crypto.randomUUID(),
});

export const controlPlaneApi = {
  getApiKey: () => apiKey,
  setApiKey: (value: string) => {
    apiKey = value.trim();
    if (typeof window !== 'undefined') {
      if (apiKey) window.sessionStorage.setItem(storageKey, apiKey);
      else window.sessionStorage.removeItem(storageKey);
    }
  },
  health: () => request<HealthResponse>('/api/health'),
  catalog: () => request<CatalogResponse>('/api/catalog'),
  runs: () => request<RunsResponse>('/api/runs'),
  createProject: (payload: {
    id: string;
    title: string;
    preset: string;
    theme: string;
  }) =>
    request<{status: string; project: {id: string; path: string}}>(
      '/api/projects',
      {
        method: 'POST',
        headers: mutationHeaders(),
        body: JSON.stringify(payload),
      },
    ),
  submitBatch: (path: string) =>
    request<{status: string; runId: string}>('/api/renders', {
      method: 'POST',
      headers: mutationHeaders(),
      body: JSON.stringify({kind: 'batch', path, dryRun: false}),
    }),
};
