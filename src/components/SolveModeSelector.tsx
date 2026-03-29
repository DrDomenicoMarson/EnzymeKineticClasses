interface SolveModeSelectorProps {
  mode: string;
  onChange: (mode: string) => void;
  options?: { value: string; label: string; description?: string }[];
  colorTheme?: 'indigo' | 'teal';
}

/**
 * Renders the solve-mode selector used by reactor tabs.
 *
 * @param props The component props.
 * @param props.mode The active solve mode.
 * @param props.onChange Callback invoked when the mode changes.
 * @param props.options The radio options to render.
 * @param props.colorTheme Optional color theme.
 * @returns A segmented-control selector.
 */
export function SolveModeSelector({
  mode, 
  onChange,
  options = [
    { value: 'forward', label: 'Forward (Compute Output)' },
    { value: 'inverse', label: 'Target (Compute Size/Time)' }
  ],
  colorTheme = 'indigo',
}: SolveModeSelectorProps) {
  const activeClasses = colorTheme === 'teal'
    ? 'bg-white text-teal-700 shadow-sm ring-1 ring-slate-200/50'
    : 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/50';

  return (
    <div className="mb-4">
      <label className="mb-2 block text-sm font-medium text-slate-700">Solve Mode</label>
      <div className="relative flex rounded-xl bg-slate-100/80 p-1 shadow-inner ring-1 ring-slate-200">
        {options.map((opt) => {
          const isActive = mode === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`relative flex-1 rounded-lg py-2 text-sm font-medium transition-all duration-300 focus:outline-none ${
                isActive
                  ? activeClasses
                  : 'text-slate-500 hover:bg-slate-200/40 hover:text-slate-700'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {options.map((opt) => (
        opt.description && mode === opt.value ? (
          <p key={opt.value} className="mt-2 text-xs text-slate-500 italic">{opt.description}</p>
        ) : null
      ))}
    </div>
  );
}
