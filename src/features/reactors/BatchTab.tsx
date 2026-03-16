import type { Data, Layout } from 'plotly.js';
import { Plot } from '../../components/Plot';
import { DocumentationBlock } from '../../components/DocumentationBlock';
import { KineticInputPanel } from '../../components/KineticInputPanel';
import { RateLawPanel } from '../../components/RateLawPanel';
import { ResultCard } from '../../components/ResultCard';
import { SolveModeSelector } from '../../components/SolveModeSelector';
import { ValidationNotice } from '../../components/ValidationNotice';
import { solveBatchForward, solveBatchInverse } from '../../lib/reactors/batch';
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
            line: { color: '#ef4444', width: 2 },
          },
          {
            x: output.trajectory.map((point) => point.t),
            y: output.trajectory.map((point) => point.X),
            type: 'scatter',
            mode: 'lines',
            name: 'X(t)',
            yaxis: 'y2',
            line: { color: '#10b981', width: 2, dash: 'dash' },
          },
        ];

  const plotLayout: Partial<Layout> = {
    margin: { t: 10, r: 50, b: 40, l: 50 },
    xaxis: { title: { text: 'Time (min)' } },
    yaxis: {
      title: { text: 'Concentration a (mol/L)', font: { color: '#ef4444' } },
      tickfont: { color: '#ef4444' },
    },
    yaxis2: {
      title: { text: 'Conversion X (-)', font: { color: '#10b981' } },
      tickfont: { color: '#10b981' },
      overlaying: 'y',
      side: 'right',
      range: [0, 1.05],
    },
    legend: { x: 0.5, y: 1.1, xanchor: 'center', orientation: 'h' },
    autosize: true,
    font: { size: 12 },
  };

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-4 xl:col-span-3">
        <KineticInputPanel
          kinetics={shared.kinetics}
          onChange={(kinetics) => onSharedChange({ kinetics })}
        />

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <SolveModeSelector
            mode={state.solveMode}
            onChange={(solveMode) => onStateChange({ solveMode })}
            options={[
              { value: 'forward', label: 'Given Time (t), find a(t)' },
              { value: 'inverse', label: 'Given Target X, find t' },
            ]}
          />

          <div className="mt-4 space-y-4 border-t pt-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Initial Concentration, a0{' '}
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

            <div
              className={`rounded-md border p-3 ${
                state.solveMode === 'forward'
                  ? 'border-blue-200 bg-blue-50'
                  : 'border-gray-200 bg-gray-50 opacity-75'
              }`}
            >
              <label className="mb-1 block text-sm font-medium text-gray-900">
                Batch Time, t{' '}
                <span className="text-xs text-gray-500">({Units.TIME})</span>
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
                className="w-full rounded-md border border-gray-300 p-2 shadow-sm"
              />
            </div>

            <div
              className={`rounded-md border p-3 ${
                state.solveMode === 'inverse'
                  ? 'border-blue-200 bg-blue-50'
                  : 'border-gray-200 bg-gray-50 opacity-75'
              }`}
            >
              <label className="mb-1 block text-sm font-medium text-gray-900">
                Target Conversion, X <span className="text-xs text-gray-500">(-)</span>
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
                className="w-full rounded-md border border-gray-300 p-2 shadow-sm"
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

            <div className="flex h-[420px] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white p-4 shadow-sm xl:h-[460px]">
              <h3 className="mb-2 text-lg font-semibold text-gray-800">Trajectories</h3>
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
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-amber-300 bg-white p-8 text-center text-gray-500 shadow-sm">
            Fix the highlighted inputs to view the batch trajectories.
          </div>
        )}
      </div>
    </div>
  );
}
