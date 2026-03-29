import { lazy, Suspense, useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { TabNavigation } from './components/TabNavigation';
import { OverviewTab } from './features/overview/OverviewTab';
import { createDefaultSimulatorState } from './lib/presets/defaults';
import {
  AppMode,
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

// New Inhibition Dashboard
const InhibitionDashboard = lazy(() =>
  import('./features/inhibition/InhibitionDashboard').then((module) => ({
    default: module.InhibitionDashboard,
  })),
);

/**
 * Hub landing screen.
 */
function HubContent({ onSelect }: { onSelect: (mode: AppMode) => void }) {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="mx-auto flex max-w-4xl flex-col items-center">
        <h1 className="mb-4 text-center text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
          Enzyme Reactor Virtual Lab
        </h1>
        <p className="mx-auto mb-16 max-w-2xl text-center text-lg text-slate-600">
          Select a simulation module below to explore the fundamentals of reactor engineering and enzymatic catalysis.
        </p>
        <div className="grid w-full gap-8 md:grid-cols-2">
          {/* Card 1 */}
          <button
            type="button"
            onClick={() => onSelect('standard')}
            className="group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition-all hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-left"
          >
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-8 sm:p-10 h-[280px]">
              <h2 className="text-3xl font-bold text-white">Ideal Reactors</h2>
              <p className="mt-4 text-indigo-100 text-[15px] leading-relaxed">
                Explore Batch, CSTR, and PFR configurations with standard Michaelis-Menten kinetics. Navigate Levenspiel plots and residence time trade-offs.
              </p>
            </div>
            <div className="flex items-center justify-between bg-slate-50 px-8 py-5 font-semibold text-indigo-600 transition-colors group-hover:bg-indigo-50">
              <span>Launch Simulator</span>
              <span>&rarr;</span>
            </div>
          </button>

          {/* Card 2 */}
          <button
            type="button"
            onClick={() => onSelect('inhibition')}
            className="group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition-all hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 text-left"
          >
            <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-8 sm:p-10 h-[280px]">
              <h2 className="text-3xl font-bold text-white">Inhibition Explorer</h2>
              <p className="mt-4 text-teal-100 text-[15px] leading-relaxed">
                Dive deep into complex kinetics. Visualize the distinct penalties of Competitive, Uncompetitive, and Product Inhibition on a live comparative optimization dashboard.
              </p>
            </div>
            <div className="flex items-center justify-between bg-slate-50 px-8 py-5 font-semibold text-teal-600 transition-colors group-hover:bg-teal-50">
              <span>Launch Explorer</span>
              <span>&rarr;</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Standard ideal reactors app content.
 */
function StandardAppContent({ onBack }: { onBack: () => void }) {
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
            onClick={onBack}
            className="rounded border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm transition-colors hover:bg-indigo-100"
          >
            &larr; Back to Hub
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
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
              <div className="rounded border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
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
 * The sophisticated single-dashboard application for inhibitor exploration.
 */
function InhibitionAppContent({ onBack }: { onBack: () => void }) {
  return (
    <Layout
      header={
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700 shadow-sm transition-colors hover:bg-teal-100"
          >
            &larr; Back to Hub
          </button>
          <div className="ml-2 flex items-center border-l border-slate-300 pl-4 text-sm font-medium text-slate-600">
            <span className="flex h-2 w-2 mr-2 rounded-full bg-teal-500"></span>
            Inhibition Explorer
          </div>
        </div>
      }
    >
      <ErrorBoundary>
        <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading Dashboard...</div>}>
          <InhibitionDashboard />
        </Suspense>
      </ErrorBoundary>
    </Layout>
  );
}

/**
 * The application root component determining which sub-app to load.
 */
export default function App() {
  const [appMode, setAppMode] = useState<AppMode>('hub');

  if (appMode === 'standard') {
    return <StandardAppContent onBack={() => setAppMode('hub')} />;
  }

  if (appMode === 'inhibition') {
    return <InhibitionAppContent onBack={() => setAppMode('hub')} />;
  }

  return <HubContent onSelect={setAppMode} />;
}
