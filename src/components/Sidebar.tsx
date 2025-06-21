
import React from 'react';
import { 
  BarChart3, 
  DollarSign, 
  Calendar, 
  PieChart, 
  Settings,
  Folder,
  User
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
  const menuItems = [
    { id: 'dashboard', label: 'แดชบอร์ด', icon: BarChart3 },
    { id: 'transactions', label: 'รายการ', icon: DollarSign },
    { id: 'recurring', label: 'รายการซ้ำ', icon: Calendar },
    { id: 'budget', label: 'งบประมาณ', icon: Folder },
    { id: 'analysis', label: 'วิเคราะห์', icon: PieChart },
    { id: 'planning', label: 'วางแผน', icon: Settings },
    { id: 'profile', label: 'โปรไฟล์', icon: User },
  ];

  return (
    <div className="bg-slate-900 text-white w-64 min-h-screen flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold text-blue-400">FinanceFlow</h1>
        <p className="text-sm text-slate-400 mt-1">จัดการการเงินส่วนบุคคล</p>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    activeTab === item.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-slate-700">
        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">เคล็ดลับ</h3>
          <p className="text-xs text-slate-400">บันทึกรายจ่ายทุกวันเพื่อข้อมูลการเงินที่แม่นยำ!</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
