import { ReactNode } from 'react';

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
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white shadow">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between xl:px-8">
          <div>
            <h1 className="text-2xl font-bold leading-tight text-gray-900">Enzyme Reactor Simulator</h1>
            <p className="text-sm text-gray-500">Chemical Engineering Education</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {header}
          </div>
        </div>
      </header>
      <main>
        <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 xl:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
