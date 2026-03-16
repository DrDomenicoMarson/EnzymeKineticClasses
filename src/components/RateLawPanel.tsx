import type { Data, Layout } from 'plotly.js';
import { Plot } from './Plot';
import { KineticParams } from '../types';
import { generateRateCurve, rate } from '../lib/kinetics/michaelisMenten';
import { useAppContext } from '../context/useAppContext';

interface RateLawPanelProps {
  kinetics: KineticParams;
  maxConcentration: number;
  currentInlet?: number;
  currentOutlet?: number;
}

/**
 * Displays the Michaelis-Menten rate-law curve and the current operating points.
 *
 * @param props The component props.
 * @param props.kinetics The kinetic parameters used to build the curve.
 * @param props.maxConcentration The concentration range to cover on the x-axis.
 * @param props.currentInlet The optional inlet concentration marker.
 * @param props.currentOutlet The optional outlet concentration marker.
 * @returns A compact rate-law visualization panel.
 */
export function RateLawPanel({
  kinetics,
  maxConcentration,
  currentInlet,
  currentOutlet,
}: RateLawPanelProps) {
  const { isLectureMode } = useAppContext();

  const maxA = Math.max(maxConcentration * 1.2, kinetics.KM * 3, 1.0);
  const curve = generateRateCurve(maxA, kinetics, 50);
  const markerX: number[] = [];
  const markerY: number[] = [];
  const markerColors: string[] = [];
  const markerTexts: string[] = [];

  if (currentInlet !== undefined) {
    markerX.push(currentInlet);
    markerY.push(rate(currentInlet, kinetics));
    markerColors.push('#ef4444');
    markerTexts.push('Inlet');
  }

  if (currentOutlet !== undefined) {
    markerX.push(currentOutlet);
    markerY.push(rate(currentOutlet, kinetics));
    markerColors.push('#10b981');
    markerTexts.push('Outlet');
  }

  const data: Data[] = [
    {
      x: curve.map((point) => point.a),
      y: curve.map((point) => point.v),
      type: 'scatter',
      mode: 'lines',
      name: 'v(a)',
      line: { color: '#2563eb', width: isLectureMode ? 3 : 2 },
      hoverinfo: 'skip',
    },
    {
      x: markerX,
      y: markerY,
      type: 'scatter',
      mode: 'text+markers',
      text: markerTexts,
      textposition: 'top center',
      name: 'Operating Points',
      marker: {
        color: markerColors,
        size: isLectureMode ? 12 : 8,
        symbol: 'circle',
      },
      hoverinfo: 'skip',
    },
  ];

  const layout: Partial<Layout> = {
    margin: { t: 10, r: 10, b: 30, l: 40 },
    xaxis: { title: { text: 'a (mol/L)' }, fixedrange: true },
    yaxis: { title: { text: 'v(a)' }, fixedrange: true },
    showlegend: false,
    autosize: true,
    font: { size: isLectureMode ? 14 : 11 },
  };

  return (
    <div className="flex h-64 flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-1 text-sm font-semibold text-gray-700">Rate Law: v(a) vs a</h3>
      <div className="relative w-full flex-1">
        <Plot
          data={data}
          layout={layout}
          useResizeHandler
          style={{ width: '100%', height: '100%', position: 'absolute' }}
          config={{ displayModeBar: false }}
        />
      </div>
    </div>
  );
}
