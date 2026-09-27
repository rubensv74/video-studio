export type HealthResponse = {
  status: 'ok';
  service: string;
  version: number;
  capabilities: string[];
  accessMode?: 'development' | 'required';
};

export type SessionResponse = {
  subject: string;
  role: 'viewer' | 'operator' | 'admin';
  provider: string;
  accessMode: 'development' | 'required';
};

export type ProjectSummary = {
  id: string;
  title: string;
  path: string;
  engine: string;
  theme: string;
  compositionId: string;
  output: {
    width: number;
    height: number;
    fps: number;
    format: string;
    file: string;
  };
};

export type PresetSummary = {
  id: string;
  width: number;
  height: number;
  fps: number;
};

export type ThemeSummary = {
  id: string;
  accent: string;
  background: string;
};

export type BatchSummary = {
  id: string;
  path: string;
  jobs: number;
  concurrency: number;
  worker: string;
};

export type CatalogResponse = {
  projects: ProjectSummary[];
  presets: PresetSummary[];
  themes: ThemeSummary[];
  batches: BatchSummary[];
};

export type RunSummary = {
  id: string;
  kind: 'project' | 'batch' | 'report';
  target: string;
  status: string;
  startedAt?: string;
  completedAt?: string;
  exitCode?: number | null;
  summary?: {
    total?: number;
    success?: number;
    cached?: number;
    failed?: number;
  };
};

export type RunsResponse = {
  runs: RunSummary[];
};

export type MediaAssetSummary = {
  id: string;
  kind: 'image' | 'tts' | 'transcription';
  provider: string;
  mediaType?: string;
  file?: string;
  createdAt?: string;
  metadata?: Record<string, unknown>;
};

export type MediaHistoryResponse = {
  assets: MediaAssetSummary[];
};

export type RuntimeServiceStatus = {
  status: 'local' | 'available' | 'unavailable';
  health?: Record<string, unknown>;
  capabilities?: Record<string, unknown> | null;
  circuit?: {
    state: string;
    failures: number;
    failureThreshold: number;
    resetTimeoutMs: number;
  } | null;
  error?: string;
};

export type RuntimeDiagnosticsResponse = {
  profile: 'local' | 'ci' | 'production' | string;
  production: boolean;
  services: {
    worker: RuntimeServiceStatus;
    store: RuntimeServiceStatus;
  };
};
