export type HealthResponse = {
  status: 'ok';
  service: string;
  version: number;
  capabilities: string[];
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
