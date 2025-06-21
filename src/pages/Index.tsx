
import React, { useState } from 'react';
import { SupabaseFinanceProvider } from '../context/SupabaseFinanceContext';
import Sidebar from '../components/Sidebar';
import Dashboard from '../components/Dashboard';
import Transactions from '../components/Transactions';
import Recurring from '../components/Recurring';
import Budget from '../components/Budget';
import Analysis from '../components/Analysis';
import Planning from '../components/Planning';
import Profile from '../components/Profile';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'transactions':
        return <Transactions />;
      case 'recurring':
        return <Recurring />;
      case 'budget':
        return <Budget />;
      case 'analysis':
        return <Analysis />;
      case 'planning':
        return <Planning />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 p-8 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;
