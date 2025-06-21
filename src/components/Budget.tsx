import React, { useState } from 'react';
import { useSupabaseFinance } from '../context/SupabaseFinanceContext';
import { Plus, Trash2, Target } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Budget = () => {
  const { budgets, transactions, addBudget, deleteBudget } = useSupabaseFinance();
  const [form, setForm] = useState({
    category: '',
    amount: '',
    month: new Date().toISOString().slice(0, 7) // YYYY-MM format
  });

  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const categories = ['อาหาร', 'การเดินทาง', 'ความบันเทิง', 'สาธารณูปโภค', 'สุขภาพ', 'ช็อปปิ้ง', 'ค่าใช้จ่ายอื่นๆ'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.category || !form.amount) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน",
        variant: "destructive"
      });
      return;
    }

    addBudget({
      category: form.category,
      amount: parseFloat(form.amount),
      month: form.month
    });

    setForm({
      category: '',
      amount: '',
      month: new Date().toISOString().slice(0, 7)
    });

    toast({
      title: "สำเร็จ",
      description: "เพิ่มงบประมาณสำเร็จแล้ว",
    });
  };

  // Get budget tracking data for selected month
  const getBudgetTracking = () => {
    const monthBudgets = budgets.filter(b => b.month === selectedMonth);
    const monthTransactions = transactions.filter(t => 
      t.type === 'expense' && t.date.startsWith(selectedMonth)
    );

    const tracking = monthBudgets.map(budget => {
      const spent = monthTransactions
        .filter(t => t.category === budget.category)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const remaining = budget.amount - spent;
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

      return {
        category: budget.category,
        budgeted: budget.amount,
        spent,
        remaining,
        percentage: Math.min(percentage, 100),
        status: remaining >= 0 ? 'อยู่ใรแผน' : 'เกินงบประมาณ'
      };
    });

    return tracking;
  };

  const budgetTracking = getBudgetTracking();
  const totalBudgeted = budgetTracking.reduce((sum, item) => sum + item.budgeted, 0);
  const totalSpent = budgetTracking.reduce((sum, item) => sum + item.spent, 0);
  const totalRemaining = totalBudgeted - totalSpent;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">การจัดการงบประมาณ</h1>
        <p className="text-gray-600 mt-1">ตั้งค่าและติดตามงบประมาณรายเดือนของคุณ</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium opacity-90">งบประมาณทั้งหมด</h3>
              <p className="text-2xl font-bold mt-2">${totalBudgeted.toLocaleString()}</p>
            </div>
            <Target className="h-8 w-8 opacity-80" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium opacity-90">ใช้จ่ายไปแล้ว</h3>
              <p className="text-2xl font-bold mt-2">${totalSpent.toLocaleString()}</p>
            </div>
            <Target className="h-8 w-8 opacity-80" />
          </div>
        </div>
        <div className={`bg-gradient-to-r ${totalRemaining >= 0 ? 'from-green-500 to-green-600' : 'from-orange-500 to-orange-600'} rounded-xl p-6 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium opacity-90">คงเหลือ</h3>
              <p className="text-2xl font-bold mt-2">${totalRemaining.toLocaleString()}</p>
            </div>
            <Target className="h-8 w-8 opacity-80" />
          </div>
        </div>
      </div>

      {/* Add Budget Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ตั้งค่างบประมาณ</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่</label>
            <select
              value={form.category}
              onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">เลือกหมวดหมู่</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนเงิน</label>
            <input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เดือน</label>
            <input
              type="month"
              value={form.month}
              onChange={(e) => setForm(prev => ({ ...prev, month: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              ตั้งค่างบประมาณ
            </button>
          </div>
        </form>
      </div>

      {/* Budget Tracking */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">การติดตามงบประมาณ</h3>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {budgetTracking.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">ยังไม่มีการตั้งค่างบประมาณสำหรับเดือนนี้</p>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {budgetTracking.map((item) => (
              <div key={item.category} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-900">{item.category}</h4>
                  <button
                    onClick={() => deleteBudget(item.category, selectedMonth)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">งบประมาณ: ${item.budgeted.toFixed(2)}</span>
                    <span className="text-gray-600">ใช้ไป: ${item.spent.toFixed(2)}</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        item.status === 'อยู่ใรแผน' ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className={`font-medium ${
                      item.remaining >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.remaining >= 0 ? 'คงเหลือ' : 'เกินงบ'}: ${Math.abs(item.remaining).toFixed(2)}
                    </span>
                    <span className="text-gray-600">{item.percentage.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Budget;