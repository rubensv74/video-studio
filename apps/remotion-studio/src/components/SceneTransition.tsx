import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';

export const SceneTransition: React.FC<
  React.PropsWithChildren<{durationInFrames: number; edgeFrames?: number}>
> = ({children, durationInFrames, edgeFrames = 10}) => {
  const frame = useCurrentFrame();
  const safeDuration = Math.max(1, durationInFrames);
  const fadeFrames = Math.max(1, Math.min(edgeFrames, Math.floor(safeDuration / 3)));

  const enter = interpolate(frame, [0, fadeFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const exitStart = Math.max(fadeFrames, safeDuration - fadeFrames - 1);
  const exit = interpolate(frame, [exitStart, safeDuration - 1], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const opacity = Math.min(enter, exit);
  const translateY = interpolate(enter, [0, 1], [22, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      {children}
    </div>
  );
};
