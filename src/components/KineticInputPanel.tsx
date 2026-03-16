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

  const handleVmaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...kinetics, Vmax: parseFloat(e.target.value) || 0 });
  };

  const handleKMChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...kinetics, KM: parseFloat(e.target.value) || 0 });
  };

  const handleKcatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...kinetics, kcat: parseFloat(e.target.value) || 0 });
  };

  const handleE0Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...kinetics, e0: parseFloat(e.target.value) || 0 });
  };

  const currentVmax = getVmax(kinetics);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h3 className="text-lg font-semibold text-gray-800">Kinetics (Michaelis-Menten)</h3>
        <label className="flex items-center space-x-2 cursor-pointer text-sm text-gray-600">
          <span>Mechanistic (kcat, e0)</span>
          <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
            <input 
              type="checkbox" 
              className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer mt-0.5 ml-0.5" 
              checked={kinetics.useMechanistic}
              onChange={handleToggle}
              style={{ right: kinetics.useMechanistic ? '0' : 'auto', transform: kinetics.useMechanistic ? 'translateX(100%)' : 'none', zIndex: 10, borderColor: kinetics.useMechanistic ? '#3b82f6': '#d1d5db', backgroundColor: kinetics.useMechanistic ? '#3b82f6' : '#d1d5db' }}
            />
            <div className={`toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${kinetics.useMechanistic ? 'bg-blue-200' : ''}`}></div>
          </div>
        </label>
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

        {/* Derived read-only values */}
        <div className="bg-gray-50 p-3 rounded text-sm text-gray-600 mt-2">
          {kinetics.useMechanistic ? (
            <div>Derived Vmax = {formatWithUnit(currentVmax, Units.RATE_V)}</div>
          ) : (
            <div className="space-y-1">
              <div>Stored Vmax = {formatWithUnit(kinetics.Vmax, Units.RATE_V)}</div>
              <div className="opacity-75 italic">
                Mechanistic fields remain available when you switch modes.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
