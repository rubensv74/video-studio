import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {
  buildRemotionRenderPlan,
  loadProjectManifest,
  validateProject,
} from './lib/manifest.mjs';

const manifestFile = process.argv[2] || 'projects/demo-product/project.json';
const {project, fullPath} = loadProjectManifest(manifestFile);
const errors = validateProject(project);

if (errors.length) {
  for (const error of errors) console.error(`FAIL ${error}`);
  process.exit(1);
}

if (project.engine === 'remotion') {
  let plan;
  try {
    plan = buildRemotionRenderPlan(project, fullPath);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(4);
  }

  fs.mkdirSync(path.dirname(plan.outputFile), {recursive: true});

  const args = [
    '--workspace',
    '@video-studio/remotion-studio',
    'exec',
    '--',
    'remotion',
    'render',
    'src/index.ts',
    plan.compositionId,
    plan.outputFile,
    '--codec',
    plan.codec,
    '--props',
    plan.propsFile,
  ];

  const result = spawnSync('npm', args, {stdio: 'inherit'});
  process.exit(result.status ?? 1);
}

console.error(
  'Motion Canvas projects are editor-rendered in VS-G01. Start with: npm run dev:motion-canvas',
);
process.exit(3);
