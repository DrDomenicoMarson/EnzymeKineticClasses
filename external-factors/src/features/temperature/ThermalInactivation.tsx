import { useState, useMemo, useEffect, useRef } from 'react';
import { Plot } from '../../components/Plot';
import { SliderControl } from '../../components/SliderControl';
import { TheoryPanel } from '../../components/TheoryPanel';
import { kelvinToCelsius } from '../../lib/constants';
import {
  vmaxClassical,
  vmaxEquilibrium,
} from '../../lib/temperatureModels';
import type { VmaxInputs } from '../../lib/temperatureModels';
import type { InactivationModel } from '../../types';

const DK = (title: string, x: string, y: string): Partial<Plotly.Layout> => ({
  title: { text: title, font: { color: '#e2e8f0', size: 15, family: 'Inter' } },
  paper_bgcolor: 'transparent',
  plot_bgcolor: 'rgba(15,23,42,0.6)',
  font: { color: '#94a3b8', family: 'Inter', size: 11 },
  xaxis: { title: { text: x }, gridcolor: 'rgba(148,163,184,0.1)' },
  yaxis: { title: { text: y }, gridcolor: 'rgba(148,163,184,0.1)', rangemode: 'tozero' },
  margin: { l: 60, r: 20, t: 45, b: 55 },
  showlegend: true,
  legend: { font: { size: 10 }, bgcolor: 'transparent' },
});

