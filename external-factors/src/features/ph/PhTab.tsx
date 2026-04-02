import { useState, useMemo } from 'react';
import { Plot } from '../../components/Plot';
import { SliderControl } from '../../components/SliderControl';
import { PresetSelector } from '../../components/PresetSelector';
import { TheoryPanel } from '../../components/TheoryPanel';
import { PH_PRESETS } from '../../lib/constants';
import {
  activityCurve,
  stabilityCurve,
  phOptimum,
} from '../../lib/phModels';
import type { PhPreset } from '../../types';

const darkLayout = (title: string, xLabel: string, yLabel: string): Partial<Plotly.Layout> => ({
  title: { text: title, font: { color: '#e2e8f0', size: 15, family: 'Inter' } },
  paper_bgcolor: 'transparent',
  plot_bgcolor: 'rgba(15,23,42,0.6)',
  font: { color: '#94a3b8', family: 'Inter', size: 11 },
  xaxis: { title: { text: xLabel }, gridcolor: 'rgba(148,163,184,0.1)', zerolinecolor: 'rgba(148,163,184,0.15)' },
  yaxis: { title: { text: yLabel }, gridcolor: 'rgba(148,163,184,0.1)', zerolinecolor: 'rgba(148,163,184,0.15)' },
  margin: { l: 60, r: 20, t: 45, b: 50 },
  showlegend: true,
  legend: { font: { size: 10 }, bgcolor: 'transparent' },
});

