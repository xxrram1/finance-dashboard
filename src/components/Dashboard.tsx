import React, { useState } from 'react';
import { useSupabaseFinance } from '../context/SupabaseFinanceContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const { transactions, budgets, recurringItems } = useSupabaseFinance();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Calculate insights
  const yearTransactions = transactions.filter(t => 
    new Date(t.date).getFullYear() === selectedYear
  );

  const totalIncome = yearTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = yearTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((netBalance / totalIncome) * 100).toFixed(1) : '0';

  // Monthly recurring expenses
  const monthlyRecurringExpenses = recurringItems
    .filter(item => item.type === 'expense')
    .reduce((sum, item) => {
      switch (item.frequency) {
        case 'daily': return sum + (item.amount * 30);
        case 'weekly': return sum + (item.amount * 4.33);
        case 'monthly': return sum + item.amount;
        case 'yearly': return sum + (item.amount / 12);
        default: return sum;
      }
    }, 0);

  // Daily average expense
  const dailyAvgExpense = totalExpense / 365;

  // Top spending category
  const categorySpending = yearTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const topCategory = Object.entries(categorySpending)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

  // Monthly data for chart
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const monthTransactions = yearTransactions.filter(t => 
      new Date(t.date).getMonth() + 1 === month
    );
    
    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      month: new Date(2023, i).toLocaleDateString('th-TH', { month: 'short' }),
      income,
      expense,
      budget: monthlyRecurringExpenses
    };
  });

  const insights = [
    {
      title: 'อัตราการออม',
      value: `${savingsRate}%`,
      description: 'ของรายได้ที่คุณออม',
      color: 'bg-green-500'
    },
    {
      title: 'ค่าใช้จ่ายเฉลี่ยต่อวัน',
      value: `${dailyAvgExpense.toFixed(2)} บาท`,
      description: 'การใช้จ่ายเฉลี่ยต่อวัน',
      color: 'bg-orange-500'
    },
    {
      title: 'หมวดหมู่ค่าใช้จ่ายสูงสุด',
      value: topCategory,
      description: 'ส่วนที่มีการใช้จ่ายสูงสุด',
      color: 'bg-purple-500'
    },
    {
      title: 'ยอดคงเหลือโดยประมาณ',
      value: `${(netBalance * 2).toFixed(0)} บาท`,
      description: 'ประมาณการ ณ สิ้นปี',
      color: 'bg-blue-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">แดชบอร์ดการเงิน</h1>
          <p className="text-gray-600 mt-1">ดูข้อมูลเชิงลึกเกี่ยวกับสุขภาพทางการเงินของคุณ</p>
        </div>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {Array.from({ length: 5 }, (_, i) => {
            const year = new Date().getFullYear() - i;
            return <option key={year} value={year}>{year}</option>;
          })}
        </select>
      </div>

      {/* Financial Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {insights.map((insight, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full ${insight.color} mr-3`}></div>
              <h3 className="text-sm font-medium text-gray-600">{insight.title}</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{insight.value}</p>
            <p className="text-sm text-gray-500 mt-1">{insight.description}</p>
          </div>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <h3 className="text-sm font-medium opacity-90">รายรับรวม</h3>
          <p className="text-3xl font-bold mt-2">{totalIncome.toLocaleString()} บาท</p>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
          <h3 className="text-sm font-medium opacity-90">รายจ่ายรวม</h3>
          <p className="text-3xl font-bold mt-2">{totalExpense.toLocaleString()} บาท</p>
        </div>
        <div className={`bg-gradient-to-r ${netBalance >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'} rounded-xl p-6 text-white`}>
          <h3 className="text-sm font-medium opacity-90">ยอดคงเหลือสุทธิ</h3>
          <p className="text-3xl font-bold mt-2">{netBalance.toLocaleString()} บาท</p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <h3 className="text-sm font-medium opacity-90">รายการประจำเดือน</h3>
          <p className="text-3xl font-bold mt-2">{monthlyRecurringExpenses.toFixed(0)} บาท</p>
        </div>
      </div>

      {/* Yearly Comparison Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ภาพรวมรายเดือน - {selectedYear}</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} บาท`, '']} />
              <Bar dataKey="income" fill="#10b981" name="รายรับ" />
              <Bar dataKey="expense" fill="#ef4444" name="รายจ่าย" />
              <Bar dataKey="budget" fill="#8b5cf6" name="งบประมาณ" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Spending Statistics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">สถิติการใช้จ่าย</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">สูงสุดต่อเดือน</p>
            <p className="text-xl font-bold text-gray-900">{Math.max(...monthlyData.map(d => d.expense)).toLocaleString()} บาท</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">ต่ำสุดต่อเดือน</p>
            <p className="text-xl font-bold text-gray-900">{Math.min(...monthlyData.map(d => d.expense)).toLocaleString()} บาท</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">เฉลี่ยต่อเดือน</p>
            <p className="text-xl font-bold text-gray-900">{(totalExpense / 12).toFixed(0)} บาท</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">เงินออมที่แนะนำ</p>
            <p className="text-xl font-bold text-green-600">{(totalIncome * 0.2 / 12).toFixed(0)} บาท/เดือน</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;