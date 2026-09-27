import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root = path.resolve('.generated/productization');
const presets = ['landscape-16x9', 'portrait-9x16', 'square-1x1'];

for (const preset of presets) {
  const manifest = path.join(root, `generated-${preset}`, 'project.json');
  if (!fs.existsSync(manifest)) {
    console.error(`FAIL missing generated manifest: ${manifest}`);
    process.exit(1);
  }

  console.log(`==> Render generated preset: ${preset}`);
  const render = spawnSync(process.execPath, ['scripts/render.mjs', manifest], {
    stdio: 'inherit',
  });
  if (render.status !== 0) process.exit(render.status ?? 1);

  console.log(`==> Verify generated preset: ${preset}`);
  const verify = spawnSync(process.execPath, ['scripts/verify-render.mjs', manifest], {
    stdio: 'inherit',
  });
  if (verify.status !== 0) process.exit(verify.status ?? 1);
}

console.log('PASS VS-G05 scaffolded preset renders');
