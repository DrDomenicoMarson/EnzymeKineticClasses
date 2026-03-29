import { formatNumber } from '../lib/units/format';

interface ResultCardProps {
  title?: string;
  results: {
    label: string;
    value: number;
    unit: string;
    secondaryValue?: number;
    secondaryUnit?: string;
    highlight?: boolean;
  }[];
}

/**
 * Displays a compact grid of highlighted numeric outputs.
 *
 * @param props The result-card props.
 * @param props.title The card title.
 * @param props.results The labeled values to display.
 * @returns A styled result summary card.
 */
export function ResultCard({ title = 'Results', results }: ResultCardProps) {
  const gridClass =
    results.length >= 4
      ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'
      : results.length === 3
        ? 'grid-cols-1 md:grid-cols-3'
        : 'grid-cols-1 sm:grid-cols-2';

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-indigo-100/60 bg-gradient-to-br from-slate-50 to-indigo-50/30 p-4 shadow-sm">
      <h3 className="mb-3 text-lg font-semibold tracking-tight text-indigo-950">{title}</h3>
      
      <div className={`grid gap-4 ${gridClass}`}>
        {results.map((res, i) => (
          <div 
            key={i} 
            className={`flex flex-col rounded-xl border bg-white p-4 transition-all duration-300 ${
              res.highlight 
                ? 'border-indigo-200 bg-gradient-to-b from-white to-indigo-50/30 shadow-md ring-1 ring-inset ring-indigo-100' 
                : 'border-slate-100 shadow-sm hover:shadow'
            }`}
          >
            <div className={`text-sm font-medium ${res.highlight ? 'text-indigo-600' : 'text-slate-500'}`}>
              {res.label}
            </div>
            <div className={`mt-1.5 flex flex-wrap items-baseline gap-1 text-2xl font-bold tracking-tight ${res.highlight ? 'text-indigo-950' : 'text-slate-800'}`}>
              <div>
                {formatNumber(res.value)} 
                <span className="ml-1 text-sm font-medium text-slate-400">{res.unit}</span>
              </div>
              {res.secondaryValue !== undefined && (
                <>
                  <span className="mx-1 text-xl font-normal text-slate-300">|</span>
                  <div>
                    {formatNumber(res.secondaryValue)}
                    <span className="ml-1 text-sm font-medium text-slate-400">{res.secondaryUnit}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
