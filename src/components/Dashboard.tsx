// src/components/Dashboard.tsx

import React, { useState, useMemo } from 'react';
import { useSupabaseFinance } from '../context/SupabaseFinanceContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Wallet, Percent, Activity, Eye, EyeOff, Info, Package, Maximize } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { motion } from 'framer-motion';
import PDFExport from './PDFExport';
import { MonthYearPicker } from '@/components/ui/month-year-picker';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { useIsMobile } from '@/hooks/use-mobile';


const Dashboard = () => {
  const { transactions, loading } = useSupabaseFinance();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [showAmounts, setShowAmounts] = useState(true);

  // State for chart modal
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [modalChartData, setModalChartData] = useState<any[]>([]);
  const [modalChartConfig, setModalChartConfig] = useState<ChartConfig>({});
  const [modalChartType, setModalChartType] = useState<'bar' | 'pie' | 'verticalBar' | 'area'>('bar');
  const [modalChartTitle, setModalChartTitle] = useState('');
  const [modalChartDescription, setModalChartDescription] = useState('');
  const isMobile = useIsMobile();

  // Helper function to format currency consistently
  const formatCurrency = (amount: number, hideAmount = false) => {
    if (hideAmount) return '฿***,***';
    return `฿${amount.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Memoized list of available years from transactions, plus current and future years
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const transactionYears = transactions.map(t => new Date(t.date).getFullYear());
    
    const allYearsSet = new Set<number>();
    // Add 5 years before current year
    for (let i = 0; i < 5; i++) {
      allYearsSet.add(currentYear - i);
    }
    // Add current year and 5 years after current year
    for (let i = 0; i <= 5; i++) {
      allYearsSet.add(currentYear + i);
    }
    // Add all transaction years
    transactionYears.forEach(year => allYearsSet.add(year));
    
    // Convert set to array, sort, and then convert to string for select values
    return Array.from(allYearsSet).sort((a, b) => b - a).map(String);
  }, [transactions]); 

  // Filter transactions for the selected year
  const yearTransactions = useMemo(() => transactions.filter(t => 
    new Date(t.date).getFullYear().toString() === selectedYear 
  ), [transactions, selectedYear]); 

  // Calculate key financial insights for the selected year
  const { totalIncome, totalExpense, netBalance, savingsRate, topExpenseCategory, dailyAvgExpense } = useMemo(() => {
    const income = yearTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0); 
    const expense = yearTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0); 
    const net = income - expense; 
    const rate = income > 0 ? ((net / income) * 100) : 0; 
    const daysInYear = new Date(parseInt(selectedYear), 1, 29).getDate() === 29 ? 366 : 365; 

    const categorySpending = yearTransactions 
      .filter(t => t.type === 'expense') 
      .reduce((acc, t) => { 
        acc[t.category] = (acc[t.category] || 0) + t.amount; 
        return acc; 
      }, {} as Record<string, number>); 

    const topCat = Object.entries(categorySpending).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A'; 

    return {
      totalIncome: income, 
      totalExpense: expense, 
      netBalance: net, 
      savingsRate: rate, 
      topExpenseCategory: topCat, 
      dailyAvgExpense: expense / daysInYear, 
    };
  }, [yearTransactions, selectedYear]); 


  // Prepare monthly data for charts (e.g., BarChart of Income vs Expense)
  const monthlyData = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    const month = i + 1; 
    const monthTransactions = yearTransactions.filter(t => 
      new Date(t.date).getMonth() + 1 === month 
    );
    
    const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0); 
    const expense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0); 
    const net = income - expense; 

    return {
      month: new Date(parseInt(selectedYear), i).toLocaleDateString('th-TH', { month: 'short' }), 
      income, 
      expense, 
      net 
    };
  }), [yearTransactions, selectedYear]); 

  // Prepare data for category breakdown charts (Pie Charts for Expense and Income)
  const categoryBreakdownData = useMemo(() => {
    const expenseByCategory = yearTransactions.filter(t => t.type === 'expense').reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    // Only expense pie data is generated, as requested to keep original Dashboard features
    const expensePieData = Object.entries(expenseByCategory).map(([name, value], index) => ({
      name,
      value,
      fill: `hsl(${(index * 30 + 10) % 360}, 70%, 50%)`, 
    })).sort((a,b) => b.value - a.value);

    return { expensePieData }; // Only return expensePieData
  }, [yearTransactions]);

  // Chart configuration for consistent styling and labeling 
  const chartConfig = useMemo(() => ({
    income: {
      label: "รายรับ",
      color: "hsl(142.1 76.2% 41%)", 
      icon: TrendingUp,
    },
    expense: {
      label: "รายจ่าย",
      color: "hsl(0 72.2% 50.6%)", 
      icon: TrendingDown,
    },
    net: {
      label: "สุทธิ",
      color: "hsl(221.2 83.2% 53.3%)", 
      icon: DollarSign,
    },
    ...categoryBreakdownData.expensePieData.reduce((acc, cur) => ({...acc, [cur.name]: {label: cur.name, color: cur.fill}}), {}),
  }), [categoryBreakdownData.expensePieData]) satisfies ChartConfig;

  // Function to open chart modal
  const openChartModal = (data: any[], config: ChartConfig, type: 'bar' | 'pie' | 'verticalBar' | 'area', title: string, description: string) => {
    setModalChartData(data);
    setModalChartConfig(config);
    setModalChartType(type);
    setModalChartTitle(title);
    setModalChartDescription(description);
    setIsChartModalOpen(true);
  };

  // Render skeleton loaders while data is loading
  if (loading) { 
    return (
      <div className="space-y-6 p-4 md:p-8 max-w-screen-2xl mx-auto">
        <header className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
          <div className="space-y-2"><Skeleton className="h-9 w-72" /><Skeleton className="h-5 w-96" /></div>
          <div className="flex gap-2 w-full lg:w-auto"><Skeleton className="h-10 w-full lg:w-48" /><Skeleton className="h-10 w-10" /><Skeleton className="h-10 w-full lg:w-32" /></div>
        </header>
        <main className="grid grid-cols-12 gap-6">
          <section className="col-span-12 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6"><Skeleton className="h-[400px]" /><Skeleton className="h-[400px]" /></div>
          </section>
        </main>
      </div>
    );
  }

  // Reusable component for displaying financial statistics in a card
  const StatCard = ({ title, value, Icon, color, description }: { title: string; value: number; Icon: React.ElementType; color: string; description?: string; }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <Icon className={`h-5 w-5 ${color}`} />
        </CardHeader>
        <CardContent className="flex-grow flex flex-col justify-end">
          <div className="text-3xl font-bold text-foreground mb-1">
            {formatCurrency(value, !showAmounts)}
          </div>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-screen-2xl mx-auto">
      <header className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">สรุปภาพรวมการเงิน</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">ข้อมูลเชิงลึกและการวิเคราะห์การเงินของคุณสำหรับปี {parseInt(selectedYear) + 543}</p>
        </div>
        <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
          {/* MonthYearPicker is used for year-only selection for consistency in UI */}
          <MonthYearPicker 
            selectedDate={`${selectedYear}-01`} // Month part is irrelevant for year-only selection but needed for format
            onDateChange={(date) => setSelectedYear(date.slice(0, 4))}
            className="flex-1 lg:flex-initial"
          />
          {/* Toggle amounts visibility button */}
          <Button variant="outline" size="icon" onClick={() => setShowAmounts(!showAmounts)} aria-label={showAmounts ? "Hide amounts" : "Show amounts"}>
            {showAmounts ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className="sr-only">{showAmounts ? "Hide amounts" : "Show amounts"}</span>
          </Button>
          {/* Export to PDF button */}
          <PDFExport /> 
        </div>
      </header>

      {/* Section for key financial statistics cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="รายรับรวม"
          value={totalIncome}
          Icon={TrendingUp}
          color="text-green-600 dark:text-green-400"
          description="รายรับทั้งหมดในปีนี้"
        />
        <StatCard
          title="รายจ่ายรวม"
          value={totalExpense}
          Icon={TrendingDown}
          color="text-red-600 dark:text-red-400"
          description={`จาก ${yearTransactions.filter(t => t.type === 'expense').length} รายการ`}
        />
        <StatCard
          title="ยอดคงเหลือสุทธิ"
          value={netBalance}
          Icon={Wallet}
          color={netBalance >= 0 ? "text-blue-600 dark:text-blue-400" : "text-orange-600 dark:text-orange-400"}
          description={netBalance >= 0 ? "กำไรสุทธิ" : "ขาดทุนสุทธิ"}
        />
        <StatCard
          title="อัตราการออม"
          value={savingsRate}
          Icon={Percent}
          color="text-purple-600 dark:text-purple-400"
          description={`${savingsRate.toFixed(1)}% ของรายรับรวม`}
        />
      </section>

      {/* Section for Charts (Monthly Overview and Category Breakdown) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Overview Bar Chart Card */}
        <Card className="h-[400px] flex flex-col hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex-row justify-between items-center">
            <div>
              <CardTitle>ภาพรวมรายรับ-รายจ่ายรายเดือน</CardTitle>
              <CardDescription>แสดงแนวโน้มตลอดทั้งปี {parseInt(selectedYear) + 543}</CardDescription>
            </div>
            {yearTransactions.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openChartModal(
                  monthlyData,
                  chartConfig,
                  'bar',
                  'ภาพรวมรายรับ-รายจ่ายรายเดือน',
                  `แสดงแนวโน้มตลอดทั้งปี ${parseInt(selectedYear) + 543}`
                )}
                className="flex-shrink-0"
                aria-label="ขยายกราฟ"
              >
                <Maximize className="h-5 w-5" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="flex-grow flex items-center justify-center">
            {yearTransactions.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-full w-full"> 
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} fontSize={12}
                           tickFormatter={(value) => showAmounts ? `฿${Number(value) / 1000}k` : '฿***'} />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent
                        formatter={(value, name) => [`${formatCurrency(value as number, !showAmounts)}`, chartConfig[name as keyof typeof chartConfig]?.label || name]}
                      />}
                    /> 
                    <ChartLegend content={<ChartLegendContent />} /> 
                    <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="text-muted-foreground text-center p-4">
                <Info className="h-8 w-8 mx-auto mb-2" />
                <p>ไม่มีข้อมูลธุรกรรมสำหรับปีนี้</p>
                <p className="text-sm">ลองเพิ่มรายการธุรกรรมหรือเลือกปีอื่น</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expense Category Breakdown Pie Chart Card */}
        <Card className="h-[400px] flex flex-col hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex-row justify-between items-center">
            <div>
              <CardTitle>การกระจายรายจ่ายตามหมวดหมู่</CardTitle>
              <CardDescription>สัดส่วนรายจ่ายในรอบปี {parseInt(selectedYear) + 543}</CardDescription>
            </div>
            {categoryBreakdownData.expensePieData.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openChartModal(
                  categoryBreakdownData.expensePieData,
                  chartConfig,
                  'pie',
                  'การกระจายรายจ่ายตามหมวดหมู่',
                  `สัดส่วนรายจ่ายในรอบปี ${parseInt(selectedYear) + 543}`
                )}
                className="flex-shrink-0"
                aria-label="ขยายกราฟ"
              >
                <Maximize className="h-5 w-5" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="flex-grow flex items-center justify-center">
            {categoryBreakdownData.expensePieData.length > 0 ? (
              <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[300px] w-full"> 
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <ChartTooltip content={<ChartTooltipContent nameKey="name" formatter={(value) => formatCurrency(value as number, !showAmounts)} />} /> 
                    <Pie
                      data={categoryBreakdownData.expensePieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={80} // Increased innerRadius for better visual
                      outerRadius={120} // Increased outerRadius to make it larger
                      paddingAngle={2}
                      animationDuration={500}
                      stroke="none"
                    >
                      {categoryBreakdownData.expensePieData.map((entry, index) => (
                        <Cell key={`cell-expense-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent />} /> 
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="text-muted-foreground text-center p-4">
                <Info className="h-8 w-8 mx-auto mb-2" />
                <p>ไม่มีข้อมูลรายจ่ายสำหรับปีนี้</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Section for additional insights: Top Expense Category and Daily Average Expense */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              หมวดหมู่รายจ่ายสูงสุด
            </CardTitle>
            <CardDescription>หมวดหมู่ที่คุณใช้จ่ายมากที่สุดในปีนี้</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {topExpenseCategory !== 'N/A' ? topExpenseCategory : 'ไม่มีข้อมูล'}
            </div>
            {topExpenseCategory !== 'N/A' && (
              <p className="text-sm text-muted-foreground mt-1">
                คุณใช้จ่ายไป {formatCurrency(yearTransactions.filter(t => t.type === 'expense' && t.category === topExpenseCategory).reduce((sum, t) => sum + t.amount, 0), !showAmounts)}
                {' '}ในหมวดหมู่นี้
              </p>
            )}
            <div className="mt-4">
              <h4 className="text-lg font-semibold mb-2">รายจ่าย 5 อันดับแรก</h4>
              <div className="space-y-3">
                {Object.entries(yearTransactions.filter(t => t.type === 'expense').reduce((acc, t) => {
                  acc[t.category] = (acc[t.category] || 0) + t.amount;
                  return acc;
                }, {} as Record<string, number>))
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([category, amount], index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{category}</span>
                    <span className="text-sm font-semibold">{formatCurrency(amount, !showAmounts)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              ค่าใช้จ่ายเฉลี่ยรายวัน
            </CardTitle>
            <CardDescription>ประมาณการค่าใช้จ่ายในแต่ละวันของคุณ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(dailyAvgExpense, !showAmounts)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              อิงจากรายจ่ายรวมในปี {parseInt(selectedYear) + 543}
            </p>
          </CardContent>
        </Card>
      </section>
      
      {/* Chart Modal (Dialog for Desktop, Drawer for Mobile) */}
      {isChartModalOpen && (
        isMobile ? (
          <Drawer open={isChartModalOpen} onClose={() => setIsChartModalOpen(false)}>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>{modalChartTitle}</DrawerTitle>
                <DrawerDescription>{modalChartDescription}</DrawerDescription>
              </DrawerHeader>
              <div className="h-[70vh] p-4 flex items-center justify-center">
                <ChartContainer config={modalChartConfig} className="h-full w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {modalChartType === 'bar' && (
                      <BarChart data={modalChartData} margin={{ top: 20, right: 20, bottom: 5, left: -10 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                        <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => showAmounts ? `฿${Number(v)/1000}k` : '฿***'} />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(value, name) => [formatCurrency(value as number, !showAmounts), modalChartConfig[name as keyof typeof modalChartConfig]?.label]}/>} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    )}
                    {modalChartType === 'pie' && (
                      <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <ChartTooltip content={<ChartTooltipContent nameKey="name" formatter={(value) => formatCurrency(value as number, !showAmounts)} />} />
                        <Pie data={modalChartData} dataKey="value" nameKey="name" innerRadius={80} outerRadius={120} paddingAngle={2} animationDuration={500} stroke="none"/>
                        <ChartLegend content={<ChartLegendContent />} />
                      </PieChart>
                    )}
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </DrawerContent>
          </Drawer>
        ) : (
          <Dialog open={isChartModalOpen} onOpenChange={() => setIsChartModalOpen(false)}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-6">
              <DialogHeader>
                <DialogTitle>{modalChartTitle}</DialogTitle>
                <DialogDescription>{modalChartDescription}</DialogDescription>
              </DialogHeader>
              <div className="flex-1 flex items-center justify-center">
                <ChartContainer config={modalChartConfig} className="h-full w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {modalChartType === 'bar' && (
                      <BarChart data={modalChartData} margin={{ top: 20, right: 20, bottom: 5, left: -10 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                        <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => showAmounts ? `฿${Number(v)/1000}k` : '฿***'} />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(value, name) => [formatCurrency(value as number, !showAmounts), modalChartConfig[name as keyof typeof modalChartConfig]?.label]}/>} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    )}
                    {modalChartType === 'pie' && (
                      <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <ChartTooltip content={<ChartTooltipContent nameKey="name" formatter={(value) => formatCurrency(value as number, !showAmounts)} />} />
                        <Pie data={modalChartData} dataKey="value" nameKey="name" innerRadius={80} outerRadius={120} paddingAngle={2} animationDuration={500} stroke="none"/>
                        <ChartLegend content={<ChartLegendContent />} />
                      </PieChart>
                    )}
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </DialogContent>
          </Dialog>
        )
      )}
    </div>
  );
};

export default Dashboard;