import { SolveMode } from '../types';

interface SolveModeSelectorProps {
  mode: SolveMode;
  onChange: (mode: SolveMode) => void;
  options?: { value: SolveMode; label: string }[];
}

/**
 * Renders the solve-mode selector used by reactor tabs.
 *
 * @param props The component props.
 * @param props.mode The active solve mode.
 * @param props.onChange Callback invoked when the mode changes.
 * @param props.options The radio options to render.
 * @returns A radio-group selector.
 */
export function SolveModeSelector({
  mode, 
  onChange,
  options = [
    { value: 'forward', label: 'Forward (Compute Output)' },
    { value: 'inverse', label: 'Target (Compute Size/Time)' }
  ]
}: SolveModeSelectorProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">Solve Mode</label>
      <div className="flex space-x-4">
        {options.map((opt) => (
          <label key={opt.value} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="solveMode"
              value={opt.value}
              checked={mode === opt.value}
              onChange={() => onChange(opt.value)}
              className="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-800">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
