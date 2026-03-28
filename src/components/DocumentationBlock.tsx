import { useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface DocumentationBlockProps {
  title: string;
  assumptions: string[];
  equations: { notation: string; latex: string }[];
  notes: string[];
}

/**
 * Displays the assumptions, equations, and teaching notes for a tab.
 *
 * @param props The component props.
 * @param props.title The documentation section title.
 * @param props.assumptions The assumptions to list.
 * @param props.equations The equations to render with KaTeX.
 * @param props.notes The short interpretation notes to display.
 * @returns A collapsible documentation block.
 */
export function DocumentationBlock({
  title, assumptions, equations, notes
}: DocumentationBlockProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleToggle = () => {
    setIsExpanded((previousValue) => !previousValue);
  };

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white text-sm text-slate-700 shadow-sm transition-all duration-300 hover:shadow-md">
      <button 
        className="flex w-full items-center justify-between bg-slate-50 px-5 py-4 transition-colors hover:bg-slate-100/80 focus:outline-none"
        onClick={handleToggle}
      >
        <h3 className="text-base font-medium text-slate-800">{title} — Documentation</h3>
        <div className="flex items-center space-x-2 text-slate-400">
          <span className="text-sm font-medium">{isExpanded ? 'Hide' : 'Show'}</span>
          <svg 
            className={`h-5 w-5 transform transition-transform duration-300 ${isExpanded ? 'rotate-180 text-indigo-500' : 'text-slate-400'}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      
      {isExpanded && (
        <div className="p-5 space-y-6">
          <section>
            <h4 className="font-semibold text-gray-900 mb-2 border-b pb-1">Assumptions</h4>
            <ul className="list-disc pl-5 space-y-1">
              {assumptions.map((ass, i) => <li key={i}>{ass}</li>)}
            </ul>
          </section>

          <section>
            <h4 className="font-semibold text-gray-900 mb-2 border-b pb-1">Governing Equations</h4>
            <div className="space-y-3 bg-gray-50 p-3 rounded">
              {equations.map((eq, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="text-xs text-gray-500 mb-1">{eq.notation}</div>
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: katex.renderToString(eq.latex, { displayMode: true, throwOnError: false }) 
                    }} 
                  />
                </div>
              ))}
            </div>
          </section>

          <section>
            <h4 className="font-semibold text-gray-900 mb-2 border-b pb-1">Interpretation Notes</h4>
            <ul className="list-disc pl-5 space-y-2">
              {notes.map((note, i) => <li key={i}>{note}</li>)}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
