import fs from 'node:fs';
import path from 'node:path';

export const loadProjectManifest = (manifestFile) => {
  const fullPath = path.resolve(manifestFile);
  const project = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  return {project, fullPath};
};

export const getProjectDurationSeconds = (project) =>
  (project.scenes ?? []).reduce(
    (total, scene) => total + Number(scene.durationSeconds || 0),
    0,
  );

export const getProjectDurationInFrames = (project) =>
  Math.max(1, Math.round(getProjectDurationSeconds(project) * Number(project.output?.fps || 0)));

export const validateProject = (project) => {
  const errors = [];
  const positiveInt = (value) => Number.isInteger(value) && value > 0;
  const nonEmpty = (value) => typeof value === 'string' && value.trim().length > 0;

  if (project.version !== 1) errors.push('version must be 1');
  if (!nonEmpty(project.id)) errors.push('id is required');
  if (!nonEmpty(project.title)) errors.push('title is required');
  if (!['remotion', 'motion-canvas'].includes(project.engine)) {
    errors.push('engine must be remotion or motion-canvas');
  }
  if (!nonEmpty(project.compositionId)) errors.push('compositionId is required');
  if (!nonEmpty(project.theme)) errors.push('theme is required');
  if (!positiveInt(project.output?.width)) errors.push('output.width must be a positive integer');
  if (!positiveInt(project.output?.height)) errors.push('output.height must be a positive integer');
  if (!positiveInt(project.output?.fps)) errors.push('output.fps must be a positive integer');
  if (!['mp4', 'webm', 'gif', 'png-sequence'].includes(project.output?.format)) {
    errors.push('unsupported output.format');
  }
  if (!nonEmpty(project.output?.file)) errors.push('output.file is required');

  if (nonEmpty(project.output?.file) && project.output?.format !== 'png-sequence') {
    const expectedExtension = `.${project.output.format}`;
    if (!project.output.file.toLowerCase().endsWith(expectedExtension)) {
      errors.push(`output.file must end in ${expectedExtension}`);
    }
  }

  if (!Array.isArray(project.scenes) || project.scenes.length === 0) {
    errors.push('at least one scene is required');
  }

  const ids = new Set();
  for (const scene of project.scenes || []) {
    if (!nonEmpty(scene.id)) errors.push('scene.id is required');
    if (ids.has(scene.id)) errors.push(`scene.id must be unique: ${scene.id}`);
    ids.add(scene.id);
    if (!nonEmpty(scene.type)) errors.push(`scene ${scene.id || '?'} type is required`);
    if (!(Number(scene.durationSeconds) > 0)) {
      errors.push(`scene ${scene.id || '?'} durationSeconds must be > 0`);
    }
    if (
      scene.payload !== undefined &&
      (scene.payload === null || Array.isArray(scene.payload) || typeof scene.payload !== 'object')
    ) {
      errors.push(`scene ${scene.id || '?'} payload must be an object`);
    }
  }

  return errors;
};

export const buildRemotionRenderPlan = (project, manifestFile) => {
  if (project.engine !== 'remotion') {
    throw new Error(`Cannot build a Remotion render plan for engine: ${project.engine}`);
  }

  if (!['mp4', 'webm'].includes(project.output.format)) {
    throw new Error(
      `Remotion dispatcher supports mp4/webm in VS-G01. Use FFmpeg derivatives for ${project.output.format} until the media-stack gate is implemented.`,
    );
  }

  return {
    engine: 'remotion',
    compositionId: project.compositionId,
    outputFile: path.resolve(project.output.file),
    propsFile: path.resolve(manifestFile),
    codec: project.output.format === 'webm' ? 'vp8' : 'h264',
    width: project.output.width,
    height: project.output.height,
    fps: project.output.fps,
    durationSeconds: getProjectDurationSeconds(project),
    durationInFrames: getProjectDurationInFrames(project),
  };
};
