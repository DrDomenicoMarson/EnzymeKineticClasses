import type { Data, Layout } from 'plotly.js';
import { DocumentationBlock } from '../../components/DocumentationBlock';
import { KineticInputPanel } from '../../components/KineticInputPanel';
import { Plot } from '../../components/Plot';
import { RateLawPanel } from '../../components/RateLawPanel';
import { ResultCard } from '../../components/ResultCard';
import { SolveModeSelector } from '../../components/SolveModeSelector';
import { ValidationNotice } from '../../components/ValidationNotice';
import {
  cstrTauForConversion,
  generateCSTRCurve,
  solveCSTRForward,
  solveCSTRInverse,
} from '../../lib/reactors/cstr';
import { rate } from '../../lib/kinetics/michaelisMenten';
import { Units } from '../../lib/units/format';
import { validateContinuousForm } from '../../lib/validation';
import {
  ContinuousFormState,
  ContinuousInput,
  ContinuousOutput,
  SharedSimulatorInputs,
} from '../../types';

interface CSTRTabProps {
  shared: SharedSimulatorInputs;
  state: ContinuousFormState;
  onSharedChange: (updates: Partial<SharedSimulatorInputs>) => void;
  onStateChange: (updates: Partial<ContinuousFormState>) => void;
}

/**
 * Renders the single-CSTR tab.
 *
 * @param props The component props.
 * @param props.shared The shared kinetic and feed inputs.
 * @param props.state The CSTR-specific UI state.
 * @param props.onSharedChange Callback used to update shared inputs.
 * @param props.onStateChange Callback used to update CSTR-specific state.
 * @returns The CSTR tab content.
 */
export function CSTRTab({
  shared,
  state,
  onSharedChange,
  onStateChange,
}: CSTRTabProps) {
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
        ? solveCSTRForward(reactorInput, state.tau)
        : solveCSTRInverse(reactorInput, state.X_target)
      : null;

  const maxTau =
    output === null
      ? Math.max(state.tau, cstrTauForConversion(reactorInput, Math.min(state.X_target, 0.95)))
      : Math.max(output.tau * 2, state.tau, 10);
  const curve = validationMessages.length === 0 ? generateCSTRCurve(reactorInput, maxTau, 60) : [];

  const plotData: Data[] =
    output === null
      ? []
      : [
          {
            x: curve.map((point) => point.tau),
            y: curve.map((point) => point.a_out),
            type: 'scatter',
            mode: 'lines',
            name: 'a_out vs τ',
            line: { color: '#4f46e5', width: 2.5 }, // indigo
          },
          {
            x: curve.map((point) => point.tau),
            y: curve.map((point) => point.X),
            type: 'scatter',
            mode: 'lines',
            name: 'X vs τ',
            yaxis: 'y2',
            line: { color: '#0d9488', width: 2.5, dash: 'dash' }, // teal
          },
          {
            x: [output.tau],
            y: [output.a_out],
            type: 'scatter',
            mode: 'markers',
            name: 'Operating Point (a)',
            marker: { color: '#4f46e5', size: 10, symbol: 'circle' },
            hoverinfo: 'skip',
          },
          {
            x: [output.tau],
            y: [output.X],
            type: 'scatter',
            mode: 'markers',
            name: 'Operating Point (X)',
            yaxis: 'y2',
            marker: { color: '#0d9488', size: 10, symbol: 'circle' },
            hoverinfo: 'skip',
          },
        ];

  const plotLayout: Partial<Layout> = {
    margin: { t: 10, r: 50, b: 40, l: 50 },
    xaxis: { title: { text: 'Residence Time τ (min)' } },
    yaxis: {
      title: { text: 'Outlet Concentration a_out (mol/L)', font: { color: '#4f46e5' } },
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
    const a_in = shared.a_in;
    const a_out = output.a_out;
    const maxA = Math.max(a_in * 1.05, 0.01);
    const points = 100;
    const da = maxA / points;

    const xCurve = [];
    const yCurve = [];
    for (let i = 1; i <= points; i++) { // Skip 0
      const a_val = i * da;
      const r = rate(a_val, shared.kinetics, shared.a_in);
      if (r > 0) {
        xCurve.push(a_val);
        yCurve.push(1 / r);
      }
    }

    const rec_rate_out = 1 / rate(a_out, shared.kinetics, shared.a_in);

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
      x: [a_out, a_in, a_in, a_out, a_out],
      y: [0, 0, rec_rate_out, rec_rate_out, 0],
      type: 'scatter',
      mode: 'none',
      fill: 'toself',
      fillcolor: 'rgba(99, 102, 241, 0.2)', // indigo
      name: 'CSTR Area',
      hoverinfo: 'skip'
    });
  }

  const levenspielLayout: Partial<Layout> = {
    margin: { t: 10, r: 10, b: 40, l: 60 },
    xaxis: { title: { text: `Substrate a (${Units.CONCENTRATION})` } },
    yaxis: { 
      title: { text: 'Reciprocal Rate 1/v(a)' }, 
      rangemode: 'tozero',
      range: output ? [0, 1.5 * (1 / rate(output.a_out || 0.001, shared.kinetics, shared.a_in))] : undefined
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
              { value: 'forward', label: 'Given τ, find a_out' },
              { value: 'inverse', label: 'Given Target X, find τ' },
            ]}
          />

          <div className="mt-5 space-y-4 border-t border-slate-100 pt-4">
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

            <div
              className={`rounded-xl border p-4 transition-colors duration-300 ${
                state.solveMode === 'forward'
                  ? 'border-indigo-100 bg-indigo-50/50'
                  : 'border-slate-100 bg-slate-50/50'
              }`}
            >
              <label className={`mb-1 block text-sm font-medium ${state.solveMode === 'forward' ? 'text-indigo-900' : 'text-slate-500'}`}>
                Residence Time, τ{' '}
                <span className="text-xs opacity-75">({Units.TIME})</span>
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
          currentOutlet={output?.a_out}
        />

        <DocumentationBlock
          title="Continuous Stirred-Tank Reactor (CSTR)"
          assumptions={[
            'Continuous steady inlet and outlet flow',
            'Perfect mixing inside the vessel (a is uniform and equals a_out)',
            'Constant density / volume',
          ]}
          equations={[
            {
              notation: 'Material Balance:',
              latex: '0 = \\dot{V}a_{in} - \\dot{V}a_{out} + V(-v(a))',
            },
            { notation: 'Design Equation:', latex: 'a_{in} - a = \\tau v(a)' },
            {
              notation: 'Conversion Form:',
              latex:
                '\\tau(X) = \\frac{a_{in}}{V_{max}}X + \\frac{K_M}{V_{max}}\\left(\\frac{X}{1-X}\\right)',
            },
          ]}
          notes={[
            'Because the vessel is perfectly mixed, the whole reactor operates at the slow outlet rate v(a_out).',
            'At high conversions the CSTR becomes much less efficient than a PFR for decreasing-rate kinetics.',
            'For Michaelis-Menten kinetics the forward design equation reduces to a quadratic in a_out.',
          ]}
        />
      </div>

      <div className="flex flex-col space-y-6 lg:col-span-8 xl:col-span-9">
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

            <div className="flex flex-col xl:flex-row gap-6">
              <div className="flex h-[400px] flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-2 text-lg font-semibold text-slate-800 tracking-tight">Steady-State Curves</h3>
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
            Fix the highlighted inputs to view the CSTR design curves.
          </div>
        )}
      </div>
    </div>
  );
}
