import React, { useState } from 'react';
import { useSupabaseFinance } from '../context/SupabaseFinanceContext';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Transactions = () => {
  const { transactions, addTransaction, deleteTransaction } = useSupabaseFinance();
  const [formMode, setFormMode] = useState<'single' | 'bulk'>('single');
  
  // Single transaction form state
  const [singleForm, setSingleForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'expense' as 'income' | 'expense',
    category: '',
    amount: '',
    note: ''
  });

  // Bulk transaction form state
  const [bulkData, setBulkData] = useState('');

  const categories = {
    income: ['เงินเดือน', 'ฟรีแลนซ์', 'เงินลงทุน', 'ของขวัญ', 'รายรับอื่นๆ'],
    expense: ['อาหาร', 'การเดินทาง', 'ความบันเทิง', 'สาธารณูปโภค', 'สุขภาพ', 'ช็อปปิ้ง', 'ค่าใช้จ่ายอื่นๆ']
  };

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!singleForm.category || !singleForm.amount) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน",
        variant: "destructive"
      });
      return;
    }

    addTransaction({
      date: singleForm.date,
      type: singleForm.type,
      category: singleForm.category,
      amount: parseFloat(singleForm.amount),
      note: singleForm.note
    });

    setSingleForm({
      date: new Date().toISOString().split('T')[0],
      type: 'expense',
      category: '',
      amount: '',
      note: ''
    });

    toast({
      title: "สำเร็จ",
      description: "เพิ่มรายการสำเร็จแล้ว",
    });
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const lines = bulkData.trim().split('\n').filter(line => line.trim());
    let successCount = 0;
    let errorCount = 0;

    lines.forEach((line, index) => {
      const parts = line.split(',').map(part => part.trim());
      
      if (parts.length >= 4) {
        const [date, type, category, amount, ...noteParts] = parts;
        
        if ((type === 'income' || type === 'expense') && !isNaN(parseFloat(amount))) {
          addTransaction({
            date: date || new Date().toISOString().split('T')[0],
            type: type as 'income' | 'expense',
            category: category || 'Other',
            amount: parseFloat(amount),
            note: noteParts.join(',') || ''
          });
          successCount++;
        } else {
          errorCount++;
        }
      } else {
        errorCount++;
      }
    });

    setBulkData('');
    
    toast({
      title: "นำเข้าข้อมูลจำนวนมากเสร็จสมบูรณ์",
      description: `เพิ่ม ${successCount} รายการ${errorCount > 0 ? `, เกิดข้อผิดพลาด ${errorCount} รายการ` : ''}`,
    });
  };

  const handleDelete = (id: string) => {
    deleteTransaction(id);
    toast({
      title: "สำเร็จ",
      description: "ลบรายการสำเร็จแล้ว",
    });
  };

  const recentTransactions = transactions.slice(0, 20);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">รายการ</h1>
        <p className="text-gray-600 mt-1">จัดการรายรับและรายจ่ายของคุณ</p>
      </div>

      {/* Form Mode Toggle */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setFormMode('single')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              formMode === 'single'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            เพิ่มทีละรายการ
          </button>
          <button
            onClick={() => setFormMode('bulk')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              formMode === 'bulk'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            นำเข้าหลายรายการ
          </button>
        </div>

        {formMode === 'single' ? (
          <form onSubmit={handleSingleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วันที่</label>
              <input
                type="date"
                value={singleForm.date}
                onChange={(e) => setSingleForm(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ประเภท</label>
              <select
                value={singleForm.type}
                onChange={(e) => setSingleForm(prev => ({ ...prev, type: e.target.value as 'income' | 'expense', category: '' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="expense">รายจ่าย</option>
                <option value="income">รายรับ</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่</label>
              <select
                value={singleForm.category}
                onChange={(e) => setSingleForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">เลือกหมวดหมู่</option>
                {categories[singleForm.type].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนเงิน</label>
              <input
                type="number"
                step="0.01"
                value={singleForm.amount}
                onChange={(e) => setSingleForm(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
              <input
                type="text"
                value={singleForm.note}
                onChange={(e) => setSingleForm(prev => ({ ...prev, note: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="หมายเหตุ (ถ้ามี)"
              />
            </div>
            
            <div className="lg:col-span-5">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus size={16} />
                เพิ่มรายการ
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleBulkSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ข้อมูลรายการจำนวนมาก
              </label>
              <p className="text-sm text-gray-500 mb-2">
                รูปแบบ: ปี-เดือน-วัน,ประเภท,หมวดหมู่,จำนวนเงิน,หมายเหตุ (หนึ่งรายการต่อบรรทัด)
              </p>
              <textarea
                value={bulkData}
                onChange={(e) => setBulkData(e.target.value)}
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="2567-01-15,expense,อาหาร,25.50,อาหารกลางวันที่ร้านกาแฟ&#10;2567-01-16,income,เงินเดือน,3000,เงินเดือน"
              />
            </div>
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              นำเข้ารายการ
            </button>
          </form>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">รายการล่าสุด</h3>
          <p className="text-sm text-gray-500">20 รายการล่าสุด</p>
        </div>
        
        {recentTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">ยังไม่มีรายการธุรกรรม เพิ่มรายการแรกของคุณด้านบน!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ประเภท</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">หมวดหมู่</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">จำนวนเงิน</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">หมายเหตุ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        transaction.type === 'income' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                        {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.note || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleDelete(transaction.id)}
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

export default Transactions;