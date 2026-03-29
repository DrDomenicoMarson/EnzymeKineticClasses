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
          marker: { color: '#4f46e5' }, // indigo
        },
        {
          x: profile.map((point) => `Stage ${point.stage}`),
          y: profile.map((point) => point.overallConversion),
          type: 'scatter',
          mode: 'lines+markers',
          name: 'Overall Conversion',
          yaxis: 'y2',
          line: { color: '#0d9488', width: 3 }, // teal
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
    font: { size: 12, family: 'Inter, sans-serif' },
    plot_bgcolor: 'transparent',
    paper_bgcolor: 'transparent',
  };

  const performanceData: Data[] = output
    ? [
        {
          x: performance.map((row) => row.label),
          y: performance.map((row) => row.X),
          type: 'bar',
          name: 'Final Conversion',
          marker: { color: ['#4f46e5', '#f43f5e', '#0d9488'] }, // indigo, rose, teal
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
    font: { size: 12, family: 'Inter, sans-serif' },
    plot_bgcolor: 'transparent',
    paper_bgcolor: 'transparent',
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
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-4 xl:col-span-3">
        <KineticInputPanel
          kinetics={shared.kinetics}
          onChange={(kinetics) => onSharedChange({ kinetics })}
        />

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 border-b border-slate-100 pb-3">
            <h3 className="text-lg font-semibold tracking-tight text-slate-800">CSTR Train Inputs</h3>
            <p className="mt-1 text-sm text-slate-500">
              Configure the exact structural volumes for each ideal continuous-stirred tank in the series. The solver aggregates the residence time to determine the total forward conversion.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Inlet Concentration, a_in{' '}
                <span className="text-xs text-slate-400">({Units.CONCENTRATION})</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={shared.a_in}
                onChange={(event) =>
                  onSharedChange({ a_in: Number.parseFloat(event.target.value) || 0 })
                }
                className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-slate-900 shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Flow Rate, Q <span className="text-xs text-slate-400">({Units.FLOW})</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={shared.v_dot}
                onChange={(event) =>
                  onSharedChange({ v_dot: Number.parseFloat(event.target.value) || 0 })
                }
                className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-slate-900 shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
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
                className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-slate-900 shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
            </div>

            <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <h4 className="text-sm font-semibold text-slate-800">
                Stage Volumes <span className="text-xs font-normal text-slate-500">({Units.VOLUME})</span>
              </h4>
              {state.volumes.map((volume, stageIndex) => (
                <div key={`volume-${stageIndex}`} className="grid grid-cols-[1fr_2fr] items-center gap-3">
                  <label className="text-sm font-medium text-slate-600">Stage {stageIndex + 1}</label>
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
                    className="w-full rounded-lg border border-slate-200 bg-white p-2 shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
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

      <div className="flex flex-col space-y-6 lg:col-span-8 xl:col-span-9">
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

            <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
              <div className="flex min-h-[360px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-2 text-lg font-semibold tracking-tight text-slate-800">
                  Stagewise Concentration / Conversion Profile
                </h3>
                <div className="min-h-0 flex-1">
                  <Plot
                    data={profileData}
                    layout={profileLayout}
                    useResizeHandler
                    style={{ width: '100%', height: '100%' }}
                    config={{ displayModeBar: false }}
                  />
                </div>
              </div>

              <div className="flex min-h-[360px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-2 text-lg font-semibold tracking-tight text-slate-800">
                  Final Performance (Same Total τ)
                </h3>
                <div className="min-h-0 flex-1">
                  <Plot
                    data={performanceData}
                    layout={performanceLayout}
                    useResizeHandler
                    style={{ width: '100%', height: '100%' }}
                    config={{ displayModeBar: false }}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm overflow-hidden">
              <h3 className="mb-4 text-lg font-semibold tracking-tight text-slate-800">Stage Summary</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500 bg-slate-50/50">
                      <th className="py-3 px-4 font-medium rounded-tl-lg">Stage</th>
                      <th className="py-3 px-4 font-medium">V (L)</th>
                      <th className="py-3 px-4 font-medium">τ (min)</th>
                      <th className="py-3 px-4 font-medium">a_in</th>
                      <th className="py-3 px-4 font-medium">a_out</th>
                      <th className="py-3 px-4 font-medium">Stage X</th>
                      <th className="py-3 px-4 font-medium rounded-tr-lg">Overall X</th>
                    </tr>
                  </thead>
                  <tbody>
                    {output.stages.map((stage) => (
                      <tr key={`stage-row-${stage.stage}`} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-800">{stage.stage}</td>
                        <td className="py-3 px-4 text-slate-600">{formatNumber(stage.V)}</td>
                        <td className="py-3 px-4 text-slate-600">{formatNumber(stage.tau)}</td>
                        <td className="py-3 px-4 text-slate-600">{formatNumber(stage.a_in)}</td>
                        <td className="py-3 px-4 text-slate-600">{formatNumber(stage.a_out)}</td>
                        <td className="py-3 px-4 text-slate-600">{formatNumber(stage.X_stage, 3)}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{formatNumber(stage.X, 3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {performance.map((row: ReactorPerformanceDatum) => (
                  <div key={row.label} className="flex flex-col rounded-xl border border-indigo-100 bg-gradient-to-b from-slate-50 to-white p-4 shadow-sm">
                    <div className="text-sm font-semibold tracking-tight text-indigo-900">{row.label}</div>
                    <div className="mt-2 text-sm text-slate-600 font-medium">
                      X = {formatNumber(row.X, 3)} <span className="text-slate-300">|</span> a_out = {formatNumber(row.a_out, 3)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/50 p-8 text-center text-amber-600 shadow-sm">
            Fix the highlighted inputs to view the staged-reactor results.
          </div>
        )}
      </div>
    </div>
  );
}
