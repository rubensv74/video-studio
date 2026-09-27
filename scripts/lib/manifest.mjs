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
  Math.max(
    1,
    Math.round(
      getProjectDurationSeconds(project) * Number(project.output?.fps || 0),
    ),
  );

export const validateProject = (project) => {
  const errors = [];
  const positiveInt = (value) => Number.isInteger(value) && value > 0;
  const positiveNumber = (value) => Number.isFinite(Number(value)) && Number(value) > 0;
  const nonNegativeNumber = (value) =>
    Number.isFinite(Number(value)) && Number(value) >= 0;
  const nonEmpty = (value) =>
    typeof value === 'string' && value.trim().length > 0;

  if (project.version !== 1) errors.push('version must be 1');
  if (!nonEmpty(project.id)) errors.push('id is required');
  if (!nonEmpty(project.title)) errors.push('title is required');
  if (!['remotion', 'motion-canvas'].includes(project.engine)) {
    errors.push('engine must be remotion or motion-canvas');
  }
  if (!nonEmpty(project.compositionId)) errors.push('compositionId is required');
  if (!nonEmpty(project.theme)) errors.push('theme is required');
  if (!positiveInt(project.output?.width)) {
    errors.push('output.width must be a positive integer');
  }
  if (!positiveInt(project.output?.height)) {
    errors.push('output.height must be a positive integer');
  }
  if (!positiveInt(project.output?.fps)) {
    errors.push('output.fps must be a positive integer');
  }
  if (!['mp4', 'webm', 'gif', 'png-sequence'].includes(project.output?.format)) {
    errors.push('unsupported output.format');
  }
  if (!nonEmpty(project.output?.file)) errors.push('output.file is required');

  if (
    nonEmpty(project.output?.file) &&
    project.output?.format !== 'png-sequence'
  ) {
    const expectedExtension = `.${project.output.format}`;
    if (!project.output.file.toLowerCase().endsWith(expectedExtension)) {
      errors.push(`output.file must end in ${expectedExtension}`);
    }
  }

  if (!Array.isArray(project.scenes) || project.scenes.length === 0) {
    errors.push('at least one scene is required');
  }

  const sceneIds = new Set();
  for (const scene of project.scenes || []) {
    if (!nonEmpty(scene.id)) errors.push('scene.id is required');
    if (sceneIds.has(scene.id)) errors.push(`scene.id must be unique: ${scene.id}`);
    sceneIds.add(scene.id);
    if (!nonEmpty(scene.type)) {
      errors.push(`scene ${scene.id || '?'} type is required`);
    }
    if (!positiveNumber(scene.durationSeconds)) {
      errors.push(`scene ${scene.id || '?'} durationSeconds must be > 0`);
    }
    if (
      scene.payload !== undefined &&
      (scene.payload === null ||
        Array.isArray(scene.payload) ||
        typeof scene.payload !== 'object')
    ) {
      errors.push(`scene ${scene.id || '?'} payload must be an object`);
    }
  }

  const mediaIds = new Set();
  const registerMediaId = (id, kind) => {
    if (!nonEmpty(id)) {
      errors.push(`${kind}.id is required`);
      return;
    }
    if (mediaIds.has(id)) errors.push(`media track id must be unique: ${id}`);
    mediaIds.add(id);
  };

  for (const track of project.media?.audioTracks ?? []) {
    registerMediaId(track.id, 'audioTrack');
    if (!['voiceover', 'music', 'sfx', 'ambient'].includes(track.role)) {
      errors.push(`audio track ${track.id || '?'} has unsupported role`);
    }
    if (!nonEmpty(track.src)) errors.push(`audio track ${track.id || '?'} src is required`);
    if (
      track.startSeconds !== undefined &&
      !nonNegativeNumber(track.startSeconds)
    ) {
      errors.push(`audio track ${track.id || '?'} startSeconds must be >= 0`);
    }
    if (
      track.durationSeconds !== undefined &&
      !positiveNumber(track.durationSeconds)
    ) {
      errors.push(`audio track ${track.id || '?'} durationSeconds must be > 0`);
    }
    if (
      track.trimBeforeSeconds !== undefined &&
      !nonNegativeNumber(track.trimBeforeSeconds)
    ) {
      errors.push(`audio track ${track.id || '?'} trimBeforeSeconds must be >= 0`);
    }
    if (
      track.trimAfterSeconds !== undefined &&
      !positiveNumber(track.trimAfterSeconds)
    ) {
      errors.push(`audio track ${track.id || '?'} trimAfterSeconds must be > 0`);
    }
    if (
      track.volume !== undefined &&
      (!Number.isFinite(Number(track.volume)) ||
        Number(track.volume) < 0 ||
        Number(track.volume) > 2)
    ) {
      errors.push(`audio track ${track.id || '?'} volume must be between 0 and 2`);
    }
  }

  const fits = ['contain', 'cover', 'fill', 'none', 'scale-down'];
  for (const track of project.media?.videoTracks ?? []) {
    registerMediaId(track.id, 'videoTrack');
    if (!nonEmpty(track.src)) errors.push(`video track ${track.id || '?'} src is required`);
    if (
      track.startSeconds !== undefined &&
      !nonNegativeNumber(track.startSeconds)
    ) {
      errors.push(`video track ${track.id || '?'} startSeconds must be >= 0`);
    }
    if (
      track.durationSeconds !== undefined &&
      !positiveNumber(track.durationSeconds)
    ) {
      errors.push(`video track ${track.id || '?'} durationSeconds must be > 0`);
    }
    if (track.objectFit !== undefined && !fits.includes(track.objectFit)) {
      errors.push(`video track ${track.id || '?'} objectFit is unsupported`);
    }
    if (
      track.opacity !== undefined &&
      (!Number.isFinite(Number(track.opacity)) ||
        Number(track.opacity) < 0 ||
        Number(track.opacity) > 1)
    ) {
      errors.push(`video track ${track.id || '?'} opacity must be between 0 and 1`);
    }
    for (const key of ['width', 'height']) {
      const value = track.layout?.[key];
      if (value !== undefined && !positiveNumber(value)) {
        errors.push(`video track ${track.id || '?'} layout.${key} must be > 0`);
      }
    }
  }

  for (const track of project.media?.captionTracks ?? []) {
    registerMediaId(track.id, 'captionTrack');
    const hasSource = nonEmpty(track.src);
    const hasCues = Array.isArray(track.cues) && track.cues.length > 0;
    if (!hasSource && !hasCues) {
      errors.push(`caption track ${track.id || '?'} requires src or cues`);
    }
    if (hasSource && track.format !== 'srt') {
      errors.push(`caption track ${track.id || '?'} external format must be srt`);
    }
    if (
      track.startSeconds !== undefined &&
      !nonNegativeNumber(track.startSeconds)
    ) {
      errors.push(`caption track ${track.id || '?'} startSeconds must be >= 0`);
    }
    for (const cue of track.cues ?? []) {
      if (!nonNegativeNumber(cue.startMs)) {
        errors.push(`caption track ${track.id || '?'} cue.startMs must be >= 0`);
      }
      if (!positiveNumber(cue.endMs) || Number(cue.endMs) <= Number(cue.startMs)) {
        errors.push(`caption track ${track.id || '?'} cue.endMs must be > startMs`);
      }
      if (!nonEmpty(cue.text)) {
        errors.push(`caption track ${track.id || '?'} cue.text is required`);
      }
    }
  }

  const derivativeIds = new Set();
  for (const derivative of project.derivatives ?? []) {
    if (!nonEmpty(derivative.id)) errors.push('derivative.id is required');
    if (derivativeIds.has(derivative.id)) {
      errors.push(`derivative.id must be unique: ${derivative.id}`);
    }
    derivativeIds.add(derivative.id);
    if (!['webm', 'gif', 'png-sequence'].includes(derivative.format)) {
      errors.push(`derivative ${derivative.id || '?'} format must be webm, gif or png-sequence`);
    }
    if (!nonEmpty(derivative.file)) {
      errors.push(`derivative ${derivative.id || '?'} file is required`);
    } else if (
      derivative.format !== 'png-sequence' &&
      !derivative.file.toLowerCase().endsWith(`.${derivative.format}`)
    ) {
      errors.push(
        `derivative ${derivative.id || '?'} file must end in .${derivative.format}`,
      );
    } else if (
      derivative.format === 'png-sequence' &&
      (!derivative.file.toLowerCase().endsWith('.png') ||
        !/%0?\d*d/.test(derivative.file))
    ) {
      errors.push(
        `derivative ${derivative.id || '?'} png-sequence file must be a numbered .png pattern`,
      );
    }
    if (derivative.fps !== undefined && !positiveInt(derivative.fps)) {
      errors.push(`derivative ${derivative.id || '?'} fps must be a positive integer`);
    }
    if (derivative.width !== undefined && !positiveInt(derivative.width)) {
      errors.push(`derivative ${derivative.id || '?'} width must be a positive integer`);
    }
  }

  if (project.audioNormalization?.enabled) {
    const normalization = project.audioNormalization;
    if (!nonEmpty(normalization.file)) {
      errors.push('audioNormalization.file is required when enabled');
    } else if (!normalization.file.toLowerCase().endsWith('.mp4')) {
      errors.push('audioNormalization.file must end in .mp4');
    }
    for (const key of ['integratedLufs', 'truePeakDb', 'loudnessRange']) {
      if (
        normalization[key] !== undefined &&
        !Number.isFinite(Number(normalization[key]))
      ) {
        errors.push(`audioNormalization.${key} must be numeric`);
      }
    }
  }

  return errors;
};

export const buildRemotionRenderPlan = (project, manifestFile) => {
  if (project.engine !== 'remotion') {
    throw new Error(
      `Cannot build a Remotion render plan for engine: ${project.engine}`,
    );
  }

  if (!['mp4', 'webm'].includes(project.output.format)) {
    throw new Error(
      `Remotion dispatcher supports mp4/webm primary output; use the derivative pipeline for ${project.output.format}`,
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
