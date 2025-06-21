import React, { useState } from 'react';
import { useSupabaseFinance } from '../context/SupabaseFinanceContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowDown, ArrowUp, Scale, PiggyBank, BarChart2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const Dashboard = () => {
  const { transactions, loading } = useSupabaseFinance();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const yearTransactions = transactions.filter(t => new Date(t.date).getFullYear() === selectedYear);
  const totalIncome = yearTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = yearTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const categorySpending = yearTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const topSpendingCategories = Object.entries(categorySpending)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const monthTransactions = yearTransactions.filter(t => new Date(t.date).getMonth() === i);
    return {
      month: new Date(selectedYear, i).toLocaleDateString('th-TH', { month: 'short' }),
      income: monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
      expense: monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    };
  });
  
  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">แดชบอร์ดการเงิน</h1>
          <p className="text-muted-foreground mt-1">ภาพรวมทางการเงินของคุณในปี {selectedYear}</p>
        </div>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
        >
          {Array.from({ length: 5 }, (_, i) => {
            const year = new Date().getFullYear() - i;
            return <option key={year} value={year}>{year}</option>;
          })}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รายรับรวม</CardTitle>
            <ArrowUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">฿{totalIncome.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">รายรับทั้งหมดในปีนี้</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รายจ่ายรวม</CardTitle>
            <ArrowDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">฿{totalExpense.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">รายจ่ายทั้งหมดในปีนี้</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ยอดคงเหลือสุทธิ</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-blue-600' : 'text-orange-500'}`}>
              ฿{netBalance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">ส่วนต่างรายรับ-รายจ่าย</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5"/>
              ภาพรวมรายเดือน
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80 pr-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(value) => `฿${Number(value)/1000}k`} />
                <Tooltip formatter={(value, name) => [`฿${Number(value).toLocaleString()}`, name]} cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}/>
                <Bar dataKey="income" fill="hsl(var(--primary))" name="รายรับ" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="hsl(var(--destructive))" name="รายจ่าย" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5"/>
              หมวดหมู่รายจ่ายสูงสุด
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {topSpendingCategories.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={topSpendingCategories} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {topSpendingCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`฿${Number(value).toLocaleString()}`, name]} contentStyle={{backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}/>
              </PieChart>
            </ResponsiveContainer>
             ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">ไม่มีข้อมูลรายจ่าย</div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const DashboardSkeleton = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><Skeleton className="h-9 w-64" /><Skeleton className="h-4 w-80 mt-2" /></div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><Skeleton className="h-5 w-24"/><Skeleton className="h-4 w-4"/></CardHeader><CardContent><Skeleton className="h-8 w-40"/><Skeleton className="h-4 w-24 mt-1"/></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><Skeleton className="h-5 w-24"/><Skeleton className="h-4 w-4"/></CardHeader><CardContent><Skeleton className="h-8 w-40"/><Skeleton className="h-4 w-24 mt-1"/></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><Skeleton className="h-5 w-24"/><Skeleton className="h-4 w-4"/></CardHeader><CardContent><Skeleton className="h-8 w-40"/><Skeleton className="h-4 w-24 mt-1"/></CardContent></Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3"><CardHeader><Skeleton className="h-6 w-48"/></CardHeader><CardContent className="pr-6"><Skeleton className="h-80 w-full"/></CardContent></Card>
        <Card className="lg:col-span-2"><CardHeader><Skeleton className="h-6 w-48"/></CardHeader><CardContent><Skeleton className="h-80 w-full"/></CardContent></Card>
      </div>
    </div>
  );

export default Dashboard;