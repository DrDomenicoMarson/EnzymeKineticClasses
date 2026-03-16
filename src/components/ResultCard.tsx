import { formatNumber } from '../lib/units/format';

interface ResultCardProps {
  title?: string;
  results: {
    label: string;
    value: number;
    unit: string;
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
    <div className="my-3 rounded-lg border border-blue-100 bg-blue-50 p-3 shadow-sm">
      <h3 className="mb-2 text-lg font-semibold text-blue-900">{title}</h3>
      
      <div className={`grid gap-3 ${gridClass}`}>
        {results.map((res, i) => (
          <div key={i} className={`rounded border bg-white p-3 shadow-sm ${res.highlight ? 'border-blue-300 ring-1 ring-blue-300' : 'border-gray-100'}`}>
            <div className="text-sm font-medium text-gray-500">{res.label}</div>
            <div className="mt-1 text-lg font-semibold text-gray-900 xl:text-xl">
              {formatNumber(res.value)} <span className="text-sm font-normal text-gray-500">{res.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
