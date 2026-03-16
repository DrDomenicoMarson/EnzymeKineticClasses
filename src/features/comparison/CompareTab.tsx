import type { Data, Layout } from 'plotly.js';
import { DocumentationBlock } from '../../components/DocumentationBlock';
import { KineticInputPanel } from '../../components/KineticInputPanel';
import { Plot } from '../../components/Plot';
import { ResultCard } from '../../components/ResultCard';
import { ValidationNotice } from '../../components/ValidationNotice';
import {
  buildLevenspielComparison,
  calculateEquivalentPerformance,
  generateCharacteristicTimeCurve,
  generateNormalizedDecayCurve,
  reciprocalRateAt,
} from '../../lib/comparison/levenspiel';
import { solveCSTRSeriesForward } from '../../lib/reactors/cstrSeries';
import { Units } from '../../lib/units/format';
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
  const validationMessages = validateCSTRSeriesForm(shared, seriesState);
  const seriesInput: CSTRSeriesInput = {
    kinetics: shared.kinetics,
    a_in: shared.a_in,
    v_dot: shared.v_dot,
    volumes: seriesState.volumes,
  };

  const baseOutput =
    validationMessages.length === 0 ? solveCSTRSeriesForward(seriesInput) : null;
  const performance =
    validationMessages.length === 0 ? calculateEquivalentPerformance(seriesInput) : [];
  const characteristicCurve =
    validationMessages.length === 0
      ? generateCharacteristicTimeCurve(seriesInput, 0.98, 55)
      : [];
  const normalizedDecay =
    validationMessages.length === 0 && baseOutput
      ? generateNormalizedDecayCurve(seriesInput, Math.max(baseOutput.tau_total * 1.6, 8), 60)
      : [];
  const levenspiel =
    validationMessages.length === 0 ? buildLevenspielComparison(seriesInput) : null;

  const characteristicData: Data[] = [
    {
      x: characteristicCurve.map((point) => point.X),
      y: characteristicCurve.map((point) => point.batchTime),
      type: 'scatter',
      mode: 'lines',
      name: 'Batch (t)',
      line: { color: '#7c3aed', width: 3 },
    },
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
    yaxis: { title: { text: 'Characteristic Time / Residence Time (min)' } },
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
            line: { color: '#1f2937', width: 3 },
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
            y: performance.map((row) => reciprocalRateAt(seriesInput, row.a_out)),
            type: 'scatter',
            mode: 'text+markers',
            name: 'Operating points',
            text: performance.map((row) => row.label),
            textposition: 'top center',
            marker: {
              size: 10,
              color: ['#2563eb', '#ef4444', '#10b981'],
            },
          },
        ];

  const levenspielLayout: Partial<Layout> = {
    margin: { t: 20, r: 20, b: 50, l: 60 },
    xaxis: { title: { text: 'Substrate Concentration, a' } },
    yaxis: { title: { text: 'Reciprocal Rate, 1/v(a)' } },
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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-4">
        <KineticInputPanel
          kinetics={shared.kinetics}
          onChange={(kinetics) => onSharedChange({ kinetics })}
        />

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-4 border-b pb-2">
            <h3 className="text-lg font-semibold text-gray-800">Comparison Basis</h3>
            <p className="mt-1 text-sm text-gray-500">
              The CSTR-train curve uses the same stage-volume ratios configured here and in the staged-reactor tab.
            </p>
          </div>

          <div className="space-y-4">
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
                Flow Rate, V̇ <span className="text-xs text-gray-500">({Units.FLOW})</span>
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
              <h4 className="text-sm font-semibold text-gray-800">Stage Volumes</h4>
              {seriesState.volumes.map((volume, stageIndex) => (
                <div
                  key={`compare-volume-${stageIndex}`}
                  className="grid grid-cols-[1fr_2fr] items-center gap-3"
                >
                  <label className="text-sm text-gray-700">Stage {stageIndex + 1}</label>
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
                </div>
              ))}
            </div>
          </div>
        </div>

        <ValidationNotice messages={validationMessages} />

        <DocumentationBlock
          title="Reactor Comparison"
          assumptions={[
            'Batch time t and continuous-reactor residence time τ are shown on a shared characteristic-time axis.',
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

      <div className="flex flex-col space-y-6 lg:col-span-8">
        {baseOutput ? (
          <>
            <ResultCard
              title="Current Fixed-Basis Comparison"
              results={[
                { label: 'Configured Train τ', value: baseOutput.tau_total, unit: Units.TIME },
                { label: 'Train X', value: performance[0]?.X ?? 0, unit: Units.DIMENSIONLESS },
                { label: 'Single CSTR X', value: performance[1]?.X ?? 0, unit: Units.DIMENSIONLESS },
                { label: 'PFR X', value: performance[2]?.X ?? 0, unit: Units.DIMENSIONLESS },
              ]}
            />

            <div className="min-h-[360px] rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-lg font-semibold text-gray-800">
                Required Characteristic Time vs Conversion
              </h3>
              <Plot
                data={characteristicData}
                layout={characteristicLayout}
                useResizeHandler
                style={{ width: '100%', height: '100%' }}
                config={{ displayModeBar: false }}
              />
            </div>

            <div className="min-h-[420px] rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-lg font-semibold text-gray-800">
                Levenspiel Comparison
              </h3>
              <Plot
                data={levenspielData}
                layout={levenspielLayout}
                useResizeHandler
                style={{ width: '100%', height: '100%' }}
                config={{ displayModeBar: false }}
              />
            </div>

            <div className="min-h-[360px] rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-lg font-semibold text-gray-800">
                Normalized Outlet Concentration Decay
              </h3>
              <Plot
                data={normalizedDecayData}
                layout={normalizedDecayLayout}
                useResizeHandler
                style={{ width: '100%', height: '100%' }}
                config={{ displayModeBar: false }}
              />
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
