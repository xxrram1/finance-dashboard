import React, { useState, useMemo } from 'react';
import { useSupabaseFinance } from '../context/SupabaseFinanceContext';
import ChartModal from './ui/ChartModal';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Wallet, Percent, Activity, Eye, EyeOff, Info, Package, Maximize, FileDown } from 'lucide-react'; // แก้ไข: เพิ่ม FileDown
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
  const [modalChartDescription, setModalChartDescription] = '';
  const isMobile = useIsMobile();
  const [isPDFExportModalOpen, setIsPDFExportModalOpen] = useState(false);

  const formatCurrency = (amount: number, hideAmount = false) => {
    if (hideAmount) return '฿***,***';
    return `฿${amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <header className="mb-8">
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
              <div className="space-y-2">
                <Skeleton className="h-10 w-80" />
                <Skeleton className="h-5 w-96" />
              </div>
              <div className="flex gap-3 flex-wrap">
                <Skeleton className="h-11 w-48" />
                <Skeleton className="h-11 w-11" />
                <Skeleton className="h-11 w-32" />
              </div>
            </div>
          </header>
          <main className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Skeleton className="h-[480px]" />
              <Skeleton className="h-[480px]" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-80" />
              <Skeleton className="h-80" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Reusable component for displaying financial statistics in a card
  const StatCard = ({
    title,
    value,
    Icon,
    color,
    description,
    className = ""
  }: {
    title: string;
    value: number;
    Icon: React.ElementType;
    color: string;
    description?: string;
    className?: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("h-full", className)}
    >
      <Card className="h-full border-0 shadow-lg bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              {title}
            </CardTitle>
            <div className={cn("p-2 rounded-lg bg-gradient-to-r", color)}>
              <Icon className="h-5 w-5 text-white" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl xl:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            {formatCurrency(value, !showAmounts)}
          </div>
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {description}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl xl:text-4xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                สรุปภาพรวมการเงิน
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-base xl:text-lg">
                ข้อมูลเชิงลึกและการวิเคราะห์การเงินของคุณสำหรับปี {parseInt(selectedYear) + 543}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <MonthYearPicker
                selectedDate={`${selectedYear}-01`}
                onDateChange={(date) => setSelectedYear(date.slice(0, 4))}
                className="min-w-48"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowAmounts(!showAmounts)}
                aria-label={showAmounts ? "ซ่อนจำนวนเงิน" : "แสดงจำนวนเงิน"}
                className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800"
              >
                {showAmounts ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              {/* ปุ่มโหลด PDF พร้อมข้อความ */}
              <Button
                onClick={() => setIsPDFExportModalOpen(true)}
                variant="outline"
                className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800"
              >
                  <FileDown className="w-4 h-4 mr-2" />
                  PDF
              </Button>
            </div>
          </div>
        </header>

        <main className="space-y-8">
          {/* Key Financial Statistics */}
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <StatCard
              title="รายรับรวม"
              value={totalIncome}
              Icon={TrendingUp}
              color="from-green-500 to-emerald-600"
              description="รายรับทั้งหมดในปีนี้"
            />
            <StatCard
              title="รายจ่ายรวม"
              value={totalExpense}
              Icon={TrendingDown}
              color="from-red-500 to-rose-600"
              description={`จาก ${yearTransactions.filter(t => t.type === 'expense').length} รายการ`}
            />
            <StatCard
              title="ยอดคงเหลือสุทธิ"
              value={netBalance}
              Icon={Wallet}
              color={netBalance >= 0 ? "from-blue-500 to-cyan-600" : "from-orange-500 to-amber-600"}
              description={netBalance >= 0 ? "กำไรสุทธิ" : "ขาดทุนสุทธิ"}
            />
            <StatCard
              title="อัตราการออม"
              value={savingsRate}
              Icon={Percent}
              color="from-purple-500 to-violet-600"
              description={`${savingsRate.toFixed(1)}% ของรายรับรวม`}
            />
          </section>

          {/* Charts Section */}
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Monthly Overview Bar Chart */}
            <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
                      ภาพรวมรายรับ-รายจ่ายรายเดือน
                    </CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-300">
                      แสดงแนวโน้มตลอดทั้งปี {parseInt(selectedYear) + 543}
                    </CardDescription>
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
                      className="flex-shrink-0 hover:bg-slate-100 dark:hover:bg-slate-700"
                      aria-label="ขยายกราฟ"
                    >
                      <Maximize className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[400px] w-full">
                  {yearTransactions.length > 0 ? (
                    <ChartContainer config={chartConfig} className="h-full w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            fontSize={12}
                            tick={{ fill: '#64748b' }}
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            fontSize={12}
                            tick={{ fill: '#64748b' }}
                            tickFormatter={(value) => showAmounts ? `฿${Number(value) / 1000}k` : '฿***'}
                          />
                          <ChartTooltip
                            cursor={{ fill: 'rgba(0,0,0,0.1)' }}
                            content={<ChartTooltipContent
                              formatter={(value, name) => [
                                `${formatCurrency(value as number, !showAmounts)}`,
                                chartConfig[name as keyof typeof chartConfig]?.label || name
                              ]}
                            />}
                          />
                          <ChartLegend content={<ChartLegendContent />} />
                          <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
                      <div className="text-center space-y-3">
                        <Info className="h-12 w-12 mx-auto opacity-50" />
                        <div>
                          <p className="text-lg font-medium">ไม่มีข้อมูลธุรกรรมสำหรับปีนี้</p>
                          <p className="text-sm">ลองเพิ่มรายการธุรกรรมหรือเลือกปีอื่น</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Expense Category Breakdown Pie Chart */}
            <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
                      การกระจายรายจ่ายตามหมวดหมู่
                    </CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-300">
                      สัดส่วนรายจ่ายในรอบปี {parseInt(selectedYear) + 543}
                    </CardDescription>
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
                      className="flex-shrink-0 hover:bg-slate-100 dark:hover:bg-slate-700"
                      aria-label="ขยายกราฟ"
                    >
                      <Maximize className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[400px] w-full">
                  {categoryBreakdownData.expensePieData.length > 0 ? (
                    <ChartContainer config={chartConfig} className="h-full w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                          <ChartTooltip
                            content={<ChartTooltipContent
                              nameKey="name"
                              formatter={(value) => formatCurrency(value as number, !showAmounts)}
                            />}
                          />
                          <Pie
                            data={categoryBreakdownData.expensePieData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={60}
                            outerRadius={140}
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
                    <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
                      <div className="text-center space-y-3">
                        <Info className="h-12 w-12 mx-auto opacity-50" />
                        <div>
                          <p className="text-lg font-medium">ไม่มีข้อมูลรายจ่ายสำหรับปีนี้</p>
                          <p className="text-sm">ลองเพิ่มรายการธุรกรรมหรือเลือกปีอื่น</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Additional Insights */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-800 dark:text-slate-100">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  หมวดหมู่รายจ่ายสูงสุด
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  หมวดหมู่ที่คุณใช้จ่ายมากที่สุดในปีนี้
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {topExpenseCategory !== 'N/A' ? topExpenseCategory : 'ไม่มีข้อมูล'}
                </div>
                {topExpenseCategory !== 'N/A' && (
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    คุณใช้จ่ายไป {formatCurrency(
                      yearTransactions
                        .filter(t => t.type === 'expense' && t.category === topExpenseCategory)
                        .reduce((sum, t) => sum + t.amount, 0),
                      !showAmounts
                    )} ในหมวดหมู่นี้
                  </p>
                )}
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">
                    รายจ่าย 5 อันดับแรก
                  </h4>
                  <div className="space-y-3">
                    {Object.entries(
                      yearTransactions
                        .filter(t => t.type === 'expense')
                        .reduce((acc, t) => {
                          acc[t.category] = (acc[t.category] || 0) + t.amount;
                          return acc;
                        }, {} as Record<string, number>)
                    )
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([category, amount], index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          {category}
                        </span>
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {formatCurrency(amount, !showAmounts)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-800 dark:text-slate-100">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-600">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  ค่าใช้จ่ายเฉลี่ยรายวัน
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  ประมาณการค่าใช้จ่ายในแต่ละวันของคุณ
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                  {formatCurrency(dailyAvgExpense, !showAmounts)}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  อิงจากรายจ่ายรวมในปี {parseInt(selectedYear) + 543}
                </p>
                <div className="p-4 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-700 dark:to-slate-600 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        รายจ่ายรวม
                      </p>
                      <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        {formatCurrency(totalExpense, !showAmounts)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        จำนวนวัน
                      </p>
                      <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        {new Date(parseInt(selectedYear), 1, 29).getDate() === 29 ? 366 : 365} วัน
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </main>
      </div>

      {/* Chart Modal (Dialog for Desktop, Drawer for Mobile) */}
      <ChartModal
        isOpen={isChartModalOpen}
        onClose={() => setIsChartModalOpen(false)}
        title={modalChartTitle}
        description={modalChartDescription}
      >
        <ChartContainer config={modalChartConfig} className="h-full w-full max-w-full">
          <ResponsiveContainer width="100%" height="100%">
            {modalChartType === 'bar' ? (
              <BarChart data={modalChartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} tick={{ fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} tick={{ fill: '#64748b' }} tickFormatter={(value) => showAmounts ? `฿${Number(value) / 1000}k` : '฿***'} />
                <ChartTooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} content={<ChartTooltipContent formatter={(value, name) => [`${formatCurrency(value as number, !showAmounts)}`, chartConfig[name as keyof typeof chartConfig]?.label || name]} />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" formatter={(value) => formatCurrency(value as number, !showAmounts)} />} />
                <Pie data={modalChartData} dataKey="value" nameKey="name" innerRadius="30%" outerRadius="80%" paddingAngle={2} animationDuration={500} stroke="none">
                  {modalChartData.map((entry, index) => (
                    <Cell key={`modal-cell-expense-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            )}
          </ResponsiveContainer>
        </ChartContainer>
      </ChartModal>
      {/* PDF Export Modal */}
      <PDFExport
        isOpen={isPDFExportModalOpen}
        onClose={() => setIsPDFExportModalOpen(false)}
      />
    </div>
  );
};

export default Dashboard;