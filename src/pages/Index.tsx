// src/pages/Index.tsx

import React, { useState, useEffect } from 'react';
import {
  SidebarProvider, Sidebar, SidebarTrigger, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarGroup,
} from '@/components/ui/sidebar';
import {
  BarChart3, DollarSign, Calendar, PieChart, Settings, Folder, User, LogOut, MoreHorizontal, Calculator, Sparkles, LayoutDashboard, ListChecks, Cpu, AlertCircle
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { AnimatePresence, motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { ReportModal } from '../components/ReportModal';

// Page Components
import Dashboard from '../components/Dashboard';
import Transactions from '../components/Transactions';
import Recurring from '../components/Recurring';
import Budget from '../components/Budget';
import Analysis from '../components/Analysis';
import Planning from '../components/Planning';
import Profile from '../components/Profile';
import MathCalculator from '../components/MathCalculator';
import AiTutor from '../components/AiTutor';

const menuGroups = [
    {
        label: "ภาพรวม",
        icon: LayoutDashboard,
        items: [
            { id: 'dashboard', label: 'แดชบอร์ด', icon: BarChart3 },
            { id: 'analysis', label: 'วิเคราะห์', icon: PieChart },
        ]
    },
    {
        label: "การจัดการ",
        icon: ListChecks,
        items: [
            { id: 'transactions', label: 'ธุรกรรม', icon: DollarSign },
            { id: 'recurring', label: 'รายการซ้ำ', icon: Calendar },
            { id: 'budget', label: 'งบประมาณ', icon: Folder },
            { id: 'planning', label: 'วางแผน', 'icon': Settings },
        ]
    },
    {
        label: "เครื่องมือ",
        icon: Cpu,
        items: [
            { id: 'calculator', label: 'เครื่องคำนวณคณิต', icon: Calculator },
            { id: 'ai-tutor', label: 'AI Tutor', icon: Sparkles, highlight: true },
        ]
    }
];

const pageComponents: { [key: string]: JSX.Element } = {
  dashboard: <Dashboard />,
  transactions: <Transactions />,
  recurring: <Recurring />,
  budget: <Budget />,
  analysis: <Analysis />,
  planning: <Planning />,
  profile: <Profile />,
  calculator: <MathCalculator />,
  'ai-tutor': <AiTutor />,
};

const Index = () => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('activeTab') || 'dashboard');
  const [isReportModalOpen, setReportModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  const getInitials = (name: string | null): string => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };
  const userName = user?.user_metadata.full_name;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-slate-100 dark:bg-slate-900">
        <Sidebar>
          <SidebarHeader>
             <h1 className="text-2xl font-bold text-primary">FinanceFlow</h1>
          </SidebarHeader>
          <SidebarContent>
             {menuGroups.map(group => (
                <SidebarGroup key={group.label} label={group.label} icon={group.icon}>
                    <SidebarMenu>
                    {group.items.map((item) => (
                        <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton 
                            onClick={() => setActiveTab(item.id)} 
                            isActive={activeTab === item.id} 
                            tooltip={item.label}
                            highlight={(item as any).highlight}
                        >
                            <item.icon size={20} />
                            <span className="flex-1">{item.label}</span>
                            {(item as any).highlight && <Badge className="ml-auto bg-primary/20 text-primary hover:bg-primary/30">AI</Badge>}
                        </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                    </SidebarMenu>
                </SidebarGroup>
             ))}
          </SidebarContent>
          <SidebarFooter>
            <div className="p-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => setReportModalOpen(true)} tooltip="แจ้งปัญหา/ข้อเสนอแนะ">
                            <AlertCircle size={20} />
                            <span>รายงาน</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </div>
            <div className="p-4 border-t">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center w-full gap-3 text-left hover:bg-accent p-2 rounded-lg">
                        <Avatar className="h-10 w-10"><AvatarImage src={user?.user_metadata.avatar_url} /><AvatarFallback>{getInitials(userName)}</AvatarFallback></Avatar>
                        <div className="flex-1 truncate"><p className="font-semibold text-sm">{userName || 'User'}</p><p className="text-xs text-muted-foreground truncate">{user?.email}</p></div>
                        <MoreHorizontal size={20} className="text-muted-foreground"/>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="top" align="start" className="w-56">
                      <DropdownMenuLabel>บัญชีของฉัน</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setActiveTab('profile')}><User className="mr-2 h-4 w-4" /><span>โปรไฟล์</span></DropdownMenuItem>
                      <DropdownMenuItem onClick={signOut} className="text-destructive focus:bg-destructive/10 focus:text-destructive"><LogOut className="mr-2 h-4 w-4" /><span>ออกจากระบบ</span></DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-y-auto">
            <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm md:hidden p-4 flex items-center gap-4 border-b">
              <SidebarTrigger />
              <h2 className="text-xl font-semibold capitalize">
                {menuGroups.flatMap(group => group.items).find(item => item.id === activeTab)?.label || 'Dashboard'}
              </h2>
            </header>
            <div className="absolute top-4 right-4 text-xs text-muted-foreground hidden md:block z-20">
                เว็บนี้เป็นเวอร์ชั่น 4.0.0
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                {pageComponents[activeTab]}
              </motion.div>
            </AnimatePresence>
        </main>
      </div>
      
      <ReportModal 
        isOpen={isReportModalOpen}
        onOpenChange={setReportModalOpen}
        activePage={activeTab}
      />
    </SidebarProvider>
  );
};

export default Index;