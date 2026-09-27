import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {loadProjectManifest, validateProject} from './lib/manifest.mjs';

const manifestFile = process.argv[2] || 'projects/demo-product/project.json';
const {project} = loadProjectManifest(manifestFile);
const errors = validateProject(project);

if (errors.length) {
  for (const error of errors) console.error(`FAIL ${error}`);
  process.exit(1);
}

const input = path.resolve(project.output.file);
if (!fs.existsSync(input)) {
  console.error(`FAIL primary render missing: ${input}`);
  process.exit(1);
}

const run = (label, args) => {
  const result = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    console.error(`FAIL derivative: ${label}`);
    process.exit(result.status ?? 1);
  }
  console.log(`PASS derivative: ${label}`);
};

for (const derivative of project.derivatives ?? []) {
  const output = path.resolve(derivative.file);
  fs.mkdirSync(path.dirname(output), {recursive: true});

  if (derivative.format === 'webm') {
    run(derivative.id, [
      '-i',
      input,
      '-c:v',
      'libvpx-vp9',
      '-row-mt',
      '1',
      '-crf',
      '36',
      '-b:v',
      '0',
      '-c:a',
      'libopus',
      '-b:a',
      '96k',
      output,
    ]);
    continue;
  }

  if (derivative.format === 'gif') {
    const fps = Number(derivative.fps ?? 12);
    const width = Number(derivative.width ?? 640);
    run(derivative.id, [
      '-i',
      input,
      '-vf',
      `fps=${fps},scale=${width}:-1:flags=lanczos`,
      output,
    ]);
    continue;
  }
  if (derivative.format === 'png-sequence') {
    const fps = Number(derivative.fps ?? 1);
    const width = Number(derivative.width ?? project.output.width);
    run(derivative.id, [
      '-i',
      input,
      '-vf',
      `fps=${fps},scale=${width}:-1:flags=lanczos`,
      output,
    ]);
    continue;
  }

  console.error(`FAIL unsupported derivative format: ${derivative.format}`);
  process.exit(2);
}

const normalization = project.audioNormalization;
if (normalization?.enabled) {
  const output = path.resolve(normalization.file);
  fs.mkdirSync(path.dirname(output), {recursive: true});
  const integratedLufs = Number(normalization.integratedLufs ?? -16);
  const truePeakDb = Number(normalization.truePeakDb ?? -1.5);
  const loudnessRange = Number(normalization.loudnessRange ?? 11);

  run('audio-normalized', [
    '-i',
    input,
    '-c:v',
    'copy',
    '-af',
    `loudnorm=I=${integratedLufs}:TP=${truePeakDb}:LRA=${loudnessRange}`,
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    output,
  ]);
}
