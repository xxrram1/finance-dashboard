import React, { useState } from 'react';
import { useSupabaseFinance } from '../context/SupabaseFinanceContext';
import { Plus, Trash2, Calendar, DollarSign } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Recurring = () => {
  const { recurringItems, addRecurringItem, deleteRecurringItem } = useSupabaseFinance();
  const [form, setForm] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
    amount: '',
    frequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    startDate: new Date().toISOString().split('T')[0]
  });

  const categories = {
    income: ['เงินเดือน', 'ฟรีแลนซ์', 'เงินลงทุน', 'ของขวัญ', 'รายรับอื่นๆ'],
    expense: ['อาหาร', 'การเดินทาง', 'ความบันเทิง', 'สาธารณูปโภค', 'สุขภาพ', 'ช็อปปิ้ง', 'ค่าใช้จ่ายอื่นๆ']
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name || !form.category || !form.amount) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน",
        variant: "destructive"
      });
      return;
    }

    addRecurringItem({
      name: form.name,
      type: form.type,
      category: form.category,
      amount: parseFloat(form.amount),
      frequency: form.frequency,
      start_date: form.startDate,
      is_active: true
    });

    setForm({
      name: '',
      type: 'expense',
      category: '',
      amount: '',
      frequency: 'monthly',
      startDate: new Date().toISOString().split('T')[0]
    });

    toast({
      title: "สำเร็จ",
      description: "เพิ่มรายการเกิดซ้ำสำเร็จแล้ว",
    });
  };

  const handleDelete = (id: string) => {
    deleteRecurringItem(id);
    toast({
      title: "สำเร็จ",
      description: "ลบรายการเกิดซ้ำสำเร็จแล้ว",
    });
  };

  // Calculate recurring totals
  const dailyTotal = recurringItems.reduce((sum, item) => {
    if (item.type === 'expense') {
      switch (item.frequency) {
        case 'daily': return sum + item.amount;
        case 'weekly': return sum + (item.amount / 7);
        case 'monthly': return sum + (item.amount / 30);
        case 'yearly': return sum + (item.amount / 365);
        default: return sum;
      }
    }
    return sum;
  }, 0);

  const monthlyTotal = recurringItems.reduce((sum, item) => {
    if (item.type === 'expense') {
      switch (item.frequency) {
        case 'daily': return sum + (item.amount * 30);
        case 'weekly': return sum + (item.amount * 4.33);
        case 'monthly': return sum + item.amount;
        case 'yearly': return sum + (item.amount / 12);
        default: return sum;
      }
    }
    return sum;
  }, 0);

  const yearlyTotal = recurringItems.reduce((sum, item) => {
    if (item.type === 'expense') {
      switch (item.frequency) {
        case 'daily': return sum + (item.amount * 365);
        case 'weekly': return sum + (item.amount * 52);
        case 'monthly': return sum + (item.amount * 12);
        case 'yearly': return sum + item.amount;
        default: return sum;
      }
    }
    return sum;
  }, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">รายการเกิดซ้ำ</h1>
        <p className="text-gray-600 mt-1">จัดการรายรับและรายจ่ายที่เกิดซ้ำของคุณ</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium opacity-90">รายจ่ายประจำวัน</h3>
              <p className="text-2xl font-bold mt-2">${dailyTotal.toFixed(2)}</p>
            </div>
            <Calendar className="h-8 w-8 opacity-80" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium opacity-90">รายจ่ายประจำเดือน</h3>
              <p className="text-2xl font-bold mt-2">${monthlyTotal.toFixed(2)}</p>
            </div>
            <Calendar className="h-8 w-8 opacity-80" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium opacity-90">รายจ่ายประจำปี</h3>
              <p className="text-2xl font-bold mt-2">${yearlyTotal.toFixed(2)}</p>
            </div>
            <Calendar className="h-8 w-8 opacity-80" />
          </div>
        </div>
      </div>

      {/* Add Recurring Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">เพิ่มรายการเกิดซ้ำ</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="เช่น เงินเดือน"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ประเภท</label>
            <select
              value={form.type}
              onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value as 'income' | 'expense', category: '' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="expense">รายจ่าย</option>
              <option value="income">รายรับ</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่</label>
            <select
              value={form.category}
              onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">เลือกหมวดหมู่</option>
              {categories[form.type].map(cat => (
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
            <label className="block text-sm font-medium text-gray-700 mb-1">ความถี่</label>
            <select
              value={form.frequency}
              onChange={(e) => setForm(prev => ({ ...prev, frequency: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="daily">รายวัน</option>
              <option value="weekly">รายสัปดาห์</option>
              <option value="monthly">รายเดือน</option>
              <option value="yearly">รายปี</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วันที่เริ่มต้น</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="lg:col-span-6">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus size={16} />
              เพิ่มรายการเกิดซ้ำ
            </button>
          </div>
        </form>
      </div>

      {/* Recurring Items List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">รายการเกิดซ้ำ</h3>
        </div>
        
        {recurringItems.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">ยังไม่มีรายการเกิดซ้ำ เพิ่มรายการแรกของคุณด้านบน!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ประเภท</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">หมวดหมู่</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">จำนวนเงิน</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ความถี่</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่เริ่มต้น</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recurringItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.type === 'income' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={item.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                        {item.type === 'income' ? '+' : '-'}${item.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {item.frequency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.start_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recurring;