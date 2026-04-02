import type { TabId } from '../types';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'ph', label: 'pH Effects', icon: '🧪' },
  { id: 'temperature', label: 'Temperature', icon: '🌡️' },
  { id: 'reactor', label: 'Reactor Impact', icon: '⚗️' },
];

interface Props {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function TabBar({ activeTab, onTabChange }: Props) {
  return (
    <nav className="flex justify-center mb-8">
      <div className="glass-card inline-flex p-1 gap-1">
        {TABS.map(({ id, label, icon }) => {
          const active = id === activeTab;
          return (
            <button
              key={id}
              id={`tab-${id}`}
              type="button"
              onClick={() => onTabChange(id)}
              className={`
                relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer
                ${active
                  ? 'bg-gradient-to-r from-amber-500/20 to-teal-500/20 text-white shadow-lg shadow-teal-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
                }
              `}
            >
              <span className="mr-1.5">{icon}</span>
              {label}
              {active && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-amber-400 to-teal-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
