import type { Data, Layout } from 'plotly.js';
import { Plot } from '../../components/Plot';
import { DocumentationBlock } from '../../components/DocumentationBlock';
import { KineticInputPanel } from '../../components/KineticInputPanel';
import { RateLawPanel } from '../../components/RateLawPanel';
import { ResultCard } from '../../components/ResultCard';
import { SolveModeSelector } from '../../components/SolveModeSelector';
import { ValidationNotice } from '../../components/ValidationNotice';
import { solveBatchForward, solveBatchInverse } from '../../lib/reactors/batch';
import { rate } from '../../lib/kinetics/michaelisMenten';
import { Units } from '../../lib/units/format';
import { validateBatchForm } from '../../lib/validation';
import {
  BatchFormState,
  BatchInput,
  BatchOutput,
  SharedSimulatorInputs,
} from '../../types';

interface BatchTabProps {
  shared: SharedSimulatorInputs;
  state: BatchFormState;
  onSharedChange: (updates: Partial<SharedSimulatorInputs>) => void;
  onStateChange: (updates: Partial<BatchFormState>) => void;
}

/**
 * Renders the batch-reactor tab.
 *
 * @param props The component props.
 * @param props.shared The shared kinetic and feed inputs.
 * @param props.state The batch-specific UI state.
 * @param props.onSharedChange Callback used to update shared inputs.
 * @param props.onStateChange Callback used to update batch-specific state.
 * @returns The batch-reactor page.
 */
