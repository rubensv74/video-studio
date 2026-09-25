import {spawnSync} from 'node:child_process';

const checks = [
  ['node', ['--version'], true],
  ['npm', ['--version'], true],
  ['ffmpeg', ['-version'], false],
  ['ffprobe', ['-version'], false],
];

let failed = false;
for (const [cmd, args, required] of checks) {
  const result = spawnSync(cmd, args, {encoding: 'utf8'});
  const ok = result.status === 0;
  const version = ok ? (result.stdout || result.stderr).split('\n')[0].trim() : 'not found';
  console.log(`${ok ? 'PASS' : required ? 'FAIL' : 'WARN'} ${cmd}: ${version}`);
  if (!ok && required) failed = true;
}

if (failed) process.exit(1);
