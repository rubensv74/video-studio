import React from 'react';
import {useVideoTheme} from './VideoThemeContext';

export const GlassCard: React.FC<
  React.PropsWithChildren<{style?: React.CSSProperties}>
> = ({children, style}) => {
  const theme = useVideoTheme();

  return (
    <div
      style={{
        border: `1px solid ${theme.colors.line}`,
        background: theme.colors.panel,
        borderRadius: theme.radius.md,
        boxShadow: '0 18px 70px rgba(0,0,0,0.30)',
        opacity: 0.92,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
