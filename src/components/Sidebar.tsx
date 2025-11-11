import { Edit2, List, BarChart3, Code2 } from 'lucide-react';

interface SidebarProps {
  activeTab: 'builder' | 'responses' | 'analytics';
  onTabChange: (tab: 'builder' | 'responses' | 'analytics') => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const tabs = [
    { id: 'builder', label: 'Form Builder', icon: <Edit2 className="w-5 h-5" /> },
    { id: 'responses', label: 'Responses', icon: <List className="w-5 h-5" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> }
  ];

  return (
    <aside className="w-64 bg-gradient-to-b from-slate-800 to-slate-900 text-white flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3 mb-1">
          <div className="bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg p-2">
            <Code2 size={24} className="text-white" />
          </div>
          <h2 className="text-xl font-bold">Dev Portal</h2>
        </div>
        <p className="text-xs text-slate-400 ml-11">Manage your forms</p>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id as any)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {activeTab === tab.id && (
              <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
            )}
          </button>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-slate-700">
        <div className="bg-slate-700 rounded-lg p-3">
          <p className="text-xs text-slate-300 font-medium">Dashboard v1.0</p>
          <p className="text-xs text-slate-500 mt-1">Built with React & Supabase</p>
        </div>
      </div>
    </aside>
  );
}
