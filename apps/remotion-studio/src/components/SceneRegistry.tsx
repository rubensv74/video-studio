import React from 'react';
import type {VideoScene} from '@video-studio/contracts';

export type SceneRenderer = React.ComponentType<{scene: VideoScene}>;

export const createSceneRegistry = (
  renderers: Record<string, SceneRenderer>,
  fallback: SceneRenderer,
): SceneRenderer => {
  const RegisteredScene: SceneRenderer = ({scene}) => {
    const Renderer = renderers[scene.type] ?? fallback;
    return <Renderer scene={scene} />;
  };

  return RegisteredScene;
};
