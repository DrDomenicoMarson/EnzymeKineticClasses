import { TabId } from '../types';

interface TabNavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

/**
 * Renders the top-level tab navigation for the simulator.
 *
 * @param props The component props.
 * @param props.activeTab The currently selected tab.
 * @param props.onTabChange Callback invoked when a tab is selected.
 * @returns The tab-navigation bar.
 */
export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'batch', label: 'Batch Reactor' },
    { id: 'cstr', label: 'CSTR' },
    { id: 'pfr', label: 'PFR' },
    { id: 'cstr-series', label: 'CSTR Series' },
    { id: 'compare', label: 'Compare Reactors' },
  ];

  return (
    <div className="border-b border-gray-200 mb-6 bg-white rounded-t-lg shadow-sm">
      <nav className="-mb-px flex flex-wrap" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              w-1/2 sm:w-auto text-center py-4 px-1 sm:px-6 border-b-2 font-medium text-sm transition-colors
              ${activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
