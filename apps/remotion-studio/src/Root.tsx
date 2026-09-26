import React from 'react';
import {Composition, type CalculateMetadataFunction} from 'remotion';
import type {VideoProjectManifest} from '@video-studio/contracts';
import demoManifestJson from '../../../projects/demo-product/project.json';
import {ProductDemo} from './compositions/ProductDemo';

const demoManifest = demoManifestJson as VideoProjectManifest;

const getDurationInFrames = (project: VideoProjectManifest) =>
  Math.max(
    1,
    Math.round(
      project.scenes.reduce((total, scene) => total + scene.durationSeconds, 0) *
        project.output.fps,
    ),
  );

const calculateMetadata: CalculateMetadataFunction<VideoProjectManifest> = ({
  props,
}) => ({
  durationInFrames: getDurationInFrames(props),
  fps: props.output.fps,
  width: props.output.width,
  height: props.output.height,
});

export const Root: React.FC = () => {
  return (
    <Composition
      id={demoManifest.compositionId}
      component={ProductDemo}
      durationInFrames={getDurationInFrames(demoManifest)}
      fps={demoManifest.output.fps}
      width={demoManifest.output.width}
      height={demoManifest.output.height}
      defaultProps={demoManifest}
      calculateMetadata={calculateMetadata}
    />
  );
};
