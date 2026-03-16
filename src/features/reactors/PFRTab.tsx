import type { Data, Layout } from 'plotly.js';
import { DocumentationBlock } from '../../components/DocumentationBlock';
import { KineticInputPanel } from '../../components/KineticInputPanel';
import { Plot } from '../../components/Plot';
import { RateLawPanel } from '../../components/RateLawPanel';
import { ResultCard } from '../../components/ResultCard';
import { SolveModeSelector } from '../../components/SolveModeSelector';
import { ValidationNotice } from '../../components/ValidationNotice';
import { useAppContext } from '../../context/useAppContext';
import {
  generatePFRCurve,
  pfrTauForConversion,
  solvePFRForward,
  solvePFRInverse,
} from '../../lib/reactors/pfr';
import { Units } from '../../lib/units/format';
import { validateContinuousForm } from '../../lib/validation';
import {
  ContinuousFormState,
  ContinuousInput,
  ContinuousOutput,
  SharedSimulatorInputs,
} from '../../types';

interface PFRTabProps {
  shared: SharedSimulatorInputs;
  state: ContinuousFormState;
  onSharedChange: (updates: Partial<SharedSimulatorInputs>) => void;
  onStateChange: (updates: Partial<ContinuousFormState>) => void;
}

/**
 * Renders the PFR tab.
 *
 * @param props The component props.
 * @param props.shared The shared kinetic and feed inputs.
 * @param props.state The PFR-specific UI state.
 * @param props.onSharedChange Callback used to update shared inputs.
 * @param props.onStateChange Callback used to update PFR-specific state.
 * @returns The PFR tab content.
 */
export function PFRTab({
  shared,
  state,
  onSharedChange,
  onStateChange,
}: PFRTabProps) {
  const { isLectureMode } = useAppContext();
  const validationMessages = validateContinuousForm(shared, state);

  const reactorInput: ContinuousInput = {
    kinetics: shared.kinetics,
    a_in: shared.a_in,
    v_dot: shared.v_dot,
    tau: state.tau,
    X_target: state.X_target,
  };

  const output: ContinuousOutput | null =
    validationMessages.length === 0
      ? state.solveMode === 'forward'
        ? solvePFRForward(reactorInput, state.tau)
        : solvePFRInverse(reactorInput, state.X_target)
      : null;

  const maxTau =
    output === null
      ? Math.max(state.tau, pfrTauForConversion(reactorInput, Math.min(state.X_target, 0.95)))
      : Math.max(output.tau * 1.6, state.tau, 10);
  const curve = validationMessages.length === 0 ? generatePFRCurve(reactorInput, maxTau, 80) : [];

  const plotData: Data[] =
    output === null
      ? []
      : [
          {
            x: curve.map((point) => point.tau),
            y: curve.map((point) => point.a_out),
            type: 'scatter',
            mode: 'lines',
            name: 'a vs τ',
            line: { color: '#ef4444', width: isLectureMode ? 4 : 2 },
          },
          {
            x: curve.map((point) => point.tau),
            y: curve.map((point) => point.X),
            type: 'scatter',
            mode: 'lines',
            name: 'X vs τ',
            yaxis: 'y2',
            line: { color: '#10b981', width: isLectureMode ? 4 : 2, dash: 'dash' },
          },
          {
            x: [output.tau],
            y: [output.a_out],
            type: 'scatter',
            mode: 'markers',
            name: 'Outlet Point (a)',
            marker: { color: '#ef4444', size: isLectureMode ? 14 : 10, symbol: 'circle' },
            hoverinfo: 'skip',
          },
          {
            x: [output.tau],
            y: [output.X],
            type: 'scatter',
            mode: 'markers',
            name: 'Outlet Point (X)',
            yaxis: 'y2',
            marker: { color: '#10b981', size: isLectureMode ? 14 : 10, symbol: 'circle' },
            hoverinfo: 'skip',
          },
        ];

  const plotLayout: Partial<Layout> = {
    margin: { t: 10, r: 50, b: 40, l: 50 },
    xaxis: { title: { text: 'Residence Time τ (min) / Position along reactor' } },
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
    font: { size: isLectureMode ? 16 : 12 },
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-4">
        <KineticInputPanel
          kinetics={shared.kinetics}
          onChange={(kinetics) => onSharedChange({ kinetics })}
        />

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <SolveModeSelector
            mode={state.solveMode}
            onChange={(solveMode) => onStateChange({ solveMode })}
            options={[
              { value: 'forward', label: 'Given τ, find a_out' },
              { value: 'inverse', label: 'Given Target X, find τ' },
            ]}
          />

          <div className="mt-4 space-y-4 border-t pt-2">
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

            <div
              className={`rounded-md border p-3 ${
                state.solveMode === 'forward'
                  ? 'border-blue-200 bg-blue-50'
                  : 'border-gray-200 bg-gray-50 opacity-75'
              }`}
            >
              <label className="mb-1 block text-sm font-medium text-gray-900">
                Residence Time, τ{' '}
                <span className="text-xs text-gray-500">({Units.TIME})</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={state.tau}
                onChange={(event) =>
                  onStateChange({ tau: Number.parseFloat(event.target.value) || 0 })
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
          currentOutlet={output?.a_out}
        />

        <DocumentationBlock
          title="Plug Flow Reactor (PFR)"
          assumptions={[
            'Continuous steady inlet and outlet flow',
            'No back-mixing along the flow direction',
            'Concentration a varies continuously along the reactor',
            'Constant density / volume',
          ]}
          equations={[
            { notation: 'Material Balance:', latex: '0 = -\\dot{V}da + dV(-v(a))' },
            { notation: 'Design Equation:', latex: '\\tau = \\int_{a_{out}}^{a_{in}} \\frac{da}{v(a)}' },
            {
              notation: 'Conversion Form:',
              latex:
                '\\tau(X) = \\frac{a_{in}}{V_{max}}X + \\frac{K_M}{V_{max}}\\ln\\left(\\frac{1}{1-X}\\right)',
            },
          ]}
          notes={[
            'The PFR design equation is identical to the batch reactor if t is replaced with τ.',
            'Because there is no back-mixing, the PFR experiences the entire rate spectrum from inlet to outlet.',
            'For Michaelis-Menten kinetics, a PFR generally needs less volume than a CSTR at the same conversion.',
          ]}
        />
      </div>

      <div className="flex flex-col space-y-6 lg:col-span-8">
        {output ? (
          <>
            <ResultCard
              results={[
                {
                  label: 'Outlet Substrate, a_out',
                  value: output.a_out,
                  unit: Units.CONCENTRATION,
                  highlight: state.solveMode === 'forward',
                },
                { label: 'Conversion, X', value: output.X, unit: Units.DIMENSIONLESS },
                {
                  label: 'Residence Time, τ',
                  value: output.tau,
                  unit: Units.TIME,
                  highlight: state.solveMode === 'inverse',
                },
                { label: 'Reactor Volume, V', value: output.V, unit: Units.VOLUME },
              ]}
            />

            <div className="min-h-[400px] flex-1 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-lg font-semibold text-gray-800">
                Steady-State Profile along Tube
              </h3>
              <Plot
                data={plotData}
                layout={plotLayout}
                useResizeHandler
                style={{ width: '100%', height: '100%' }}
                config={{ displayModeBar: false }}
              />
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-amber-300 bg-white p-8 text-center text-gray-500 shadow-sm">
            Fix the highlighted inputs to view the PFR design curves.
          </div>
        )}
      </div>
    </div>
  );
}
