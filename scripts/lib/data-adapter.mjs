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
