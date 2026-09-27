import fs from 'node:fs';
import path from 'node:path';

const initialState = () => ({
  version: 1,
  runs: {},
  audit: [],
  idempotency: {},
});

const ensureState = (value) => {
  if (!value || value.version !== 1 || typeof value !== 'object') {
    throw new Error('Unsupported Control Plane state format');
  }
  value.runs ??= {};
  value.audit ??= [];
  value.idempotency ??= {};
  return value;
};

export const createJsonControlPlaneStore = ({
  file = '.video-studio/control-plane-state.json',
  auditLimit = 10_000,
} = {}) => {
  const fullPath = path.resolve(file);

  const read = () => {
    if (!fs.existsSync(fullPath)) return initialState();
    return ensureState(JSON.parse(fs.readFileSync(fullPath, 'utf8')));
  };

  const write = (state) => {
    fs.mkdirSync(path.dirname(fullPath), {recursive: true});
    const temp = `${fullPath}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(state, null, 2) + '\n');
    fs.renameSync(temp, fullPath);
  };

  const mutate = (change) => {
    const state = read();
    const result = change(state);
    if (state.audit.length > auditLimit) {
      state.audit = state.audit.slice(-auditLimit);
    }
    write(state);
    return result;
  };

  return {
    file: fullPath,
    getRuns: () => Object.values(read().runs),
    getRun: (id) => read().runs[id] ?? null,
    upsertRun: (record) =>
      mutate((state) => {
        state.runs[record.id] = {...record};
        return state.runs[record.id];
      }),
    appendAudit: (event) =>
      mutate((state) => {
        const record = {
          id: `audit-${Date.now()}-${state.audit.length + 1}`,
          at: new Date().toISOString(),
          ...event,
        };
        state.audit.push(record);
        return record;
      }),
    getAudit: ({limit = 200} = {}) =>
      read().audit.slice(-Math.max(1, Math.min(limit, 1000))).reverse(),
    getIdempotency: (scope, key) =>
      read().idempotency[`${scope}:${key}`] ?? null,
    putIdempotency: (scope, key, record) =>
      mutate((state) => {
        state.idempotency[`${scope}:${key}`] = {...record};
        return state.idempotency[`${scope}:${key}`];
      }),
  };
};
