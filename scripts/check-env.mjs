import {spawnSync} from 'node:child_process';

const checks = [
  ['node', ['--version']],
  ['npm', ['--version']],
  ['ffmpeg', ['-version']],
  ['ffprobe', ['-version']],
];

let failed = false;
for (const [cmd, args] of checks) {
  const result = spawnSync(cmd, args, {encoding: 'utf8'});
  const ok = result.status === 0;
  const version = ok ? (result.stdout || result.stderr).split('\n')[0].trim() : 'not found';
  console.log(`${ok ? 'PASS' : 'FAIL'} ${cmd}: ${version}`);
  if (!ok) failed = true;
}

if (failed) process.exit(1);
