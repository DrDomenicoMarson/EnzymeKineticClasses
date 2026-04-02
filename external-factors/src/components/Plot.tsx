import Plotly from 'plotly.js-dist-min';
import type { ComponentType } from 'react';
import type { PlotParams } from 'react-plotly.js';
import createPlotlyComponentModule from 'react-plotly.js/factory';

/**
 * Resolves the Plotly component factory across the CJS/ESM boundary used by Vite.
 */
function resolvePlotlyFactory(
  moduleValue: unknown,
): (plotly: typeof Plotly) => ComponentType<PlotParams> {
  if (typeof moduleValue === 'function') {
    return moduleValue as (plotly: typeof Plotly) => ComponentType<PlotParams>;
  }

  if (
    typeof moduleValue === 'object' &&
    moduleValue !== null &&
    'default' in moduleValue &&
    typeof moduleValue.default === 'function'
  ) {
    return moduleValue.default as (plotly: typeof Plotly) => ComponentType<PlotParams>;
  }

  throw new Error('Unable to resolve the Plotly React component factory.');
}

const plotlyFactory = resolvePlotlyFactory(createPlotlyComponentModule);

/**
 * Typed Plotly React component (uses full plotly.js for 3D surface support).
 */
export const Plot = plotlyFactory(Plotly);
