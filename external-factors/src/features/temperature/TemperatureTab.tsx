import { useState, useMemo } from 'react';
import { Plot } from '../../components/Plot';
import { SliderControl } from '../../components/SliderControl';
import { PresetSelector } from '../../components/PresetSelector';
import { TheoryPanel } from '../../components/TheoryPanel';
import { TEMPERATURE_PRESETS, kelvinToCelsius } from '../../lib/constants';
import { kcat as kcatFn } from '../../lib/temperatureModels';
import type { TemperaturePreset, CatalyticModel } from '../../types';

const DK = (title: string, x: string, y: string): Partial<Plotly.Layout> => ({
  title: { text: title, font: { color: '#e2e8f0', size: 15, family: 'Inter' } },
  paper_bgcolor: 'transparent',
  plot_bgcolor: 'rgba(15,23,42,0.6)',
  font: { color: '#94a3b8', family: 'Inter', size: 11 },
  xaxis: { title: { text: x }, gridcolor: 'rgba(148,163,184,0.1)', zerolinecolor: 'rgba(148,163,184,0.15)' },
  yaxis: { title: { text: y }, gridcolor: 'rgba(148,163,184,0.1)', zerolinecolor: 'rgba(148,163,184,0.15)' },
  margin: { l: 65, r: 20, t: 45, b: 55 },
  showlegend: true,
  legend: { font: { size: 10 }, bgcolor: 'transparent' },
});

