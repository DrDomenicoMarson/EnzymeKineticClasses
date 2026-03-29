import { useState } from 'react';
import type { Data, Layout } from 'plotly.js';
import { DocumentationBlock } from '../../components/DocumentationBlock';
import { KineticInputPanel } from '../../components/KineticInputPanel';
import { Plot } from '../../components/Plot';
import { ResultCard } from '../../components/ResultCard';
import { SolveModeSelector } from '../../components/SolveModeSelector';
import { ValidationNotice } from '../../components/ValidationNotice';
import {
  buildLevenspielComparison,
  calculateEquivalentPerformance,
  generateCharacteristicTimeCurve,
  generateNormalizedDecayCurve,
  reciprocalRateAt,
} from '../../lib/comparison/levenspiel';
import { 
  solveCSTRSeriesForward, 
  solveScaledCSTRSeriesForTargetConversion 
} from '../../lib/reactors/cstrSeries';
import { Units, formatNumber } from '../../lib/units/format';
import { validateCSTRSeriesForm } from '../../lib/validation';
import {
  CSTRSeriesFormState,
  CSTRSeriesInput,
  SharedSimulatorInputs,
} from '../../types';

interface CompareTabProps {
  shared: SharedSimulatorInputs;
  seriesState: CSTRSeriesFormState;
  onSharedChange: (updates: Partial<SharedSimulatorInputs>) => void;
  onSeriesChange: (updates: Partial<CSTRSeriesFormState>) => void;
}

/**
 * Renders the dedicated reactor-comparison tab.
 *
 * @param props The component props.
 * @param props.shared The shared kinetic and feed inputs.
 * @param props.seriesState The staged-reactor state reused for the comparison basis.
 * @param props.onSharedChange Callback used to update shared inputs.
 * @param props.onSeriesChange Callback used to update staged-reactor state.
 * @returns The comparison tab content.
 */
