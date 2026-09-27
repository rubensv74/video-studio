import React from 'react';
import {Composition, type CalculateMetadataFunction} from 'remotion';
import type {VideoProjectManifest} from '@video-studio/contracts';
import demoManifestJson from '../../../projects/demo-product/project.json';
import advancedManifestJson from '../../../projects/advanced-visuals-demo/project.json';
import {ProductDemo} from './compositions/ProductDemo';
import {AdvancedVisualsDemo} from './compositions/AdvancedVisualsDemo';

const demoManifest = demoManifestJson as VideoProjectManifest;
const advancedManifest = advancedManifestJson as VideoProjectManifest;

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

export const Root: React.FC = () => (
  <>
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
    <Composition
      id={advancedManifest.compositionId}
      component={AdvancedVisualsDemo}
      durationInFrames={getDurationInFrames(advancedManifest)}
      fps={advancedManifest.output.fps}
      width={advancedManifest.output.width}
      height={advancedManifest.output.height}
      defaultProps={advancedManifest}
      calculateMetadata={calculateMetadata}
    />
  </>
);