export function BatchTab({
  shared,
  state,
  onSharedChange,
  onStateChange,
}: BatchTabProps) {
  const validationMessages = validateBatchForm(shared, state);

  const batchInput: BatchInput = {
    kinetics: shared.kinetics,
    a0: shared.a_in,
    t: state.t,
    X_target: state.X_target,
  };

  const output: BatchOutput | null =
    validationMessages.length === 0
      ? state.solveMode === 'forward'
        ? solveBatchForward(batchInput, state.t)
        : solveBatchInverse(batchInput, state.X_target)
      : null;

  const plotData: Data[] =
    output === null
      ? []
      : [
          {
            x: output.trajectory.map((point) => point.t),
            y: output.trajectory.map((point) => point.a),
            type: 'scatter',
            mode: 'lines',
            name: 'a(t)',
            line: { color: '#4f46e5', width: 2.5 }, // indigo-600
          },
          {
            x: output.trajectory.map((point) => point.t),
            y: output.trajectory.map((point) => point.X),
            type: 'scatter',
            mode: 'lines',
            name: 'X(t)',
            yaxis: 'y2',
            line: { color: '#0d9488', width: 2.5, dash: 'dash' }, // teal-600
          },
        ];

  const plotLayout: Partial<Layout> = {
    margin: { t: 10, r: 50, b: 40, l: 50 },
    xaxis: { title: { text: 'Time (min)' } },
    yaxis: {
      title: { text: 'Concentration a (mol/L)', font: { color: '#4f46e5' } },
      tickfont: { color: '#4f46e5' },
    },
    yaxis2: {
      title: { text: 'Conversion X (-)', font: { color: '#0d9488' } },
      tickfont: { color: '#0d9488' },
      overlaying: 'y',
      side: 'right',
      range: [0, 1.05],
    },
    legend: { x: 0.5, y: 1.1, xanchor: 'center', orientation: 'h' },
    autosize: true,
    font: { size: 12, family: 'Inter, sans-serif' },
    plot_bgcolor: 'transparent',
    paper_bgcolor: 'transparent',
  };

  const levenspielData: Data[] = [];
  if (output !== null) {
    const a0 = shared.a_in;
    const a_end = output.a_final;
    const maxA = Math.max(a0 * 1.05, 0.01);
    const points = 100;
    const da = maxA / points;

    const xCurve = [];
    const yCurve = [];
    for (let i = 1; i <= points; i++) { // Skip 0 to avoid Infinity
      const a_val = i * da;
      const r = rate(a_val, shared.kinetics);
      if (r > 0) {
        xCurve.push(a_val);
        yCurve.push(1 / r);
      }
    }

    const xArea = [];
    const yArea = [];
    if (a_end > 0) {
      xArea.push(a_end);
      yArea.push(1 / rate(a_end, shared.kinetics));
    }
    for (let i = 1; i <= points; i++) {
      const a_val = i * da;
      if (a_val > a_end && a_val < a0) {
        xArea.push(a_val);
        yArea.push(1 / rate(a_val, shared.kinetics));
      }
    }
    if (a0 > 0 && a0 > a_end) {
      xArea.push(a0);
      yArea.push(1 / rate(a0, shared.kinetics));
    }

    levenspielData.push({
      x: xCurve,
      y: yCurve,
      type: 'scatter',
      mode: 'lines',
      name: '1/v(a)',
      line: { color: '#64748b', width: 2 },
      hoverinfo: 'x+y'
    });

    levenspielData.push({
      x: xArea,
      y: yArea,
      type: 'scatter',
      mode: 'none',
      fill: 'tozeroy',
      fillcolor: 'rgba(99, 102, 241, 0.2)', // indigo
      name: 'Batch Time Area',
      hoverinfo: 'skip'
    });
  }

  const levenspielLayout: Partial<Layout> = {
    margin: { t: 10, r: 10, b: 40, l: 60 },
    xaxis: { title: { text: `Substrate a (${Units.CONCENTRATION})` } },
    yaxis: { 
      title: { text: 'Reciprocal Rate 1/v(a)' }, 
      rangemode: 'tozero',
      range: output ? [0, 1.5 * (1 / rate(output.a_final || 0.001, shared.kinetics))] : undefined
    },
    showlegend: false,
    autosize: true,
    font: { size: 12, family: 'Inter, sans-serif' },
    plot_bgcolor: 'transparent',
    paper_bgcolor: 'transparent',
  };

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-4 xl:col-span-3">
        <KineticInputPanel
          kinetics={shared.kinetics}
          onChange={(kinetics) => onSharedChange({ kinetics })}
        />

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <SolveModeSelector
            mode={state.solveMode}
            onChange={(solveMode) => onStateChange({ solveMode })}
            options={[
              { value: 'forward', label: 'Given Time (t), find a(t)' },
              { value: 'inverse', label: 'Given Target X, find t' },
            ]}
          />

          <div className="mt-5 space-y-4 border-t border-slate-100 pt-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Initial Concentration, a0{' '}
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

            <div
              className={`rounded-xl border p-4 transition-colors duration-300 ${
                state.solveMode === 'forward'
                  ? 'border-indigo-100 bg-indigo-50/50'
                  : 'border-slate-100 bg-slate-50/50'
              }`}
            >
              <label className={`mb-1 block text-sm font-medium ${state.solveMode === 'forward' ? 'text-indigo-900' : 'text-slate-500'}`}>
                Batch Time, t{' '}
                <span className="text-xs opacity-75">({Units.TIME})</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={state.t}
                onChange={(event) =>
                  onStateChange({ t: Number.parseFloat(event.target.value) || 0 })
                }
                disabled={state.solveMode !== 'forward'}
                className="w-full rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60 disabled:cursor-not-allowed outline-none"
              />
            </div>

            <div
              className={`rounded-xl border p-4 transition-colors duration-300 ${
                state.solveMode === 'inverse'
                  ? 'border-indigo-100 bg-indigo-50/50'
                  : 'border-slate-100 bg-slate-50/50'
              }`}
            >
              <label className={`mb-1 block text-sm font-medium ${state.solveMode === 'inverse' ? 'text-indigo-900' : 'text-slate-500'}`}>
                Target Conversion, X <span className="text-xs opacity-75">(-)</span>
              </label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="0.999"
                value={state.X_target}
                onChange={(event) =>
                  onStateChange({ X_target: Number.parseFloat(event.target.value) || 0 })
                }
                disabled={state.solveMode !== 'inverse'}
                className="w-full rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60 disabled:cursor-not-allowed outline-none"
              />
            </div>
          </div>
        </div>

        <ValidationNotice messages={validationMessages} />

        <RateLawPanel
          kinetics={shared.kinetics}
          maxConcentration={shared.a_in}
          currentInlet={shared.a_in}
          currentOutlet={output?.a_final}
        />

        <DocumentationBlock
          title="Batch Reactor"
          assumptions={[
            'Perfect mixing throughout the vessel',
            'Constant density / volume',
            'Isothermal operation',
            'No inflow or outflow during the batch time',
          ]}
          equations={[
            { notation: 'Material Balance:', latex: 'V \\frac{da}{dt} = V(-v(a))' },
            { notation: 'Design Equation:', latex: 't = \\int_{a}^{a_0} \\frac{da}{v(a)}' },
            {
              notation: 'Conversion Form:',
              latex:
                't(X) = \\frac{a_0}{V_{max}}X + \\frac{K_M}{V_{max}}\\ln\\left(\\frac{1}{1-X}\\right)',
            },
          ]}
          notes={[
            'The batch reactor concentration evolves in time, not space.',
            'The required time is the area under the 1/v(a) curve between a0 and a(t).',
            'At very high substrate concentrations (a >> KM), the decay becomes close to zero-order.',
          ]}
        />
      </div>

      <div className="flex flex-col space-y-6 lg:col-span-8 xl:col-span-9">
        {output ? (
          <>
            <ResultCard
              results={[
                {
                  label: 'Final Substrate, a(t)',
                  value: output.a_final,
                  unit: Units.CONCENTRATION,
                  highlight: state.solveMode === 'forward',
                },
                { label: 'Conversion, X', value: output.X, unit: Units.DIMENSIONLESS },
                {
                  label: 'Required Time, t',
                  value: output.t,
                  unit: Units.TIME,
                  highlight: state.solveMode === 'inverse',
                },
              ]}
            />

            <div className="flex flex-col xl:flex-row gap-6">
              <div className="flex h-[400px] flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-2 text-lg font-semibold text-slate-800 tracking-tight">Time Trajectories</h3>
                <div className="min-h-0 flex-1">
                  <Plot
                    data={plotData}
                    layout={plotLayout}
                    useResizeHandler
                    style={{ width: '100%', height: '100%' }}
                    config={{ displayModeBar: false }}
                  />
                </div>
              </div>

              <div className="flex h-[400px] flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-2 text-lg font-semibold text-slate-800 tracking-tight">Levenspiel Plot</h3>
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
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/50 p-8 text-center text-amber-600 shadow-sm">
            Fix the highlighted inputs to view the batch trajectories.
          </div>
        )}
      </div>
    </div>
  );
}
