import fs from 'node:fs';
import path from 'node:path';

const assertPlainObject = (value, label) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must resolve to a JSON object`);
  }
};

export const resolveProjectData = ({project, manifestFile}) => {
  const result = {...(project.data?.inline ?? {})};
  const baseDir = path.dirname(path.resolve(manifestFile));

  for (const relativeFile of project.data?.jsonFiles ?? []) {
    const full = path.resolve(baseDir, relativeFile);
    const parsed = JSON.parse(fs.readFileSync(full, 'utf8'));
    assertPlainObject(parsed, relativeFile);
    Object.assign(result, parsed);
  }

  return {
    data: result,
    endpoints: [...(project.data?.endpoints ?? [])],
  };
};

export const resolveProjectDataAsync = async ({
  project,
  manifestFile,
  fetchImpl = globalThis.fetch,
  timeoutMs = 10_000,
}) => {
  const local = resolveProjectData({project, manifestFile});
  const result = {...local.data};

  if (local.endpoints.length === 0) {
    return {data: result, endpoints: []};
  }

  if (typeof fetchImpl !== 'function') {
    throw new Error('No fetch implementation is available for API data adapters');
  }

  const resolvedEndpoints = [];

  for (const endpoint of local.endpoints) {
    if (typeof endpoint !== 'string' || !/^https?:\/\//i.test(endpoint)) {
      throw new Error(`API endpoint must be http/https: ${String(endpoint)}`);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchImpl(endpoint, {
        headers: {accept: 'application/json'},
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`API endpoint ${endpoint} returned HTTP ${response.status}`);
      }

      const parsed = await response.json();
      assertPlainObject(parsed, endpoint);
      Object.assign(result, parsed);
      resolvedEndpoints.push(endpoint);
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    data: result,
    endpoints: resolvedEndpoints,
  };
};
