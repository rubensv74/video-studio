export type VideoEngine = 'remotion' | 'motion-canvas';
export type VideoFormat = 'mp4' | 'webm' | 'gif' | 'png-sequence';

export type VideoScene = {
  id: string;
  type: string;
  durationSeconds: number;
  payload?: Record<string, unknown>;
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
  audio?: {
    voiceover?: string;
    music?: string;
    captions?: string;
  };
  data?: {
    inline?: Record<string, unknown>;
    jsonFiles?: string[];
    endpoints?: string[];
  };
  scenes: VideoScene[];
};
