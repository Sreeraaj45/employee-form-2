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
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={onTabChange}
        userEmail={userEmail}
        onLogout={onLogout}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-8 py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {activeTab === 'builder' && 'Form Builder'}
                {activeTab === 'responses' && 'Responses'}
                {activeTab === 'analytics' && 'Analytics Dashboard'}
              </h1>
              <p className="text-sm text-gray-600 mt-1 mb-1">
                {activeTab === 'builder' && 'Customize your employee form'}
                {activeTab === 'responses' && 'Employee form responses'}
                {activeTab === 'analytics' && 'Employee form insights & skill statistics'}
              </p>
            </div>
          </div>
        </header> */}

        <main className="flex-1 overflow-auto">
          <div className="px-6 py-6">
            {activeTab === 'builder' && <FormBuilder />}
            {activeTab === 'responses' && <Responses />}
            {activeTab === 'analytics' && <Analytics />}
          </div>
        </main>
      </div>
    </div>
  );
}