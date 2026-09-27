import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import type {VideoProjectManifest, VideoScene} from '@video-studio/contracts';
import {videoTheme} from '@video-studio/design-system';
import {AdvancedSvgSystem} from '../components/AdvancedSvgSystem';
import {AdvancedCanvasTelemetry} from '../components/AdvancedCanvasTelemetry';
import {AdvancedThreeAsset} from '../components/AdvancedThreeAsset';
import {BlueprintGrid} from '../components/BlueprintGrid';

const Shell: React.FC<React.PropsWithChildren<{eyebrow: string; title: string}>> = ({
  eyebrow,
  title,
  children,
}) => (
  <AbsoluteFill
    style={{
      background:
        'radial-gradient(circle at 78% 14%, rgba(66,199,184,.15), transparent 28%), linear-gradient(145deg, #08111F, #0D1929 58%, #08111F)',
      color: videoTheme.colors.paper,
      fontFamily: videoTheme.font.family,
      overflow: 'hidden',
    }}
  >
    <BlueprintGrid />
    <div style={{position: 'absolute', left: 92, top: 72, zIndex: 5}}>
      <div style={{fontSize: 22, letterSpacing: 6, color: videoTheme.colors.accent}}>
        {eyebrow}
      </div>
      <div style={{fontSize: 54, fontWeight: 720, marginTop: 14}}>{title}</div>
    </div>
    <div
      style={{
        position: 'absolute',
        inset: '190px 100px 72px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </div>
  </AbsoluteFill>
);

const AdvancedScene: React.FC<{scene: VideoScene}> = ({scene}) => {
  if (scene.type === 'svg-system-flow') {
    return (
      <Shell eyebrow="VECTOR MOTION" title="Animated industrial system flow">
        <AdvancedSvgSystem />
      </Shell>
    );
  }

  if (scene.type === 'canvas-telemetry') {
    return (
      <Shell eyebrow="HTML CANVAS" title="Deterministic telemetry rendering">
        <AdvancedCanvasTelemetry />
      </Shell>
    );
  }

  if (scene.type === 'three-asset') {
    return (
      <Shell eyebrow="WEBGL / THREE.JS" title="Procedural industrial asset">
        <div style={{position: 'absolute', inset: -190}}>
          <AdvancedThreeAsset />
        </div>
      </Shell>
    );
  }

  return (
    <Shell eyebrow="ADVANCED VISUALS" title={scene.id}>
      <div style={{fontSize: 52}}>Unsupported scene type: {scene.type}</div>
    </Shell>
  );
};

export const AdvancedVisualsDemo: React.FC<VideoProjectManifest> = (project) => {
  let from = 0;
  return (
    <AbsoluteFill>
      {project.scenes.map((scene) => {
        const durationInFrames = Math.max(
          1,
          Math.round(scene.durationSeconds * project.output.fps),
        );
        const start = from;
        from += durationInFrames;
        return (
          <Sequence key={scene.id} from={start} durationInFrames={durationInFrames}>
            <AdvancedScene scene={scene} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
