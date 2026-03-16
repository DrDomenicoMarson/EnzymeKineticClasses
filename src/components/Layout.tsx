import React, { ReactNode } from 'react';
import { useAppContext } from '../context/AppContext';

interface LayoutProps {
  children: ReactNode;
  header: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children, header }) => {
  const { isLectureMode } = useAppContext();

  return (
    <div className={`min-h-screen bg-gray-50 text-gray-900 ${isLectureMode ? 'lecture-mode' : ''}`}>
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold leading-tight text-gray-900">Enzyme Reactor Simulator</h1>
            <p className="text-sm text-gray-500">Chemical Engineering Education</p>
          </div>
          <div className="flex items-center space-x-4">
            {header}
          </div>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
};
