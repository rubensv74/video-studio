import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type {VideoProjectManifest, VideoScene} from '@video-studio/contracts';
import {videoTheme} from '@video-studio/design-system';
import {BlueprintGrid} from '../components/BlueprintGrid';
import {GlassCard} from '../components/GlassCard';
import {MediaLayer} from '../components/MediaLayer';

const defaultCapabilities = [
  'UI demos',
  'Technical diagrams',
  'Data-driven scenes',
  'Audio + captions',
  'WebGL / 3D',
  'Batch rendering',
];

const capabilityDescriptions: Record<string, string> = {
  'UI demos': 'React components become deterministic video scenes.',
  'Technical diagrams': 'Motion Canvas remains available for engineering animation.',
  'Data-driven scenes': 'Generate variants from manifests, JSON and APIs.',
  'Audio + captions': 'Voice, music and subtitle tracks share the same timeline.',
  'WebGL / 3D': 'Three.js scenes can live inside the Remotion production path.',
  'Batch rendering': 'Headless rendering is ready for CI and future cloud workers.',
};

const text = (value: unknown, fallback: string) =>
  typeof value === 'string' && value.trim() ? value : fallback;

const stringArray = (value: unknown, fallback: string[]) =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')
    ? value
    : fallback;

const Stage: React.FC<React.PropsWithChildren> = ({children}) => (
  <AbsoluteFill
    style={{
      background:
        'radial-gradient(circle at 72% 18%, rgba(66,199,184,.16), transparent 30%), linear-gradient(145deg, #08111F 0%, #0D1929 54%, #08111F 100%)',
      color: videoTheme.colors.paper,
      fontFamily: videoTheme.font.family,
      overflow: 'hidden',
    }}
  >
    <BlueprintGrid />
    {children}
  </AbsoluteFill>
);

const Intro: React.FC<{scene: VideoScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 20, stiffness: 110}});
  const y = interpolate(enter, [0, 1], [70, 0]);
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const payload = scene.payload ?? {};

  return (
    <Stage>
      <div style={{padding: 120, position: 'relative', zIndex: 1}}>
        <div
          style={{
            fontSize: 24,
            letterSpacing: 7,
            color: videoTheme.colors.accent,
            opacity,
          }}
        >
          {text(payload.eyebrow, 'PROGRAMMATIC VIDEO PLATFORM')}
        </div>
        <div
          style={{
            fontSize: 132,
            fontWeight: 750,
            lineHeight: 0.95,
            marginTop: 32,
            transform: `translateY(${y}px)`,
            opacity: enter,
          }}
        >
          {text(payload.title, 'Video Studio')}
        </div>
        <div
          style={{
            fontSize: 38,
            color: videoTheme.colors.muted,
            marginTop: 42,
            transform: `translateY(${y * 0.45}px)`,
            opacity: enter,
          }}
        >
          {text(payload.subtitle, 'One contract. Multiple render engines.')}
        </div>
        <div style={{display: 'flex', gap: 18, marginTop: 62, opacity}}>
          {['REMOTION', 'MOTION CANVAS', 'FFMPEG'].map((item) => (
            <GlassCard
              key={item}
              style={{padding: '18px 26px', fontSize: 20, letterSpacing: 2}}
            >
              {item}
            </GlassCard>
          ))}
        </div>
      </div>
    </Stage>
  );
};

const CapabilityGrid: React.FC<{scene: VideoScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const items = stringArray(scene.payload?.items, defaultCapabilities);

  return (
    <Stage>
      <div style={{padding: '88px 110px', position: 'relative', zIndex: 1}}>
        <div
          style={{
            fontSize: 28,
            color: videoTheme.colors.accent,
            letterSpacing: 5,
          }}
        >
          CAPABILITY LAYER
        </div>
        <div style={{fontSize: 62, fontWeight: 700, marginTop: 18}}>
          Everything belongs to one timeline
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24,
            marginTop: 56,
          }}
        >
          {items.map((title, i) => {
            const start = i * 6;
            const opacity = interpolate(frame, [start, start + 18], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const y = interpolate(frame, [start, start + 18], [36, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.out(Easing.cubic),
            });

            return (
              <GlassCard
                key={title}
                style={{
                  padding: 32,
                  minHeight: 190,
                  opacity,
                  transform: `translateY(${y}px)`,
                }}
              >
                <div style={{fontSize: 30, fontWeight: 700}}>{title}</div>
                <div
                  style={{
                    fontSize: 20,
                    lineHeight: 1.5,
                    color: videoTheme.colors.muted,
                    marginTop: 18,
                  }}
                >
                  {capabilityDescriptions[title] ??
                    'Reusable project capability driven by the video manifest.'}
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </Stage>
  );
};

const Outro: React.FC<{scene: VideoScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // useCurrentFrame() is relative to the surrounding Sequence, while
  // useVideoConfig().durationInFrames is composition-wide. The outro therefore
  // derives its fade timing from its own scene duration.
  const sceneFrames = Math.max(1, Math.round(scene.durationSeconds * fps));
  const fadeInEnd = Math.max(1, Math.min(20, sceneFrames - 1));
  const fadeOutStart = Math.max(0, sceneFrames - 10);
  const fadeOutEnd = Math.max(fadeOutStart + 1, sceneFrames - 1);

  const fadeIn = interpolate(frame, [0, fadeInEnd], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(frame, [fadeOutStart, fadeOutEnd], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = Math.min(fadeIn, fadeOut);

  return (
    <Stage>
      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
          opacity,
        }}
      >
        <div
          style={{
            fontSize: 26,
            letterSpacing: 6,
            color: videoTheme.colors.accent,
          }}
        >
          VIDEO STUDIO
        </div>
        <div style={{fontSize: 76, fontWeight: 740, marginTop: 24}}>
          {text(scene.payload?.title, 'Code is the source of truth')}
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

const GenericScene: React.FC<{scene: VideoScene}> = ({scene}) => (
  <Stage>
    <AbsoluteFill
      style={{alignItems: 'center', justifyContent: 'center', zIndex: 1}}
    >
      <div
        style={{
          fontSize: 26,
          letterSpacing: 5,
          color: videoTheme.colors.accent,
        }}
      >
        {scene.type.toUpperCase()}
      </div>
      <div style={{fontSize: 72, fontWeight: 720, marginTop: 20}}>
        {scene.id}
      </div>
    </AbsoluteFill>
  </Stage>
);

const SceneRenderer: React.FC<{scene: VideoScene}> = ({scene}) => {
  if (scene.type === 'hero') return <Intro scene={scene} />;
  if (scene.type === 'capability-grid') return <CapabilityGrid scene={scene} />;
  if (scene.type === 'outro') return <Outro scene={scene} />;
  return <GenericScene scene={scene} />;
};

export const ProductDemo: React.FC<VideoProjectManifest> = (project) => {
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
          <Sequence
            key={scene.id}
            from={start}
            durationInFrames={durationInFrames}
          >
            <SceneRenderer scene={scene} />
          </Sequence>
        );
      })}
      <MediaLayer media={project.media} />
    </AbsoluteFill>
  );
};
