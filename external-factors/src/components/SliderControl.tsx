interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  decimals?: number;
  onChange: (v: number) => void;
}

export function SliderControl({
  label,
  value,
  min,
  max,
  step,
  unit = '',
  decimals = 2,
  onChange,
}: Props) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-slate-300">{label}</label>
        <span className="text-xs font-mono text-amber-400/90 tabular-nums">
          {value.toFixed(decimals)}{unit && ` ${unit}`}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}
