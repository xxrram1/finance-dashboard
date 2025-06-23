// src/components/Analysis.tsx

import React, { useState, useMemo } from 'react';
import ChartModal from './ui/ChartModal';
import { useSupabaseFinance } from '../context/SupabaseFinanceContext';
import { 
  Bar, BarChart, Line, LineChart, Pie, PieChart, Area, AreaChart,
  CartesianGrid, XAxis, YAxis, Cell, ResponsiveContainer, Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, TrendingDown, Activity, Calendar as CalendarIcon, Target,
  AlertCircle, CheckCircle, XCircle, ArrowUpRight, ArrowDownRight,
  BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon,
  Filter, Download, Zap, Eye, EyeOff, RefreshCw, Info, Users,
  DollarSign, Wallet, CreditCard, Calculator, AlertTriangle, ShieldCheck, HeartPulse, ChevronDown, Maximize
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AnimatePresence, motion } from 'framer-motion';
import PDFExport from './PDFExport'; 
import { format, subMonths } from 'date-fns'; 
import { th } from 'date-fns/locale'; 
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { useIsMobile } from '@/hooks/use-mobile';

const Analysis = () => {
  const { transactions, budgets, loading } = useSupabaseFinance();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showAmounts, setShowAmounts] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const isMobile = useIsMobile();

  // State for chart modal
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [modalChartData, setModalChartData] = useState<any[]>([]);
  const [modalChartConfig, setModalChartConfig] = useState<ChartConfig>({});
  const [modalChartType, setModalChartType] = useState<'bar' | 'pie' | 'verticalBar' | 'area'>('bar');
  const [modalChartTitle, setModalChartTitle] = useState('');
  const [modalChartDescription, setModalChartDescription] = useState('');

 const formatCurrency = (amount: number, hideAmount = false) => {
  if (hideAmount) return '฿***,***';
  return `฿${amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
  
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = -5; i <= 5; i++) { 
      years.push(currentYear + i);
    }
    return years.sort((a, b) => b - a); 
  }, []);

  const availableMonths = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: (i + 1).toString().padStart(2, '0'),
      label: format(new Date(2000, i, 1), 'MMMM', { locale: th }) 
    }));
  }, []);

  const handleMonthYearChange = (type: 'month' | 'year', value: string) => {
    const currentDateObj = new Date(selectedMonth + '-01'); 
    let newDateObj = currentDateObj;

    if (type === 'month') {
      newDateObj.setMonth(parseInt(value, 10) - 1); 
    } else { 
      newDateObj.setFullYear(parseInt(value, 10));
    }
    setSelectedMonth(format(newDateObj, 'yyyy-MM')); 
  };

  const twelveMonthTrend = useMemo(() => {
    const data: { [key: string]: { month: string, income: number, expense: number, net: number } } = {};
    const today = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = subMonths(today, i);
      const key = d.toISOString().slice(0, 7);
      data[key] = { month: format(d, 'MMM yy', { locale: th }), income: 0, expense: 0, net: 0 };
    }
    transactions.forEach(t => {
      const key = t.date.slice(0, 7);
      if (data[key]) {
        if (t.type === 'income') data[key].income += t.amount;
        else data[key].expense += t.amount;
        data[key].net = data[key].income - data[key].expense;
      }
    });
    return Object.values(data);
  }, [transactions]);

  const monthlyAnalysis = useMemo(() => {
    const monthTx = transactions.filter(t => t.date.startsWith(selectedMonth));
    const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const net = income - expense;
    
    const expenseByCategory = monthTx.filter(t => t.type === 'expense').reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    const categoryChartData = Object.entries(expenseByCategory)
      .map(([category, value], index) => ({
        name: category,
        value,
        fill: `hsl(${(index * 40 + 200) % 360}, 70%, 60%)`, // Adjusted color palette for better distinction
      }))
      .sort((a, b) => b.value - a.value);

    return { income, expense, net, transactionCount: monthTx.length, categoryChartData };
  }, [transactions, selectedMonth]);
  
  const globalStats = useMemo(() => {
      const totalIncome = twelveMonthTrend.reduce((s, d) => s + d.income, 0);
      const totalExpense = twelveMonthTrend.reduce((s, d) => s + d.expense, 0);
      const avgIncome = totalIncome / twelveMonthTrend.length;
      const avgExpense = totalExpense / twelveMonthTrend.length;
      const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
      return { totalIncome, totalExpense, avgIncome, avgExpense, savingsRate };
  }, [twelveMonthTrend]);

  const financialHealthScore = useMemo(() => {
      let score = 0;
      // Max 40 points for savings rate
      if (globalStats.savingsRate >= 20) score += 40;
      else if (globalStats.savingsRate >= 10) score += 20;
      else if (globalStats.savingsRate > 0) score += 10;
  
      // Max 30 points for expense control
      const netRatio = globalStats.totalIncome > 0 ? globalStats.totalExpense / globalStats.totalIncome : 1;
      if (netRatio < 0.8) score += 30;
      else if (netRatio < 1) score += 15;
  
      // Max 20 points for transaction consistency/activity
      const totalTransactionsInPeriod = transactions.filter(t => {
          const tDate = new Date(t.date);
          const earliestDate = subMonths(new Date(), 12);
          return tDate >= earliestDate;
      }).length;
      const consistencyScore = totalTransactionsInPeriod / 5;
      if (consistencyScore > 30) score += 20;
      else if (consistencyScore > 15) score += 10;
  
      // Max 10 points for expense category diversification
      const expenseCatCount = new Set(transactions.filter(t=>t.type === 'expense').map(t=>t.category)).size;
      if(expenseCatCount > 5) score += 10;

      score = Math.min(100, score);
  
      const scoreData = {
          score,
          label: score >= 80 ? 'ดีเยี่ยม' : score >= 60 ? 'ดี' : score >= 40 ? 'พอใช้' : 'ต้องปรับปรุง',
          color: score >= 80 ? 'text-green-500' : score >= 60 ? 'text-blue-500' : score >= 40 ? 'text-yellow-500' : 'text-red-500',
      };
      return scoreData;
  }, [globalStats, transactions]);
  
  // Generate insights/recommendations based on financial data
  const insights = useMemo(() => {
    const list = [];
    if (monthlyAnalysis.net < 0) list.push({ type: 'error', title: 'รายจ่ายเกินรายรับ', description: `เดือนนี้ใช้จ่ายเกินมา ${formatCurrency(Math.abs(monthlyAnalysis.net), !showAmounts)}`, icon: AlertTriangle });
    if (globalStats.savingsRate < 10 && globalStats.totalIncome > 0) list.push({ type: 'warning', title: 'อัตราการออมต่ำ', description: `ควรปรับปรุงการออม ปัจจุบันอยู่ที่ ${globalStats.savingsRate.toFixed(1)}%`, icon: XCircle });
    if (monthlyAnalysis.categoryChartData.length > 0) {
        const topCatPercentage = (monthlyAnalysis.categoryChartData[0].value / monthlyAnalysis.expense) * 100;
        if(topCatPercentage > 40 && monthlyAnalysis.expense > 0) list.push({ type: 'info', title: 'รายจ่ายกระจุกตัว', description: `หมวด "${monthlyAnalysis.categoryChartData[0].name}" มีสัดส่วนถึง ${topCatPercentage.toFixed(0)}% ของรายจ่าย`, icon: Info });
    }
    if(list.length === 0) list.push({ type: 'success', title: 'การเงินมีวินัย', description: 'ยอดเยี่ยม! รักษาวินัยการเงินที่ดีนี้ต่อไป', icon: CheckCircle });
    return list;
  }, [monthlyAnalysis, globalStats, showAmounts]);

  // Chart configuration for Recharts components
  const chartConfig = useMemo(() => ({
    income: { label: "รายรับ", color: "hsl(142.1 76.2% 41%)" },
    expense: { label: "รายจ่าย", color: "hsl(0 72.2% 50.6%)" },
    net: { label: "สุทธิ", color: "hsl(221.2 83.2% 53.3%)" },
    ...monthlyAnalysis.categoryChartData.reduce((acc, cur) => ({...acc, [cur.name]: {label: cur.name, color: cur.fill}}), {})
  }), [monthlyAnalysis.categoryChartData]) as ChartConfig;

  // Function to open chart modal
  const openChartModal = (data: any[], config: ChartConfig, type: 'bar' | 'pie' | 'verticalBar' | 'area', title: string, description: string) => {
    setModalChartData(data);
    setModalChartConfig(config);
    setModalChartType(type);
    setModalChartTitle(title);
    setModalChartDescription(description);
    setIsChartModalOpen(true);
  };

  // Skeleton loader for Analysis page
  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-900 dark:to-slate-800">
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
        <main className="grid grid-cols-12 gap-6">
          <section className="col-span-12 lg:col-span-9 space-y-6">
            <Skeleton className="h-12 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Skeleton className="h-[480px]" />
              <Skeleton className="h-[480px]" />
            </div>
          </section>
          <aside className="col-span-12 lg:col-span-3 space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-80" />
          </aside>
        </main>
      </div>
    </div>
  );

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    color, 
    description,
    className = ""
  }: { 
    title: string; 
    value: string | number; 
    icon: React.ElementType; 
    trend?: number; 
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
            {typeof value === 'number' ? formatCurrency(value, !showAmounts) : value}
          </div>
          {description && (
            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {trend !== undefined && (
                trend > 0 ? 
                  <ArrowUpRight className="h-4 w-4 text-green-500" /> : 
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
              )}
              {description}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl xl:text-4xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                การวิเคราะห์ขั้นสูง
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-base xl:text-lg">
                ภาพรวมและแนวโน้มทางการเงินเพื่อการตัดสินใจที่แม่นยำ
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="min-w-48 justify-between bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span>{format(new Date(selectedMonth + '-01'), 'MMMMyyyy', { locale: th })}</span>
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                  <div className="flex gap-2">
                    <Select
                      value={selectedMonth.slice(5, 7)}
                      onValueChange={(value) => handleMonthYearChange('month', value)}
                    >
                      <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {availableMonths.map(month => (
                          <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={selectedMonth.slice(0, 4)}
                      onValueChange={(value) => handleMonthYearChange('year', value)}
                    >
                      <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {availableYears.map(year => (
                          <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </PopoverContent>
              </Popover>

              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setShowAmounts(!showAmounts)} 
                aria-label={showAmounts ? "ซ่อนจำนวนเงิน" : "แสดงจำนวนเงิน"}
                className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800"
              >
                {showAmounts ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <PDFExport />
            </div>
          </div>
        </header>
        
        <main className="grid grid-cols-12 gap-6">
          <section className="col-span-12 lg:col-span-9 space-y-6">
            <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-slate-100/50 dark:bg-slate-700/50">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
                      ภาพรวมเดือน
                    </TabsTrigger>
                    <TabsTrigger value="trends" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
                      แนวโน้ม 12 เดือน
                    </TabsTrigger>
                    <TabsTrigger value="breakdown" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
                      เปรียบเทียบหมวดหมู่
                    </TabsTrigger>
                  </TabsList>
                  
                  <div className="p-6">
                    <AnimatePresence mode="wait">
                      <motion.div 
                        key={activeTab} 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -10 }} 
                        transition={{ duration: 0.2 }}
                      >
                        <TabsContent value="overview" className="mt-0 space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard 
                              title="รายรับเดือนนี้" 
                              value={monthlyAnalysis.income} 
                              icon={TrendingUp} 
                              color="from-green-500 to-emerald-600" 
                              description="จากรายการทั้งหมด" 
                            />
                            <StatCard 
                              title="รายจ่ายเดือนนี้" 
                              value={monthlyAnalysis.expense} 
                              icon={TrendingDown} 
                              color="from-red-500 to-rose-600" 
                              description={`${monthlyAnalysis.transactionCount} รายการ`} 
                            />
                            <StatCard 
                              title="คงเหลือสุทธิ" 
                              value={monthlyAnalysis.net} 
                              icon={Wallet} 
                              color={monthlyAnalysis.net >= 0 ? "from-blue-500 to-cyan-600" : "from-orange-500 to-amber-600"} 
                              description={monthlyAnalysis.net >= 0 ? "เป็นบวก" : "ติดลบ"} 
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {/* Expense Distribution Chart */}
                            <Card className="border-0 shadow-lg bg-slate-50/50 dark:bg-slate-700/50">
                              <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                  <div className="space-y-2">
                                    <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
                                      การกระจายรายจ่าย
                                    </CardTitle>
                                    <CardDescription className="text-slate-600 dark:text-slate-300">
                                      สัดส่วนรายจ่ายในเดือน {format(new Date(selectedMonth + '-01'), 'MMMMyyyy', {locale: th})}
                                    </CardDescription>
                                  </div>
                                  {monthlyAnalysis.categoryChartData.length > 0 && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => openChartModal(
                                        monthlyAnalysis.categoryChartData,
                                        chartConfig,
                                        'pie',
                                        'การกระจายรายจ่าย',
                                        `สัดส่วนรายจ่ายในเดือน ${format(new Date(selectedMonth + '-01'), 'MMMMyyyy', {locale: th})}`
                                      )}
                                      className="flex-shrink-0 hover:bg-slate-100 dark:hover:bg-slate-600"
                                      aria-label="ขยายกราฟ"
                                    >
                                      <Maximize className="h-5 w-5" />
                                    </Button>
                                  )}
                                </div>
                              </CardHeader>
                              <CardContent className="pt-0">
                                <div className="h-[350px] w-full">
                                  {monthlyAnalysis.categoryChartData.length > 0 ? (
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
                                            data={monthlyAnalysis.categoryChartData} 
                                            dataKey="value" 
                                            nameKey="name" 
                                            innerRadius={60} 
                                            outerRadius={100} 
                                            paddingAngle={2} 
                                            animationDuration={500} 
                                            stroke="none"
                                          >
                                            {monthlyAnalysis.categoryChartData.map((entry, index) => (
                                              <Cell key={`cell-${index}`} fill={entry.fill} />
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
                                          <p className="text-lg font-medium">ไม่มีข้อมูลรายจ่ายสำหรับเดือนนี้</p>
                                          <p className="text-sm">ลองเพิ่มรายการธุรกรรมหรือเลือกเดือนอื่น</p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>

                            {/* Top Expenses */}
                            <Card className="border-0 shadow-lg bg-slate-50/50 dark:bg-slate-700/50">
                              <CardHeader className="pb-4">
                                <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
                                  รายจ่ายสูงสุด
                                </CardTitle>
                                <CardDescription className="text-slate-600 dark:text-slate-300">
                                  5 อันดับแรกของเดือนนี้
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                {monthlyAnalysis.categoryChartData.slice(0, 5).map((cat, index) => (
                                  <motion.div 
                                    key={cat.name}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                    className="space-y-2"
                                  >
                                    <div className="flex justify-between text-sm font-medium text-slate-700 dark:text-slate-200">
                                      <span>{cat.name}</span>
                                      <span>{formatCurrency(cat.value, !showAmounts)}</span>
                                    </div>
                                    <Progress 
                                      value={(cat.value / monthlyAnalysis.expense) * 100} 
                                      style={{'--progress-color': cat.fill} as React.CSSProperties} 
                                      className="h-2 [&>div]:bg-[--progress-color]" 
                                    />
                                  </motion.div>
                                ))}
                                {monthlyAnalysis.categoryChartData.length === 0 && (
                                  <div className="h-[200px] flex items-center justify-center text-slate-500 dark:text-slate-400">
                                    <div className="text-center space-y-3">
                                      <Info className="h-8 w-8 mx-auto opacity-50" />
                                      <p className="text-sm">ไม่มีข้อมูลรายจ่าย</p>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                        </TabsContent>

                        <TabsContent value="trends" className="mt-0">
                          <Card className="border-0 shadow-lg bg-slate-50/50 dark:bg-slate-700/50">
                            <CardHeader className="pb-4">
                              <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                  <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
                                    แนวโน้มรายรับ-รายจ่าย 12 เดือน
                                  </CardTitle>
                                  <CardDescription className="text-slate-600 dark:text-slate-300">
                                    แสดงการเปลี่ยนแปลงรายรับและรายจ่ายในช่วง 12 เดือนที่ผ่านมา
                                  </CardDescription>
                                </div>
                                {twelveMonthTrend.some(d => d.income > 0 || d.expense > 0) && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openChartModal(
                                      twelveMonthTrend,
                                      chartConfig,
                                      'bar',
                                      'แนวโน้มรายรับ-รายจ่าย 12 เดือน',
                                      'แสดงการเปลี่ยนแปลงรายรับและรายจ่ายในช่วง 12 เดือนที่ผ่านมา'
                                    )}
                                    className="flex-shrink-0 hover:bg-slate-100 dark:hover:bg-slate-600"
                                    aria-label="ขยายกราฟ"
                                  >
                                    <Maximize className="h-5 w-5" />
                                  </Button>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="h-[450px] w-full">
                                {twelveMonthTrend.some(d => d.income > 0 || d.expense > 0) ? (
                                  <ChartContainer config={chartConfig} className="h-full w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <BarChart data={twelveMonthTrend} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
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
                                          tickFormatter={(v) => showAmounts ? `฿${Number(v)/1000}k` : '฿***'} 
                                        />
                                        <ChartTooltip 
                                          cursor={{ fill: 'rgba(0,0,0,0.1)' }}
                                          content={<ChartTooltipContent 
                                            formatter={(value, name) => [
                                              formatCurrency(value as number, !showAmounts), 
                                              chartConfig[name as keyof typeof chartConfig]?.label
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
                                        <p className="text-lg font-medium">ไม่มีข้อมูลสำหรับแนวโน้ม 12 เดือน</p>
                                        <p className="text-sm">ลองเพิ่มรายการธุรกรรมหรือเลือกช่วงเวลาอื่น</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </TabsContent>

                        <TabsContent value="breakdown" className="mt-0">
                          <Card className="border-0 shadow-lg bg-slate-50/50 dark:bg-slate-700/50">
                            <CardHeader className="pb-4">
                              <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                  <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
                                    เปรียบเทียบรายจ่ายแต่ละหมวดหมู่
                                  </CardTitle>
                                  <CardDescription className="text-slate-600 dark:text-slate-300">
                                    แสดงรายจ่ายรายเดือนแยกตามหมวดหมู่
                                  </CardDescription>
                                </div>
                                {monthlyAnalysis.categoryChartData.length > 0 && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openChartModal(
                                      monthlyAnalysis.categoryChartData,
                                      chartConfig,
                                      'verticalBar',
                                      'เปรียบเทียบรายจ่ายแต่ละหมวดหมู่',
                                      'แสดงรายจ่ายรายเดือนแยกตามหมวดหมู่'
                                    )}
                                    className="flex-shrink-0 hover:bg-slate-100 dark:hover:bg-slate-600"
                                    aria-label="ขยายกราฟ"
                                  >
                                    <Maximize className="h-5 w-5" />
                                  </Button>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="h-[450px] w-full">
                                {monthlyAnalysis.categoryChartData.length > 0 ? (
                                  <ChartContainer config={chartConfig} className="h-full w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <BarChart data={monthlyAnalysis.categoryChartData} layout="vertical" margin={{left: 30}}>
                                        <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis 
                                          type="number" 
                                          hide 
                                          tick={{ fill: '#64748b' }}
                                        />
                                        <YAxis 
                                          dataKey="name" 
                                          type="category" 
                                          tickLine={false} 
                                          axisLine={false} 
                                          tickMargin={10} 
                                          width={120}
                                          tick={{ fill: '#64748b', fontSize: 12 }}
                                        />
                                        <ChartTooltip 
                                          cursor={{ fill: 'rgba(0,0,0,0.1)' }}
                                          content={<ChartTooltipContent 
                                            formatter={(value, name) => [
                                              formatCurrency(value as number, !showAmounts), 
                                              chartConfig[name as keyof typeof chartConfig]?.label
                                            ]} 
                                          />} 
                                        />
                                        <Bar dataKey="value" layout="vertical" radius={4}>
                                          {monthlyAnalysis.categoryChartData.map((entry, index) => (
                                            <Cell key={`cell-breakdown-${index}`} fill={entry.fill} />
                                          ))}
                                        </Bar>
                                      </BarChart>
                                    </ResponsiveContainer>
                                  </ChartContainer>
                                ) : (
                                  <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
                                    <div className="text-center space-y-3">
                                      <Info className="h-12 w-12 mx-auto opacity-50" />
                                      <div>
                                        <p className="text-lg font-medium">ไม่มีข้อมูลรายจ่ายสำหรับหมวดหมู่นี้</p>
                                        <p className="text-sm">ลองเพิ่มรายการธุรกรรมหรือเลือกเดือนอื่น</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </TabsContent>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </section>

          <aside className="col-span-12 lg:col-span-3 space-y-6">
            {/* Financial Health Score */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-indigo-950/50 dark:to-purple-950/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-800 dark:text-slate-100">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600">
                    <ShieldCheck className="h-5 w-5 text-white" />
                  </div>
                  สุขภาพการเงิน
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="relative h-32 w-32 mx-auto">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path 
                      className="stroke-current text-slate-200 dark:text-slate-700" 
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                      fill="none" 
                      strokeWidth="3"
                    />
                    <path 
                      className={`stroke-current transition-all duration-1000 ${financialHealthScore.color}`} 
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                      fill="none" 
                      strokeWidth="3" 
                      strokeDasharray={`${financialHealthScore.score}, 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <motion.span 
                      className={`text-3xl font-bold ${financialHealthScore.color}`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      {financialHealthScore.score}
                    </motion.span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">/100</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className={`text-xl font-bold ${financialHealthScore.color}`}>
                    {financialHealthScore.label}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    อิงจากข้อมูล 12 เดือนล่าสุด
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                  <div className="text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      อัตราการออม
                    </p>
                    <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                      {globalStats.savingsRate.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      รายรับเฉลี่ย
                    </p>
                    <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                      {formatCurrency(globalStats.avgIncome, !showAmounts)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Insights */}
            <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-800 dark:text-slate-100">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-600">
                    <HeartPulse className="h-5 w-5 text-white" />
                  </div>
                  ข้อมูลเชิงลึก
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {insights.map((insight, index) => {
                  const colors = { 
                    success: "bg-green-50 border-green-200 text-green-800 dark:bg-green-950/50 dark:border-green-800 dark:text-green-200", 
                    warning: "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950/50 dark:border-yellow-800 dark:text-yellow-200", 
                    error: "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/50 dark:border-red-800 dark:text-red-200", 
                    info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-200"
                  };
                  return (
                    <motion.div 
                      key={index} 
                      initial={{ opacity: 0, x: -20 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Alert className={`flex items-start gap-3 p-4 border ${colors[insight.type]} rounded-lg`}>
                        <insight.icon className="h-5 w-5 mt-0.5 flex-shrink-0"/>
                        <div className="space-y-1">
                          <AlertTitle className="text-sm font-semibold leading-tight">
                            {insight.title}
                          </AlertTitle>
                          <AlertDescription className="text-xs leading-relaxed">
                            {insight.description}
                          </AlertDescription>
                        </div>
                      </Alert>
                    </motion.div>
                  );
                })}
              </CardContent>
            </Card>
          </aside>
        </main>
      </div>

      {/* Chart Modal (Dialog for Desktop, Drawer for Mobile) */}
     {/* REFACTORED: Use the new ChartModal component */}
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
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `฿${Number(v) / 1000}k`} />
          <ChartTooltip content={<ChartTooltipContent formatter={(value, name) => [formatCurrency(value as number), chartConfig[name as keyof typeof chartConfig]?.label]} />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
        </BarChart>
      ) : modalChartType === 'pie' ? (
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="name" formatter={(value) => formatCurrency(value as number)} />} />
          <Pie data={modalChartData} dataKey="value" nameKey="name" innerRadius="30%" outerRadius="80%" paddingAngle={2}>
            {modalChartData.map((entry, index) => (<Cell key={`modal-cell-pie-${index}`} fill={entry.fill} />))}
          </Pie>
          <ChartLegend content={<ChartLegendContent />} />
        </PieChart>
      ) : ( // verticalBar
        <BarChart data={modalChartData} layout="vertical" margin={{ left: 50, right: 30, top: 20, bottom: 20 }}>
          <CartesianGrid horizontal={false} strokeDasharray="3 3" />
          <XAxis type="number" hide />
          <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={10} width={120} fontSize={12} />
          <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />} />
          <Bar dataKey="value" layout="vertical" radius={4}>
            {modalChartData.map((entry) => (<Cell key={`modal-cell-vbar-${entry.name}`} fill={entry.fill} />))}
          </Bar>
        </BarChart>
      )}
    </ResponsiveContainer>
  </ChartContainer>
</ChartModal>
    </div>
  );
};

export default Analysis;