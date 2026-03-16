import type { Data, Layout } from 'plotly.js';
import { DocumentationBlock } from '../../components/DocumentationBlock';
import { KineticInputPanel } from '../../components/KineticInputPanel';
import { Plot } from '../../components/Plot';
import { RateLawPanel } from '../../components/RateLawPanel';
import { ResultCard } from '../../components/ResultCard';
import { ValidationNotice } from '../../components/ValidationNotice';
import { calculateEquivalentPerformance } from '../../lib/comparison/levenspiel';
import {
  generateCSTRSeriesProfile,
  solveCSTRSeriesForward,
} from '../../lib/reactors/cstrSeries';
import { Units, formatNumber } from '../../lib/units/format';
import { validateCSTRSeriesForm } from '../../lib/validation';
import {
  CSTRSeriesFormState,
  CSTRSeriesInput,
  ReactorPerformanceDatum,
  SharedSimulatorInputs,
} from '../../types';

interface CSTRSeriesTabProps {
  shared: SharedSimulatorInputs;
  state: CSTRSeriesFormState;
  onSharedChange: (updates: Partial<SharedSimulatorInputs>) => void;
  onStateChange: (updates: Partial<CSTRSeriesFormState>) => void;
}

/**
 * Renders the staged-CSTR tab.
 *
 * @param props The component props.
 * @param props.shared The shared kinetic and feed inputs.
 * @param props.state The staged-reactor UI state.
 * @param props.onSharedChange Callback used to update shared inputs.
 * @param props.onStateChange Callback used to update staged-reactor state.
 * @returns The CSTR-series tab content.
 */
