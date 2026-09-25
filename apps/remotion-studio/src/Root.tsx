import React from 'react';
import {Composition} from 'remotion';
import type {VideoProjectManifest} from '@video-studio/contracts';
import demoManifestJson from '../../../projects/demo-product/project.json';
import {ProductDemo} from './compositions/ProductDemo';

const demoManifest = demoManifestJson as VideoProjectManifest;
const durationInFrames = Math.round(
  demoManifest.scenes.reduce((total, scene) => total + scene.durationSeconds, 0) * demoManifest.output.fps,
);

export const Root: React.FC = () => {
  return (
    <Composition
      id={demoManifest.compositionId}
      component={ProductDemo}
      durationInFrames={durationInFrames}
      fps={demoManifest.output.fps}
      width={demoManifest.output.width}
      height={demoManifest.output.height}
      defaultProps={demoManifest}
    />
  );
};
