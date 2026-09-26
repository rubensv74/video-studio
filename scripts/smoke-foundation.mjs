import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildRemotionRenderPlan,
  getProjectDurationInFrames,
  getProjectDurationSeconds,
  loadProjectManifest,
  validateProject,
} from './lib/manifest.mjs';

const root = process.cwd();
const manifestFile = path.join(root, 'projects/demo-product/project.json');
const {project, fullPath} = loadProjectManifest(manifestFile);

assert.deepEqual(validateProject(project), [], 'demo manifest must validate');
assert.equal(getProjectDurationSeconds(project), 10, 'demo duration must be 10 seconds');
assert.equal(getProjectDurationInFrames(project), 300, 'demo duration must be 300 frames at 30fps');

const plan = buildRemotionRenderPlan(project, fullPath);
assert.equal(plan.compositionId, 'ProductDemo');
assert.equal(plan.codec, 'h264');
assert.equal(plan.width, 1920);
assert.equal(plan.height, 1080);
assert.equal(plan.fps, 30);
assert.equal(plan.propsFile, path.resolve(manifestFile));
assert.equal(plan.outputFile, path.resolve('output/remotion-demo.mp4'));

const rootSource = fs.readFileSync(path.join(root, 'apps/remotion-studio/src/Root.tsx'), 'utf8');
assert.match(rootSource, /CalculateMetadataFunction<VideoProjectManifest>/);
assert.match(rootSource, /calculateMetadata=\{calculateMetadata\}/);
assert.match(rootSource, /props\.output\.width/);
assert.match(rootSource, /props\.output\.height/);
assert.match(rootSource, /props\.output\.fps/);

const compositionSource = fs.readFileSync(
  path.join(root, 'apps/remotion-studio/src/compositions/ProductDemo.tsx'),
  'utf8',
);
assert.match(compositionSource, /project\.scenes\.map/);

const remotionPackage = JSON.parse(
  fs.readFileSync(path.join(root, 'apps/remotion-studio/package.json'), 'utf8'),
);
assert.match(remotionPackage.scripts.render, /--props/);
assert.match(remotionPackage.scripts.render, /projects\/demo-product\/project\.json/);

const motionTsconfig = JSON.parse(
  fs.readFileSync(path.join(root, 'apps/motion-canvas-studio/tsconfig.json'), 'utf8'),
);
assert.equal(motionTsconfig.extends, '@motion-canvas/2d/tsconfig.project.json');

const motionVite = fs.readFileSync(
  path.join(root, 'apps/motion-canvas-studio/vite.config.ts'),
  'utf8',
);
assert.match(motionVite, /@motion-canvas\/ffmpeg/);
assert.match(motionVite, /ffmpeg\(\)/);

console.log('PASS manifest validation');
console.log('PASS demo timing: 10s / 300 frames');
console.log('PASS manifest -> Remotion --props render plan');
console.log('PASS calculateMetadata controls width/height/fps/duration');
console.log('PASS ProductDemo consumes manifest scenes');
console.log('PASS Motion Canvas official TypeScript base');
console.log('PASS Motion Canvas FFmpeg exporter configured');
console.log('PASS VS-G01 source-contract smoke gate');
