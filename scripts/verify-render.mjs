import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {
  getProjectDurationSeconds,
  loadProjectManifest,
  validateProject,
} from './lib/manifest.mjs';

const manifestFile = process.argv[2] || 'projects/demo-product/project.json';
const {project} = loadProjectManifest(manifestFile);
const manifestErrors = validateProject(project);

if (manifestErrors.length) {
  for (const error of manifestErrors) console.error(`FAIL manifest: ${error}`);
  process.exit(1);
}

const mediaFile = path.resolve(process.argv[3] || project.output.file);
if (!fs.existsSync(mediaFile)) {
  console.error(`FAIL render output does not exist: ${mediaFile}`);
  process.exit(1);
}

const result = spawnSync(
  'ffprobe',
  [
    '-v',
    'error',
    '-show_entries',
    'format=duration,size:stream=codec_name,codec_type,width,height,r_frame_rate',
    '-of',
    'json',
    mediaFile,
  ],
  {encoding: 'utf8'},
);

if (result.status !== 0) {
  console.error(result.stderr || 'ffprobe failed');
  process.exit(result.status ?? 1);
}

let probe;
try {
  probe = JSON.parse(result.stdout);
} catch {
  console.error('FAIL ffprobe returned invalid JSON');
  process.exit(1);
}

const video = (probe.streams || []).find((stream) => stream.codec_type === 'video');
if (!video) {
  console.error('FAIL no video stream found');
  process.exit(1);
}

const errors = [];
const expectedCodec = project.output.format === 'webm' ? 'vp8' : 'h264';

if (video.codec_name !== expectedCodec) {
  errors.push(`codec expected ${expectedCodec}; found ${video.codec_name}`);
}
if (Number(video.width) !== project.output.width) {
  errors.push(`width expected ${project.output.width}; found ${video.width}`);
}
if (Number(video.height) !== project.output.height) {
  errors.push(`height expected ${project.output.height}; found ${video.height}`);
}

const parseRate = (value) => {
  if (typeof value !== 'string') return Number.NaN;
  const [numerator, denominator = '1'] = value.split('/').map(Number);
  return numerator / denominator;
};

const actualFps = parseRate(video.r_frame_rate);
if (!Number.isFinite(actualFps) || Math.abs(actualFps - project.output.fps) > 0.01) {
  errors.push(`fps expected ${project.output.fps}; found ${video.r_frame_rate}`);
}

const expectedDuration = getProjectDurationSeconds(project);
const actualDuration = Number(probe.format?.duration);
const durationTolerance = Math.max(0.15, 2 / project.output.fps);
if (
  !Number.isFinite(actualDuration) ||
  Math.abs(actualDuration - expectedDuration) > durationTolerance
) {
  errors.push(
    `duration expected ${expectedDuration}s ± ${durationTolerance.toFixed(3)}s; found ${String(probe.format?.duration)}s`,
  );
}

const size = Number(probe.format?.size);
if (!Number.isFinite(size) || size <= 0) {
  errors.push(`file size must be > 0; found ${String(probe.format?.size)}`);
}

if (errors.length) {
  for (const error of errors) console.error(`FAIL ${error}`);
  process.exit(1);
}

console.log(`PASS file: ${mediaFile}`);
console.log(`PASS codec: ${video.codec_name}`);
console.log(`PASS geometry: ${video.width}x${video.height}`);
console.log(`PASS fps: ${actualFps}`);
console.log(`PASS duration: ${actualDuration}s`);
console.log(`PASS size: ${size} bytes`);
console.log('PASS VS-G02 rendered-media contract');
