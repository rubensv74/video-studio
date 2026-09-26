import React from 'react';

export const BlueprintGrid: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      opacity: 0.16,
      backgroundImage:
        'linear-gradient(rgba(255,255,255,.22) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.22) 1px, transparent 1px)',
      backgroundSize: '48px 48px',
      maskImage: 'linear-gradient(to bottom, black, transparent 92%)',
    }}
  />
);
