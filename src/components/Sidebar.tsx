import { Edit2, List, BarChart3 } from 'lucide-react';

interface SidebarProps {
  activeTab: 'builder' | 'responses' | 'analytics';
  onTabChange: (tab: 'builder' | 'responses' | 'analytics') => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const tabs = [
    // { id: 'builder', label: 'Form Builder', icon: Edit2 },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'responses', label: 'Responses', icon: List },
  ];

  return (
    <div className="bg-white h-full w-64 shadow-lg flex flex-col">

      {/* Logo & Title */}
      <div className="p-6 border-b">
        <div className="flex items-center space-x-3">
          <img src="src/assets/logo.png" alt="Logo" className="w-10 h-10 rounded-md" />
          <div>
            <h1 className="text-lg font-bold text-gray-900">Dev Portal</h1>
            <p className="text-xs text-gray-500">Manage your forms</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {tabs.map((tab) => (
            <li key={tab.id}>
              <button
                onClick={() => onTabChange(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-400'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span className="font-medium text-sm">{tab.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

    </div>
  );
}