export function TemperatureTab() {
  const [dH, setDH] = useState(60);
  const [dS, setDS] = useState(-20);
  const [model, setModel] = useState<CatalyticModel>('eyring');
  const [dCp, setDCp] = useState(-4);
  const [Tref, setTref] = useState(298.15);
  const [activePre, setActivePre] = useState('Mesophile');

  /* comparison overlay */
  const [showComp, setShowComp] = useState(false);
  const [dH2, setDH2] = useState(80);
  const [dS2, setDS2] = useState(10);
  const [dCp2, setDCp2] = useState(-2);

  const useMMRT = model === 'mmrt';

  const apply = (p: TemperaturePreset) => {
    if (p.params.dH_act !== undefined) setDH(p.params.dH_act);
    if (p.params.dS_act !== undefined) setDS(p.params.dS_act);
    if (p.params.dCp_act !== undefined) setDCp(p.params.dCp_act);
    if (p.params.T_ref !== undefined) setTref(p.params.T_ref);
    setActivePre(p.name);
  };

  /* Temperature sweep */
  const Ts = useMemo(() => {
    const a: number[] = [];
    for (let T = 273.15; T <= 373.15; T += 0.5) a.push(T);
    return a;
  }, []);

  const kcats = useMemo(
    () => Ts.map((T) => kcatFn(T, dH, dS, useMMRT, dCp, Tref)),
    [Ts, dH, dS, useMMRT, dCp, Tref],
  );

  const Tc = Ts.map(kelvinToCelsius);
  const invT = Ts.map((T) => 1000 / T);  // 1000/T for readability
  const lnK = kcats.map((k) => Math.log(Math.max(k, 1e-30)));
  const lnKT = kcats.map((k, i) => Math.log(Math.max(k / Ts[i], 1e-30)));

  /* Comparison series */
  const kcats2 = useMemo(
    () => (showComp ? Ts.map((T) => kcatFn(T, dH2, dS2, useMMRT, dCp2, Tref)) : []),
    [Ts, dH2, dS2, useMMRT, dCp2, Tref, showComp],
  );
  const lnK2 = kcats2.map((k) => Math.log(Math.max(k, 1e-30)));
  const lnKT2 = kcats2.map((k, i) => Math.log(Math.max(k / Ts[i], 1e-30)));

  const compTrace = (y: number[], name: string): Plotly.Data => ({
    x: invT, y, type: 'scatter', mode: 'lines',
    name, line: { color: '#f59e0b', width: 2, dash: 'dot' },
  });

  return (
    <div className="space-y-6">
      <div className="glass-card p-4">
        <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Enzyme Presets</p>
        <PresetSelector presets={TEMPERATURE_PRESETS} activeName={activePre} onSelect={apply} accentColor="amber" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Controls */}
        <div className="glass-card p-5 space-y-1">
          <h3 className="text-sm font-bold text-amber-400 mb-3">⚡ Catalytic Acceleration</h3>
          <SliderControl label="ΔH‡_act (kJ/mol)" value={dH} min={10} max={150} step={1} unit="kJ/mol" decimals={0} onChange={(v) => { setDH(v); setActivePre(''); }} />
          <SliderControl label="ΔS‡_act (J/mol·K)" value={dS} min={-150} max={50} step={1} unit="J/mol·K" decimals={0} onChange={(v) => { setDS(v); setActivePre(''); }} />

          {/* Model toggle */}
          <div className="flex items-center gap-3 my-3">
            <span className="text-xs text-slate-400">Model:</span>
            {(['eyring', 'mmrt'] as CatalyticModel[]).map((m) => (
              <button key={m} type="button" onClick={() => setModel(m)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold ring-1 transition-all cursor-pointer
                  ${model === m ? 'bg-amber-500/20 text-amber-300 ring-amber-500/40' : 'bg-slate-700/40 text-slate-400 ring-slate-600/30 hover:bg-slate-700/60'}`}
              >
                {m === 'eyring' ? 'Eyring' : 'MMRT'}
              </button>
            ))}
          </div>

          {useMMRT && (
            <>
              <SliderControl label="ΔCp‡ (kJ/mol·K)" value={dCp} min={-10} max={0} step={0.1} unit="kJ/mol·K" onChange={setDCp} />
              <SliderControl label="T_ref (K)" value={Tref} min={273} max={373} step={1} unit="K" decimals={0} onChange={setTref} />
            </>
          )}

          {/* Comparison */}
          <div className="border-t border-slate-700/50 pt-3 mt-3">
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer mb-2">
              <input type="checkbox" checked={showComp} onChange={(e) => setShowComp(e.target.checked)} className="accent-amber-500" />
              Show comparison overlay
            </label>
            {showComp && (
              <div className="pl-2 space-y-1 border-l-2 border-amber-500/30">
                <SliderControl label="ΔH‡₂ (kJ/mol)" value={dH2} min={10} max={150} step={1} decimals={0} onChange={setDH2} />
                <SliderControl label="ΔS‡₂ (J/mol·K)" value={dS2} min={-150} max={50} step={1} decimals={0} onChange={setDS2} />
                {useMMRT && (
                  <SliderControl label="ΔCp‡₂ (kJ/mol·K)" value={dCp2} min={-10} max={0} step={0.1} onChange={setDCp2} />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Plots */}
        <div className="space-y-4">
          <div className="glass-card p-4">
            <Plot
              data={[
                { x: Tc, y: kcats, type: 'scatter', mode: 'lines', name: 'k<sub>cat</sub>', line: { color: '#14b8a6', width: 3 } },
                ...(showComp ? [{ x: Tc, y: kcats2, type: 'scatter' as const, mode: 'lines' as const, name: 'k<sub>cat</sub> (comp)', line: { color: '#f59e0b', width: 2, dash: 'dot' as const } }] : []),
              ]}
              layout={DK('k<sub>cat</sub> vs Temperature', 'T (°C)', 'k<sub>cat</sub> (s⁻¹)')}
              config={{ responsive: true, displaylogo: false }}
              useResizeHandler style={{ width: '100%', height: '350px' }}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="glass-card p-4">
              <Plot
                data={[
                  { x: invT, y: lnK, type: 'scatter', mode: 'lines', name: 'ln k<sub>cat</sub>', line: { color: '#14b8a6', width: 2.5 } },
                  ...(showComp ? [compTrace(lnK2, 'comp')] : []),
                ]}
                layout={DK('Arrhenius Plot', '1000 / T (K⁻¹)', 'ln k<sub>cat</sub>')}
                config={{ responsive: true, displaylogo: false }}
                useResizeHandler style={{ width: '100%', height: '320px' }}
              />
            </div>

            <div className="glass-card p-4">
              <Plot
                data={[
                  { x: invT, y: lnKT, type: 'scatter', mode: 'lines', name: 'ln(k<sub>cat</sub>/T)', line: { color: '#14b8a6', width: 2.5 } },
                  ...(showComp ? [compTrace(lnKT2, 'comp')] : []),
                ]}
                layout={DK('Eyring Plot', '1000 / T (K⁻¹)', 'ln(k<sub>cat</sub> / T)')}
                config={{ responsive: true, displaylogo: false }}
                useResizeHandler style={{ width: '100%', height: '320px' }}
              />
            </div>
          </div>
        </div>
      </div>

      <TheoryPanel
        title="Temperature Acceleration — Theory"
        equations={[
          { label: 'Arrhenius equation', latex: 'k_{cat} = A \\exp\\!\\left(-\\frac{E_a}{RT}\\right)' },
          { label: 'Eyring-Polanyi equation', latex: 'k_{cat} = \\frac{k_B T}{h} \\exp\\!\\left(-\\frac{\\Delta G^\\ddagger_{act}}{RT}\\right) \\quad\\text{with}\\quad \\Delta G^\\ddagger = \\Delta H^\\ddagger - T\\Delta S^\\ddagger' },
          { label: 'Eyring plot (linearised)', latex: '\\ln\\!\\left(\\frac{k_{cat}}{T}\\right) = -\\frac{\\Delta H^\\ddagger}{R}\\frac{1}{T} + \\frac{\\Delta S^\\ddagger}{R} + \\ln\\frac{k_B}{h}' },
          { label: 'MMRT (temperature-dependent activation parameters)', latex: '\\Delta H^\\ddagger(T) = \\Delta H^\\ddagger_0 + \\Delta C_p^\\ddagger(T-T_0), \\qquad \\Delta S^\\ddagger(T) = \\Delta S^\\ddagger_0 + \\Delta C_p^\\ddagger \\ln\\frac{T}{T_0}' },
        ]}
        notes={[
          'With standard Eyring, Arrhenius and Eyring plots are linear.',
          'MMRT introduces curvature via ΔCp‡ (negative for most enzymes), explaining deviations from linearity even below denaturation temperatures.',
          'The Arrhenius E_a relates to ΔH‡ via E_a = ΔH‡ + RT.',
        ]}
      />
    </div>
  );
}
