import React, {useEffect, useMemo, useState} from 'react';
import {controlPlaneApi} from './api';
import type {
  BatchSummary,
  CatalogResponse,
  HealthResponse,
  RunSummary,
  MediaAssetSummary,
} from './types';

const emptyCatalog: CatalogResponse = {
  projects: [],
  presets: [],
  themes: [],
  batches: [],
};

const StatusPill: React.FC<{status: string}> = ({status}) => (
  <span className={`status status--${status.toLowerCase()}`}>
    <span className="status__dot" />
    {status}
  </span>
);

const Metric: React.FC<{
  label: string;
  value: string | number;
  detail: string;
}> = ({label, value, detail}) => (
  <article className="metric-card">
    <span className="eyebrow">{label}</span>
    <strong>{value}</strong>
    <span className="muted">{detail}</span>
  </article>
);

export const App: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [catalog, setCatalog] = useState<CatalogResponse>(emptyCatalog);
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAssetSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    id: 'product-video',
    title: 'Product Video',
    preset: 'landscape-16x9',
    theme: 'default-dark',
  });
  const [mediaForm, setMediaForm] = useState({
    kind: 'image' as 'image' | 'tts' | 'transcription',
    value: 'Industrial blueprint visualization for a programmatic video.',
  });

  const refresh = async () => {
    try {
      setError(null);
      const [healthData, catalogData, runsData, mediaData] = await Promise.all([
        controlPlaneApi.health(),
        controlPlaneApi.catalog(),
        controlPlaneApi.runs(),
        controlPlaneApi.media(),
      ]);
      setHealth(healthData);
      setCatalog(catalogData);
      setRuns(runsData.runs);
      setMediaAssets(mediaData.assets);
      setForm((current) => ({
        ...current,
        preset: catalogData.presets.some((item) => item.id === current.preset)
          ? current.preset
          : catalogData.presets[0]?.id ?? current.preset,
        theme: catalogData.themes.some((item) => item.id === current.theme)
          ? current.theme
          : catalogData.themes[0]?.id ?? current.theme,
      }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  };

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 5000);
    return () => window.clearInterval(timer);
  }, []);

  const completedRuns = useMemo(
    () => runs.filter((run) => ['success', 'cached', 'completed'].includes(run.status)).length,
    [runs],
  );

  const createProject = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setBusy(true);
      setError(null);
      await controlPlaneApi.createProject(form);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  };

  const createMedia = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setBusy(true);
      setError(null);

      if (mediaForm.kind === 'image') {
        await controlPlaneApi.createMedia({
          kind: 'image',
          prompt: mediaForm.value,
          width: 1600,
          height: 900,
        });
      } else if (mediaForm.kind === 'tts') {
        await controlPlaneApi.createMedia({
          kind: 'tts',
          text: mediaForm.value,
          voice: 'fixture-neutral',
        });
      } else {
        await controlPlaneApi.createMedia({
          kind: 'transcription',
          audioFile: 'apps/remotion-studio/public/generated-media/ai-voice.wav',
          fixtureTranscript: mediaForm.value,
        });
      }

      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  };

  const launchBatch = async (batch: BatchSummary) => {
    try {
      setBusy(true);
      setError(null);
      await controlPlaneApi.submitBatch(batch.path);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand__mark">VS</div>
          <div>
            <strong>Video Studio</strong>
            <span>Control Plane</span>
          </div>
        </div>

        <nav>
          <a className="nav-item nav-item--active" href="#overview">Overview</a>
          <a className="nav-item" href="#projects">Projects</a>
          <a className="nav-item" href="#batches">Batches</a>
          <a className="nav-item" href="#runs">Runs</a>
          <a className="nav-item" href="#media">Media Lab</a>
        </nav>

        <div className="sidebar__footer">
          <span className="eyebrow">ENGINE</span>
          <StatusPill status={health?.status ?? 'loading'} />
          <small>{health?.capabilities.length ?? 0} capabilities online</small>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <span className="eyebrow">PROGRAMMATIC VIDEO PLATFORM</span>
            <h1>Render operations</h1>
          </div>
          <button className="button button--ghost" onClick={() => void refresh()}>
            Refresh
          </button>
        </header>

        {error && <div className="error-banner">{error}</div>}

        <section id="overview" className="hero-panel">
          <div>
            <span className="eyebrow">CONTROL PLANE / VS-G07</span>
            <h2>One operational surface for the entire render pipeline.</h2>
            <p>
              Create projects, submit batches, inspect cache-aware runs and keep
              the renderer independent from the UI and cloud provider.
            </p>
          </div>
          <div className="hero-panel__signal">
            <span>FOUNDATION</span>
            <strong>G01–G06</strong>
            <small>verified</small>
          </div>
        </section>

        <section className="metrics">
          <Metric label="PROJECTS" value={catalog.projects.length} detail="manifest-driven" />
          <Metric label="BATCHES" value={catalog.batches.length} detail="queue definitions" />
          <Metric label="RUNS" value={runs.length} detail={`${completedRuns} completed`} />
          <Metric label="THEMES" value={catalog.themes.length} detail="runtime brand packs" />
          <Metric label="ASSETS" value={mediaAssets.length} detail="generated media" />
        </section>

        <section id="projects" className="grid-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">PROJECT CATALOG</span>
              <h3>Video projects</h3>
            </div>
          </div>

          <div className="project-grid">
            {catalog.projects.map((project) => (
              <article className="project-card" key={project.path}>
                <div className="project-card__meta">
                  <span>{project.engine}</span>
                  <span>{project.theme}</span>
                </div>
                <h4>{project.title}</h4>
                <p>{project.id}</p>
                <div className="project-card__output">
                  <strong>{project.output.width}×{project.output.height}</strong>
                  <span>{project.output.fps} FPS · {project.output.format.toUpperCase()}</span>
                </div>
              </article>
            ))}

            <form className="project-card project-card--create" onSubmit={createProject}>
              <span className="eyebrow">NEW PROJECT</span>
              <input
                value={form.id}
                onChange={(event) => setForm({...form, id: event.target.value})}
                placeholder="project-id"
                required
              />
              <input
                value={form.title}
                onChange={(event) => setForm({...form, title: event.target.value})}
                placeholder="Project title"
                required
              />
              <div className="form-row">
                <select
                  value={form.preset}
                  onChange={(event) => setForm({...form, preset: event.target.value})}
                >
                  {catalog.presets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.id}
                    </option>
                  ))}
                </select>
                <select
                  value={form.theme}
                  onChange={(event) => setForm({...form, theme: event.target.value})}
                >
                  {catalog.themes.map((theme) => (
                    <option key={theme.id} value={theme.id}>
                      {theme.id}
                    </option>
                  ))}
                </select>
              </div>
              <button className="button" disabled={busy} type="submit">
                Create manifest
              </button>
            </form>
          </div>
        </section>

        <section id="batches" className="grid-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">QUEUE CONTROL</span>
              <h3>Render batches</h3>
            </div>
          </div>
          <div className="batch-list">
            {catalog.batches.map((batch) => (
              <article className="batch-row" key={batch.path}>
                <div>
                  <strong>{batch.id}</strong>
                  <span>{batch.jobs} jobs · concurrency {batch.concurrency} · {batch.worker}</span>
                </div>
                <button
                  className="button button--ghost"
                  disabled={busy}
                  onClick={() => void launchBatch(batch)}
                >
                  Launch batch
                </button>
              </article>
            ))}
          </div>
        </section>


        <section id="media" className="grid-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">MEDIA LAB / VS-G08</span>
              <h3>Generated media</h3>
            </div>
          </div>

          <div className="project-grid">
            <form className="project-card project-card--create" onSubmit={createMedia}>
              <span className="eyebrow">NEW GENERATED ASSET</span>
              <select
                value={mediaForm.kind}
                onChange={(event) =>
                  setMediaForm({
                    kind: event.target.value as 'image' | 'tts' | 'transcription',
                    value: mediaForm.value,
                  })
                }
              >
                <option value="image">Image</option>
                <option value="tts">TTS</option>
                <option value="transcription">Transcription</option>
              </select>
              <textarea
                value={mediaForm.value}
                onChange={(event) =>
                  setMediaForm({...mediaForm, value: event.target.value})
                }
                rows={5}
                placeholder="Prompt, text or transcript fixture"
                required
              />
              <button className="button" disabled={busy} type="submit">
                Generate asset
              </button>
              <small className="muted">
                Local mode uses deterministic fixtures. Production providers plug in through the HTTP media-provider boundary.
              </small>
            </form>

            {mediaAssets.slice(0, 8).map((asset) => (
              <article className="project-card" key={asset.id}>
                <div className="project-card__meta">
                  <span>{asset.kind}</span>
                  <span>{asset.provider}</span>
                </div>
                <h4>{asset.id}</h4>
                <p>{asset.file ?? 'provider-managed asset'}</p>
                <div className="project-card__output">
                  <strong>{asset.mediaType ?? 'generated media'}</strong>
                  <span>{asset.createdAt ?? 'current session'}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="runs" className="grid-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">OBSERVABILITY</span>
              <h3>Recent runs</h3>
            </div>
          </div>
          <div className="run-table">
            <div className="run-table__head">
              <span>Run</span>
              <span>Target</span>
              <span>Status</span>
              <span>Result</span>
            </div>
            {runs.slice(0, 12).map((run) => (
              <div className="run-table__row" key={run.id}>
                <code>{run.id}</code>
                <span>{run.target}</span>
                <StatusPill status={run.status} />
                <span>
                  {run.summary
                    ? `${run.summary.success ?? 0} ok / ${run.summary.cached ?? 0} cached / ${run.summary.failed ?? 0} failed`
                    : run.exitCode === undefined
                      ? '—'
                      : `exit ${run.exitCode ?? '…'}`}
                </span>
              </div>
            ))}
            {runs.length === 0 && (
              <div className="run-table__empty">No runs recorded yet.</div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};
