export const createLocalWorkerAdapter = ({execute}) => ({
  type: 'local',
  execute,
});

export const createHttpWorkerAdapter = ({
  endpoint,
  fetchImpl = globalThis.fetch,
  timeoutMs = 30_000,
}) => {
  if (!/^https?:\/\//i.test(endpoint ?? '')) {
    throw new Error('HTTP worker endpoint must be http/https');
  }
  if (typeof fetchImpl !== 'function') {
    throw new Error('No fetch implementation is available for HTTP worker');
  }

  return {
    type: 'http',
    execute: async (payload) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetchImpl(endpoint, {
          method: 'POST',
          headers: {'content-type': 'application/json', accept: 'application/json'},
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP worker returned ${response.status}`);
        }

        const body = await response.json();
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
          throw new Error('HTTP worker must return a JSON object');
        }
        return body;
      } finally {
        clearTimeout(timer);
      }
    },
  };
};
