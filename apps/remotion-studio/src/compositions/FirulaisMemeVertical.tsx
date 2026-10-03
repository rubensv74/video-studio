import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type {VideoProjectManifest, VideoScene} from '@video-studio/contracts';
import {MediaLayer} from '../components/MediaLayer';
import {createSceneRegistry} from '../components/SceneRegistry';
import {VideoThemeProvider} from '../components/VideoThemeContext';

type MemeMotion =
  | 'none'
  | 'zoom-in'
  | 'zoom-out'
  | 'pan-left'
  | 'pan-right'
  | 'shake'
  | 'pulse';

const text = (value: unknown, fallback = '') =>
  typeof value === 'string' && value.trim() ? value.trim() : fallback;

const resolveSource = (src: string) =>
  /^(https?:|data:|blob:)/i.test(src) ? src : staticFile(src);

const motionName = (value: unknown): MemeMotion => {
  const allowed: MemeMotion[] = [
    'none',
    'zoom-in',
    'zoom-out',
    'pan-left',
    'pan-right',
    'shake',
    'pulse',
  ];
  return typeof value === 'string' && allowed.includes(value as MemeMotion)
    ? (value as MemeMotion)
    : 'zoom-in';
};

const SceneStage: React.FC<
  React.PropsWithChildren<{accent?: string; danger?: boolean}>
> = ({children, accent = '#FFD21F', danger = false}) => (
  <AbsoluteFill
    style={{
      background: danger
        ? 'radial-gradient(circle at 50% 28%, #5a0c13 0%, #1b0508 42%, #06070b 100%)'
        : 'radial-gradient(circle at 50% 25%, #23324d 0%, #0b1120 48%, #05070c 100%)',
      color: '#FFFFFF',
      fontFamily: 'Arial, Helvetica, sans-serif',
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.13,
        backgroundImage:
          'linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 18,
        background: accent,
      }}
    />
    {children}
  </AbsoluteFill>
);

const AnimatedVisual: React.FC<{
  src?: string;
  emoji?: string;
  motion: MemeMotion;
}> = ({src, emoji = '🐶', motion}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const end = Math.max(1, durationInFrames - 1);
  const p = interpolate(frame, [0, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  let scale = 1.03;
  let x = 0;
  let y = 0;
  let rotate = 0;

  if (motion === 'zoom-in') scale = interpolate(p, [0, 1], [1.02, 1.12]);
  if (motion === 'zoom-out') scale = interpolate(p, [0, 1], [1.12, 1.02]);
  if (motion === 'pan-left') x = interpolate(p, [0, 1], [34, -34]);
  if (motion === 'pan-right') x = interpolate(p, [0, 1], [-34, 34]);
  if (motion === 'pulse') scale = 1.04 + Math.sin(frame / 5) * 0.025;
  if (motion === 'shake') {
    x = Math.sin(frame * 1.7) * 14;
    y = Math.cos(frame * 1.35) * 8;
    rotate = Math.sin(frame * 1.25) * 0.8;
    scale = 1.06;
  }

  if (src) {
    return (
      <Img
        src={resolveSource(src)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `translate3d(${x}px, ${y}px, 0) scale(${scale}) rotate(${rotate}deg)`,
        }}
      />
    );
  }

  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 310,
        transform: `translate3d(${x}px, ${y}px, 0) scale(${scale}) rotate(${rotate}deg)`,
        background:
          'radial-gradient(circle at 50% 38%, rgba(255,255,255,.18), rgba(255,255,255,.02) 48%, transparent 70%)',
      }}
    >
      {emoji}
    </AbsoluteFill>
  );
};

const MemeScene: React.FC<{scene: VideoScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const payload = scene.payload ?? {};
  const accent = text(payload.accent, '#FFD21F');
  const imageSrc = text(payload.imageSrc);
  const kicker = text(payload.kicker, 'FIRULAIS · SALA DE CRISIS');
  const headline = text(payload.headline, 'Hoy toca activar el protocolo');
  const body = text(payload.body);
  const callout = text(payload.callout);
  const emoji = text(payload.emoji, '🐶');
  const motion = motionName(payload.motion);

  const enter = spring({
    frame,
    fps,
    config: {damping: 18, stiffness: 125, mass: 0.8},
  });
  const headlineY = interpolate(enter, [0, 1], [80, 0]);
  const opacity = interpolate(frame, [0, 14], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <SceneStage accent={accent}>
      <AbsoluteFill>
        <AnimatedVisual src={imageSrc || undefined} emoji={emoji} motion={motion} />
        <AbsoluteFill
          style={{
            background:
              'linear-gradient(180deg, rgba(3,5,10,.18) 0%, rgba(3,5,10,.05) 32%, rgba(3,5,10,.86) 72%, rgba(3,5,10,.98) 100%)',
          }}
        />
      </AbsoluteFill>

      <div
        style={{
          position: 'absolute',
          left: 64,
          right: 64,
          top: 74,
          zIndex: 4,
          opacity,
        }}
      >
        <div
          style={{
            display: 'inline-block',
            background: '#0B1120',
            border: `4px solid ${accent}`,
            color: accent,
            borderRadius: 999,
            padding: '12px 24px',
            fontSize: 34,
            fontWeight: 900,
            letterSpacing: 1.4,
            boxShadow: '0 12px 28px rgba(0,0,0,.35)',
          }}
        >
          {kicker}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 64,
          right: 64,
          bottom: callout ? 172 : 92,
          zIndex: 5,
          transform: `translateY(${headlineY}px)`,
          opacity: enter,
          textShadow: '0 6px 18px rgba(0,0,0,.85)',
        }}
      >
        <div
          style={{
            fontSize: 92,
            lineHeight: 0.94,
            fontWeight: 1000,
            textTransform: 'uppercase',
            letterSpacing: -2.4,
          }}
        >
          {headline}
        </div>
        {body ? (
          <div
            style={{
              marginTop: 28,
              fontSize: 42,
              lineHeight: 1.13,
              fontWeight: 800,
              color: '#F4F6FA',
            }}
          >
            {body}
          </div>
        ) : null}
      </div>

      {callout ? (
        <div
          style={{
            position: 'absolute',
            left: 58,
            right: 58,
            bottom: 48,
            zIndex: 6,
            background: accent,
            color: '#07090D',
            borderRadius: 24,
            padding: '22px 28px',
            fontSize: 34,
            lineHeight: 1.15,
            textAlign: 'center',
            fontWeight: 1000,
            transform: `scale(${0.96 + enter * 0.04})`,
            boxShadow: '0 12px 32px rgba(0,0,0,.38)',
          }}
        >
          {callout}
        </div>
      ) : null}
    </SceneStage>
  );
};

