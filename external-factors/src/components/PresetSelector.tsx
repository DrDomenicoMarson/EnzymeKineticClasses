interface Preset {
  name: string;
  description: string;
}

interface Props<T extends Preset> {
  presets: T[];
  activeName?: string;
  onSelect: (preset: T) => void;
  accentColor?: string;
}

export function PresetSelector<T extends Preset>({
  presets,
  activeName,
  onSelect,
  accentColor = 'teal',
}: Props<T>) {
  const colorMap: Record<string, string> = {
    teal: 'bg-teal-500/20 text-teal-300 ring-teal-500/40 hover:bg-teal-500/30',
    amber: 'bg-amber-500/20 text-amber-300 ring-amber-500/40 hover:bg-amber-500/30',
    indigo: 'bg-indigo-500/20 text-indigo-300 ring-indigo-500/40 hover:bg-indigo-500/30',
  };
  const activeClass = colorMap[accentColor] ?? colorMap.teal;
  const inactiveClass = 'bg-slate-700/40 text-slate-400 ring-slate-600/30 hover:bg-slate-700/60 hover:text-slate-300';

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {presets.map((p) => (
        <button
          key={p.name}
          type="button"
          title={p.description}
          onClick={() => onSelect(p)}
          className={`
            px-3 py-1.5 rounded-lg text-xs font-semibold ring-1 transition-all cursor-pointer
            ${p.name === activeName ? activeClass : inactiveClass}
          `}
        >
          {p.name}
        </button>
      ))}
    </div>
  );
}
