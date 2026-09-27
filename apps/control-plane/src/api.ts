import type {
  CatalogResponse,
  HealthResponse,
  RunsResponse,
  MediaHistoryResponse,
  SessionResponse,
  RuntimeDiagnosticsResponse,
} from './types';

const tokenKey = 'video-studio.access-token';

const apiBase = String(
  import.meta.env.VITE_CONTROL_PLANE_API_BASE_URL ?? '',
).replace(/\/$/, '');

const apiUrl = (pathname: string) =>
  apiBase ? `${apiBase}${pathname}` : pathname;

export const setControlPlaneAccessToken = (token: string) => {
  if (typeof window === 'undefined') return;
  const value = token.trim();
  if (value) window.localStorage.setItem(tokenKey, value);
  else window.localStorage.removeItem(tokenKey);
};

export const getControlPlaneAccessToken = () => {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(tokenKey) ?? '';
};

const request = async <T>(
  url: string,
  options?: RequestInit,
): Promise<T> => {
  const token = getControlPlaneAccessToken();
  const response = await fetch(apiUrl(url), {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(token ? {authorization: `Bearer ${token}`} : {}),
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
  session: () => request<SessionResponse>('/api/session'),
  runtime: () => request<RuntimeDiagnosticsResponse>('/api/runtime'),
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
  media: () => request<MediaHistoryResponse>('/api/media'),
  createMedia: (payload:
    | {kind: 'image'; prompt: string; width?: number; height?: number}
    | {kind: 'tts'; text: string; voice?: string}
    | {kind: 'transcription'; audioFile: string; fixtureTranscript?: string}
  ) =>
    request<{status: string; asset: unknown}>('/api/media', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
