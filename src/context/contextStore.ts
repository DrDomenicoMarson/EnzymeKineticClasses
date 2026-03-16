import { createContext } from 'react';

/**
 * Shared UI state stored in the app context.
 */
export interface AppContextValue {
  isLectureMode: boolean;
  toggleLectureMode: () => void;
}

/**
 * React context for app-level UI state.
 */
export const appContext = createContext<AppContextValue | undefined>(undefined);
