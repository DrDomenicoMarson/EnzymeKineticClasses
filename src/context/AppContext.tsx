import { ReactNode, useState } from 'react';
import { appContext, AppContextValue } from './contextStore';

interface AppProviderProps {
  children: ReactNode;
}

/**
 * Provides cross-app UI state such as lecture mode.
 *
 * @param props The provider props.
 * @param props.children The subtree that consumes the app context.
 * @returns The context provider wrapping the given children.
 */
export function AppProvider({ children }: AppProviderProps) {
  const [isLectureMode, setIsLectureMode] = useState(false);

  const value: AppContextValue = {
    isLectureMode,
    toggleLectureMode: () => setIsLectureMode((previousValue) => !previousValue),
  };

  return <appContext.Provider value={value}>{children}</appContext.Provider>;
}