export function PhTab() {
  /* Activity state */
  const [pKa1, setPKa1] = useState(6.5);
  const [pKa2, setPKa2] = useState(9.0);
  const [vPrime, setVPrime] = useState(100);

  /* Stability state */
  const [pKs1, setPKs1] = useState(3.0);
  const [pKs2, setPKs2] = useState(11.0);
  const [n1, setN1] = useState(1.5);
  const [n2, setN2] = useState(1.5);
  const [showStability, setShowStability] = useState(true);

  const [activePreset, setActivePreset] = useState<string>('Trypsin');

  const applyPreset = (p: PhPreset) => {
    setPKa1(p.activity.pKa1);
    setPKa2(p.activity.pKa2);
    setVPrime(p.activity.vPrime);
    setPKs1(p.stability.pKs1);
    setPKs2(p.stability.pKs2);
    setN1(p.stability.n1);
    setN2(p.stability.n2);
    setActivePreset(p.name);
  };

  const pHopt = useMemo(() => phOptimum(pKa1, pKa2), [pKa1, pKa2]);
  const actData = useMemo(() => activityCurve(pKa1, pKa2, vPrime), [pKa1, pKa2, vPrime]);
  const stabData = useMemo(() => stabilityCurve(pKs1, pKs2, n1, n2), [pKs1, pKs2, n1, n2]);

  /* ---------- Activity plot ---------- */

  /* Vertical line at pH optimum */
  const activityShapes: Partial<Plotly.Shape>[] = [
    {
      type: 'line',
      x0: pHopt, x1: pHopt, y0: 0, y1: vPrime * 1.05,
      line: { color: '#f59e0b', width: 1.5, dash: 'dash' },
    },
  ];

  /* ---------- Combined plot ---------- */
  const combinedTraces: Plotly.Data[] = [
    {
      x: actData.map((p) => p.pH),
      y: actData.map((p) => p.value),
      type: 'scatter',
      mode: 'lines',
      name: 'Activity',
      line: { color: '#14b8a6', width: 3 },
      yaxis: 'y',
    },
  ];

  if (showStability) {
    combinedTraces.push({
      x: stabData.map((p) => p.pH),
      y: stabData.map((p) => p.value),
      type: 'scatter',
      mode: 'lines',
      name: 'Stability (%)',
      line: { color: '#06b6d4', width: 2.5, dash: 'dash' },
      yaxis: 'y2',
    });
  }

  const combinedLayout: Partial<Plotly.Layout> = {
    ...darkLayout('pH Activity & Stability', 'pH', 'V<sub>app</sub>'),
    yaxis2: {
      title: { text: 'Residual activity (%)', font: { color: '#06b6d4' } },
      overlaying: 'y',
      side: 'right',
      range: [0, 105],
      gridcolor: 'rgba(148,163,184,0.05)',
      tickfont: { color: '#06b6d4' },
    },
    shapes: activityShapes,
    annotations: [
      {
        x: pHopt,
        y: vPrime * 0.95,
        text: `pH<sub>opt</sub> = ${pHopt.toFixed(2)}`,
        showarrow: false,
        font: { color: '#f59e0b', size: 11 },
        yshift: 10,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Preset row */}
      <div className="glass-card p-4">
        <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Enzyme Presets</p>
        <PresetSelector presets={PH_PRESETS} activeName={activePreset} onSelect={applyPreset} accentColor="teal" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Sliders */}
        <div className="glass-card p-5 space-y-1">
          <h3 className="text-sm font-bold text-teal-400 mb-3">🧪 pH Activity</h3>
          <SliderControl label="pKₐ₁ (acid group)" value={pKa1} min={0} max={7} step={0.1} onChange={(v) => { setPKa1(v); setActivePreset(''); }} />
          <SliderControl label="pKₐ₂ (basic group)" value={pKa2} min={7} max={14} step={0.1} onChange={(v) => { setPKa2(v); setActivePreset(''); }} />
          <SliderControl label="V' (intrinsic rate)" value={vPrime} min={10} max={200} step={1} unit="" decimals={0} onChange={(v) => { setVPrime(v); setActivePreset(''); }} />

          <div className="border-t border-slate-700/50 pt-3 mt-3">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-bold text-cyan-400">🛡️ pH Stability</h3>
              <label className="ml-auto flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showStability}
                  onChange={(e) => setShowStability(e.target.checked)}
                  className="accent-cyan-500"
                />
                Overlay
              </label>
            </div>
            <SliderControl label="pKₛ₁ (acid limit)" value={pKs1} min={0} max={7} step={0.1} onChange={(v) => { setPKs1(v); setActivePreset(''); }} />
            <SliderControl label="pKₛ₂ (alk. limit)" value={pKs2} min={7} max={14} step={0.1} onChange={(v) => { setPKs2(v); setActivePreset(''); }} />
            <SliderControl label="n₁ (steepness)" value={n1} min={0.5} max={4} step={0.1} onChange={setN1} />
            <SliderControl label="n₂ (steepness)" value={n2} min={0.5} max={4} step={0.1} onChange={setN2} />
          </div>

          {/* Info card */}
          <div className="mt-4 rounded-xl bg-slate-900/50 p-3">
            <p className="text-xs text-slate-400">
              <span className="text-amber-400 font-bold">pH optimum:</span>{' '}
              <span className="font-mono">{pHopt.toFixed(2)}</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              = (pKₐ₁ + pKₐ₂) / 2
            </p>
          </div>
        </div>

        {/* Plot */}
        <div className="glass-card p-4">
          <Plot
            data={combinedTraces}
            layout={combinedLayout}
            config={{ responsive: true, displayModeBar: true, displaylogo: false }}
            useResizeHandler
            style={{ width: '100%', height: '500px' }}
          />
        </div>
      </div>

      {/* Theory */}
      <TheoryPanel
        title="pH Kinetics — Theory"
        equations={[
          {
            label: 'Active fraction (two ionisable groups)',
            latex: 'f_{\\text{active}}(\\text{pH}) = \\frac{1}{1 + 10^{pK_{a1} - \\text{pH}} + 10^{\\text{pH} - pK_{a2}}}',
          },
          {
            label: 'Apparent rate',
            latex: "V_{\\text{app}} = V' \\cdot f_{\\text{active}}(\\text{pH})",
          },
          {
            label: 'pH optimum',
            latex: '\\text{pH}_{\\text{opt}} = \\frac{pK_{a1} + pK_{a2}}{2}',
          },
          {
            label: 'Stability (double logistic)',
            latex: '\\text{Residual}(\\text{pH}) = \\frac{1}{1+10^{n_1(pK_{s1}-\\text{pH})}} \\cdot \\frac{1}{1+10^{n_2(\\text{pH}-pK_{s2})}}',
          },
        ]}
        notes={[
          'Bell-shaped activity curves reflect titration of ≥ 2 essential ionisable groups.',
          'The stability plateau is typically broader than the activity bell curve.',
          'pKₐ values from the pH curve can indicate catalytic residue types (Asp 3.86, His 6.09, Cys 8.3, Arg 12.28).',
        ]}
      />
    </div>
  );
}
