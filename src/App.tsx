import { lazy, Suspense, useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { TabNavigation } from './components/TabNavigation';
import { OverviewTab } from './features/overview/OverviewTab';
import { createDefaultSimulatorState } from './lib/presets/defaults';
import {
  BatchFormState,
  CSTRSeriesFormState,
  ContinuousFormState,
  SharedSimulatorInputs,
  SimulatorState,
  TabId,
} from './types';

const BatchTab = lazy(() =>
  import('./features/reactors/BatchTab').then((module) => ({ default: module.BatchTab })),
);
const CSTRTab = lazy(() =>
  import('./features/reactors/CSTRTab').then((module) => ({ default: module.CSTRTab })),
);
const PFRTab = lazy(() =>
  import('./features/reactors/PFRTab').then((module) => ({ default: module.PFRTab })),
);
const CSTRSeriesTab = lazy(() =>
  import('./features/reactors/CSTRSeriesTab').then((module) => ({
    default: module.CSTRSeriesTab,
  })),
);
const CompareTab = lazy(() =>
  import('./features/comparison/CompareTab').then((module) => ({
    default: module.CompareTab,
  })),
);

/**
 * Renders the stateful simulator shell.
 *
 * @returns The application content inside the shared provider.
 */
function AppContent() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [simulatorState, setSimulatorState] = useState<SimulatorState>(
    createDefaultSimulatorState,
  );

  const updateShared = (updates: Partial<SharedSimulatorInputs>) => {
    setSimulatorState((previousState) => ({
      ...previousState,
      shared: {
        ...previousState.shared,
        ...updates,
        kinetics: updates.kinetics ?? previousState.shared.kinetics,
      },
    }));
  };

  const updateBatchState = (updates: Partial<BatchFormState>) => {
    setSimulatorState((previousState) => ({
      ...previousState,
      batch: { ...previousState.batch, ...updates },
    }));
  };

  const updateCSTRState = (updates: Partial<ContinuousFormState>) => {
    setSimulatorState((previousState) => ({
      ...previousState,
      cstr: { ...previousState.cstr, ...updates },
    }));
  };

  const updatePFRState = (updates: Partial<ContinuousFormState>) => {
    setSimulatorState((previousState) => ({
      ...previousState,
      pfr: { ...previousState.pfr, ...updates },
    }));
  };

  const updateSeriesState = (updates: Partial<CSTRSeriesFormState>) => {
    setSimulatorState((previousState) => ({
      ...previousState,
      cstrSeries: { ...previousState.cstrSeries, ...updates },
    }));
  };

  const handleReset = () => {
    setSimulatorState(createDefaultSimulatorState());
    setActiveTab('overview');
  };

  return (
    <Layout
      header={
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Reset to Default
          </button>
        </div>
      }
    >
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'overview' && <OverviewTab />}

      {activeTab !== 'overview' && (
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="rounded border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-sm">
                Loading tab...
              </div>
            }
          >
            {activeTab === 'batch' && (
              <BatchTab
                shared={simulatorState.shared}
                state={simulatorState.batch}
                onSharedChange={updateShared}
                onStateChange={updateBatchState}
              />
            )}
            {activeTab === 'cstr' && (
              <CSTRTab
                shared={simulatorState.shared}
                state={simulatorState.cstr}
                onSharedChange={updateShared}
                onStateChange={updateCSTRState}
              />
            )}
            {activeTab === 'pfr' && (
              <PFRTab
                shared={simulatorState.shared}
                state={simulatorState.pfr}
                onSharedChange={updateShared}
                onStateChange={updatePFRState}
              />
            )}
            {activeTab === 'cstr-series' && (
              <CSTRSeriesTab
                shared={simulatorState.shared}
                state={simulatorState.cstrSeries}
                onSharedChange={updateShared}
                onStateChange={updateSeriesState}
              />
            )}
            {activeTab === 'compare' && (
              <CompareTab
                shared={simulatorState.shared}
                seriesState={simulatorState.cstrSeries}
                onSharedChange={updateShared}
                onSeriesChange={updateSeriesState}
              />
            )}
          </Suspense>
        </ErrorBoundary>
      )}
    </Layout>
  );
}

/**
 * The application root component.
 *
 * @returns The simulator application.
 */
function App() {
  return <AppContent />;
}

export default App;
