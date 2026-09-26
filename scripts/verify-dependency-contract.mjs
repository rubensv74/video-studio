import fs from 'node:fs';
import {verifyDependencyContract} from './lib/dependency-contract.mjs';

const remotionPackage = JSON.parse(
  fs.readFileSync('apps/remotion-studio/package.json', 'utf8'),
);
const motionCanvasPackage = JSON.parse(
  fs.readFileSync('apps/motion-canvas-studio/package.json', 'utf8'),
);

const errors = verifyDependencyContract({remotionPackage, motionCanvasPackage});

if (errors.length) {
  for (const error of errors) console.error(`FAIL ${error}`);
  process.exit(1);
}

console.log('PASS Remotion packages are version-aligned at 4.0.528');
console.log('PASS Remotion 3D dependency baseline matches official v4.0.528 template');
console.log('PASS Motion Canvas packages are version-aligned at 3.17.2');
console.log('PASS Motion Canvas Vite baseline is 4.x');
