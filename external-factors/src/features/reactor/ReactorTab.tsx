import { useState, useMemo } from 'react';
import { Plot } from '../../components/Plot';
import { SliderControl } from '../../components/SliderControl';
import { TheoryPanel } from '../../components/TheoryPanel';
import { kelvinToCelsius } from '../../lib/constants';
import {
  solveCSTR,
  solvePFR,
  cstrTempSweep,
  pfrTempSweep,
} from '../../lib/reactorModels';
import type { ReactorInputs } from '../../lib/reactorModels';

const DK = (title: string, x: string, y: string): Partial<Plotly.Layout> => ({
  title: { text: title, font: { color: '#e2e8f0', size: 15, family: 'Inter' } },
  paper_bgcolor: 'transparent',
  plot_bgcolor: 'rgba(15,23,42,0.6)',
  font: { color: '#94a3b8', family: 'Inter', size: 11 },
  xaxis: { title: { text: x }, gridcolor: 'rgba(148,163,184,0.1)' },
  yaxis: { title: { text: y }, gridcolor: 'rgba(148,163,184,0.1)', rangemode: 'tozero' },
  margin: { l: 65, r: 20, t: 45, b: 55 },
  showlegend: true,
  legend: { font: { size: 10 }, bgcolor: 'transparent' },
});

