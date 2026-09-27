import themeCatalog from '../../../themes/catalog.json';

export type VideoTheme = {
  colors: {
    ink: string;
    panel: string;
    paper: string;
    muted: string;
    accent: string;
    line: string;
  };
  font: {
    family: string;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
  };
};

export const themePacks = themeCatalog as Record<string, VideoTheme>;

export const getVideoTheme = (id: string): VideoTheme => {
  const theme = themePacks[id];
  if (!theme) {
    throw new Error(`Unknown video theme: ${id}`);
  }
  return theme;
};

export const videoTheme = getVideoTheme('default-dark');
