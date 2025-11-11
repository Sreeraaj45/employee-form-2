import { useState } from 'react';
import DashboardLayout from './DashboardLayout';

interface DeveloperDashboardProps {
  userEmail: string;
  onLogout: () => void;
}

export default function DeveloperDashboard({ userEmail, onLogout }: DeveloperDashboardProps) {
  const [activeTab, setActiveTab] = useState<'builder' | 'responses' | 'analytics'>('responses');

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      userEmail={userEmail}
      onLogout={onLogout}
    />
  );
}
