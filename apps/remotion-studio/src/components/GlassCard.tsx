import React from 'react';
import {videoTheme} from '@video-studio/design-system';

export const GlassCard: React.FC<React.PropsWithChildren<{style?: React.CSSProperties}>> = ({children, style}) => (
  <div
    style={{
      border: `1px solid ${videoTheme.colors.line}`,
      background: 'rgba(16,26,43,0.72)',
      borderRadius: videoTheme.radius.md,
      boxShadow: '0 18px 70px rgba(0,0,0,0.30)',
      backdropFilter: 'blur(18px)',
      ...style,
    }}
  >
    {children}
  </div>
);
