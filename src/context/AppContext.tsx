import { createContext, useContext, useState, ReactNode } from 'react';

interface AppContextType {
  isLectureMode: boolean;
  toggleLectureMode: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLectureMode, setIsLectureMode] = useState(false);

  const toggleLectureMode = () => setIsLectureMode(prev => !prev);

  return (
    <AppContext.Provider value={{ isLectureMode, toggleLectureMode }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
