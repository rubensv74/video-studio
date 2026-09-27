import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {loadProjectManifest} from './lib/manifest.mjs';

const manifestFile = process.argv[2] || 'projects/advanced-visuals-demo/project.json';
const {project} = loadProjectManifest(manifestFile);
const dir = path.resolve('output/advanced-visuals-qa');
const errors = [];

for (const scene of project.scenes) {
  const file = path.join(dir, `${scene.id}.png`);
  if (!fs.existsSync(file)) {
    errors.push(`missing QA frame: ${scene.id}`);
    continue;
  }
  const size = fs.statSync(file).size;
  if (size < 10_000) errors.push(`QA frame too small: ${scene.id} (${size} bytes)`);

  const probe = spawnSync(
    'ffprobe',
    [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=codec_name,width,height',
      '-of', 'json',
      file,
    ],
    {encoding: 'utf8'},
  );
  if (probe.status !== 0) {
    errors.push(`ffprobe failed: ${scene.id}`);
    continue;
  }
  const stream = JSON.parse(probe.stdout).streams?.[0];
  if (stream?.codec_name !== 'png') errors.push(`${scene.id} codec is not png`);
  if (Number(stream?.width) !== project.output.width) errors.push(`${scene.id} width mismatch`);
  if (Number(stream?.height) !== project.output.height) errors.push(`${scene.id} height mismatch`);
  console.log(`PASS QA frame ${scene.id}: ${size} bytes`);
}

if (errors.length) {
  errors.forEach((error) => console.error(`FAIL ${error}`));
  process.exit(1);
}
console.log('PASS VS-G04 QA frame contract');
