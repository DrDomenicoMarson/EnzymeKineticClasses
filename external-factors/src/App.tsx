import { lazy, Suspense, useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { TabBar } from './components/TabBar';
import type { TabId } from './types';

const PhTab = lazy(() =>
  import('./features/ph/PhTab').then((m) => ({ default: m.PhTab })),
);
const TemperatureTab = lazy(() =>
  import('./features/temperature/TemperatureTab').then((m) => ({ default: m.TemperatureTab })),
);
const ThermalInactivation = lazy(() =>
  import('./features/temperature/ThermalInactivation').then((m) => ({ default: m.ThermalInactivation })),
);
const ReactorTab = lazy(() =>
  import('./features/reactor/ReactorTab').then((m) => ({ default: m.ReactorTab })),
);

function LoadingFallback() {
  return (
    <div className="glass-card p-8 text-center text-slate-500 animate-pulse">
      Loading module…
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('ph');

  return (
    <Layout>
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          {activeTab === 'ph' && <PhTab />}

          {activeTab === 'temperature' && (
            <div>
              <TemperatureTab />
              <ThermalInactivation />
            </div>
          )}

          {activeTab === 'reactor' && <ReactorTab />}
        </Suspense>
      </ErrorBoundary>
    </Layout>
  );
}
