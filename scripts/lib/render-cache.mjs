import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const sha256 = (value) =>
  crypto.createHash('sha256').update(value).digest('hex');

export const hashFile = (file) =>
  sha256(fs.readFileSync(file));

const collectFiles = (entry) => {
  const full = path.resolve(entry);
  if (!fs.existsSync(full)) return [];

  const stat = fs.statSync(full);
  if (stat.isFile()) return [full];

  const files = [];
  for (const item of fs.readdirSync(full, {withFileTypes: true})) {
    if (['node_modules', '.git', 'output', '.generated'].includes(item.name)) {
      continue;
    }
    const child = path.join(full, item.name);
    if (item.isDirectory()) files.push(...collectFiles(child));
    else if (item.isFile()) files.push(child);
  }
  return files;
};

const fingerprintFiles = (files) => {
  const hash = crypto.createHash('sha256');
  for (const file of [...files].sort()) {
    hash.update(path.relative(process.cwd(), file).replaceAll('\\', '/'));
    hash.update('\0');
    hash.update(fs.readFileSync(file));
    hash.update('\0');
  }
  return hash.digest('hex');
};

export const computeRendererFingerprint = () => {
  const roots = [
    'apps/remotion-studio/src',
    'apps/remotion-studio/public',
    'packages/contracts/src',
    'packages/design-system/src',
    'themes',
    'presets',
    'package-lock.json',
  ];
  return fingerprintFiles(roots.flatMap(collectFiles));
};

export const computeRenderCacheKey = (
  manifestFile,
  {rendererFingerprint = computeRendererFingerprint()} = {},
) => {
  const fullManifest = path.resolve(manifestFile);
  const projectFiles = collectFiles(path.dirname(fullManifest));

  const hash = crypto.createHash('sha256');
  hash.update('video-studio-render-cache:v1\0');
  hash.update(rendererFingerprint);
  hash.update('\0');
  hash.update(fingerprintFiles(projectFiles));
  return hash.digest('hex');
};

export const cacheRecordPath = (cacheDir, key) =>
  path.resolve(cacheDir, `${key}.json`);

export const readRenderCache = ({cacheDir, key, outputFile}) => {
  const recordFile = cacheRecordPath(cacheDir, key);
  const output = path.resolve(outputFile);

  if (!fs.existsSync(recordFile) || !fs.existsSync(output)) return null;

  const record = JSON.parse(fs.readFileSync(recordFile, 'utf8'));
  if (record.version !== 1 || record.key !== key) return null;
  if (record.expiresAt && Date.parse(record.expiresAt) <= Date.now()) return null;
  if (path.resolve(record.outputFile) !== output) return null;

  const actualHash = hashFile(output);
  if (actualHash !== record.outputSha256) return null;

  return record;
};

export const writeRenderCache = ({
  cacheDir,
  key,
  jobId,
  manifestFile,
  outputFile,
  retentionDays,
}) => {
  fs.mkdirSync(path.resolve(cacheDir), {recursive: true});

  const createdAt = new Date();
  const expiresAt = new Date(
    createdAt.getTime() + retentionDays * 24 * 60 * 60 * 1000,
  );

  const record = {
    version: 1,
    key,
    jobId,
    manifestFile: path.resolve(manifestFile),
    outputFile: path.resolve(outputFile),
    outputSha256: hashFile(path.resolve(outputFile)),
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    retentionDays,
  };

  fs.writeFileSync(
    cacheRecordPath(cacheDir, key),
    JSON.stringify(record, null, 2) + '\n',
  );

  return record;
};