export function CompareTab({
  shared,
  seriesState,
  onSharedChange,
  onSeriesChange,
}: CompareTabProps) {
  const [compareMode, setCompareMode] = useState<'fixed_tau' | 'target_conversion'>('fixed_tau');
  const [compareTargetX, setCompareTargetX] = useState(0.9);

  const validationMessages = validateCSTRSeriesForm(shared, seriesState);
  const seriesInput: CSTRSeriesInput = {
    kinetics: shared.kinetics,
    a_in: shared.a_in,
    v_dot: shared.v_dot,
    volumes: seriesState.volumes,
  };

  const isTargetMode = compareMode === 'target_conversion';

  const baseOutput =
    validationMessages.length === 0 ? solveCSTRSeriesForward(seriesInput) : null;
  const targetSeriesOutput = 
    isTargetMode && validationMessages.length === 0 
      ? solveScaledCSTRSeriesForTargetConversion(seriesInput, compareTargetX) 
      : null;

  const performance =
    validationMessages.length === 0 ? calculateEquivalentPerformance(seriesInput, isTargetMode ? compareTargetX : undefined) : [];
  const characteristicCurve =
    validationMessages.length === 0
      ? generateCharacteristicTimeCurve(seriesInput, 0.98, 55)
      : [];
  const normalizedDecay =
    validationMessages.length === 0 && baseOutput
      ? generateNormalizedDecayCurve(seriesInput, Math.max(baseOutput.tau_total * 1.6, 8), 60)
      : [];
  const levenspiel =
    validationMessages.length === 0 ? buildLevenspielComparison(seriesInput, isTargetMode ? compareTargetX : undefined) : null;

  const characteristicData: Data[] = [
    {
      x: characteristicCurve.map((point) => point.X),
      y: characteristicCurve.map((point) => point.cstrTau),
      type: 'scatter',
      mode: 'lines',
      name: 'Single CSTR (τ)',
      line: { color: '#ef4444', width: 3 },
    },
    {
      x: characteristicCurve.map((point) => point.X),
      y: characteristicCurve.map((point) => point.pfrTau),
      type: 'scatter',
      mode: 'lines',
      name: 'PFR (τ)',
      line: { color: '#10b981', width: 3 },
    },
    {
      x: characteristicCurve
        .filter((point) => point.seriesTau !== null)
        .map((point) => point.X),
      y: characteristicCurve
        .filter((point) => point.seriesTau !== null)
        .map((point) => point.seriesTau as number),
      type: 'scatter',
      mode: 'lines',
      name: 'CSTR Train (τ)',
      line: { color: '#2563eb', width: 3, dash: 'dash' },
    },
  ];

  const characteristicLayout: Partial<Layout> = {
    margin: { t: 20, r: 20, b: 50, l: 55 },
    xaxis: { title: { text: 'Conversion X (-)' }, range: [0, 1] },
    yaxis: { title: { text: 'Residence Time, τ (min)' } },
    legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: 1.15 },
    autosize: true,
  };

  const seriesAreaTraces: Data[] =
    levenspiel?.cstrSeriesAreas.map((area) => ({
      x: area.x,
      y: area.y,
      type: 'scatter' as const,
      mode: 'lines' as const,
      name: area.label,
      fill: 'toself' as const,
      fillcolor: area.fillColor,
      line: { color: area.lineColor, width: 1.5 },
    })) ?? [];

  const operatingPointRates = performance.map((row) => reciprocalRateAt(seriesInput, row.a_out));
  const finiteLevenspielXValues =
    levenspiel === null
      ? []
      : [
          ...levenspiel.pfrArea.x,
          ...levenspiel.cstrArea.x,
          ...levenspiel.cstrSeriesAreas.flatMap((area) => area.x),
          ...performance.map((row) => row.a_out),
          shared.a_in,
        ].filter((value) => Number.isFinite(value));
  const finiteLevenspielYValues =
    levenspiel === null
      ? []
      : [
          ...levenspiel.pfrArea.y,
          ...levenspiel.cstrArea.y,
          ...levenspiel.cstrSeriesAreas.flatMap((area) => area.y),
          ...operatingPointRates,
        ].filter((value) => Number.isFinite(value) && value >= 0);
  const levenspielXRange =
    finiteLevenspielXValues.length === 0
      ? undefined
      : (() => {
          const minValue = Math.min(...finiteLevenspielXValues);
          const maxValue = Math.max(...finiteLevenspielXValues);
          const span = Math.max(maxValue - minValue, 0.1);
          const padding = span * 0.08;
          return [Math.max(0, minValue - padding), maxValue + padding] as [number, number];
        })();
  const levenspielYRange =
    finiteLevenspielYValues.length === 0
      ? undefined
      : [0, Math.max(Math.max(...finiteLevenspielYValues) * 1.12, 1)];

  const levenspielData: Data[] =
    levenspiel === null || baseOutput === null
      ? []
      : [
          {
            x: levenspiel.curve.map((point) => point.a),
            y: levenspiel.curve.map((point) => point.reciprocalRate),
            type: 'scatter',
            mode: 'lines',
            name: 'Kinetics: 1/v(a)',
            line: { color: '#1f2937', width: 2.5, dash: 'dot' },
          },
          {
            x: levenspiel.pfrArea.x,
            y: levenspiel.pfrArea.y,
            type: 'scatter',
            mode: 'lines',
            name: levenspiel.pfrArea.label,
            fill: 'toself',
            fillcolor: levenspiel.pfrArea.fillColor,
            line: { color: levenspiel.pfrArea.lineColor, width: 2 },
          },
          {
            x: levenspiel.cstrArea.x,
            y: levenspiel.cstrArea.y,
            type: 'scatter',
            mode: 'lines',
            name: levenspiel.cstrArea.label,
            fill: 'toself',
            fillcolor: levenspiel.cstrArea.fillColor,
            line: { color: levenspiel.cstrArea.lineColor, width: 2 },
          },
          ...seriesAreaTraces,
          {
            x: performance.map((row) => row.a_out),
            y: operatingPointRates,
            type: 'scatter',
            mode: 'text+markers',
            name: 'Operating points',
            text: performance.map((row) => row.label),
            textposition: 'top center',
            cliponaxis: false,
            marker: {
              size: 10,
              color: ['#2563eb', '#ef4444', '#10b981'],
            },
          },
        ];

  const levenspielLayout: Partial<Layout> = {
    margin: { t: 20, r: 20, b: 50, l: 60 },
    xaxis: {
      title: { text: 'Substrate Concentration, a' },
      range: levenspielXRange,
    },
    yaxis: {
      title: { text: 'Reciprocal Rate, 1/v(a)' },
      range: levenspielYRange,
    },
    legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: 1.18 },
    autosize: true,
  };

  const normalizedDecayData: Data[] = [
    {
      x: normalizedDecay.map((point) => point.tau),
      y: normalizedDecay.map((point) => point.pfr),
      type: 'scatter',
      mode: 'lines',
      name: 'PFR',
      line: { color: '#10b981', width: 3 },
    },
    {
      x: normalizedDecay.map((point) => point.tau),
      y: normalizedDecay.map((point) => point.cstr),
      type: 'scatter',
      mode: 'lines',
      name: 'Single CSTR',
      line: { color: '#ef4444', width: 3, dash: 'dash' },
    },
    {
      x: normalizedDecay
        .filter((point) => point.cstrSeries !== null)
        .map((point) => point.tau),
      y: normalizedDecay
        .filter((point) => point.cstrSeries !== null)
        .map((point) => point.cstrSeries as number),
      type: 'scatter',
      mode: 'lines',
      name: 'CSTR Train',
      line: { color: '#2563eb', width: 3, dash: 'dot' },
    },
  ];

  const normalizedDecayLayout: Partial<Layout> = {
    margin: { t: 20, r: 20, b: 50, l: 60 },
    xaxis: { title: { text: 'Residence Time, τ (min)' } },
    yaxis: {
      title: { text: 'Normalized Outlet Concentration, a_out / a_in' },
      range: [0, 1.05],
    },
    legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: 1.15 },
    autosize: true,
  };

  const handleStageCountChange = (stageCount: number) => {
    const safeStageCount = Math.max(1, Math.min(stageCount, 8));
    const currentVolumes = [...seriesState.volumes];

    while (currentVolumes.length < safeStageCount) {
      currentVolumes.push(currentVolumes[currentVolumes.length - 1] ?? 1);
    }

    onSeriesChange({ volumes: currentVolumes.slice(0, safeStageCount) });
  };

  const handleVolumeChange = (stageIndex: number, nextVolume: number) => {
    const nextVolumes = seriesState.volumes.map((volume, index) =>
      index === stageIndex ? nextVolume : volume,
    );
    onSeriesChange({ volumes: nextVolumes });
  };

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-4 xl:col-span-3">
        <KineticInputPanel
          kinetics={shared.kinetics}
          onChange={(kinetics) => onSharedChange({ kinetics })}
        />

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-4 border-b pb-2">
            <h3 className="text-lg font-semibold text-gray-800">Comparison Basis</h3>
            <p className="mt-1 text-sm text-gray-500">
              {isTargetMode 
                ? 'All reactors scale up or down dynamically to guarantee an identical final conversion (X).'
                : 'All reactors are constrained to the exact total volume (V) of the train to directly compare capability.'}
            </p>
          </div>

          <SolveModeSelector
            mode={compareMode}
            onChange={(mode) => setCompareMode(mode)}
            options={[
              { value: 'fixed_tau', label: 'Equal Total Volume' },
              { value: 'target_conversion', label: 'Equal Target Conversion' },
            ]}
          />

          <div className="space-y-4">
            {compareMode === 'target_conversion' && (
              <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                <label className="mb-1 block text-sm font-medium text-gray-900">
                  Target Conversion, X <span className="text-xs text-gray-500">(-)</span>
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="0.999"
                  value={compareTargetX}
                  onChange={(event) =>
                    setCompareTargetX(Number.parseFloat(event.target.value) || 0)
                  }
                  className="w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Inlet Concentration, a_in{' '}
                <span className="text-xs text-gray-500">({Units.CONCENTRATION})</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={shared.a_in}
                onChange={(event) =>
                  onSharedChange({ a_in: Number.parseFloat(event.target.value) || 0 })
                }
                className="w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Flow Rate, Q <span className="text-xs text-gray-500">({Units.FLOW})</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={shared.v_dot}
                onChange={(event) =>
                  onSharedChange({ v_dot: Number.parseFloat(event.target.value) || 0 })
                }
                className="w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Train Stage Count
              </label>
              <input
                type="number"
                min="1"
                max="8"
                step="1"
                value={seriesState.volumes.length}
                onChange={(event) =>
                  handleStageCountChange(Number.parseInt(event.target.value, 10) || 1)
                }
                className="w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500"
              />
            </div>

            <div className="space-y-3 rounded-md border border-gray-200 bg-gray-50 p-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-800">
                  Stage Volumes <span className="text-xs font-normal text-gray-500">({isTargetMode ? 'Ratio' : Units.VOLUME})</span>
                </h4>
                {isTargetMode && targetSeriesOutput && (
                  <button
                    type="button"
                    title="Set the train's underlying physical volumes to these exact mathematically calculated values."
                    onClick={() => {
                      const newVolumes = targetSeriesOutput.stages.map(s => Number(Number(s.V).toFixed(4)));
                      onSeriesChange({ volumes: newVolumes });
                    }}
                    className="rounded border border-indigo-200 bg-white px-2 py-1 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-50 active:bg-indigo-100"
                  >
                    Sync to Train
                  </button>
                )}
              </div>
              {seriesState.volumes.map((volume, stageIndex) => {
                const actualVolume = isTargetMode 
                  ? targetSeriesOutput?.stages[stageIndex]?.V 
                  : undefined;
                
                return (
                <div
                  key={`compare-volume-${stageIndex}`}
                  className={`grid ${isTargetMode ? 'grid-cols-[1fr_2fr_1fr]' : 'grid-cols-[1fr_2fr]'} items-center gap-3 ${isTargetMode ? 'opacity-80' : ''}`}
                >
                  <label className="text-sm text-gray-700">Stage {stageIndex + 1} {isTargetMode && 'Ratio'}</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={volume}
                    onChange={(event) =>
                      handleVolumeChange(
                        stageIndex,
                        Number.parseFloat(event.target.value) || 0,
                      )
                    }
                    className="w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500"
                  />
                  {isTargetMode && (
                    <div className="text-sm font-medium text-blue-800 text-right pr-2">
                      {actualVolume !== undefined ? `${formatNumber(actualVolume)} L` : '-'}
                    </div>
                  )}
                </div>
              )})}
            </div>
          </div>
        </div>

        <ValidationNotice messages={validationMessages} />

        <DocumentationBlock
          title="Reactor Comparison"
          assumptions={[
            'The main comparison curve reports residence time τ for continuous-reactor designs only.',
            'The CSTR-train comparison curve scales the currently selected volume ratios uniformly.',
            'Levenspiel areas are shown in concentration space using the lecture notation 1 / v(a).',
          ]}
          equations={[
            {
              notation: 'PFR:',
              latex: '\\tau = \\int_{a_{out}}^{a_{in}} \\frac{da}{v(a)}',
            },
            {
              notation: 'CSTR:',
              latex: '\\tau = \\frac{a_{in} - a_{out}}{v(a_{out})}',
            },
            {
              notation: 'Michaelis-Menten:',
              latex: 'v(a) = \\frac{V_{max} a}{K_M + a}',
            },
          ]}
          notes={[
            'The single CSTR rectangle is larger than the PFR integral for decreasing-rate kinetics because the CSTR operates everywhere at the outlet rate.',
            'A staged train splits that large rectangle into smaller rectangles, which is why it trends toward plug-flow behavior.',
            'Low a_in / KM presets recover the familiar first-order-style normalized decay curves from the lecture slides.',
          ]}
        />
      </div>

      <div className="flex flex-col space-y-6 lg:col-span-8 xl:col-span-9">
        {baseOutput ? (
          <>
            <ResultCard
              title={isTargetMode ? "Performance at Equal Target Conversion" : "Performance at Equal Total Volume"}
              results={[
                { 
                  label: 'Total Train V & τ', 
                  value: (performance[0]?.tau ?? 0) * shared.v_dot, 
                  unit: Units.VOLUME,
                  secondaryValue: performance[0]?.tau ?? 0,
                  secondaryUnit: Units.TIME,
                  highlight: isTargetMode 
                },
                { 
                  label: 'Single CSTR V & τ', 
                  value: (performance[1]?.tau ?? 0) * shared.v_dot, 
                  unit: Units.VOLUME,
                  secondaryValue: performance[1]?.tau ?? 0,
                  secondaryUnit: Units.TIME,
                  highlight: isTargetMode 
                },
                { 
                  label: 'PFR V & τ', 
                  value: (performance[2]?.tau ?? 0) * shared.v_dot, 
                  unit: Units.VOLUME,
                  secondaryValue: performance[2]?.tau ?? 0,
                  secondaryUnit: Units.TIME,
                  highlight: isTargetMode 
                },
                { 
                  label: 'Eval Conversion X', 
                  value: performance[0]?.X ?? 0, 
                  unit: Units.DIMENSIONLESS 
                },
              ]}
            />

            <div className="flex min-h-[360px] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-lg font-semibold text-gray-800">
                Required Residence Time vs Conversion
              </h3>
              <div className="min-h-0 flex-1">
                <Plot
                  data={characteristicData}
                  layout={characteristicLayout}
                  useResizeHandler
                  style={{ width: '100%', height: '100%' }}
                  config={{ displayModeBar: false }}
                />
              </div>
            </div>

            <div className="flex min-h-[420px] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-lg font-semibold text-gray-800">
                Levenspiel Comparison
              </h3>
              <div className="min-h-0 flex-1">
                <Plot
                  data={levenspielData}
                  layout={levenspielLayout}
                  useResizeHandler
                  style={{ width: '100%', height: '100%' }}
                  config={{ displayModeBar: false }}
                />
              </div>
            </div>

            <div className="flex min-h-[360px] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-lg font-semibold text-gray-800">
                Normalized Outlet Concentration Decay
              </h3>
              <div className="min-h-0 flex-1">
                <Plot
                  data={normalizedDecayData}
                  layout={normalizedDecayLayout}
                  useResizeHandler
                  style={{ width: '100%', height: '100%' }}
                  config={{ displayModeBar: false }}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-amber-300 bg-white p-8 text-center text-gray-500 shadow-sm">
            Fix the highlighted inputs to view the reactor-comparison plots.
          </div>
        )}
      </div>
    </div>
  );
}