export function ThermalInactivation() {
  const [dH_act, setDHAct] = useState(60);
  const [dS_act, setDSAct] = useState(-20);
  const [dH_inact, setDHIn] = useState(200);
  const [dS_inact, setDSIn] = useState(450);
  const [dH_eq, setDHeq] = useState(100);
  const [T_eq, setTeq] = useState(330);
  const [e0] = useState(1);
  const [time, setTime] = useState(0);
  const [inactModel, setInactModel] = useState<InactivationModel>('both');

  /* Animation */
  const [playing, setPlaying] = useState(false);
  const animRef = useRef<number>(0);

  useEffect(() => {
    if (!playing) { cancelAnimationFrame(animRef.current); return; }
    let last = 0;
    const step = (ts: number) => {
      if (ts - last > 50) {
        setTime((t) => (t >= 300 ? 0 : t + 2));
        last = ts;
      }
      animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animRef.current);
  }, [playing]);

  const p: VmaxInputs = {
    dH_act, dS_act, useMMRT: false, dCp_act: 0, T_ref: 298.15,
    dH_inact, dS_inact, dH_eq, T_eq, e0,
  };

  /* Temperature sweep for 2D plot */
  const Ts = useMemo(() => {
    const a: number[] = [];
    for (let T = 283; T <= 373; T += 0.5) a.push(T);
    return a;
  }, []);
  const Tc = Ts.map(kelvinToCelsius);

  const showClassical = inactModel === 'classical' || inactModel === 'both';
  const showEquil = inactModel === 'equilibrium' || inactModel === 'both';

  const vmaxCl = useMemo(() => (showClassical ? Ts.map((T) => vmaxClassical(T, time, p)) : []), [Ts, time, p, showClassical]);
  const vmaxEq = useMemo(() => (showEquil ? Ts.map((T) => vmaxEquilibrium(T, time, p)) : []), [Ts, time, p, showEquil]);

  /* Multi-time curves */
  const times2d = [0, 10, 30, 60, 120, 300];
  const multiTraces: Plotly.Data[] = [];
  const colors = ['#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e'];

  if (showEquil) {
    times2d.forEach((t, i) => {
      multiTraces.push({
        x: Tc, y: Ts.map((T) => vmaxEquilibrium(T, t, p)),
        type: 'scatter', mode: 'lines',
        name: `Eq t=${t}s`,
        line: { color: colors[i], width: 2 },
      });
    });
  }

  /* 3D surface */
  const surfTs = useMemo(() => {
    const a: number[] = [];
    for (let T = 283; T <= 373; T += 2) a.push(T);
    return a;
  }, []);
  const surfTimes = useMemo(() => {
    const a: number[] = [];
    for (let t = 0; t <= 300; t += 5) a.push(t);
    return a;
  }, []);

  const surfZ_cl = useMemo(
    () => surfTimes.map((t) => surfTs.map((T) => vmaxClassical(T, t, p))),
    [surfTs, surfTimes, p],
  );
  const surfZ_eq = useMemo(
    () => surfTimes.map((t) => surfTs.map((T) => vmaxEquilibrium(T, t, p))),
    [surfTs, surfTimes, p],
  );

  const surfTraces: Plotly.Data[] = [];
  if (showClassical) {
    surfTraces.push({
      z: surfZ_cl, x: surfTs.map(kelvinToCelsius), y: surfTimes,
      type: 'surface', name: 'Classical',
      colorscale: [[0, '#0f172a'], [0.5, '#f43f5e'], [1, '#fbbf24']],
      opacity: 0.85, showscale: false,
    } as Plotly.Data);
  }
  if (showEquil) {
    surfTraces.push({
      z: surfZ_eq, x: surfTs.map(kelvinToCelsius), y: surfTimes,
      type: 'surface', name: 'Equilibrium',
      colorscale: [[0, '#0f172a'], [0.5, '#6366f1'], [1, '#14b8a6']],
      opacity: 0.85, showscale: false,
    } as Plotly.Data);
  }

  return (
    <div className="space-y-6 mt-8">
      <h2 className="text-lg font-bold text-rose-400">🔥 Thermal Inactivation</h2>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Controls */}
        <div className="glass-card p-5 space-y-1">
          {/* Model selector */}
          <div className="flex gap-2 mb-3">
            {(['classical', 'equilibrium', 'both'] as InactivationModel[]).map((m) => (
              <button key={m} type="button" onClick={() => setInactModel(m)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold ring-1 transition-all cursor-pointer
                  ${inactModel === m ? 'bg-rose-500/20 text-rose-300 ring-rose-500/40' : 'bg-slate-700/40 text-slate-400 ring-slate-600/30 hover:bg-slate-700/60'}`}
              >
                {m === 'both' ? 'Both' : m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>

          <SliderControl label="ΔH‡_act (kJ/mol)" value={dH_act} min={10} max={150} step={1} decimals={0} onChange={setDHAct} />
          <SliderControl label="ΔS‡_act (J/mol·K)" value={dS_act} min={-150} max={50} step={1} decimals={0} onChange={setDSAct} />
          <SliderControl label="ΔH‡_inact (kJ/mol)" value={dH_inact} min={50} max={400} step={5} decimals={0} onChange={setDHIn} />
          <SliderControl label="ΔS‡_inact (J/mol·K)" value={dS_inact} min={100} max={900} step={10} decimals={0} onChange={setDSIn} />

          {showEquil && (
            <>
              <div className="border-t border-slate-700/50 pt-2 mt-2" />
              <SliderControl label="ΔH_eq (kJ/mol)" value={dH_eq} min={20} max={300} step={5} decimals={0} onChange={setDHeq} />
              <SliderControl label="T_eq (K)" value={T_eq} min={290} max={380} step={1} unit="K" decimals={0} onChange={setTeq} />
            </>
          )}

          {/* Time + animation */}
          <div className="border-t border-slate-700/50 pt-3 mt-3">
            <div className="flex items-center gap-2 mb-1">
              <SliderControl label={`Time (s) — ${time} s`} value={time} min={0} max={300} step={1} decimals={0} onChange={setTime} />
            </div>
            <button type="button" onClick={() => setPlaying(!playing)}
              className="w-full mt-1 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500/30 to-rose-500/30 text-white ring-1 ring-amber-500/30 hover:ring-amber-500/60 transition-all cursor-pointer"
            >
              {playing ? '⏸ Pause' : '▶ Animate time'}
            </button>
          </div>
        </div>

        {/* Plots */}
        <div className="space-y-4">
          {/* V_max vs T at current time */}
          <div className="glass-card p-4">
            <Plot
              data={[
                ...(showClassical ? [{ x: Tc, y: vmaxCl, type: 'scatter' as const, mode: 'lines' as const, name: `Classical (t=${time}s)`, line: { color: '#f43f5e', width: 3 } }] : []),
                ...(showEquil ? [{ x: Tc, y: vmaxEq, type: 'scatter' as const, mode: 'lines' as const, name: `Equilibrium (t=${time}s)`, line: { color: '#6366f1', width: 3 } }] : []),
              ]}
              layout={DK(`V<sub>max</sub> vs T at t = ${time} s`, 'T (°C)', 'V<sub>max</sub>')}
              config={{ responsive: true, displaylogo: false }}
              useResizeHandler style={{ width: '100%', height: '380px' }}
            />
          </div>

          {/* Multi-time family */}
          <div className="glass-card p-4">
            <Plot
              data={multiTraces}
              layout={DK('V<sub>max</sub> vs T — multiple times', 'T (°C)', 'V<sub>max</sub>')}
              config={{ responsive: true, displaylogo: false }}
              useResizeHandler style={{ width: '100%', height: '380px' }}
            />
          </div>

          {/* 3D surface */}
          <div className="glass-card p-4">
            <Plot
              data={surfTraces}
              layout={{
                title: { text: 'V<sub>max</sub>(T, t) — 3D Surface', font: { color: '#e2e8f0', size: 15, family: 'Inter' } },
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                font: { color: '#94a3b8', family: 'Inter', size: 10 },
                scene: {
                  xaxis: { title: { text: 'T (°C)' }, gridcolor: 'rgba(148,163,184,0.15)', color: '#94a3b8' },
                  yaxis: { title: { text: 'Time (s)' }, gridcolor: 'rgba(148,163,184,0.15)', color: '#94a3b8' },
                  zaxis: { title: { text: 'V_max' }, gridcolor: 'rgba(148,163,184,0.15)', color: '#94a3b8' },
                  bgcolor: 'rgba(15,23,42,0.4)',
                },
                margin: { l: 0, r: 0, t: 45, b: 0 },
                showlegend: true,
                legend: { font: { size: 10 }, bgcolor: 'transparent', x: 0, y: 1 },
              }}
              config={{ responsive: true, displaylogo: false }}
              useResizeHandler style={{ width: '100%', height: '500px' }}
            />
          </div>
        </div>
      </div>

      <TheoryPanel
        title="Thermal Inactivation — Theory"
        equations={[
          { label: 'Classical model', latex: 'V_{max}(t,T)= k_{cat}(T)\\cdot e_0 \\cdot \\exp\\!\\left(-k_{inact}(T)\\,t\\right)' },
          { label: 'Inactivation rate', latex: 'k_{inact}(T)= \\frac{k_B T}{h}\\exp\\!\\left(-\\frac{\\Delta G^\\ddagger_{inact}}{RT}\\right)' },
          { label: 'Equilibrium scheme', latex: 'E_{act} \\underset{}{\\overset{K_{eq}}{\\rightleftharpoons}} E_{inact} \\xrightarrow{k_{inact}} X' },
          { label: 'K_eq temperature dependence', latex: 'K_{eq}(T)= \\exp\\!\\left(\\frac{\\Delta H_{eq}}{R}\\left(\\frac{1}{T_{eq}}-\\frac{1}{T}\\right)\\right)' },
          { label: 'Equilibrium V_max', latex: 'V_{max}(t,T)= k_{cat}\\frac{1}{1+K_{eq}}\\,e_0\\exp\\!\\left(-k_{inact}\\frac{K_{eq}}{1+K_{eq}}\\,t\\right)' },
        ]}
        notes={[
          'Classical model: T-optimum exists only at t > 0 (at t₀, k_cat monotonically increases with T).',
          'Equilibrium model: introduces a true T-optimum even at t = 0 via the factor 1/(1+K_eq).',
          'Above T_eq, the equilibrium shifts toward the inactive form, reducing the observed rate.',
        ]}
      />
    </div>
  );
}
