import type { ReactNode } from 'react';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <header className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-amber-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
            Enzyme External Factors Explorer
          </span>
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
          Interactive tools for understanding pH and temperature effects on enzyme kinetics
        </p>
      </header>
      {children}
    </div>
  );
}
