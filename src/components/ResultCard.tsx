import React from 'react';
import { formatNumber } from '../lib/units/format';
import { useAppContext } from '../context/AppContext';

interface ResultCardProps {
  title?: string;
  results: {
    label: string;
    value: number;
    unit: string;
    highlight?: boolean;
  }[];
}

export const ResultCard: React.FC<ResultCardProps> = ({ title = 'Results', results }) => {
  const { isLectureMode } = useAppContext();

  return (
    <div className={`bg-blue-50 border border-blue-100 rounded-lg p-4 shadow-sm ${isLectureMode ? 'my-6' : 'my-4'}`}>
      <h3 className={`font-bold text-blue-900 mb-3 ${isLectureMode ? 'text-xl' : 'text-lg'}`}>{title}</h3>
      
      <div className={`grid gap-4 ${results.length > 2 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {results.map((res, i) => (
          <div key={i} className={`bg-white p-3 rounded shadow-sm border ${res.highlight ? 'border-blue-300 ring-1 ring-blue-300' : 'border-gray-100'}`}>
            <div className="text-sm text-gray-500 font-medium">{res.label}</div>
            <div className={`font-bold text-gray-900 ${isLectureMode ? 'text-3xl' : 'text-2xl mt-1'}`}>
              {formatNumber(res.value)} <span className="text-base text-gray-500 font-normal">{res.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
