import React, {createContext, useContext} from 'react';
import {
  getVideoTheme,
  videoTheme,
  type VideoTheme,
} from '@video-studio/design-system';

const VideoThemeContext = createContext<VideoTheme>(videoTheme);

export const VideoThemeProvider: React.FC<
  React.PropsWithChildren<{themeId: string}>
> = ({themeId, children}) => (
  <VideoThemeContext.Provider value={getVideoTheme(themeId)}>
    {children}
  </VideoThemeContext.Provider>
);

export const useVideoTheme = () => useContext(VideoThemeContext);
