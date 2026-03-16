import type { ChangeEvent } from 'react';
import { KineticParams } from '../types';
import { getVmax } from '../lib/kinetics/michaelisMenten';
import { formatWithUnit, Units } from '../lib/units/format';

interface KineticInputPanelProps {
  kinetics: KineticParams;
  onChange: (newKinetics: KineticParams) => void;
}

/**
 * Renders the shared Michaelis-Menten kinetic input block.
 *
 * @param props The component props.
 * @param props.kinetics The current kinetic parameter set.
 * @param props.onChange Callback invoked when the kinetics change.
 * @returns The kinetic-input panel.
 */
export function KineticInputPanel({
  kinetics,
  onChange,
}: KineticInputPanelProps) {
  const handleToggle = () => {
    onChange({ ...kinetics, useMechanistic: !kinetics.useMechanistic });
  };

  const handleVmaxChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...kinetics, Vmax: parseFloat(event.target.value) || 0 });
  };

  const handleKMChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...kinetics, KM: parseFloat(event.target.value) || 0 });
  };

  const handleKcatChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...kinetics, kcat: parseFloat(event.target.value) || 0 });
  };

  const handleE0Change = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...kinetics, e0: parseFloat(event.target.value) || 0 });
  };

  const currentVmax = getVmax(kinetics);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
      <div className="mb-4 flex items-start justify-between gap-4 border-b pb-2">
        <h3 className="text-lg font-semibold text-gray-800">Kinetics (Michaelis-Menten)</h3>
        <div className="flex items-center gap-3">
          <span className="text-right text-sm text-gray-600">
            Input Mode
            <span className="block text-gray-500">
              {kinetics.useMechanistic ? 'kcat, e0' : 'Vmax'}
            </span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={kinetics.useMechanistic}
            aria-label="Toggle mechanistic kinetic inputs"
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              kinetics.useMechanistic ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform ${
                kinetics.useMechanistic ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Vmax or kcat/e0 inputs */}
        {!kinetics.useMechanistic ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vmax <span className="text-xs text-gray-500">({Units.RATE_V})</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={kinetics.Vmax}
              onChange={handleVmaxChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                kcat <span className="text-xs text-gray-500">({Units.RATE_KCAT})</span>
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={kinetics.kcat}
                onChange={handleKcatChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                e0 <span className="text-xs text-gray-500">({Units.CONCENTRATION})</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={kinetics.e0}
                onChange={handleE0Change}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              />
            </div>
          </div>
        )}

        {/* KM input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            KM <span className="text-xs text-gray-500">({Units.CONCENTRATION})</span>
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={kinetics.KM}
            onChange={handleKMChange}
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
          />
        </div>

        {kinetics.useMechanistic ? (
          <div className="mt-2 rounded bg-gray-50 p-3 text-sm text-gray-600">
            Derived Vmax = {formatWithUnit(currentVmax, Units.RATE_V)}
          </div>
        ) : null}
      </div>
    </div>
  );
}
