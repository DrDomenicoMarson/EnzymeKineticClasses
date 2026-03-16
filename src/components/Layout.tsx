import { ReactNode } from 'react';
import { useAppContext } from '../context/useAppContext';

interface LayoutProps {
  children: ReactNode;
  header: ReactNode;
}

/**
 * Renders the application shell shared by all tabs.
 *
 * @param props The layout props.
 * @param props.children The main page content.
 * @param props.header The controls displayed in the header toolbar.
 * @returns The simulator layout.
 */
export function Layout({ children, header }: LayoutProps) {
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
}
