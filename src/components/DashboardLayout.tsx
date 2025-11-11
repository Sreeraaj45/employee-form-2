import { LogOut, User } from 'lucide-react';
import Sidebar from './Sidebar';
import FormBuilder from './FormBuilder';
import Responses from './Responses';
import Analytics from './Analytics';

interface DashboardLayoutProps {
  activeTab: 'builder' | 'responses' | 'analytics';
  onTabChange: (tab: 'builder' | 'responses' | 'analytics') => void;
  userEmail: string;
  onLogout: () => void;
}

export default function DashboardLayout({
  activeTab,
  onTabChange,
  userEmail,
  onLogout
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} onTabChange={onTabChange} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {activeTab === 'builder' && 'Form Builder'}
                {activeTab === 'responses' && 'Responses'}
                {activeTab === 'analytics' && 'Analytics Dashboard'}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {activeTab === 'builder' && 'Customize your employee form'}
                {activeTab === 'responses' && 'Employee form responses'}
                {activeTab === 'analytics' && 'Employee form insights & skill statistics'}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-700">{userEmail.split('@')[0]}</p>
                  <p className="text-xs text-gray-500">{userEmail}</p>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="p-8">
            {activeTab === 'builder' && <FormBuilder />}
            {activeTab === 'responses' && <Responses />}
            {activeTab === 'analytics' && <Analytics />}
          </div>
        </main>
      </div>
    </div>
  );
}
