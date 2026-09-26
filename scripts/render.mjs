import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const manifestFile = process.argv[2] || 'projects/demo-product/project.json';
const full = path.resolve(manifestFile);
const project = JSON.parse(fs.readFileSync(full, 'utf8'));

const validate = spawnSync(process.execPath, ['scripts/validate-project.mjs', manifestFile], {
  stdio: 'inherit',
});
if (validate.status !== 0) process.exit(validate.status ?? 1);

if (project.engine === 'remotion') {
  if (!['mp4', 'webm'].includes(project.output.format)) {
    console.error(
      `Remotion dispatcher supports mp4/webm in VS-G01. Use FFmpeg derivatives for ${project.output.format} until the media-stack gate is implemented.`,
    );
    process.exit(4);
  }

  const output = path.resolve(project.output.file);
  fs.mkdirSync(path.dirname(output), {recursive: true});

  const codec = project.output.format === 'webm' ? 'vp8' : 'h264';
  const args = [
    '--workspace',
    '@video-studio/remotion-studio',
    'exec',
    '--',
    'remotion',
    'render',
    'src/index.ts',
    project.compositionId,
    output,
    '--codec',
    codec,
    '--props',
    full,
  ];

  const result = spawnSync('npm', args, {stdio: 'inherit'});
  process.exit(result.status ?? 1);
}

console.error(
  'Motion Canvas projects are editor-rendered in VS-G01. Start with: npm run dev:motion-canvas',
);
process.exit(3);
