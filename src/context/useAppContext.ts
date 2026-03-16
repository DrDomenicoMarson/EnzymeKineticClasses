import { useContext } from 'react';
import { appContext } from './contextStore';

/**
 * Reads the shared app context.
 *
 * @returns The current app context value.
 * @throws If the hook is used outside the provider.
 */
export function useAppContext() {
  const context = useContext(appContext);

  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }

  return context;
}
