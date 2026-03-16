import { useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { useAppContext } from '../context/useAppContext';

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
  const { isLectureMode } = useAppContext();
  const [expandedInNormalMode, setExpandedInNormalMode] = useState(true);
  const [expandedInLectureMode, setExpandedInLectureMode] = useState(false);
  const isExpanded = isLectureMode ? expandedInLectureMode : expandedInNormalMode;

  const handleToggle = () => {
    if (isLectureMode) {
      setExpandedInLectureMode((previousValue) => !previousValue);
      return;
    }

    setExpandedInNormalMode((previousValue) => !previousValue);
  };

  return (
    <div className="bg-white border text-sm text-gray-700 border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
      <button 
        className="w-full px-4 py-3 bg-gray-50 flex justify-between items-center hover:bg-gray-100 transition-colors"
        onClick={handleToggle}
      >
        <h3 className="text-base font-semibold text-gray-900">{title} — Documentation</h3>
        <span className="text-gray-500">{isExpanded ? '▼ Hide' : '▶ Show'}</span>
      </button>
      
      {isExpanded && (
        <div className="p-4 space-y-6">
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
