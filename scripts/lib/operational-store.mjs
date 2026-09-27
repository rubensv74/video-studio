import fs from 'node:fs';
import path from 'node:path';

const emptyState = () => ({
  version: 1,
  runs: [],
  audit: [],
});

const clone = (value) => JSON.parse(JSON.stringify(value));

export const createOperationalStore = ({
  file = 'output/operations/store.json',
  maxAuditEvents = 2000,
} = {}) => {
  const absoluteFile = path.resolve(file);
  fs.mkdirSync(path.dirname(absoluteFile), {recursive: true});

  const read = () => {
    if (!fs.existsSync(absoluteFile)) return emptyState();
    const parsed = JSON.parse(fs.readFileSync(absoluteFile, 'utf8'));
    if (parsed.version !== 1) {
      throw new Error('Unsupported operational store version');
    }
    parsed.runs ??= [];
    parsed.audit ??= [];
    return parsed;
  };

  const write = (state) => {
    const temp = `${absoluteFile}.${process.pid}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(state, null, 2) + '\n');
    fs.renameSync(temp, absoluteFile);
  };

  const update = (mutator) => {
    const state = read();
    mutator(state);
    write(state);
    return clone(state);
  };

  return {
    file: absoluteFile,

    snapshot: () => clone(read()),

    listRuns: () => clone(read().runs),

    upsertRun: (record) => {
      update((state) => {
        const index = state.runs.findIndex((item) => item.id === record.id);
        if (index >= 0) state.runs[index] = {...state.runs[index], ...record};
        else state.runs.unshift(record);
      });
      return clone(record);
    },

    appendAudit: (event) => {
      const record = {
        id: event.id ?? `audit-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`,
        timestamp: event.timestamp ?? new Date().toISOString(),
        ...event,
      };
      update((state) => {
        state.audit.unshift(record);
        if (state.audit.length > maxAuditEvents) {
          state.audit.length = maxAuditEvents;
        }
      });
      return clone(record);
    },

    listAudit: ({limit = 100} = {}) =>
      clone(read().audit.slice(0, Math.max(1, Math.min(limit, 1000)))),

    clear: () => write(emptyState()),
  };
};
