import { useState } from 'react';
import type { Data, Layout } from 'plotly.js';
import { Plot } from '../../components/Plot';
import { ResultCard } from '../../components/ResultCard';
import { SolveModeSelector } from '../../components/SolveModeSelector';
import { ValidationNotice } from '../../components/ValidationNotice';
import {
  buildLevenspielComparison,
  calculateEquivalentPerformance,
  reciprocalRateAt,
} from '../../lib/comparison/levenspiel';
import { 
  solveCSTRSeriesForward, 
  solveScaledCSTRSeriesForTargetConversion 
} from '../../lib/reactors/cstrSeries';
import { rate, generateRateCurve } from '../../lib/kinetics/michaelisMenten';
import { Units, formatNumber } from '../../lib/units/format';
import { validateSharedInputs } from '../../lib/validation';
import {
  CSTRSeriesFormState,
  CSTRSeriesInput,
  SharedSimulatorInputs,
} from '../../types';

export function InhibitionDashboard() {
  // 1. State
  const [shared, setShared] = useState<SharedSimulatorInputs>({
    kinetics: {
      Vmax: 10,
      KM: 5,
      useMechanistic: false,
      inhibitionType: 'none',
      K_I_c: 2,
      K_I_u: 2,
      i_0: 5,
    },
    a_in: 50,
    v_dot: 1,
  });

  const [seriesState, setSeriesState] = useState<CSTRSeriesFormState>({
    volumes: [20, 20],
  });

  const [compareMode, setCompareMode] = useState<string>('target_conversion');
  const [compareTargetX, setCompareTargetX] = useState(0.9);

  // 2. Handlers
  const handleKineticChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setShared(prev => ({
      ...prev,
      kinetics: {
        ...prev.kinetics,
        [name]: name === 'inhibitionType' ? value : parseFloat(value) || 0,
      }
    }));
  };

  const handleStageCountChange = (count: number) => {
    const clamped = Math.max(1, Math.min(count, 8));
    const currentVols = seriesState.volumes;
    if (clamped > currentVols.length) {
      const lastV = currentVols[currentVols.length - 1] || 20;
      const newVols = [...currentVols, ...Array(clamped - currentVols.length).fill(lastV)];
      setSeriesState({ volumes: newVols });
    } else {
      setSeriesState({ volumes: currentVols.slice(0, clamped) });
    }
  };

  const handleVolumeChange = (index: number, value: number) => {
    const newVols = [...seriesState.volumes];
    newVols[index] = value;
    setSeriesState({ volumes: newVols });
  };

  // 3. Engine Execution
  const validationMessages = validateSharedInputs(shared);
  const seriesInput: CSTRSeriesInput = {
    kinetics: shared.kinetics,
    a_in: shared.a_in,
    v_dot: shared.v_dot,
    volumes: seriesState.volumes,
  };

  const isTargetMode = compareMode === 'target_conversion';

  const baseOutput = validationMessages.length === 0 ? solveCSTRSeriesForward(seriesInput) : null;
  const targetSeriesOutput = isTargetMode && validationMessages.length === 0 
    ? solveScaledCSTRSeriesForTargetConversion(seriesInput, compareTargetX) 
    : null;

  const performance = validationMessages.length === 0 
    ? calculateEquivalentPerformance(seriesInput, isTargetMode ? compareTargetX : undefined) 
    : [];
    
  const levenspiel = validationMessages.length === 0 
    ? buildLevenspielComparison(seriesInput, isTargetMode ? compareTargetX : undefined) 
    : null;

  // 4. Build the reference (uninhibited) curve for overlay
  const uninhibitedInput: CSTRSeriesInput = {
    ...seriesInput,
    kinetics: { ...shared.kinetics, inhibitionType: 'none' },
  };
  const showReference = shared.kinetics.inhibitionType !== 'none' && validationMessages.length === 0;
  const referenceCurve = showReference
    ? (() => {
        const maxA = Math.max(shared.a_in, shared.kinetics.KM, 1);
        const steps = 140;
        const pts: { a: number; rr: number }[] = [];
        for (let i = 0; i <= steps; i++) {
          const a = (i / steps) * maxA;
          const r = rate(Math.max(a, 1e-6), uninhibitedInput.kinetics, shared.a_in);
          pts.push({ a, rr: r > 0 ? 1 / r : 0 });
        }
        return pts;
      })()
    : null;

  // 5. Rate law preview data (v(a) vs a)
  const rateCurve = validationMessages.length === 0
    ? generateRateCurve(Math.max(shared.a_in * 1.2, shared.kinetics.KM * 3, 1), shared.kinetics, shared.a_in, 80)
    : [];
  const referenceRateCurve = showReference
    ? generateRateCurve(Math.max(shared.a_in * 1.2, shared.kinetics.KM * 3, 1), uninhibitedInput.kinetics, shared.a_in, 80)
    : [];

  // 6. Plot Traces — Levenspiel
  const seriesAreaTraces: Data[] =
    levenspiel?.cstrSeriesAreas.map((area) => ({
      x: area.x,
      y: area.y,
      type: 'scatter' as const,
      mode: 'lines' as const,
      name: area.label,
      fill: 'toself' as const,
      fillcolor: area.fillColor,
      line: { color: area.lineColor, width: 1.5 },
    })) ?? [];

  const operatingPointRates = performance.map((row) => reciprocalRateAt(seriesInput, row.a_out));
  const finiteLevenspielXValues = levenspiel === null ? [] : [
    ...levenspiel.pfrArea.x,
    ...levenspiel.cstrArea.x,
    ...levenspiel.cstrSeriesAreas.flatMap((area) => area.x),
    ...performance.map((row) => row.a_out),
    shared.a_in,
  ].filter((value) => Number.isFinite(value));

  const finiteLevenspielYValues = levenspiel === null ? [] : [
    ...levenspiel.pfrArea.y,
    ...levenspiel.cstrArea.y,
    ...levenspiel.cstrSeriesAreas.flatMap((area) => area.y),
    ...operatingPointRates,
    reciprocalRateAt(seriesInput, shared.a_in),
  ].filter((value) => Number.isFinite(value));

  const maxLevenspielY = finiteLevenspielYValues.length > 0 ? Math.max(...finiteLevenspielYValues) : 10;
  const targetXMaxY = reciprocalRateAt(seriesInput, isTargetMode ? shared.a_in * (1 - compareTargetX) : 0);
  const finalLevenspielYMax = Math.max(maxLevenspielY, targetXMaxY) * 1.5;

  const levenspielRateTrace: Data | null = levenspiel === null ? null : {
    x: levenspiel.curve.map((pt) => pt.a),
    y: levenspiel.curve.map((pt) => pt.reciprocalRate),
    type: 'scatter' as const,
    mode: 'lines' as const,
    name: '1 / v(a)',
    line: { color: '#000000', width: 3 },
  };

  const referenceTrace: Data | null = referenceCurve ? {
    x: referenceCurve.map(pt => pt.a),
    y: referenceCurve.map(pt => pt.rr),
    type: 'scatter' as const,
    mode: 'lines' as const,
    name: '1 / v(a) — no inhibition',
    line: { color: '#9ca3af', width: 2, dash: 'dot' },
  } : null;

  const levenspielData: Data[] = [
    ...(levenspiel === null ? [] : [
      {
        x: levenspiel.pfrArea.x,
        y: levenspiel.pfrArea.y,
        type: 'scatter' as const,
        mode: 'lines' as const,
        name: 'PFR Area',
        fill: 'tozeroy' as const,
        fillcolor: 'rgba(16, 185, 129, 0.2)',
        line: { color: '#10b981', width: 2 },
      },
      {
        x: levenspiel.cstrArea.x,
        y: levenspiel.cstrArea.y,
        type: 'scatter' as const,
        mode: 'lines' as const,
        name: 'Single CSTR Area',
        fill: 'toself' as const,
        fillcolor: 'rgba(239, 68, 68, 0.15)',
        line: { color: '#ef4444', width: 2, dash: 'dash' },
      },
    ]),
    ...seriesAreaTraces,
    ...(referenceTrace ? [referenceTrace] : []),
    ...(levenspielRateTrace ? [levenspielRateTrace] : []),
  ];

  const levenspielLayout: Partial<Layout> = {
    margin: { t: 20, r: 20, b: 50, l: 60 },
    xaxis: { title: { text: `Concentration, a (${Units.CONCENTRATION})` }, automargin: true },
    yaxis: {
      title: { text: `1 / v(a) (${Units.RECIPROCAL_RATE})` },
      range: [0, Number.isFinite(finalLevenspielYMax) ? finalLevenspielYMax : undefined],
      automargin: true,
    },
    legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: 1.15 },
    autosize: true,
  };

  // 7. Rate law preview plot traces
  const ratePlotData: Data[] = [
    ...(referenceRateCurve.length > 0 ? [{
      x: referenceRateCurve.map(pt => pt.a),
      y: referenceRateCurve.map(pt => pt.v),
      type: 'scatter' as const,
      mode: 'lines' as const,
      name: 'Standard MM',
      line: { color: '#9ca3af', width: 2, dash: 'dot' as const },
    }] : []),
    ...(rateCurve.length > 0 ? [{
      x: rateCurve.map(pt => pt.a),
      y: rateCurve.map(pt => pt.v),
      type: 'scatter' as const,
      mode: 'lines' as const,
      name: 'v(a) — active',
      line: { color: '#0d9488', width: 2.5 },
    }] : []),
  ];
  const ratePlotLayout: Partial<Layout> = {
    margin: { t: 10, r: 10, b: 30, l: 40 },
    xaxis: { title: { text: `a (${Units.CONCENTRATION})` }, fixedrange: true },
    yaxis: { title: { text: `v(a) (${Units.RATE_V})` }, fixedrange: true, rangemode: 'tozero' },
    showlegend: true,
    legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: 1.12, font: { size: 10 } },
    autosize: true,
    font: { size: 11 },
  };

  // Helper to determine which K_I fields to show
  const inhType = shared.kinetics.inhibitionType || 'none';
  const needsKIc = inhType === 'competitive' || inhType === 'product_competitive'
    || inhType === 'non-competitive' || inhType === 'product_non-competitive';
  const needsKIu = inhType === 'uncompetitive' || inhType === 'product_uncompetitive'
    || inhType === 'substrate'
    || inhType === 'non-competitive' || inhType === 'product_non-competitive';
  const needsI0 = inhType !== 'none' && !inhType.startsWith('product_') && inhType !== 'substrate';

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Inhibition Explorer Dashboard</h2>
          <p className="mt-1 text-sm text-slate-500">
            Dynamically adjust inhibition parameters to see exactly how they penalize PFR and CSTR performance differently.
          </p>
        </div>
      </div>

      <ValidationNotice messages={validationMessages} />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Panel: Inputs */}
        <div className="space-y-5 lg:col-span-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
              Reactor Feed
            </h3>
            <div className="space-y-4 text-sm">
              <div>
                <label className="mb-1 block font-medium text-slate-700">
                  Inlet Concentration, a₀ ({Units.CONCENTRATION})
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={shared.a_in}
                  onChange={(e) => setShared({ ...shared, a_in: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-md border-slate-300 py-1.5 focus:border-teal-500 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="mb-1 block font-medium text-slate-700">
                  Volumetric Flow, v₀ ({Units.FLOW})
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={shared.v_dot}
                  onChange={(e) => setShared({ ...shared, v_dot: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-md border-slate-300 py-1.5 focus:border-teal-500 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
              Kinetic Parameters
            </h3>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-medium text-slate-700">
                    Base Vₘₐₓ <span className="text-xs text-slate-400">({Units.RATE_V})</span>
                  </label>
                  <input
                    type="number"
                    name="Vmax"
                    value={shared.kinetics.Vmax}
                    onChange={handleKineticChange}
                    className="w-full rounded-md border-slate-300 py-1.5 focus:border-teal-500 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-medium text-slate-700">
                    Base K<sub>M</sub> <span className="text-xs text-slate-400">({Units.CONCENTRATION})</span>
                  </label>
                  <input
                    type="number"
                    name="KM"
                    value={shared.kinetics.KM}
                    onChange={handleKineticChange}
                    className="w-full rounded-md border-slate-300 py-1.5 focus:border-teal-500 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-4 text-sm">
              <h4 className="mb-3 font-medium text-slate-800">Inhibition Mechanism</h4>
              <div className="space-y-4">
                <select
                  name="inhibitionType"
                  value={shared.kinetics.inhibitionType}
                  onChange={handleKineticChange}
                  className="w-full rounded-md border-slate-300 py-1.5 text-slate-700 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                >
                  <option value="none">None (Standard)</option>
                  <option value="competitive">Competitive</option>
                  <option value="uncompetitive">Uncompetitive</option>
                  <option value="non-competitive">Non-competitive (Mixed)</option>
                  <option value="substrate">Substrate Excess</option>
                  <optgroup label="Product Inhibition">
                    <option value="product_competitive">Product Competitive</option>
                    <option value="product_uncompetitive">Product Uncompetitive</option>
                    <option value="product_non-competitive">Product Non-competitive</option>
                  </optgroup>
                </select>

                {inhType !== 'none' && (
                  <div className="rounded-md bg-teal-50 p-3 ring-1 ring-inset ring-teal-500/10">
                    {/* Competitive Constant */}
                    {needsKIc && (
                      <div className="mb-3 last:mb-0">
                        <label className="mb-1 block text-xs font-semibold text-teal-800">
                          K<sub>I,c</sub> (Competitive) <span className="font-normal text-teal-600">({Units.CONCENTRATION})</span>
                        </label>
                        <input
                          type="number"
                          name="K_I_c"
                          value={shared.kinetics.K_I_c}
                          onChange={handleKineticChange}
                          className="w-full rounded border-teal-200 py-1 text-sm focus:border-teal-500 focus:ring-teal-500"
                        />
                      </div>
                    )}
                    
                    {/* Uncompetitive Constant */}
                    {needsKIu && (
                      <div className="mb-3 last:mb-0">
                        <label className="mb-1 block text-xs font-semibold text-teal-800">
                          {inhType === 'substrate' ? (
                            <>K<sub>I,s</sub> (Substrate)</>
                          ) : (
                            <>K<sub>I,u</sub> (Uncompetitive)</>
                          )}{' '}
                          <span className="font-normal text-teal-600">({Units.CONCENTRATION})</span>
                        </label>
                        <input
                          type="number"
                          name="K_I_u"
                          value={shared.kinetics.K_I_u}
                          onChange={handleKineticChange}
                          className="w-full rounded border-teal-200 py-1 text-sm focus:border-teal-500 focus:ring-teal-500"
                        />
                      </div>
                    )}

                    {/* Impurity Concentration */}
                    {needsI0 && (
                      <div className="mb-3 last:mb-0 pt-2 border-t border-teal-100">
                        <label className="mb-1 block text-xs font-semibold text-teal-800">
                          Impurity Conc. i₀ <span className="font-normal text-teal-600">({Units.CONCENTRATION})</span>
                        </label>
                        <input
                          type="number"
                          name="i_0"
                          value={shared.kinetics.i_0}
                          onChange={handleKineticChange}
                          className="w-full rounded border-teal-200 py-1 text-sm focus:border-teal-500 focus:ring-teal-500"
                        />
                      </div>
                    )}

                    {/* Product Helper */}
                    {inhType.startsWith('product_') && (
                      <p className="text-xs text-teal-700 italic">
                        Inhibitor concentration dynamically calculated as: p = a₀ − a
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CSTR Train Configuration */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
              CSTR Train Configuration
            </h3>
            <div className="space-y-4 text-sm">
              <div>
                <label className="mb-1 block font-medium text-slate-700">Number of Stages</label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  step="1"
                  value={seriesState.volumes.length}
                  onChange={(e) => handleStageCountChange(parseInt(e.target.value, 10) || 1)}
                  className="w-full rounded-md border-slate-300 py-1.5 focus:border-teal-500 focus:ring-teal-500"
                />
              </div>
              <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
                <h4 className="text-xs font-semibold text-slate-600">Stage Volumes ({Units.VOLUME})</h4>
                {seriesState.volumes.map((vol, idx) => (
                  <div key={idx} className="grid grid-cols-[auto_1fr] items-center gap-2">
                    <label className="text-xs text-slate-500 w-14">Stage {idx + 1}</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={vol}
                      onChange={(e) => handleVolumeChange(idx, parseFloat(e.target.value) || 0)}
                      className="w-full rounded border-slate-300 py-1 text-sm focus:border-teal-500 focus:ring-teal-500"
                    />
                  </div>
                ))}
                <p className="text-xs text-slate-400 pt-1">
                  Total: {formatNumber(seriesState.volumes.reduce((s, v) => s + v, 0))} {Units.VOLUME}
                </p>
              </div>
            </div>
          </div>

          {/* Rate Law Preview */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
              Rate Law Preview
            </h3>
            <div className="h-48">
              <Plot
                data={ratePlotData}
                layout={ratePlotLayout}
                useResizeHandler
                style={{ width: '100%', height: '100%' }}
                config={{ displayModeBar: false }}
              />
            </div>
          </div>
        </div>

        {/* Middle Panel: Levenspiel Plot */}
        <div className="lg:col-span-5 flex flex-col pt-0 lg:pt-0">
          <div className="flex-grow rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
              Levenspiel Comparison
            </h3>
            <div className="h-[450px]">
              <Plot data={levenspielData} layout={levenspielLayout} />
            </div>
          </div>
        </div>

        {/* Right Panel: Results */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-slate-50 p-4 border-b border-slate-200">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-800">
                Performance Dashboard
              </h3>
            </div>
            
            <div className="p-4">
              <SolveModeSelector
                mode={compareMode}
                onChange={setCompareMode}
                options={[
                  { 
                    value: 'fixed_tau', 
                    label: 'Equal Total Volume',
                    description: 'Compare reactors with the same total volume — see resulting conversion.'
                  },
                  { 
                    value: 'target_conversion', 
                    label: 'Equal Target X',
                    description: 'Compare volumes needed to hit a required exit conversion.'
                  },
                ]}
                colorTheme="teal"
              />

              {isTargetMode && (
                <div className="mt-4 flex items-center gap-3">
                  <label className="text-sm font-medium text-slate-700 w-24">
                    Target X:
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="0.99"
                    step="0.01"
                    value={compareTargetX}
                    onChange={(e) => setCompareTargetX(parseFloat(e.target.value))}
                    className="flex-grow accent-teal-600"
                  />
                  <div className="w-12 text-right text-sm font-bold text-slate-900 border border-slate-200 rounded px-1.5 py-1 bg-slate-50">
                    {formatNumber(compareTargetX, 3)}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200">
              <ResultCard
                title={isTargetMode ? "Volume to Reach Target X" : "Conversion at Equal Total Volume"}
                results={performance.map((res) => ({
                  label: res.label,
                  value: isTargetMode ? res.tau * shared.v_dot : res.X,
                  unit: isTargetMode ? Units.VOLUME : Units.DIMENSIONLESS,
                  secondaryValue: res.tau,
                  secondaryUnit: Units.TIME,
                  highlight: isTargetMode,
                }))}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
