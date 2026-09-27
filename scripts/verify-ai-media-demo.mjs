import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const manifestFile = 'projects/ai-media-demo/project.json';
const project = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
const output = path.resolve(project.output.file);

const run = (cmd, args) => {
  const result = spawnSync(cmd, args, {encoding: 'utf8'});
  if (result.status !== 0) {
    process.stderr.write(result.stderr || '');
    process.exit(result.status ?? 1);
  }
  return result.stdout;
};

run(process.execPath, ['scripts/verify-render.mjs', manifestFile]);

const probe = JSON.parse(
  run('ffprobe', [
    '-v', 'error',
    '-show_entries', 'stream=codec_type,codec_name',
    '-of', 'json',
    output,
  ]),
);

const audio = (probe.streams ?? []).find((stream) => stream.codec_type === 'audio');
if (!audio) {
  console.error('FAIL AI media demo has no audio stream');
  process.exit(1);
}
console.log(`PASS AI media audio stream: ${audio.codec_name}`);

const required = [
  'apps/remotion-studio/public/generated-media/ai-image.svg',
  'apps/remotion-studio/public/generated-media/ai-voice.wav',
  'apps/remotion-studio/public/generated-media/ai-captions.srt',
  'output/generated-media/registry.json',
];

for (const file of required) {
  if (!fs.existsSync(file) || fs.statSync(file).size === 0) {
    console.error(`FAIL generated media evidence missing: ${file}`);
    process.exit(1);
  }
  console.log(`PASS generated media evidence: ${file}`);
}

const registry = JSON.parse(
  fs.readFileSync('output/generated-media/registry.json', 'utf8'),
);
const kinds = new Set((registry.assets ?? []).map((asset) => asset.kind));
for (const kind of ['image', 'tts', 'transcription']) {
  if (!kinds.has(kind)) {
    console.error(`FAIL registry missing asset kind: ${kind}`);
    process.exit(1);
  }
}

const srt = fs.readFileSync(
  'apps/remotion-studio/public/generated-media/ai-captions.srt',
  'utf8',
);
if (!/Video Studio keeps AI providers modular/.test(srt)) {
  console.error('FAIL generated captions do not contain expected transcript');
  process.exit(1);
}

const qa = path.resolve('output/ai-media-demo-frame.png');
run('ffmpeg', [
  '-y',
  '-ss', '1.5',
  '-i', output,
  '-frames:v', '1',
  '-update', '1',
  qa,
]);

if (!fs.existsSync(qa) || fs.statSync(qa).size < 20_000) {
  console.error('FAIL AI media QA frame missing or unexpectedly small');
  process.exit(1);
}

console.log(`PASS AI media QA frame: ${fs.statSync(qa).size} bytes`);
console.log('PASS VS-G08 physical AI-media integration contract');
