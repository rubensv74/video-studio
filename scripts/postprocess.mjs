import {spawnSync} from 'node:child_process';

const [input, output, profile='webm'] = process.argv.slice(2);
if (!input || !output) {
  console.error('Usage: npm run postprocess -- <input> <output> <webm|gif|audio>');
  process.exit(2);
}

let args;
if (profile === 'webm') {
  args = ['-y', '-i', input, '-c:v', 'libvpx-vp9', '-crf', '32', '-b:v', '0', '-c:a', 'libopus', output];
} else if (profile === 'gif') {
  args = ['-y', '-i', input, '-vf', 'fps=15,scale=960:-1:flags=lanczos', output];
} else if (profile === 'audio') {
  args = ['-y', '-i', input, '-vn', '-c:a', 'aac', '-b:a', '192k', output];
} else {
  console.error(`Unknown profile: ${profile}`);
  process.exit(2);
}

const result = spawnSync('ffmpeg', args, {stdio: 'inherit'});
process.exit(result.status ?? 1);
