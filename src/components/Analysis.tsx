// src/components/Analysis.tsx

import React, { useState, useMemo } from 'react';
import { useSupabaseFinance } from '../context/SupabaseFinanceContext';
import { 
  Bar, BarChart, Line, LineChart, Pie, PieChart, Area, AreaChart,
  CartesianGrid, XAxis, YAxis, Cell, ResponsiveContainer, Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge }
from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, TrendingDown, Activity, Calendar as CalendarIcon, Target, // CalendarIcon added for consistency
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
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // 'YYYY-MM' format
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
    return `฿${amount.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`;
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
      const d = subMonths(today, i); // Use subMonths for accurate historical months
      const key = d.toISOString().slice(0, 7); // 'YYYY-MM'
      data[key] = { month: format(d, 'MMM yy', { locale: th }), income: 0, expense: 0, net: 0 }; // Format month label
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
        fill: `hsl(${(index * 30 + 10) % 360}, 70%, 50%)`, // Dynamic color generation
      }))
      .sort((a, b) => b.value - a.value); // Sort by value descending

    return { income, expense, net, transactionCount: monthTx.length, categoryChartData };
  }, [transactions, selectedMonth]);
  
  const globalStats = useMemo(() => {
      const totalIncome = twelveMonthTrend.reduce((s, d) => s + d.income, 0);
      const totalExpense = twelveMonthTrend.reduce((s, d) => s + d.expense, 0);
      const avgIncome = totalIncome / twelveMonthTrend.length; // Average over actual available months
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
  
      // Max 30 points for expense control (lower ratio means better control)
      const netRatio = globalStats.totalIncome > 0 ? globalStats.totalExpense / globalStats.totalIncome : 1;
      if (netRatio < 0.8) score += 30;
      else if (netRatio < 1) score += 15;
  
      // Max 20 points for transaction consistency/activity (more transactions suggest better tracking)
      // Base consistency on total number of transactions over the 12-month period
      const totalTransactionsInPeriod = transactions.filter(t => {
          const tDate = new Date(t.date);
          const earliestDate = subMonths(new Date(), 12);
          return tDate >= earliestDate;
      }).length;
      const consistencyScore = totalTransactionsInPeriod / 5; // Arbitrary scaling factor, adjust as needed
      if (consistencyScore > 30) score += 20;
      else if (consistencyScore > 15) score += 10;
  
      // Max 10 points for expense category diversification (diversified spending might indicate balanced lifestyle)
      const expenseCatCount = new Set(transactions.filter(t=>t.type === 'expense').map(t=>t.category)).size;
      if(expenseCatCount > 5) score += 10;

      score = Math.min(100, score); // Cap score at 100
  
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
    income: { label: "รายรับ", color: "hsl(142.1 76.2% 41%)" }, // Green
    expense: { label: "รายจ่าย", color: "hsl(0 72.2% 50.6%)" }, // Red
    net: { label: "สุทธิ", color: "hsl(221.2 83.2% 53.3%)" }, // Blue
    // Dynamically add colors for expense categories from the data itself
    ...monthlyAnalysis.categoryChartData.reduce((acc, cur) => ({...acc, [cur.name]: {label: cur.name, color: cur.fill}}), {})
  }), [monthlyAnalysis.categoryChartData]) as ChartConfig; // Cast to ChartConfig

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
    <div className="space-y-6 p-4 md:p-8 max-w-screen-2xl mx-auto">
      <header className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
        <div className="space-y-2"><Skeleton className="h-9 w-72" /><Skeleton className="h-5 w-96" /></div>
        <div className="flex gap-2 w-full lg:w-auto"><Skeleton className="h-10 w-full lg:w-48" /><Skeleton className="h-10 w-10" /><Skeleton className="h-10 w-full lg:w-32" /></div>
      </header>
      <main className="grid grid-cols-12 gap-6">
        <section className="col-span-12 lg:col-span-9 space-y-6">
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6"><Skeleton className="h-[400px]" /><Skeleton className="h-[400px]" /></div>
        </section>
        <aside className="col-span-12 lg:col-span-3 space-y-6"><Skeleton className="h-64" /><Skeleton className="h-48" /></aside>
      </main>
    </div>
  );

  const StatCard = ({ title, value, icon: Icon, trend, color, description }: { title: string; value: string | number; icon: React.ElementType; trend?: number; color: string; description?: string; }) => (
    <Card className="flex flex-col h-full hover:shadow-lg transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-5 w-5 ${color}`} />
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-end">
        <div className="text-3xl font-bold text-foreground mb-1">{typeof value === 'number' ? formatCurrency(value, !showAmounts) : value}</div>
        {description && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {trend !== undefined && (trend > 0 ? <ArrowUpRight className="h-4 w-4 text-green-500" /> : <ArrowDownRight className="h-4 w-4 text-red-500" />)}
            {description}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-screen-2xl mx-auto">
      <header className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
        <div><h1 className="text-3xl font-bold tracking-tight">การวิเคราะห์ขั้นสูง</h1><p className="text-muted-foreground mt-1">ภาพรวมและแนวโน้มทางการเงินเพื่อการตัดสินใจที่แม่นยำ</p></div>
        <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap"> {/* Added flex-wrap */}
          {/* Month/Year Picker using Popover with Selects */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex-1 lg:flex-initial w-full lg:w-48 justify-between pr-3">
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

          <Button variant="outline" size="icon" onClick={() => setShowAmounts(!showAmounts)} aria-label={showAmounts ? "ซ่อนจำนวนเงิน" : "แสดงจำนวนเงิน"}>
            {showAmounts ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className="sr-only">{showAmounts ? "ซ่อนจำนวนเงิน" : "แสดงจำนวนเงิน"}</span>
          </Button>
          <PDFExport /> {/* PDF Export button component */}
        </div>
      </header>
      
      <main className="grid grid-cols-12 gap-6">
        <section className="col-span-12 lg:col-span-9 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3"><TabsTrigger value="overview">ภาพรวมเดือน</TabsTrigger><TabsTrigger value="trends">แนวโน้ม 12 เดือน</TabsTrigger><TabsTrigger value="breakdown">เปรียบเทียบหมวดหมู่</TabsTrigger></TabsList>
            <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <TabsContent value="overview" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard title="รายรับเดือนนี้" value={monthlyAnalysis.income} icon={TrendingUp} color="text-green-500" description="จากรายการทั้งหมด" />
                  <StatCard title="รายจ่ายเดือนนี้" value={monthlyAnalysis.expense} icon={TrendingDown} color="text-red-500" description={`${monthlyAnalysis.transactionCount} รายการ`} />
                  <StatCard title="คงเหลือสุทธิ" value={monthlyAnalysis.net} icon={Wallet} color={monthlyAnalysis.net >= 0 ? "text-blue-500" : "text-orange-500"} description={monthlyAnalysis.net >= 0 ? "เป็นบวก" : "ติดลบ"} />
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
                  <Card>
                    <CardHeader className="flex-row justify-between items-center">
                      <div>
                        <CardTitle>การกระจายรายจ่าย</CardTitle>
                        <CardDescription>สัดส่วนรายจ่ายในเดือน {format(new Date(selectedMonth + '-01'), 'MMMMyyyy', {locale: th})}</CardDescription>
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
                          className="flex-shrink-0"
                          aria-label="ขยายกราฟ"
                        >
                          <Maximize className="h-5 w-5" />
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent>
                      {monthlyAnalysis.categoryChartData.length > 0 ? (
                      <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                          <ChartTooltip content={<ChartTooltipContent nameKey="name" formatter={(value) => formatCurrency(value as number, !showAmounts)} />} />
                          <Pie data={monthlyAnalysis.categoryChartData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={80} paddingAngle={2} animationDuration={500} stroke="none"/>
                          <ChartLegend content={<ChartLegendContent />} />
                        </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                      ) : (<div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground"><Info className="h-8 w-8 mx-auto mb-2" /><p>ไม่มีข้อมูลรายจ่ายสำหรับเดือนนี้</p></div>)}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>รายจ่ายสูงสุด</CardTitle>
                      <CardDescription>5 อันดับแรกของเดือนนี้</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {monthlyAnalysis.categoryChartData.slice(0, 5).map(cat => (
                        <div key={cat.name} className="space-y-1">
                          <div className="flex justify-between text-sm font-medium"><span>{cat.name}</span><span>{formatCurrency(cat.value, !showAmounts)}</span></div>
                          <Progress value={(cat.value / monthlyAnalysis.expense) * 100} style={{'--progress-color': cat.fill} as React.CSSProperties} className="h-2 [&>div]:bg-[--progress-color]" />
                        </div>
                      ))}
                      {monthlyAnalysis.categoryChartData.length === 0 && (
                        <div className="text-muted-foreground text-center p-4">
                           <Info className="h-8 w-8 mx-auto mb-2" />
                           <p>ไม่มีข้อมูลรายจ่าย</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="trends" className="mt-4">
                <Card>
                  <CardHeader className="flex-row justify-between items-center">
                    <div>
                      <CardTitle>แนวโน้มรายรับ-รายจ่าย 12 เดือน</CardTitle>
                      <CardDescription>แสดงการเปลี่ยนแปลงรายรับและรายจ่ายในช่วง 12 เดือนที่ผ่านมา</CardDescription>
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
                        className="flex-shrink-0"
                        aria-label="ขยายกราฟ"
                      >
                        <Maximize className="h-5 w-5" />
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    {twelveMonthTrend.some(d => d.income > 0 || d.expense > 0) ? (
                    <ChartContainer config={chartConfig} className="h-[400px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={twelveMonthTrend} margin={{ top: 20, right: 20, bottom: 5, left: -10 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                        <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => showAmounts ? `฿${Number(v)/1000}k` : '฿***'} />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(value, name) => [formatCurrency(value as number, !showAmounts), chartConfig[name as keyof typeof chartConfig]?.label]}/>} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                    ) : (
                      <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground">
                         <Info className="h-8 w-8 mx-auto mb-2" />
                         <p>ไม่มีข้อมูลสำหรับแนวโน้ม 12 เดือน</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="breakdown" className="mt-4">
                <Card>
                  <CardHeader className="flex-row justify-between items-center">
                    <div>
                      <CardTitle>เปรียบเทียบรายจ่ายแต่ละหมวดหมู่</CardTitle>
                      <CardDescription>แสดงรายจ่ายรายเดือนแยกตามหมวดหมู่</CardDescription>
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
                        className="flex-shrink-0"
                        aria-label="ขยายกราฟ"
                      >
                        <Maximize className="h-5 w-5" />
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                     {monthlyAnalysis.categoryChartData.length > 0 ? (
                     <ChartContainer config={chartConfig} className="h-[400px] w-full">
                         <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={monthlyAnalysis.categoryChartData} layout="vertical" margin={{left: 30}}>
                             <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                             <XAxis type="number" hide />
                             <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={10} width={120} />
                             <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(value, name) => [formatCurrency(value as number, !showAmounts), chartConfig[name as keyof typeof chartConfig]?.label]} />} />
                             <Bar dataKey="value" layout="vertical" radius={4}>
                                 {monthlyAnalysis.categoryChartData.map((entry) => (<Cell key={entry.name} fill={entry.fill} />))}
                             </Bar>
                         </BarChart>
                         </ResponsiveContainer>
                     </ChartContainer>
                     ) : (
                       <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground">
                         <Info className="h-8 w-8 mx-auto mb-2" />
                         <p>ไม่มีข้อมูลรายจ่ายสำหรับหมวดหมู่นี้</p>
                       </div>
                     )}
                  </CardContent>
                </Card>
              </TabsContent>
            </motion.div>
            </AnimatePresence>
          </Tabs>
        </section>

        <aside className="col-span-12 lg:col-span-3 space-y-6">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShieldCheck/> สุขภาพการเงิน</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
                <div className="relative h-32 w-32 mx-auto">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                        <path className="stroke-current text-gray-200 dark:text-gray-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="3"></path>
                        <path className={`stroke-current ${financialHealthScore.color}`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="3" strokeDasharray={`${financialHealthScore.score}, 100`}></path>
                    </svg>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <span className={`text-3xl font-bold ${financialHealthScore.color}`}>{financialHealthScore.score}</span>
                        <span className="text-sm text-muted-foreground">/100</span>
                    </div>
                </div>
                <p className={`mt-3 font-semibold text-lg ${financialHealthScore.color}`}>{financialHealthScore.label}</p>
                <p className="text-sm text-muted-foreground mt-1">อิงจากข้อมูล 12 เดือนล่าสุด</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><HeartPulse/> ข้อมูลเชิงลึก</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {insights.map((insight, index) => {
                  const colors = { success: "bg-green-500/10 border-green-500/20 text-green-700", warning: "bg-yellow-500/10 border-yellow-500/20 text-yellow-700", error: "bg-red-500/10 border-red-500/20 text-red-700", info: "bg-blue-500/10 border-blue-500/20 text-blue-700"};
                  return (
                    <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: index * 0.1 }}>
                        <Alert className={`flex items-start gap-3 p-3 ${colors[insight.type]}`}>
                            <insight.icon className="h-5 w-5 mt-0.5"/>
                            <div>
                                <AlertTitle className="text-sm font-semibold">{insight.title}</AlertTitle>
                                <AlertDescription className="text-xs">{insight.description}</AlertDescription>
                            </div>
                        </Alert>
                    </motion.div>
                  );
              })}
            </CardContent>
          </Card>
        </aside>
      </main>

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
                        <Pie data={modalChartData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={80} paddingAngle={2} animationDuration={500} stroke="none"/>
                        <ChartLegend content={<ChartLegendContent />} />
                      </PieChart>
                    )}
                    {modalChartType === 'verticalBar' && (
                       <BarChart data={modalChartData} layout="vertical" margin={{left: 30}}>
                           <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                           <XAxis type="number" hide />
                           <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={10} width={120} />
                           <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(value, name) => [formatCurrency(value as number, !showAmounts), modalChartConfig[name as keyof typeof modalChartConfig]?.label]} />} />
                           <Bar dataKey="value" layout="vertical" radius={4}>
                               {modalChartData.map((entry) => (<Cell key={entry.name} fill={entry.fill} />))}
                           </Bar>
                       </BarChart>
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
                    {modalChartType === 'verticalBar' && (
                       <BarChart data={modalChartData} layout="vertical" margin={{left: 30}}>
                           <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                           <XAxis type="number" hide />
                           <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={10} width={120} />
                           <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(value, name) => [formatCurrency(value as number, !showAmounts), modalChartConfig[name as keyof typeof modalChartConfig]?.label]} />} />
                           <Bar dataKey="value" layout="vertical" radius={4}>
                               {modalChartData.map((entry) => (<Cell key={entry.name} fill={entry.fill} />))}
                           </Bar>
                       </BarChart>
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

const AnalysisSkeleton = () => (
  <div className="space-y-6 p-4 md:p-8 max-w-screen-2xl mx-auto">
    <header className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
      <div className="space-y-2"><Skeleton className="h-9 w-72" /><Skeleton className="h-5 w-96" /></div>
      <div className="flex gap-2 w-full lg:w-auto"><Skeleton className="h-10 w-full lg:w-48" /><Skeleton className="h-10 w-10" /><Skeleton className="h-10 w-full lg:w-32" /></div>
    </header>
    <main className="grid grid-cols-12 gap-6">
      <section className="col-span-12 lg:col-span-9 space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6"><Skeleton className="h-[400px]" /><Skeleton className="h-[400px]" /></div>
      </section>
      <aside className="col-span-12 lg:col-span-3 space-y-6"><Skeleton className="h-64" /><Skeleton className="h-48" /></aside>
    </main>
  </div>
);

export default Analysis;