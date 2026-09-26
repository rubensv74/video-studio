import {spawnSync} from 'node:child_process';

let failed = false;

const fail = (message) => {
  console.error(`FAIL ${message}`);
  failed = true;
};

const nodeVersion = process.versions.node;
const nodeMajor = Number(nodeVersion.split('.')[0]);
if (!Number.isInteger(nodeMajor) || nodeMajor < 20) {
  fail(`node: v${nodeVersion}; Video Studio requires Node.js >=20`);
} else {
  console.log(`PASS node: v${nodeVersion}`);
}

const commandCheck = (cmd, args) => {
  const result = spawnSync(cmd, args, {encoding: 'utf8'});
  if (result.status !== 0) {
    fail(`${cmd}: not found or not executable`);
    return;
  }

  const firstLine = (result.stdout || result.stderr).split('\n')[0].trim();
  console.log(`PASS ${cmd}: ${firstLine}`);
};

commandCheck('npm', ['--version']);
commandCheck('ffmpeg', ['-version']);
commandCheck('ffprobe', ['-version']);

if (failed) process.exit(1);
