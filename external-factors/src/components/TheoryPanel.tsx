import { useState, useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface Props {
  title: string;
  equations: { label: string; latex: string }[];
  notes?: string[];
}

function RenderedLatex({ latex }: { latex: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (ref.current) {
      katex.render(latex, ref.current, {
        throwOnError: false,
        displayMode: true,
      });
    }
  }, [latex]);
  return <span ref={ref} />;
}

export function TheoryPanel({ title, equations, notes }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-card overflow-hidden mt-6">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3 text-left cursor-pointer hover:bg-slate-700/30 transition-colors"
      >
        <span className="text-sm font-semibold text-slate-300">
          📐 {title}
        </span>
        <span
          className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-slate-700/50 pt-4">
          {equations.map(({ label, latex }, i) => (
            <div key={i}>
              <p className="text-xs font-medium text-slate-400 mb-1">{label}</p>
              <div className="bg-slate-900/50 rounded-lg px-4 py-3 overflow-x-auto">
                <RenderedLatex latex={latex} />
              </div>
            </div>
          ))}
          {notes && notes.length > 0 && (
            <div className="text-xs text-slate-400 space-y-1 pt-2 border-t border-slate-700/40">
              {notes.map((n, i) => (
                <p key={i}>• {n}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