export function ReactorTab() {
  /* Kinetic / reactor parameters */
  const [K_M, setKM] = useState(2);
  const [a_in, setAin] = useState(10);
  const [e_in, setEin] = useState(1);
  const [tau, setTau] = useState(5);
  const [T, setT] = useState(310);
  /* Temp-dependent kinetics */
  const [dH_act, setDHAct] = useState(60);
  const [dS_act, setDSAct] = useState(-20);
  const [dH_inact, setDHIn] = useState(200);
  const [dS_inact, setDSIn] = useState(450);
  const [dH_eq, setDHeq] = useState(100);
  const [T_eq, setTeq] = useState(330);
  const [useEq, setUseEq] = useState(true);

  const base: ReactorInputs = {
    K_M, a_in, e_in, tau, T,
    dH_act, dS_act, dH_inact, dS_inact, dH_eq, T_eq,
    useEquilibrium: useEq,
  };

  /* Single-point solutions */
  const cstrRes = useMemo(() => solveCSTR(base), [K_M, a_in, e_in, tau, T, dH_act, dS_act, dH_inact, dS_inact, dH_eq, T_eq, useEq]);
  const pfrRes = useMemo(() => solvePFR(base, 400), [K_M, a_in, e_in, tau, T, dH_act, dS_act, dH_inact, dS_inact, dH_eq, T_eq, useEq]);

  /* Temperature sweeps */
  const cstrSweep = useMemo(() => cstrTempSweep(base), [K_M, a_in, e_in, tau, dH_act, dS_act, dH_inact, dS_inact, dH_eq, T_eq, useEq]);
  const pfrSweep = useMemo(() => pfrTempSweep(base), [K_M, a_in, e_in, tau, dH_act, dS_act, dH_inact, dS_inact, dH_eq, T_eq, useEq]);

  /* PFR profile along reactor */
  const profileT = pfrRes.profile_t.map((t) => t / 60); // min

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Controls */}
        <div className="glass-card p-5 space-y-1">
          <h3 className="text-sm font-bold text-indigo-400 mb-3">⚗️ Reactor Parameters</h3>
          <SliderControl label="K_M (mM)" value={K_M} min={0.1} max={20} step={0.1} unit="mM" onChange={setKM} />
          <SliderControl label="[S]_in (mM)" value={a_in} min={0.5} max={50} step={0.5} unit="mM" decimals={1} onChange={setAin} />
          <SliderControl label="[E]_in (a.u.)" value={e_in} min={0.1} max={5} step={0.1} unit="a.u." onChange={setEin} />
          <SliderControl label="τ (min)" value={tau} min={0.5} max={30} step={0.5} unit="min" decimals={1} onChange={setTau} />
          <SliderControl label="T (°C)" value={kelvinToCelsius(T)} min={0} max={100} step={1} unit="°C" decimals={0}
            onChange={(c) => setT(c + 273.15)} />

          <div className="border-t border-slate-700/50 pt-3 mt-3">
            <h3 className="text-sm font-bold text-indigo-400 mb-3">🌡️ Enzyme Thermodynamics</h3>
            <SliderControl label="ΔH‡_act (kJ/mol)" value={dH_act} min={10} max={150} step={1} decimals={0} onChange={setDHAct} />
            <SliderControl label="ΔS‡_act (J/mol·K)" value={dS_act} min={-150} max={50} step={1} decimals={0} onChange={setDSAct} />
            <SliderControl label="ΔH‡_inact (kJ/mol)" value={dH_inact} min={50} max={400} step={5} decimals={0} onChange={setDHIn} />
            <SliderControl label="ΔS‡_inact (J/mol·K)" value={dS_inact} min={100} max={900} step={10} decimals={0} onChange={setDSIn} />

            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer mt-2 mb-1">
              <input type="checkbox" checked={useEq} onChange={(e) => setUseEq(e.target.checked)} className="accent-indigo-500" />
              Equilibrium model
            </label>
            {useEq && (
              <>
                <SliderControl label="ΔH_eq (kJ/mol)" value={dH_eq} min={20} max={300} step={5} decimals={0} onChange={setDHeq} />
                <SliderControl label="T_eq (K)" value={T_eq} min={290} max={380} step={1} unit="K" decimals={0} onChange={setTeq} />
              </>
            )}
          </div>

          {/* Results cards */}
          <div className="border-t border-slate-700/50 pt-3 mt-3 space-y-2">
            <div className="rounded-xl bg-orange-500/10 p-3">
              <p className="text-xs font-bold text-orange-400 mb-1">CSTR @ {kelvinToCelsius(T).toFixed(0)} °C</p>
              <p className="text-xs text-slate-300">[S]<sub>out</sub> = {cstrRes.a_out.toFixed(3)} mM</p>
              <p className="text-xs text-slate-300">Conversion = {(cstrRes.conversion * 100).toFixed(1)}%</p>
              <p className="text-xs text-slate-300">[E]<sub>ss</sub> = {cstrRes.e_ss.toFixed(4)} a.u.</p>
            </div>
            <div className="rounded-xl bg-blue-500/10 p-3">
              <p className="text-xs font-bold text-blue-400 mb-1">PFR @ {kelvinToCelsius(T).toFixed(0)} °C</p>
              <p className="text-xs text-slate-300">[S]<sub>out</sub> = {pfrRes.a_out.toFixed(3)} mM</p>
              <p className="text-xs text-slate-300">Conversion = {(pfrRes.conversion * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* Plots */}
        <div className="space-y-4">
          {/* Conversion vs T */}
          <div className="glass-card p-4">
            <Plot
              data={[
                { x: cstrSweep.map((p) => p.T_C), y: cstrSweep.map((p) => p.conversion * 100),
                  type: 'scatter', mode: 'lines', name: 'CSTR', line: { color: '#ea580c', width: 3 } },
                { x: pfrSweep.map((p) => p.T_C), y: pfrSweep.map((p) => p.conversion * 100),
                  type: 'scatter', mode: 'lines', name: 'PFR', line: { color: '#2563eb', width: 3 } },
              ]}
              layout={{
                ...DK('Conversion vs Temperature (τ = ' + tau + ' min)', 'T (°C)', 'Conversion (%)'),
                shapes: [{ type: 'line', x0: kelvinToCelsius(T), x1: kelvinToCelsius(T), y0: 0, y1: 100,
                  line: { color: '#f59e0b', width: 1.5, dash: 'dash' } }],
              }}
              config={{ responsive: true, displaylogo: false }}
              useResizeHandler style={{ width: '100%', height: '380px' }}
            />
          </div>

          {/* PFR profile along reactor */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="glass-card p-4">
              <Plot
                data={[
                  { x: profileT, y: pfrRes.profile_a, type: 'scatter', mode: 'lines',
                    name: '[S]', line: { color: '#14b8a6', width: 2.5 } },
                ]}
                layout={DK('PFR — substrate profile', 'Residence time (min)', '[S] (mM)')}
                config={{ responsive: true, displaylogo: false }}
                useResizeHandler style={{ width: '100%', height: '300px' }}
              />
            </div>
            <div className="glass-card p-4">
              <Plot
                data={[
                  { x: profileT, y: pfrRes.profile_e, type: 'scatter', mode: 'lines',
                    name: '[E]', line: { color: '#f43f5e', width: 2.5 } },
                ]}
                layout={DK('PFR — enzyme decay', 'Residence time (min)', '[E] (a.u.)')}
                config={{ responsive: true, displaylogo: false }}
                useResizeHandler style={{ width: '100%', height: '300px' }}
              />
            </div>
          </div>

          {/* CSTR enzyme vs T */}
          <div className="glass-card p-4">
            <Plot
              data={[
                { x: cstrSweep.map((p) => p.T_C), y: cstrSweep.map((p) => p.e_ss),
                  type: 'scatter', mode: 'lines', name: '[E]_ss', line: { color: '#f43f5e', width: 2.5 } },
              ]}
              layout={DK('CSTR — steady-state enzyme vs T', 'T (°C)', '[E]<sub>ss</sub> (a.u.)')}
              config={{ responsive: true, displaylogo: false }}
              useResizeHandler style={{ width: '100%', height: '300px' }}
            />
          </div>
        </div>
      </div>

      <TheoryPanel
        title="Reactor Engineering — Theory"
        equations={[
          { label: 'CSTR substrate balance', latex: 'a_{in} - a = \\tau \\cdot \\frac{V_{max}\\, a}{K_M + a}' },
          { label: 'CSTR enzyme balance (with inactivation)', latex: 'e = \\frac{e_{in}}{1 + k_{inact}\\,\\tau}' },
          { label: 'PFR — coupled ODEs', latex: '\\frac{da}{dt\'} = -k_{cat}(T)\\,e(t\')\\ \\frac{a}{K_M + a}, \\qquad \\frac{de}{dt\'} = -k_{inact,eff}\\,e' },
          { label: 'CSTR limiting cases', latex: 'k_{inact}\\tau \\ll 1 \\Rightarrow e \\approx e_{in}; \\qquad k_{inact}\\tau \\gg 1 \\Rightarrow e \\approx \\frac{e_{in}}{k_{inact}\\tau}' },
        ]}
        notes={[
          'In a CSTR, the enzyme is continuously replenished; its steady-state level depends on τ and k_inact.',
          'In a PFR, the enzyme decays exponentially as it flows through — identical to a batch reactor.',
          'At moderate temperatures PFR typically achieves higher conversion, but at high T the CSTR can outperform because fresh enzyme is continuously fed in.',
          'The T-optimum for conversion depends on the reactor type and residence time.',
        ]}
      />
    </div>
  );
}
