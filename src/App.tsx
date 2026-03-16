import { lazy, Suspense, useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { LectureModeToggle } from './components/LectureModeToggle';
import { TabNavigation } from './components/TabNavigation';
import { AppProvider } from './context/AppContext';
import { OverviewTab } from './features/overview/OverviewTab';
import {
  createDefaultSimulatorState,
  createSimulatorStateFromPreset,
  defaultPresets,
  getPresetById,
} from './lib/presets/defaults';
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
 * Applies a partial update to the simulator state while marking the preset as custom.
 *
 * @param previousState The current simulator state.
 * @param nextState The updated simulator state.
 * @returns The updated state with preset metadata cleared to custom.
 */
function markCustomPreset(
  previousState: SimulatorState,
  nextState: SimulatorState,
): SimulatorState {
  if (previousState.selectedPresetId === nextState.selectedPresetId) {
    return { ...nextState, selectedPresetId: 'custom' };
  }

  return nextState;
}

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
    setSimulatorState((previousState) =>
      markCustomPreset(previousState, {
        ...previousState,
        shared: {
          ...previousState.shared,
          ...updates,
          kinetics: updates.kinetics ?? previousState.shared.kinetics,
        },
      }),
    );
  };

  const updateBatchState = (updates: Partial<BatchFormState>) => {
    setSimulatorState((previousState) =>
      markCustomPreset(previousState, {
        ...previousState,
        batch: { ...previousState.batch, ...updates },
      }),
    );
  };

  const updateCSTRState = (updates: Partial<ContinuousFormState>) => {
    setSimulatorState((previousState) =>
      markCustomPreset(previousState, {
        ...previousState,
        cstr: { ...previousState.cstr, ...updates },
      }),
    );
  };

  const updatePFRState = (updates: Partial<ContinuousFormState>) => {
    setSimulatorState((previousState) =>
      markCustomPreset(previousState, {
        ...previousState,
        pfr: { ...previousState.pfr, ...updates },
      }),
    );
  };

  const updateSeriesState = (updates: Partial<CSTRSeriesFormState>) => {
    setSimulatorState((previousState) =>
      markCustomPreset(previousState, {
        ...previousState,
        cstrSeries: { ...previousState.cstrSeries, ...updates },
      }),
    );
  };

  const handlePresetChange = (presetId: string) => {
    if (!presetId) {
      return;
    }

    const preset = getPresetById(presetId);
    setSimulatorState(createSimulatorStateFromPreset(preset));
    if (preset.preferredTab) {
      setActiveTab(preset.preferredTab);
    }
  };

  const handleReset = () => {
    setSimulatorState(createDefaultSimulatorState());
    setActiveTab('overview');
  };

  const selectedPreset = defaultPresets.find(
    (preset) => preset.id === simulatorState.selectedPresetId,
  );
  const presetSelectorValue = selectedPreset?.id ?? '';

  return (
    <Layout
      header={
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="rounded border border-gray-300 bg-white p-2 text-sm text-gray-700"
            onChange={(event) => handlePresetChange(event.target.value)}
            value={presetSelectorValue}
          >
            <option value="">Custom scenario</option>
            {defaultPresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleReset}
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Reset to Default
          </button>
          <LectureModeToggle />
        </div>
      }
    >
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="mb-4 rounded-lg border border-sky-100 bg-sky-50 p-4 text-sm text-sky-950">
        <div className="font-semibold">
          {selectedPreset?.name ?? 'Custom scenario'}
        </div>
        <div className="mt-1 text-sky-900">
          {selectedPreset?.description ??
            'Current inputs no longer match a saved preset, so the simulator is running a custom scenario.'}
        </div>
      </div>

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
 * @returns The simulator wrapped in the shared app provider.
 */
function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
