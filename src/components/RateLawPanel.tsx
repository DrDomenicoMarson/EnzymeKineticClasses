import React from 'react';
import Plotly from 'plotly.js-basic-dist';
import createPlotlyComponentModule from 'react-plotly.js/factory';
const createPlotlyComponent = (createPlotlyComponentModule as any).default || createPlotlyComponentModule;
const Plot = createPlotlyComponent(Plotly);
import { KineticParams } from '../types';
import { generateRateCurve, rate } from '../lib/kinetics/michaelisMenten';
import { useAppContext } from '../context/AppContext';

interface RateLawPanelProps {
  kinetics: KineticParams;
  maxConcentration: number;
  currentInlet?: number;
  currentOutlet?: number;
}

export const RateLawPanel: React.FC<RateLawPanelProps> = ({ 
  kinetics, 
  maxConcentration,
  currentInlet,
  currentOutlet
}) => {
  const { isLectureMode } = useAppContext();
  
  // Extend curve slightly past max concentration for context
  const max_a = Math.max(maxConcentration * 1.2, kinetics.KM * 3, 1.0);
  const data = generateRateCurve(max_a, kinetics, 50);

  const trace1 = {
    x: data.map(d => d.a),
    y: data.map(d => d.v),
    mode: 'lines',
    name: 'v(a)',
    line: { color: '#2563eb', width: isLectureMode ? 3 : 2 },
    hoverinfo: 'none'
  };

  const markersX = [];
  const markersY = [];
  const markerColors = [];
  const markerTexts = [];

  if (currentInlet !== undefined) {
    markersX.push(currentInlet);
    markersY.push(rate(currentInlet, kinetics));
    markerColors.push('#ef4444');
    markerTexts.push('Inlet');
  }

  if (currentOutlet !== undefined) {
    markersX.push(currentOutlet);
    markersY.push(rate(currentOutlet, kinetics));
    markerColors.push('#10b981');
    markerTexts.push('Outlet');
  }

  const markersTrace = {
    x: markersX,
    y: markersY,
    mode: 'markers+text',
    text: markerTexts,
    textposition: 'top center',
    name: 'Operating Points',
    marker: {
      color: markerColors,
      size: isLectureMode ? 12 : 8,
      symbol: 'circle'
    },
    hoverinfo: 'none'
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 h-64 flex flex-col">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">Rate Law: v(a) vs a</h3>
      <div className="flex-1 w-full relative">
        {/* @ts-ignore */}
        <Plot
          data={[trace1, markersTrace] as any}
          layout={{
            margin: { t: 10, r: 10, b: 30, l: 40 },
            xaxis: { title: 'a (mol/L)', fixedrange: true },
            yaxis: { title: 'v(a)', fixedrange: true },
            showlegend: false,
            autosize: true,
            font: { size: isLectureMode ? 14 : 11 }
          } as any}
          useResizeHandler={true}
          style={{ width: '100%', height: '100%', position: 'absolute' }}
          config={{ displayModeBar: false }}
        />
      </div>
    </div>
  );
};
