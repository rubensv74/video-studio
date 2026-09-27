import {CircuitBreaker, fetchWithTimeout, withRetry} from './resilience.mjs';

const ensureUrl = (value) => {
  if (!/^https:\/\/[^/]+\.supabase\.co$/i.test(String(value ?? '').replace(/\/$/, ''))) {
    throw new Error('Supabase URL must be an https://<project>.supabase.co origin');
  }
  return String(value).replace(/\/$/, '');
};

const validateSchema = (value) => {
  const schema = String(value ?? 'video_studio_api');
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(schema)) {
    throw new Error('Supabase schema name is invalid');
  }
  return schema;
};

const retryable = (error) =>
  error?.code === 'TIMEOUT' ||
  error?.name === 'TypeError' ||
  Number(error?.statusCode) >= 500;

const asArray = (body, label) => {
  if (!Array.isArray(body)) throw new Error(`${label} must return a JSON array`);
  return body;
};

export const createSupabaseOperationalStore = ({
  baseUrl,
  secretRef,
  secretResolver,
  schema = 'video_studio_api',
  fetchImpl = globalThis.fetch,
  timeoutMs = 10_000,
  retry = {},
  breaker = new CircuitBreaker(),
} = {}) => {
  const origin = ensureUrl(baseUrl);
  const profile = validateSchema(schema);

  if (!secretRef) throw new Error('Supabase secretRef is required');
  if (!secretResolver?.resolve) {
    throw new Error('Supabase secretRef requires a secret resolver');
  }
  if (typeof fetchImpl !== 'function') {
    throw new Error('No fetch implementation is available');
  }

  const request = async (resource, {
    method = 'GET',
    query = '',
    body,
    prefer,
  } = {}) =>
    breaker.execute(() =>
      withRetry(
        async () => {
          const secret = await secretResolver.resolve(secretRef);
          const isRead = method === 'GET' || method === 'HEAD';
          const headers = {
            accept: 'application/json',
            apikey: secret,
            ...(isRead
              ? {'Accept-Profile': profile}
              : {'Content-Profile': profile}),
            ...(body === undefined ? {} : {'content-type': 'application/json'}),
            ...(prefer ? {Prefer: prefer} : {}),
          };

          const response = await fetchWithTimeout(
            fetchImpl,
            `${origin}/rest/v1/${resource}${query}`,
            {
              method,
              headers,
              ...(body === undefined ? {} : {body: JSON.stringify(body)}),
            },
            timeoutMs,
          );

          if (!response.ok) {
            const detail = await response.text().catch(() => '');
            const error = new Error(
              `Supabase ${resource} returned HTTP ${response.status}${detail ? `: ${detail.slice(0, 240)}` : ''}`,
            );
            error.statusCode = response.status;
            throw error;
          }

          if (response.status === 204) return null;
          const text = await response.text();
          return text ? JSON.parse(text) : null;
        },
        {
          attempts: retry.attempts ?? 3,
          baseDelayMs: retry.baseDelayMs ?? 75,
          maxDelayMs: retry.maxDelayMs ?? 750,
          shouldRetry: retry.shouldRetry ?? retryable,
          sleep: retry.sleep,
        },
      ),
    );

  return {
    type: 'supabase-operational-store',
    provider: 'supabase',
    schema: profile,

    health: async () => {
      await request('runs', {
        query: '?select=id&limit=1',
      });
      return {
        status: 'ok',
        provider: 'supabase',
        schema: profile,
      };
    },

    listRuns: async () => {
      const rows = asArray(
        await request('runs', {
          query: '?select=payload&order=updated_at.desc',
        }),
        'Supabase runs',
      );
      return rows.map((row) => row.payload).filter(Boolean);
    },

    upsertRun: async (record) => {
      const updatedAt =
        record.completedAt ??
        record.startedAt ??
        new Date().toISOString();
      const rows = asArray(
        await request('runs', {
          method: 'POST',
          query: '?on_conflict=id',
          prefer: 'resolution=merge-duplicates,return=representation',
          body: [{
            id: record.id,
            status: record.status ?? 'unknown',
            payload: record,
            updated_at: updatedAt,
          }],
        }),
        'Supabase run upsert',
      );
      return rows[0]?.payload ?? record;
    },

    appendAudit: async (event) => {
      const record = {
        ...event,
        timestamp: event.timestamp ?? new Date().toISOString(),
      };
      const rows = asArray(
        await request('audit_events', {
          method: 'POST',
          prefer: 'return=representation',
          body: [{
            action: record.action ?? 'unknown',
            outcome: record.outcome ?? 'unknown',
            payload: record,
            created_at: record.timestamp,
          }],
        }),
        'Supabase audit insert',
      );
      return rows[0]?.payload ?? record;
    },

    listAudit: async ({limit = 100} = {}) => {
      const bounded = Math.max(1, Math.min(Number(limit) || 100, 1000));
      const rows = asArray(
        await request('audit_events', {
          query: `?select=payload&order=created_at.desc&limit=${bounded}`,
        }),
        'Supabase audit list',
      );
      return rows.map((row) => row.payload).filter(Boolean);
    },

    snapshot: async () => {
      const [runs, audit] = await Promise.all([
        request('runs', {
          query: '?select=payload&order=updated_at.desc',
        }),
        request('audit_events', {
          query: '?select=payload&order=created_at.desc&limit=1000',
        }),
      ]);
      return {
        version: 1,
        provider: 'supabase',
        runs: asArray(runs, 'Supabase runs')
          .map((row) => row.payload)
          .filter(Boolean),
        audit: asArray(audit, 'Supabase audit')
          .map((row) => row.payload)
          .filter(Boolean),
      };
    },

    circuitStatus: () => breaker.status(),
  };
};
