import fs from 'node:fs';
import path from 'node:path';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/validate-project.mjs <project.json>');
  process.exit(2);
}

const full = path.resolve(file);
const project = JSON.parse(fs.readFileSync(full, 'utf8'));
const errors = [];
const positiveInt = (value) => Number.isInteger(value) && value > 0;
const nonEmpty = (value) => typeof value === 'string' && value.trim().length > 0;

if (project.version !== 1) errors.push('version must be 1');
if (!nonEmpty(project.id)) errors.push('id is required');
if (!nonEmpty(project.title)) errors.push('title is required');
if (!['remotion', 'motion-canvas'].includes(project.engine)) errors.push('engine must be remotion or motion-canvas');
if (!nonEmpty(project.compositionId)) errors.push('compositionId is required');
if (!nonEmpty(project.theme)) errors.push('theme is required');
if (!positiveInt(project.output?.width)) errors.push('output.width must be a positive integer');
if (!positiveInt(project.output?.height)) errors.push('output.height must be a positive integer');
if (!positiveInt(project.output?.fps)) errors.push('output.fps must be a positive integer');
if (!['mp4', 'webm', 'gif', 'png-sequence'].includes(project.output?.format)) errors.push('unsupported output.format');
if (!nonEmpty(project.output?.file)) errors.push('output.file is required');

if (nonEmpty(project.output?.file) && project.output?.format !== 'png-sequence') {
  const expectedExtension = `.${project.output.format}`;
  if (!project.output.file.toLowerCase().endsWith(expectedExtension)) {
    errors.push(`output.file must end in ${expectedExtension}`);
  }
}

if (!Array.isArray(project.scenes) || project.scenes.length === 0) errors.push('at least one scene is required');
const ids = new Set();
for (const scene of project.scenes || []) {
  if (!nonEmpty(scene.id)) errors.push('scene.id is required');
  if (ids.has(scene.id)) errors.push(`scene.id must be unique: ${scene.id}`);
  ids.add(scene.id);
  if (!nonEmpty(scene.type)) errors.push(`scene ${scene.id || '?'} type is required`);
  if (!(Number(scene.durationSeconds) > 0)) errors.push(`scene ${scene.id || '?'} durationSeconds must be > 0`);
  if (scene.payload !== undefined && (scene.payload === null || Array.isArray(scene.payload) || typeof scene.payload !== 'object')) {
    errors.push(`scene ${scene.id || '?'} payload must be an object`);
  }
}

if (errors.length) {
  for (const error of errors) console.error(`FAIL ${error}`);
  process.exit(1);
}

const duration = (project.scenes || []).reduce((total, scene) => total + Number(scene.durationSeconds || 0), 0);
console.log(`PASS ${project.id}: ${project.engine} -> ${project.output.file} (${duration}s @ ${project.output.fps}fps)`);