export function CSTRSeriesTab({
  shared,
  state,
  onSharedChange,
  onStateChange,
}: CSTRSeriesTabProps) {
  const validationMessages = validateCSTRSeriesForm(shared, state);
  const seriesInput: CSTRSeriesInput = {
    kinetics: shared.kinetics,
    a_in: shared.a_in,
    v_dot: shared.v_dot,
    volumes: state.volumes,
  };
  const output =
    validationMessages.length === 0 ? solveCSTRSeriesForward(seriesInput) : null;
  const profile = output ? generateCSTRSeriesProfile(output) : [];
  const performance = output ? calculateEquivalentPerformance(seriesInput) : [];

  const profileData: Data[] = output
    ? [
        {
          x: profile.map((point) => `Stage ${point.stage}`),
          y: profile.map((point) => point.aOut),
          type: 'bar',
          name: 'Outlet Concentration',
          marker: { color: '#2563eb' },
        },
        {
          x: profile.map((point) => `Stage ${point.stage}`),
          y: profile.map((point) => point.overallConversion),
          type: 'scatter',
          mode: 'lines+markers',
          name: 'Overall Conversion',
          yaxis: 'y2',
          line: { color: '#10b981', width: 3 },
          marker: { size: 9 },
        },
      ]
    : [];

  const profileLayout: Partial<Layout> = {
    margin: { t: 20, r: 50, b: 50, l: 50 },
    xaxis: { title: { text: 'CSTR Stage' } },
    yaxis: { title: { text: 'Outlet Concentration a_out (mol/L)' } },
    yaxis2: {
      title: { text: 'Overall Conversion X (-)' },
      overlaying: 'y',
      side: 'right',
      range: [0, 1.05],
    },
    barmode: 'group',
    legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: 1.15 },
    autosize: true,
  };

  const performanceData: Data[] = output
    ? [
        {
          x: performance.map((row) => row.label),
          y: performance.map((row) => row.X),
          type: 'bar',
          name: 'Final Conversion',
          marker: { color: ['#2563eb', '#ef4444', '#10b981'] },
          text: performance.map((row) => formatNumber(row.X, 3)),
          textposition: 'outside',
        },
      ]
    : [];

  const performanceLayout: Partial<Layout> = {
    margin: { t: 20, r: 20, b: 45, l: 50 },
    xaxis: { title: { text: 'Reactor configuration' } },
    yaxis: { title: { text: 'Final Conversion X (-)' }, range: [0, 1.05] },
    autosize: true,
    showlegend: false,
  };

  const handleStageCountChange = (stageCount: number) => {
    const safeStageCount = Math.max(1, Math.min(stageCount, 8));
    const currentVolumes = [...state.volumes];

    while (currentVolumes.length < safeStageCount) {
      currentVolumes.push(currentVolumes[currentVolumes.length - 1] ?? 1);
    }

    onStateChange({ volumes: currentVolumes.slice(0, safeStageCount) });
  };

  const handleVolumeChange = (stageIndex: number, nextVolume: number) => {
    const nextVolumes = state.volumes.map((volume, index) =>
      index === stageIndex ? nextVolume : volume,
    );
    onStateChange({ volumes: nextVolumes });
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
            <h3 className="text-lg font-semibold text-gray-800">CSTR Train Inputs</h3>
            <p className="mt-1 text-sm text-gray-500">
              v1 keeps the staged train in forward-simulation mode with direct stage volumes.
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
                Number of Stages
              </label>
              <input
                type="number"
                min="1"
                max="8"
                step="1"
                value={state.volumes.length}
                onChange={(event) =>
                  handleStageCountChange(Number.parseInt(event.target.value, 10) || 1)
                }
                className="w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500"
              />
            </div>

            <div className="space-y-3 rounded-md border border-gray-200 bg-gray-50 p-3">
              <h4 className="text-sm font-semibold text-gray-800">Stage Volumes</h4>
              {state.volumes.map((volume, stageIndex) => (
                <div key={`volume-${stageIndex}`} className="grid grid-cols-[1fr_2fr] items-center gap-3">
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

        <RateLawPanel
          kinetics={shared.kinetics}
          maxConcentration={shared.a_in}
          currentInlet={shared.a_in}
          currentOutlet={output?.a_out_final}
        />

        <DocumentationBlock
          title="CSTRs in Series"
          assumptions={[
            'Each stage behaves as an ideal CSTR',
            'Flow rate is constant from stage to stage',
            'Unequal stage sizes are allowed intentionally for design exploration',
          ]}
          equations={[
            { notation: 'Stage Balance:', latex: 'a_{in,i} - a_{out,i} = \\tau_i v(a_{out,i})' },
            { notation: 'Stage Residence Time:', latex: '\\tau_i = \\frac{V_i}{\\dot{V}}' },
            { notation: 'Total Residence Time:', latex: '\\tau_{total} = \\sum_i \\tau_i' },
          ]}
          notes={[
            'Adding more stages generally pushes the train toward PFR-like performance.',
            'The configured volume distribution is reused in the comparison tab when the train is scaled.',
            'Unequal sizing is useful for lecture discussion because early and late stages can be emphasized differently.',
          ]}
        />
      </div>

      <div className="flex flex-col space-y-6 lg:col-span-8">
        {output ? (
          <>
            <ResultCard
              results={[
                { label: 'Final Substrate, a_out', value: output.a_out_final, unit: Units.CONCENTRATION },
                { label: 'Final Conversion, X', value: output.X_final, unit: Units.DIMENSIONLESS },
                { label: 'Total Residence Time, τ', value: output.tau_total, unit: Units.TIME },
                { label: 'Total Volume, V', value: output.V_total, unit: Units.VOLUME },
              ]}
            />

            <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
              <div className="min-h-[360px] rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="mb-2 text-lg font-semibold text-gray-800">
                  Stagewise Concentration / Conversion Profile
                </h3>
                <Plot
                  data={profileData}
                  layout={profileLayout}
                  useResizeHandler
                  style={{ width: '100%', height: '100%' }}
                  config={{ displayModeBar: false }}
                />
              </div>

              <div className="min-h-[360px] rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="mb-2 text-lg font-semibold text-gray-800">
                  Final Performance at Same Total τ
                </h3>
                <Plot
                  data={performanceData}
                  layout={performanceLayout}
                  useResizeHandler
                  style={{ width: '100%', height: '100%' }}
                  config={{ displayModeBar: false }}
                />
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-lg font-semibold text-gray-800">Stage Summary</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-2 pr-4">Stage</th>
                      <th className="pb-2 pr-4">V (L)</th>
                      <th className="pb-2 pr-4">τ (min)</th>
                      <th className="pb-2 pr-4">a_in</th>
                      <th className="pb-2 pr-4">a_out</th>
                      <th className="pb-2 pr-4">Stage X</th>
                      <th className="pb-2">Overall X</th>
                    </tr>
                  </thead>
                  <tbody>
                    {output.stages.map((stage) => (
                      <tr key={`stage-row-${stage.stage}`} className="border-b last:border-b-0">
                        <td className="py-2 pr-4 font-medium text-gray-800">{stage.stage}</td>
                        <td className="py-2 pr-4">{formatNumber(stage.V)}</td>
                        <td className="py-2 pr-4">{formatNumber(stage.tau)}</td>
                        <td className="py-2 pr-4">{formatNumber(stage.a_in)}</td>
                        <td className="py-2 pr-4">{formatNumber(stage.a_out)}</td>
                        <td className="py-2 pr-4">{formatNumber(stage.X_stage, 3)}</td>
                        <td className="py-2">{formatNumber(stage.X, 3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {performance.map((row: ReactorPerformanceDatum) => (
                  <div key={row.label} className="rounded-md border border-gray-200 bg-gray-50 p-3">
                    <div className="text-sm font-semibold text-gray-800">{row.label}</div>
                    <div className="mt-2 text-sm text-gray-600">
                      X = {formatNumber(row.X, 3)} | a_out = {formatNumber(row.a_out, 3)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-amber-300 bg-white p-8 text-center text-gray-500 shadow-sm">
            Fix the highlighted inputs to view the staged-reactor results.
          </div>
        )}
      </div>
    </div>
  );
}
