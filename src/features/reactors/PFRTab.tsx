import React, { useState } from 'react';
import Plotly from 'plotly.js-basic-dist';
import createPlotlyComponentModule from 'react-plotly.js/factory';
const createPlotlyComponent = (createPlotlyComponentModule as any).default || createPlotlyComponentModule;
const Plot = createPlotlyComponent(Plotly);
import { KineticInputPanel } from '../../components/KineticInputPanel';
import { SolveModeSelector } from '../../components/SolveModeSelector';
import { RateLawPanel } from '../../components/RateLawPanel';
import { ResultCard } from '../../components/ResultCard';
import { DocumentationBlock } from '../../components/DocumentationBlock';
import { ContinuousInput, SolveMode } from '../../types';
import { solvePFRForward, solvePFRInverse, generatePFRCurve } from '../../lib/reactors/pfr';
import { Units } from '../../lib/units/format';
import { useAppContext } from '../../context/AppContext';

interface PFRTabProps {
  input: ContinuousInput;
  onInputChange: (input: ContinuousInput) => void;
}

export const PFRTab: React.FC<PFRTabProps> = ({ input, onInputChange }) => {
  const { isLectureMode } = useAppContext();
  const [solveMode, setSolveMode] = useState<SolveMode>('forward');

  const [tau_input, set_tau_input] = useState(input.tau ?? 5.0);
  const [X_target_input, set_X_target_input] = useState(input.X_target ?? 0.8);

  const output = solveMode === 'forward' 
    ? solvePFRForward({ ...input, tau: tau_input }, tau_input)
    : solvePFRInverse({ ...input, X_target: X_target_input }, X_target_input);

  const max_tau = Math.max(output.tau * 1.5, 10.0);
  const curveData = generatePFRCurve(input, max_tau, 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-4 space-y-6">
        <KineticInputPanel 
          kinetics={input.kinetics} 
          onChange={(k) => onInputChange({ ...input, kinetics: k })} 
        />

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <SolveModeSelector 
            mode={solveMode} 
            onChange={setSolveMode}
            options={[
              { value: 'forward', label: 'Given τ, find a_out' },
              { value: 'inverse', label: 'Given Target X, find τ' }
            ]}
          />

          <div className="space-y-4 pt-2 border-t mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inlet Concentration, a_in <span className="text-xs text-gray-500">({Units.CONCENTRATION})</span>
              </label>
              <input
                type="number" step="0.1" min="0" value={input.a_in}
                onChange={(e) => onInputChange({ ...input, a_in: parseFloat(e.target.value) || 0 })}
                className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Flow Rate, V̇ <span className="text-xs text-gray-500">({Units.FLOW})</span>
              </label>
              <input
                type="number" step="0.1" min="0" value={input.v_dot}
                onChange={(e) => onInputChange({ ...input, v_dot: parseFloat(e.target.value) || 0 })}
                className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className={`p-3 rounded-md border ${solveMode === 'forward' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200 opacity-75'}`}>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Residence Time, τ <span className="text-xs text-gray-500">({Units.TIME})</span>
              </label>
              <input
                type="number" step="0.1" min="0" value={tau_input}
                onChange={(e) => set_tau_input(parseFloat(e.target.value) || 0)}
                disabled={solveMode !== 'forward'}
                className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className={`p-3 rounded-md border ${solveMode === 'inverse' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200 opacity-75'}`}>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Target Conversion, X <span className="text-xs text-gray-500">(-)</span>
              </label>
              <input
                type="number" step="0.05" min="0" max="0.999" value={X_target_input}
                onChange={(e) => set_X_target_input(parseFloat(e.target.value) || 0)}
                disabled={solveMode !== 'inverse'}
                className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <RateLawPanel 
          kinetics={input.kinetics} 
          maxConcentration={input.a_in}
          currentInlet={input.a_in}
          currentOutlet={output.a_out}
        />

        <DocumentationBlock 
          title="Plug Flow Reactor (PFR)"
          assumptions={[
            "Continuous steady inlet and outlet flow",
            "No back-mixing along the flow direction",
            "Concentration a depends on the position along the tube",
            "Constant density / volume"
          ]}
          equations={[
            { notation: "Material Balance:", latex: "0 = -\\dot{V}da + dV(-v(a))" },
            { notation: "Design Equation:", latex: "\\tau = \\int_{a_{out}}^{a_{in}} \\frac{da}{v(a)}" },
            { notation: "Conversion Form:", latex: "\\tau(X) = \\frac{a_{in}}{V_{max}}X + \\frac{K_M}{V_{max}}\\ln\\left(\\frac{1}{1-X}\\right)" }
          ]}
          notes={[
            "The mathematical form of the PFR is identical to the Batch reactor, just replacing t with τ.",
            "Because there is no back-mixing, the PFR 'sees the entire rate spectrum'. It operates fast at the entrance and slows down toward the exit.",
            "For decreasing-rate kinetics (like MM), a PFR always requires less volume than a CSTR for the same conversion."
          ]}
        />
      </div>

      <div className="lg:col-span-8 flex flex-col space-y-6">
        <ResultCard 
          results={[
            { label: 'Outlet Substrate, a_out', value: output.a_out, unit: Units.CONCENTRATION, highlight: solveMode === 'forward' },
            { label: 'Conversion, X', value: output.X, unit: Units.DIMENSIONLESS },
            { label: 'Residence Time, τ', value: output.tau, unit: Units.TIME, highlight: solveMode === 'inverse' },
            { label: 'Reactor Volume, V', value: output.tau * input.v_dot, unit: Units.VOLUME }
          ]}
        />

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex-1 min-h-[400px]">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Steady-State Profile along Tube</h3>
          {/* @ts-ignore */}
        <Plot
            data={[
              {
                x: curveData.map(pt => pt.tau),
                y: curveData.map(pt => pt.a_out),
                type: 'scatter', mode: 'lines', name: 'a vs τ',
                line: { color: '#ef4444', width: isLectureMode ? 4 : 2 }
              },
              {
                x: curveData.map(pt => pt.tau),
                y: curveData.map(pt => pt.X),
                type: 'scatter', mode: 'lines', name: 'X vs τ', yaxis: 'y2',
                line: { color: '#10b981', width: isLectureMode ? 4 : 2, dash: 'dash' }
              },
              {
                x: [output.tau],
                y: [output.a_out],
                type: 'scatter', mode: 'markers', name: 'Outlet Point (a)',
                marker: { color: '#ef4444', size: isLectureMode ? 14 : 10, symbol: 'circle' },
                hoverinfo: 'none'
              },
              {
                x: [output.tau],
                y: [output.X],
                type: 'scatter', mode: 'markers', name: 'Outlet Point (X)', yaxis: 'y2',
                marker: { color: '#10b981', size: isLectureMode ? 14 : 10, symbol: 'circle' },
                hoverinfo: 'none'
              }
            ] as any}
            layout={{
              margin: { t: 10, r: 50, b: 40, l: 50 },
              xaxis: { title: 'Residence Time τ (min) / Distance along tube' },
              yaxis: { title: 'Concentration a (mol/L)', titlefont: { color: '#ef4444' }, tickfont: { color: '#ef4444' } },
              yaxis2: { 
                title: 'Conversion X (-)', titlefont: { color: '#10b981' }, tickfont: { color: '#10b981' },
                overlaying: 'y', side: 'right', range: [0, 1.05]
              },
              legend: { x: 0.5, y: 1.1, xanchor: 'center', orientation: 'h' },
              autosize: true,
              font: { size: isLectureMode ? 16 : 12 }
            } as any}
            useResizeHandler={true}
            style={{ width: '100%', height: '100%' }}
            config={{ displayModeBar: false }}
          />
        </div>
      </div>
    </div>
  );
};
