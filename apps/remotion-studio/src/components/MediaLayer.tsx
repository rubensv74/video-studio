import React, {useEffect, useState} from 'react';
import {parseSrt} from '@remotion/captions';
import {Audio, Video} from '@remotion/media';
import type {
  AudioTrack,
  CaptionCue,
  CaptionTrack,
  ImageTrack,
  MediaStack,
  VideoTrack,
} from '@video-studio/contracts';
import {
  AbsoluteFill,
  Img,
  cancelRender,
  continueRender,
  delayRender,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const secondsToFrames = (seconds: number | undefined, fps: number) =>
  seconds === undefined ? undefined : Math.max(0, Math.round(seconds * fps));

const resolveMediaSource = (src: string) =>
  /^(https?:|data:|blob:)/i.test(src) ? src : staticFile(src);

const ImageTrackLayer: React.FC<{track: ImageTrack}> = ({track}) => {
  const {fps, width, height} = useVideoConfig();
  const frame = useCurrentFrame();
  if (track.enabled === false) return null;

  const start = secondsToFrames(track.startSeconds ?? 0, fps) ?? 0;
  const duration = secondsToFrames(track.durationSeconds, fps);
  const end = duration === undefined ? Number.POSITIVE_INFINITY : start + duration;
  if (frame < start || frame >= end) return null;

  const layout = track.layout ?? {};
  return (
    <Img
      src={resolveMediaSource(track.src)}
      style={{
        position: 'absolute',
        left: layout.x ?? 0,
        top: layout.y ?? 0,
        width: layout.width ?? width,
        height: layout.height ?? height,
        objectFit: track.objectFit ?? 'cover',
        opacity: track.opacity ?? 1,
        borderRadius: layout.borderRadius ?? 0,
      }}
    />
  );
};

const AudioTrackLayer: React.FC<{track: AudioTrack}> = ({track}) => {
  const {fps} = useVideoConfig();
  if (track.enabled === false) return null;

  return (
    <Audio
      name={`${track.role}:${track.id}`}
      src={resolveMediaSource(track.src)}
      from={secondsToFrames(track.startSeconds ?? 0, fps)}
      durationInFrames={secondsToFrames(track.durationSeconds, fps)}
      trimBefore={secondsToFrames(track.trimBeforeSeconds, fps)}
      trimAfter={secondsToFrames(track.trimAfterSeconds, fps)}
      volume={track.volume ?? 1}
      loop={track.loop ?? false}
      onError={() => 'fail'}
    />
  );
};

const VideoTrackLayer: React.FC<{track: VideoTrack}> = ({track}) => {
  const {fps, width, height} = useVideoConfig();
  if (track.enabled === false) return null;

  const layout = track.layout ?? {};
  return (
    <Video
      name={`video:${track.id}`}
      src={resolveMediaSource(track.src)}
      from={secondsToFrames(track.startSeconds ?? 0, fps)}
      durationInFrames={secondsToFrames(track.durationSeconds, fps)}
      trimBefore={secondsToFrames(track.trimBeforeSeconds, fps)}
      trimAfter={secondsToFrames(track.trimAfterSeconds, fps)}
      volume={track.volume ?? 1}
      muted={track.muted ?? true}
      loop={track.loop ?? false}
      objectFit={track.objectFit ?? 'cover'}
      onError={() => 'fail'}
      style={{
        position: 'absolute',
        left: layout.x ?? 0,
        top: layout.y ?? 0,
        width: layout.width ?? width,
        height: layout.height ?? height,
        opacity: track.opacity ?? 1,
        borderRadius: layout.borderRadius ?? 0,
      }}
    />
  );
};

const CaptionTrackLayer: React.FC<{track: CaptionTrack}> = ({track}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const [captions, setCaptions] = useState<CaptionCue[]>(track.cues ?? []);
  const [handle] = useState<number | null>(() =>
    track.src ? delayRender(`Loading caption track ${track.id}`) : null,
  );

  useEffect(() => {
    if (!track.src || handle === null) return;

    let mounted = true;
    fetch(resolveMediaSource(track.src))
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Caption track ${track.id} failed with HTTP ${response.status}`,
          );
        }
        return response.text();
      })
      .then((input) => parseSrt({input}).captions)
      .then((items) => {
        if (mounted) {
          setCaptions(
            items.map((item) => ({
              startMs: item.startMs,
              endMs: item.endMs,
              text: item.text,
            })),
          );
        }
        continueRender(handle);
      })
      .catch((error) => {
        cancelRender(error instanceof Error ? error : new Error(String(error)));
      });

    return () => {
      mounted = false;
    };
  }, [handle, track.id, track.src]);

  if (track.enabled === false) return null;

  const timelineMs =
    (frame / fps - (track.startSeconds ?? 0)) * 1000;
  const active = captions.find(
    (cue) => timelineMs >= cue.startMs && timelineMs < cue.endMs,
  );
  if (!active) return null;

  const style = track.style ?? {};
  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: style.bottom ?? 72,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: style.maxWidth ?? 1400,
          padding: '14px 24px',
          borderRadius: 16,
          background: `rgba(4, 10, 18, ${style.backgroundOpacity ?? 0.78})`,
          color: '#FFFFFF',
          fontSize: style.fontSize ?? 42,
          lineHeight: 1.2,
          textAlign: 'center',
          boxShadow: '0 12px 40px rgba(0,0,0,.28)',
        }}
      >
        {active.text}
      </div>
    </AbsoluteFill>
  );
};

export const MediaLayer: React.FC<{media?: MediaStack}> = ({media}) => {
  if (!media) return null;

  return (
    <>
      {(media.imageTracks ?? []).map((track) => (
        <ImageTrackLayer key={track.id} track={track} />
      ))}
      {(media.videoTracks ?? []).map((track) => (
        <VideoTrackLayer key={track.id} track={track} />
      ))}
      {(media.audioTracks ?? []).map((track) => (
        <AudioTrackLayer key={track.id} track={track} />
      ))}
      {(media.captionTracks ?? []).map((track) => (
        <CaptionTrackLayer key={track.id} track={track} />
      ))}
    </>
  );
};
