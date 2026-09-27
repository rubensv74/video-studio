export const executeQueue = async ({jobs, concurrency, executeJob}) => {
  const results = new Array(jobs.length);
  let cursor = 0;

  const worker = async () => {
    while (true) {
      const index = cursor++;
      if (index >= jobs.length) return;

      const job = jobs[index];
      const started = Date.now();
      const startedAt = new Date(started).toISOString();

      try {
        const value = await executeJob(job, index);
        const ended = Date.now();
        results[index] = {
          jobId: job.id,
          status: value?.status ?? 'success',
          cacheHit: Boolean(value?.cacheHit),
          output: value?.output ?? null,
          cacheKey: value?.cacheKey ?? null,
          worker: value?.worker ?? null,
          startedAt,
          completedAt: new Date(ended).toISOString(),
          durationMs: ended - started,
          detail: value?.detail ?? null,
        };
      } catch (error) {
        const ended = Date.now();
        results[index] = {
          jobId: job.id,
          status: 'failed',
          cacheHit: false,
          output: null,
          cacheKey: null,
          worker: null,
          startedAt,
          completedAt: new Date(ended).toISOString(),
          durationMs: ended - started,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  };

  const workers = Array.from(
    {length: Math.max(1, Math.min(concurrency, jobs.length))},
    () => worker(),
  );

  await Promise.all(workers);
  return results;
};
