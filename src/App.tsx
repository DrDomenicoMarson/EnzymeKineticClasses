import { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
import { TabNavigation, TabId } from './components/TabNavigation';
import { LectureModeToggle } from './components/LectureModeToggle';

import { OverviewTab } from './features/overview/OverviewTab';

import { defaultPresets } from './lib/presets/defaults';

// Lazy-load heavy Plotly-dependent tabs
import React from 'react';
const BatchTab = React.lazy(() => import('./features/reactors/BatchTab').then(m => ({ default: m.BatchTab })));
const CSTRTab = React.lazy(() => import('./features/reactors/CSTRTab').then(m => ({ default: m.CSTRTab })));
const PFRTab = React.lazy(() => import('./features/reactors/PFRTab').then(m => ({ default: m.PFRTab })));

import { BatchInput, ContinuousInput } from './types';

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const [kinetics, setKinetics] = useState(defaultPresets[0].kinetics);
  const [a_in, setAIn] = useState(defaultPresets[0].a_in);
  const [v_dot, setVDot] = useState(defaultPresets[0].v_dot);

  const [batchInput, setBatchInput] = useState<BatchInput>({
    kinetics,
    a0: a_in,
  });

  const [continuousInput, setContinuousInput] = useState<ContinuousInput>({
    kinetics,
    a_in,
    v_dot,
  });

  const handleBatchChange = (newInput: BatchInput) => {
    setBatchInput(newInput);
    if (newInput.kinetics !== kinetics) setKinetics(newInput.kinetics);
    if (newInput.a0 !== a_in) {
      setAIn(newInput.a0);
      setContinuousInput(prev => ({ ...prev, a_in: newInput.a0 }));
    }
  };

  const handleContinuousChange = (newInput: ContinuousInput) => {
    setContinuousInput(newInput);
    if (newInput.kinetics !== kinetics) setKinetics(newInput.kinetics);
    if (newInput.a_in !== a_in) {
      setAIn(newInput.a_in);
      setBatchInput(prev => ({ ...prev, a0: newInput.a_in }));
    }
    if (newInput.v_dot !== v_dot) setVDot(newInput.v_dot);
  };

  const loadPreset = (presetId: string) => {
    const preset = defaultPresets.find(p => p.id === presetId);
    if (preset) {
      setKinetics(preset.kinetics);
      setAIn(preset.a_in);
      setVDot(preset.v_dot);
      
      setBatchInput({
        kinetics: preset.kinetics,
        a0: preset.a_in,
        X_target: preset.target_X,
      });

      setContinuousInput({
        kinetics: preset.kinetics,
        a_in: preset.a_in,
        v_dot: preset.v_dot,
        X_target: preset.target_X,
      });

      if (preset.id === 'cstr-vs-pfr') setActiveTab('compare');
      else if (preset.id === 'cstr-series') setActiveTab('cstr-series');
    }
  };

  return (
    <Layout
      header={
        <div className="flex items-center space-x-4">
          <select 
            className="border-gray-300 rounded p-2 text-sm text-gray-700 bg-white"
            onChange={(e) => loadPreset(e.target.value)}
            defaultValue="default"
          >
            <option disabled value="">-- Load Scenario Preset --</option>
            {defaultPresets.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <LectureModeToggle />
        </div>
      }
    >
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="mt-4">
        {activeTab === 'overview' && <OverviewTab />}
        
        <React.Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
          {activeTab === 'batch' && <BatchTab input={batchInput} onInputChange={handleBatchChange} />}
          {activeTab === 'cstr' && <CSTRTab input={continuousInput} onInputChange={handleContinuousChange} />}
          {activeTab === 'pfr' && <PFRTab input={continuousInput} onInputChange={handleContinuousChange} />}
        </React.Suspense>
        
        {activeTab === 'cstr-series' && (
          <div className="p-8 text-center text-gray-500 bg-white rounded shadow-sm border">
            <h2 className="text-xl font-bold mb-2">CSTR Series Tab</h2>
            <p>Coming in Phase 3.</p>
          </div>
        )}
        {activeTab === 'compare' && (
          <div className="p-8 text-center text-gray-500 bg-white rounded shadow-sm border">
            <h2 className="text-xl font-bold mb-2">Comparison & Levenspiel Plot</h2>
            <p>Coming in Phase 4.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
