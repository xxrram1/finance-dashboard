import React, { useState } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarInset,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  BarChart3,
  DollarSign,
  Calendar,
  PieChart,
  Settings,
  Folder,
  User,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

// Page Components
import Dashboard from '../components/Dashboard';
import Transactions from '../components/Transactions';
import Recurring from '../components/Recurring';
import Budget from '../components/Budget';
import Analysis from '../components/Analysis';
import Planning from '../components/Planning';
import Profile from '../components/Profile';

// Menu items definition
const menuItems = [
  { id: 'dashboard', label: 'แดชบอร์ด', icon: BarChart3 },
  { id: 'transactions', label: 'รายการ', icon: DollarSign },
  { id: 'recurring', label: 'รายการซ้ำ', icon: Calendar },
  { id: 'budget', label: 'งบประมาณ', icon: Folder },
  { id: 'analysis', label: 'วิเคราะห์', icon: PieChart },
  { id: 'planning', label: 'วางแผน', icon: Settings },
  { id: 'profile', label: 'โปรไฟล์', icon: User },
];

const Index = () => {
  const { signOut } = useAuth();
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
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar>
          <SidebarHeader className="p-4">
            <h1 className="text-xl font-bold text-blue-400">FinanceFlow</h1>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => setActiveTab(item.id)}
                      isActive={activeTab === item.id}
                      tooltip={item.label}
                    >
                      <Icon size={20} />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={signOut} tooltip="ออกจากระบบ">
                  <LogOut size={20} />
                  <span>ออกจากระบบ</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <header className="mb-4 flex items-center gap-2 md:hidden">
            <SidebarTrigger />
            <h2 className="text-xl font-semibold capitalize">{activeTab}</h2>
          </header>
          {renderContent()}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Index;