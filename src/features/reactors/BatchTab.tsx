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
import { BatchInput, SolveMode } from '../../types';
import { solveBatchForward, solveBatchInverse } from '../../lib/reactors/batch';
import { Units } from '../../lib/units/format';
import { useAppContext } from '../../context/AppContext';

interface BatchTabProps {
  input: BatchInput;
  onInputChange: (input: BatchInput) => void;
}

export const BatchTab: React.FC<BatchTabProps> = ({ input, onInputChange }) => {
  const { isLectureMode } = useAppContext();
  const [solveMode, setSolveMode] = useState<SolveMode>('forward');

  // We need to keep track of the edited values for both t and X_target independently
  // because toggling modes shouldn't immediately clobber the intention.
  const [t_input, set_t_input] = useState(input.t ?? 5.0);
  const [X_target_input, set_X_target_input] = useState(input.X_target ?? 0.8);

  const output = solveMode === 'forward' 
    ? solveBatchForward({ ...input, t: t_input, X_target: X_target_input }, t_input)
    : solveBatchInverse({ ...input, t: t_input, X_target: X_target_input }, X_target_input);

  const handleModeChange = (m: SolveMode) => setSolveMode(m);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT COLUMN - Controls & Docs */}
      <div className="lg:col-span-4 space-y-6">
        
        <KineticInputPanel 
          kinetics={input.kinetics} 
          onChange={(k) => onInputChange({ ...input, kinetics: k })} 
        />

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <SolveModeSelector 
            mode={solveMode} 
            onChange={handleModeChange}
            options={[
              { value: 'forward', label: 'Given Time (t), find a(t)' },
              { value: 'inverse', label: 'Given Target X, find t' }
            ]}
          />

          <div className="space-y-4 pt-2 border-t mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Initial Concentration, a₀ <span className="text-xs text-gray-500">({Units.CONCENTRATION})</span>
              </label>
              <input
                type="number" step="0.1" min="0" value={input.a0}
                onChange={(e) => onInputChange({ ...input, a0: parseFloat(e.target.value) || 0 })}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 p-2 border"
              />
            </div>

            <div className={`p-3 rounded-md border ${solveMode === 'forward' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200 opacity-75'}`}>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Batch Time, t <span className="text-xs text-gray-500">({Units.TIME})</span>
              </label>
              <input
                type="number" step="0.1" min="0" value={t_input}
                onChange={(e) => set_t_input(parseFloat(e.target.value) || 0)}
                disabled={solveMode !== 'forward'}
                className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
              />
            </div>

            <div className={`p-3 rounded-md border ${solveMode === 'inverse' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200 opacity-75'}`}>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Target Conversion, X <span className="text-xs text-gray-500">(-)</span>
              </label>
              <input
                type="number" step="0.05" min="0" max="1" value={X_target_input}
                onChange={(e) => set_X_target_input(parseFloat(e.target.value) || 0)}
                disabled={solveMode !== 'inverse'}
                className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
              />
            </div>
          </div>
        </div>

        <RateLawPanel 
          kinetics={input.kinetics} 
          maxConcentration={input.a0}
          currentInlet={input.a0}
          currentOutlet={output.a_final}
        />

        <DocumentationBlock 
          title="Batch Reactor"
          assumptions={[
            "Perfect mixing throughout the vessel",
            "Constant density / volume",
            "Isothermal operation",
            "No inflow or outflow during the batch time"
          ]}
          equations={[
            { notation: "Material Balance:", latex: "V \\frac{da}{dt} = V(-v(a))" },
            { notation: "Design Equation:", latex: "t = \\int_{a}^{a_0} \\frac{da}{v(a)}" },
            { notation: "Conversion Form:", latex: "t(X) = \\frac{a_0}{V_{max}}X + \\frac{K_M}{V_{max}}\\ln\\left(\\frac{1}{1-X}\\right)" }
          ]}
          notes={[
            "The batch reactor concentration evolves in time, not space.",
            "The required time is exactly the area under the 1/v(a) curve between a₀ and a(t).",
            "At extremely high substrate concentrations (a ≫ KM), it behaves like a 0th order reaction (linear decay)."
          ]}
        />
      </div>

      {/* RIGHT COLUMN - Results & Plots */}
      <div className="lg:col-span-8 flex flex-col space-y-6">
        
        <ResultCard 
          results={[
            { label: 'Final Substrate, a(t)', value: output.a_final, unit: Units.CONCENTRATION, highlight: solveMode === 'forward' },
            { label: 'Conversion, X', value: output.X, unit: Units.DIMENSIONLESS },
            { label: 'Required Time, t', value: output.t, unit: Units.TIME, highlight: solveMode === 'inverse' },
          ]}
        />

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex-1 min-h-[400px]">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Trajectories</h3>
          {/* @ts-ignore */}
        <Plot
            data={[
              {
                x: output.trajectory.map(pt => pt.t),
                y: output.trajectory.map(pt => pt.a),
                type: 'scatter', mode: 'lines', name: 'a(t)',
                line: { color: '#ef4444', width: isLectureMode ? 4 : 2 }
              },
              {
                x: output.trajectory.map(pt => pt.t),
                y: output.trajectory.map(pt => pt.X),
                type: 'scatter', mode: 'lines', name: 'X(t)', yaxis: 'y2',
                line: { color: '#10b981', width: isLectureMode ? 4 : 2, dash: 'dash' }
              }
            ] as any}
            layout={{
              margin: { t: 10, r: 50, b: 40, l: 50 },
              xaxis: { title: 'Time (min)' },
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
