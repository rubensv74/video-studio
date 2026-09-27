import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {loadProjectManifest, getProjectDurationSeconds} from './lib/manifest.mjs';

const manifestFile = process.argv[2] || 'projects/demo-product/project.json';
const {project} = loadProjectManifest(manifestFile);
const failures = [];

const probe = (file) => {
  const result = spawnSync(
    'ffprobe',
    [
      '-v',
      'error',
      '-show_entries',
      'format=duration,size,format_name:stream=codec_name,codec_type,width,height,r_frame_rate,sample_rate,channels',
      '-of',
      'json',
      file,
    ],
    {encoding: 'utf8'},
  );
  if (result.status !== 0) {
    throw new Error(result.stderr || `ffprobe failed for ${file}`);
  }
  return JSON.parse(result.stdout);
};

const expectFile = (label, file) => {
  const full = path.resolve(file);
  if (!fs.existsSync(full)) {
    failures.push(`${label} missing: ${full}`);
    return null;
  }
  return {full, data: probe(full)};
};

const primary = expectFile('primary', project.output.file);
if (primary) {
  const audio = primary.data.streams?.find((s) => s.codec_type === 'audio');
  if (!audio) failures.push('primary render must contain an audio stream');
  else console.log(`PASS primary audio: ${audio.codec_name} ${audio.sample_rate ?? ''}Hz`);
}

for (const derivative of project.derivatives ?? []) {
  const item = expectFile(`derivative ${derivative.id}`, derivative.file);
  if (!item) continue;
  const video = item.data.streams?.find((s) => s.codec_type === 'video');
  const audio = item.data.streams?.find((s) => s.codec_type === 'audio');

  if (derivative.format === 'webm') {
    if (video?.codec_name !== 'vp9') {
      failures.push(`${derivative.id} expected vp9; found ${video?.codec_name}`);
    }
    if (audio?.codec_name !== 'opus') {
      failures.push(`${derivative.id} expected opus; found ${audio?.codec_name}`);
    }
  }

  if (derivative.format === 'gif' && video?.codec_name !== 'gif') {
    failures.push(`${derivative.id} expected gif; found ${video?.codec_name}`);
  }

  if (derivative.format === 'png-sequence') {
    const directory = path.dirname(path.resolve(derivative.file));
    const basename = path.basename(derivative.file);
    const token = basename.match(/%0?(\d*)d/);
    const width = token?.[1] ? Number(token[1]) : null;
    const prefix = basename.slice(0, token?.index ?? 0);
    const suffix = token ? basename.slice((token.index ?? 0) + token[0].length) : '.png';
    const frames = fs.existsSync(directory)
      ? fs
          .readdirSync(directory)
          .filter((name) =>
            name.startsWith(prefix) &&
            name.endsWith(suffix) &&
            (width === null ||
              name.slice(prefix.length, name.length - suffix.length).length === width),
          )
          .sort()
      : [];

    if (frames.length === 0) {
      failures.push(`${derivative.id} produced no PNG frames`);
    } else {
      const first = probe(path.join(directory, frames[0]));
      const firstVideo = first.streams?.find((s) => s.codec_type === 'video');
      if (firstVideo?.codec_name !== 'png') {
        failures.push(`${derivative.id} expected png frames; found ${firstVideo?.codec_name}`);
      } else {
        console.log(`PASS derivative ${derivative.id}: ${frames.length} PNG frames`);
      }
    }
    continue;
  }

  console.log(`PASS derivative ${derivative.id}: ${video?.codec_name ?? 'no-video'}`);
}

const normalization = project.audioNormalization;
if (normalization?.enabled) {
  const item = expectFile('normalized output', normalization.file);
  if (item) {
    const audio = item.data.streams?.find((s) => s.codec_type === 'audio');
    if (!audio) {
      failures.push('normalized output must contain audio');
    } else {
      const target = Number(normalization.integratedLufs ?? -16);
      const tp = Number(normalization.truePeakDb ?? -1.5);
      const lra = Number(normalization.loudnessRange ?? 11);
      const analysis = spawnSync(
        'ffmpeg',
        [
          '-hide_banner',
          '-nostats',
          '-i',
          item.full,
          '-af',
          `loudnorm=I=${target}:TP=${tp}:LRA=${lra}:print_format=json`,
          '-f',
          'null',
          '-',
        ],
        {encoding: 'utf8'},
      );
      const stderr = analysis.stderr ?? '';
      const match = stderr.match(/\{[\s\S]*?"input_i"[\s\S]*?\}/g)?.at(-1);
      if (!match) {
        failures.push('unable to measure normalized loudness');
      } else {
        const report = JSON.parse(match);
        const measured = Number(report.input_i);
        if (!Number.isFinite(measured) || Math.abs(measured - target) > 1.5) {
          failures.push(`normalized loudness expected ~${target} LUFS; measured ${report.input_i}`);
        } else {
          console.log(`PASS normalized loudness: ${measured} LUFS (target ${target})`);
        }
      }
    }
  }
}

const duration = getProjectDurationSeconds(project);
if (duration <= 0) failures.push('project duration must be positive');

if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exit(1);
}

console.log('PASS VS-G03 media stack contract');
