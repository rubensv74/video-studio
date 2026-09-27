import type {
  CatalogResponse,
  HealthResponse,
  RunsResponse,
} from './types';

const request = async <T>(
  url: string,
  options?: RequestInit,
): Promise<T> => {
  const response = await fetch(url, {
    ...options,
    headers: {
      'content-type': 'application/json',
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

export const controlPlaneApi = {
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
        body: JSON.stringify(payload),
      },
    ),
  submitBatch: (path: string) =>
    request<{status: string; runId: string}>('/api/renders', {
      method: 'POST',
      body: JSON.stringify({kind: 'batch', path, dryRun: false}),
    }),
};
