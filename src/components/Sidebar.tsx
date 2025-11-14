import { List, BarChart3, User, LogOut, ChevronRight } from 'lucide-react';
import logo from "../assets/logo.png";

interface SidebarProps {
  activeTab: 'builder' | 'responses' | 'analytics';
  onTabChange: (tab: 'builder' | 'responses' | 'analytics') => void;
  userEmail: string;
  onLogout: () => void;
}

export default function Sidebar({ activeTab, onTabChange, userEmail, onLogout }: SidebarProps) {
  const tabs = [
    {
      id: 'responses' as const,
      label: 'Responses',
      icon: List,
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'analytics' as const,
      label: 'Analytics',
      icon: BarChart3,
      gradient: 'from-purple-500 to-pink-500'
    },

  ];

  return (
    <div className="bg-white h-full w-52 shadow-lg flex flex-col border-r border-gray-200">
      {/* Logo & Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <img src={logo} alt="Logo" className="w-12 h-12 rounded" />
          <div>
            <h1 className="text-base font-bold text-gray-900">Skill Flow</h1>
            <p className="text-xs text-gray-500">Employee skills</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3">
        <div className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`w-full group relative transition-all duration-200 ${isActive ? 'transform scale-[1.01]' : ''
                  }`}
              >
                <div className={`relative flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${isActive
                    ? 'bg-blue-50 border border-blue-200 shadow-sm'
                    : 'hover:bg-gray-50 border border-transparent'
                  }`}>
                  {/* Icon */}
                  <div className={`p-1.5 rounded-md bg-gradient-to-br ${tab.gradient} shadow-sm flex-shrink-0 ${isActive ? 'ring-1 ring-blue-200' : ''
                    }`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>

                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`font-medium text-sm transition-colors ${isActive ? 'text-blue-700' : 'text-gray-700 group-hover:text-gray-900'
                        }`}>
                        {tab.label}
                      </span>
                      <ChevronRight
                        size={14}
                        className={`transition-all duration-200 ${isActive
                            ? 'text-blue-500 transform translate-x-0'
                            : 'text-gray-400 group-hover:text-gray-600 transform -translate-x-0.5 group-hover:translate-x-0'
                          }`}
                      />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* User Profile & Logout Section */}
      <div className="p-4 border-t border-gray-200 bg-gradient-to-b from-gray-50 to-white">
        {/* User Info Card */}
        <div className="flex items-center gap-3 px-3 py-3 mb-3 bg-white rounded-xl border border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-300 group">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-300">
              <User size={16} className="text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {userEmail.split('@')[0]}
            </p>
            <p className="text-xs text-gray-500 truncate mt-0.5">
              {userEmail.split('@')[1]}
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 bg-white hover:bg-red-50 rounded-xl border border-gray-200/60 transition-all duration-300 hover:border-red-200 hover:text-red-700 hover:shadow-md group"
        >
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-gray-100 group-hover:bg-red-100 transition-colors duration-300">
              <LogOut size={14} className="text-gray-500 group-hover:text-red-500 transition-colors duration-300" />
            </div>
            <span className="font-semibold">Sign Out</span>
          </div>
          <ChevronRight
            size={14}
            className="text-gray-400 group-hover:text-red-400 transition-colors duration-300 transform group-hover:translate-x-0.5"
          />
        </button>
      </div>
    </div>
  );
}