import { Edit2, List, BarChart3, User, LogOut, Settings } from 'lucide-react';

interface SidebarProps {
  activeTab: 'builder' | 'responses' | 'analytics';
  onTabChange: (tab: 'builder' | 'responses' | 'analytics') => void;
  userEmail: string;
  onLogout: () => void;
}

export default function Sidebar({ activeTab, onTabChange, userEmail, onLogout }: SidebarProps) {
  const tabs = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'responses', label: 'Responses', icon: List },
  ];

  return (
    <div className="bg-white h-full w-54 shadow-xl flex flex-col border-r border-gray-200">
      {/* Logo & Title */}
      <div className="p-6 border-b border-gray-200">
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
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-400 shadow-sm'
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

      {/* User Profile & Logout Section */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        {/* User Info */}
        <div className="flex items-center gap-3 px-3 py-3 mb-3 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center flex-shrink-0">
            <User size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {userEmail.split('@')[0]}
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 transition-all duration-200 hover:shadow-sm hover:text-red-600 group"
        >
          <LogOut size={16} className="text-gray-400 group-hover:text-red-500 transition-colors" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}