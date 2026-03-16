/**
 * Formats numbers into engineering-friendly readable strings, typically 3 or 4 sig figs.
 */
export function formatNumber(val: number, decimalPlaces: number = 2): string {
  if (val === undefined || val === null || isNaN(val)) return '-';
  if (!isFinite(val)) return val > 0 ? '∞' : '-∞';
  
  const absVal = Math.abs(val);
  if (absVal === 0) return '0';
  
  if (absVal >= 0.01 && absVal < 10000) {
    return val.toFixed(decimalPlaces).replace(/\.?0+$/, ''); // Strip trailing zeros and point
  } else {
    return val.toExponential(decimalPlaces).replace(/\+/, '');
  }
}

export function formatWithUnit(val: number, unit: string, decimalPlaces = 2): string {
  if (val === undefined || val === null || isNaN(val)) return '- ' + unit;
  return `${formatNumber(val, decimalPlaces)} ${unit}`;
}

export const Units = {
  CONCENTRATION: 'mol/L',
  TIME: 'min',
  FLOW: 'L/min',
  VOLUME: 'L',
  RATE_V: 'mol/(L·min)',
  RATE_KCAT: '1/min',
  DIMENSIONLESS: ''
};
