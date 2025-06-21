import React, { useState } from 'react';
import { useSupabaseFinance } from '../context/SupabaseFinanceContext';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const Analysis = () => {
  const { transactions, budgets } = useSupabaseFinance();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Get month data
  const monthTransactions = transactions.filter(t => t.date.startsWith(selectedMonth));
  const monthIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const monthExpense = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const monthNet = monthIncome - monthExpense;

  // Expense by category for pie chart
  const expenseByCategory = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const pieChartData = Object.entries(expenseByCategory).map(([category, amount]) => ({
    name: category,
    value: amount
  }));

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#ffb347'];

  // Budget vs Actual comparison
  const monthBudgets = budgets.filter(b => b.month === selectedMonth);
  const budgetComparison = monthBudgets.map(budget => {
    const actual = expenseByCategory[budget.category] || 0;
    return {
      category: budget.category,
      budget: budget.amount,
      actual,
      difference: budget.amount - actual
    };
  });

  // Yearly trend data
  const yearlyTrend = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const monthStr = `${selectedYear}-${month.toString().padStart(2, '0')}`;
    const monthTxns = transactions.filter(t => t.date.startsWith(monthStr));
    
    const income = monthTxns
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = monthTxns
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      month: new Date(selectedYear, i).toLocaleDateString('th-TH', { month: 'short' }),
      income,
      expense,
      net: income - expense
    };
  });

  // AI Insights simulation
  const generateAIInsights = () => {
    const insights = [
      `สำหรับ ${new Date(selectedMonth).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}, ยอดคงเหลือสุทธิของคุณเป็น ${monthNet >= 0 ? 'บวก' : 'ลบ'} อยู่ที่ ${Math.abs(monthNet).toFixed(2)} บาท.`,
      `หมวดหมู่ค่าใช้จ่ายสูงสุดของคุณคือ ${Object.keys(expenseByCategory)[0] || 'ไม่มี'} ด้วยเงิน ${Object.values(expenseByCategory)[0]?.toFixed(2) || '0.00'} บาท.`,
      monthNet >= 0 ? 'ยอดเยี่ยมมากที่รักษากระแสเงินสดเป็นบวกได้!' : 'ลองทบทวนค่าใช้จ่ายเพื่อปรับปรุงสถานะทางการเงินของคุณ',
      `ค่าใช้จ่ายทั้งหมดของคุณ ${monthExpense.toFixed(2)} บาท คิดเป็น ${monthIncome > 0 ? ((monthExpense / monthIncome) * 100).toFixed(1) : '0'}% ของรายได้ของคุณ.`
    ];

    return insights.join(' ');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">การวิเคราะห์ทางการเงิน</h1>
          <p className="text-gray-600 mt-1">ข้อมูลเชิงลึกเกี่ยวกับรูปแบบทางการเงินของคุณ</p>
        </div>
        <div className="flex gap-4">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
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
      </div>

      {/* Monthly Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium opacity-90">รายรับรายเดือน</h3>
              <p className="text-2xl font-bold mt-2">${monthIncome.toLocaleString()}</p>
            </div>
            <TrendingUp className="h-8 w-8 opacity-80" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium opacity-90">รายจ่ายรายเดือน</h3>
              <p className="text-2xl font-bold mt-2">${monthExpense.toLocaleString()}</p>
            </div>
            <TrendingDown className="h-8 w-8 opacity-80" />
          </div>
        </div>
        <div className={`bg-gradient-to-r ${monthNet >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'} rounded-xl p-6 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium opacity-90">ยอดคงเหลือสุทธิ</h3>
              <p className="text-2xl font-bold mt-2">${monthNet.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 opacity-80" />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ค่าใช้จ่ายตามหมวดหมู่</h3>
          {pieChartData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} บาท`, 'จำนวน']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              ไม่มีข้อมูลค่าใช้จ่ายสำหรับเดือนนี้
            </div>
          )}
        </div>

        {/* Budget vs Actual */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">งบประมาณเทียบกับความเป็นจริง</h3>
          {budgetComparison.length > 0 ? (
            <div className="space-y-4">
              {budgetComparison.map((item) => (
                <div key={item.category} className="border-b border-gray-100 pb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-900">{item.category}</span>
                    <span className={`text-sm ${item.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.difference >= 0 ? 'ต่ำกว่า' : 'สูงกว่า'} by ${Math.abs(item.difference).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>งบประมาณ: ${item.budget.toFixed(2)}</span>
                    <span>ใช้จริง: ${item.actual.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-60 flex items-center justify-center text-gray-500">
              ไม่มีข้อมูลงบประมาณสำหรับเดือนนี้
            </div>
          )}
        </div>
      </div>

      {/* Yearly Trend */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">แนวโน้มรายปี - {selectedYear}</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={yearlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} บาท`, '']} />
              <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="รายรับ" />
              <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} name="รายจ่าย" />
              <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={2} name="สุทธิ" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">ข้อมูลเชิงลึกทางการเงินจาก AI</h3>
          <button
            onClick={() => {
              // In a real app, this would call an AI API
              alert(generateAIInsights());
            }}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            สร้างข้อมูลเชิงลึกจาก AI
          </button>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-gray-700">{generateAIInsights()}</p>
        </div>
      </div>
    </div>
  );
};

export default Analysis;