const AlertScene: React.FC<{scene: VideoScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const payload = scene.payload ?? {};
  const headline = text(payload.headline, '¡ACTIVAR PROTOCOLO BARÇA!');
  const body = text(payload.body, 'Hay que cambiar de tema.');
  const buttonLabel = text(payload.buttonLabel, 'BARÇA');
  const accent = text(payload.accent, '#FFD21F');
  const press = spring({
    frame: Math.max(0, frame - Math.round(fps * 0.65)),
    fps,
    config: {damping: 12, stiffness: 180},
  });
  const shake = frame > fps * 0.55 ? Math.sin(frame * 2.5) * 8 : 0;

  return (
    <SceneStage accent={accent} danger>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <div
          style={{
            fontSize: 180,
            position: 'absolute',
            top: 120,
            filter: 'drop-shadow(0 14px 18px rgba(0,0,0,.5))',
          }}
        >
          🚨
        </div>
        <div
          style={{
            width: 820,
            padding: '54px 48px',
            borderRadius: 36,
            border: '6px solid rgba(255,255,255,.85)',
            background: 'rgba(18, 3, 6, .78)',
            textAlign: 'center',
            boxShadow: '0 34px 90px rgba(0,0,0,.52)',
            transform: `translateX(${shake}px)`,
          }}
        >
          <div
            style={{
              fontSize: 86,
              lineHeight: 0.96,
              fontWeight: 1000,
              textTransform: 'uppercase',
            }}
          >
            {headline}
          </div>
          <div style={{fontSize: 42, fontWeight: 800, marginTop: 26}}>
            {body}
          </div>
          <div
            style={{
              margin: '56px auto 0',
              width: 430,
              height: 250,
              borderRadius: '50%',
              background:
                'radial-gradient(circle at 50% 35%, #ff6b70 0%, #df1622 34%, #87030b 72%, #420106 100%)',
              border: '18px solid #252A33',
              boxShadow:
                '0 18px 0 #080A0E, 0 34px 60px rgba(0,0,0,.5), inset 0 10px 18px rgba(255,255,255,.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `scale(${1 - press * 0.08})`,
            }}
          >
            <span
              style={{
                fontSize: 68,
                lineHeight: 1,
                fontWeight: 1000,
                textTransform: 'uppercase',
                textShadow: '0 5px 0 rgba(0,0,0,.35)',
              }}
            >
              {buttonLabel}
            </span>
          </div>
        </div>
      </AbsoluteFill>
    </SceneStage>
  );
};

const OutroScene: React.FC<{scene: VideoScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const payload = scene.payload ?? {};
  const accent = text(payload.accent, '#FFD21F');
  const headline = text(
    payload.headline,
    'Cuando no hay fútbol que celebrar… siempre queda un Barça que investigar.',
  );
  const body = text(payload.body, 'Departamento de desvío de atención · abierto 24/7');
  const emoji = text(payload.emoji, '🐶');
  const enter = spring({frame, fps, config: {damping: 18, stiffness: 120}});

  return (
    <SceneStage accent={accent}>
      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          padding: '90px 70px 130px',
        }}
      >
        <div
          style={{
            fontSize: 250,
            transform: `scale(${0.7 + enter * 0.3})`,
            filter: 'drop-shadow(0 16px 30px rgba(0,0,0,.45))',
          }}
        >
          {emoji}
        </div>
        <div
          style={{
            marginTop: 44,
            fontSize: 76,
            lineHeight: 0.98,
            fontWeight: 1000,
            textAlign: 'center',
            textTransform: 'uppercase',
          }}
        >
          {headline}
        </div>
        <div
          style={{
            marginTop: 34,
            fontSize: 34,
            lineHeight: 1.15,
            fontWeight: 900,
            textAlign: 'center',
            color: accent,
          }}
        >
          {body}
        </div>
      </AbsoluteFill>
    </SceneStage>
  );
};

const FallbackScene: React.FC<{scene: VideoScene}> = ({scene}) => (
  <MemeScene scene={scene} />
);

const SceneRenderer = createSceneRegistry(
  {
    'firulais-meme': MemeScene,
    'firulais-alert': AlertScene,
    'firulais-outro': OutroScene,
  },
  FallbackScene,
);

export const FirulaisMemeVertical: React.FC<VideoProjectManifest> = (project) => {
  let from = 0;

  return (
    <VideoThemeProvider themeId={project.theme}>
      <AbsoluteFill style={{backgroundColor: '#05070C'}}>
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
    </VideoThemeProvider>
  );
};
