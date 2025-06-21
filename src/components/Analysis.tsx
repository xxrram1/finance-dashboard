import React, { useState } from 'react';
import { useSupabaseFinance } from '../context/SupabaseFinanceContext';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const Analysis = () => {
  const { transactions, budgets } = useSupabaseFinance();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const monthTransactions = transactions.filter(t => t.date.startsWith(selectedMonth));
  const monthIncome = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const monthExpense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const monthNet = monthIncome - monthExpense;

  const expenseByCategory = monthTransactions.filter(t => t.type === 'expense').reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const pieChartData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

  const monthBudgets = budgets.filter(b => b.month === selectedMonth);
  const budgetComparison = monthBudgets.map(budget => {
    const actual = expenseByCategory[budget.category] || 0;
    return { category: budget.category, budget: budget.amount, actual, difference: budget.amount - actual };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">การวิเคราะห์ทางการเงิน</h1>
          <p className="text-muted-foreground mt-1">ข้อมูลเชิงลึกเกี่ยวกับรูปแบบทางการเงินของคุณ</p>
        </div>
        <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background"/>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รายรับเดือนนี้</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">฿{monthIncome.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รายจ่ายเดือนนี้</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">฿{monthExpense.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ยอดคงเหลือสุทธิ</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className={`text-2xl font-bold ${monthNet >= 0 ? 'text-blue-600' : 'text-orange-500'}`}>฿{monthNet.toLocaleString()}</div></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>สัดส่วนรายจ่าย</CardTitle><CardDescription>การแบ่งรายจ่ายตามหมวดหมู่ในเดือนนี้</CardDescription></CardHeader>
          <CardContent className="h-80">
            {pieChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8">
                  {pieChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                </Pie>
                <Tooltip formatter={(value) => [`฿${Number(value).toLocaleString()}`, '']} contentStyle={{backgroundColor: 'hsl(var(--background))', borderRadius: 'var(--radius)'}} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-muted-foreground">ไม่มีข้อมูลรายจ่าย</div> }
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>งบประมาณ vs. ใช้จริง</CardTitle><CardDescription>เปรียบเทียบการใช้จ่ายจริงกับงบประมาณที่ตั้งไว้</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {budgetComparison.length > 0 ? budgetComparison.map(item => (
              <div key={item.category}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{item.category}</span>
                  <span className="text-muted-foreground">฿{item.actual.toLocaleString()} / ฿{item.budget.toLocaleString()}</span>
                </div>
                <Progress value={(item.actual / item.budget) * 100} />
              </div>
            )) : <div className="flex h-full pt-16 items-center justify-center text-muted-foreground">ไม่มีข้อมูลงบประมาณ</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analysis;