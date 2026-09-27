import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {loadProjectManifest, validateProject} from './lib/manifest.mjs';

const manifestFile = process.argv[2] || 'projects/advanced-visuals-demo/project.json';
const {project} = loadProjectManifest(manifestFile);
const errors = validateProject(project);
if (errors.length) {
  errors.forEach((error) => console.error(`FAIL ${error}`));
  process.exit(1);
}

const mediaFile = path.resolve(project.output.file);
const outputDir = path.resolve('output/advanced-visuals-qa');
fs.mkdirSync(outputDir, {recursive: true});

let cursor = 0;
for (const scene of project.scenes) {
  const midpoint = cursor + scene.durationSeconds / 2;
  const output = path.join(outputDir, `${scene.id}.png`);
  const result = spawnSync(
    'ffmpeg',
    ['-y', '-ss', String(midpoint), '-i', mediaFile, '-frames:v', '1', output],
    {stdio: 'inherit'},
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
  cursor += scene.durationSeconds;
}

console.log(`PASS extracted ${project.scenes.length} advanced-visual QA frames`);
