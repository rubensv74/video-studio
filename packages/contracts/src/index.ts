export type VideoEngine = 'remotion' | 'motion-canvas';
export type VideoFormat = 'mp4' | 'webm' | 'gif' | 'png-sequence';

export type VideoScene = {
  id: string;
  type: string;
  durationSeconds: number;
  payload?: Record<string, unknown>;
};

export type AudioTrackRole = 'voiceover' | 'music' | 'sfx' | 'ambient';

export type AudioTrack = {
  id: string;
  role: AudioTrackRole;
  src: string;
  startSeconds?: number;
  durationSeconds?: number;
  trimBeforeSeconds?: number;
  trimAfterSeconds?: number;
  volume?: number;
  loop?: boolean;
  enabled?: boolean;
};

export type MediaObjectFit = 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';

export type VideoTrack = {
  id: string;
  src: string;
  startSeconds?: number;
  durationSeconds?: number;
  trimBeforeSeconds?: number;
  trimAfterSeconds?: number;
  volume?: number;
  muted?: boolean;
  loop?: boolean;
  enabled?: boolean;
  objectFit?: MediaObjectFit;
  opacity?: number;
  layout?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    borderRadius?: number;
  };
};

export type CaptionCue = {
  startMs: number;
  endMs: number;
  text: string;
};

export type CaptionTrack = {
  id: string;
  src?: string;
  format?: 'srt';
  cues?: CaptionCue[];
  startSeconds?: number;
  enabled?: boolean;
  style?: {
    bottom?: number;
    fontSize?: number;
    maxWidth?: number;
    backgroundOpacity?: number;
  };
};

export type MediaStack = {
  audioTracks?: AudioTrack[];
  videoTracks?: VideoTrack[];
  captionTracks?: CaptionTrack[];
};

export type DerivativeOutput = {
  id: string;
  format: 'webm' | 'gif';
  file: string;
  fps?: number;
  width?: number;
};

export type AudioNormalization = {
  enabled: boolean;
  file: string;
  integratedLufs?: number;
  truePeakDb?: number;
  loudnessRange?: number;
};

export type VideoProjectManifest = {
  version: 1;
  id: string;
  title: string;
  engine: VideoEngine;
  compositionId: string;
  theme: string;
  output: {
    width: number;
    height: number;
    fps: number;
    format: VideoFormat;
    file: string;
  };
  /**
   * Legacy VS-G01 paths. Kept for backwards compatibility while projects migrate
   * to the timed media stack.
   */
  audio?: {
    voiceover?: string;
    music?: string;
    captions?: string;
  };
  media?: MediaStack;
  derivatives?: DerivativeOutput[];
  audioNormalization?: AudioNormalization;
  data?: {
    inline?: Record<string, unknown>;
    jsonFiles?: string[];
    endpoints?: string[];
  };
  scenes: VideoScene[];
};
