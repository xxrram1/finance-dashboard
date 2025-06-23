// src/components/Budget.tsx

import React, { useState, useMemo, useCallback } from 'react';
import { useSupabaseFinance } from '../context/SupabaseFinanceContext';
import {
  Plus, Target, Trash2, CheckCircle, AlertTriangle, XCircle, Wallet,
  TrendingDown, TrendingUp, Copy, HelpCircle, Info, Utensils, Car,
  Smile, GraduationCap, ShoppingBag, Home, Heart, BookOpen,
  DollarSign as DollarIcon, Calendar as CalendarIcon, ChevronDown,
  BarChart2, Zap, RefreshCw, Download, FileText
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, subMonths } from 'date-fns';
import { th } from 'date-fns/locale';
import { MonthYearPicker } from '@/components/ui/month-year-picker';
import { Alert } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';

// For image export (html2canvas must be loaded via CDN in public/index.html or similar)
declare const html2canvas: any;

// --- Helper Function ---
const formatCurrency = (amount: number) => `฿${amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// --- Constants & Mappings ---
const allCategories = ['อาหาร', 'การเดินทาง', 'ความบันเทิง', 'สาธารณูปโภค', 'สุขภาพ', 'ช็อปปิ้ง', 'ค่าเช่า/ผ่อน', 'การศึกษา', 'ค่าใช้จ่ายอื่นๆ'];

const categoryIcons: Record<string, React.ElementType> = {
  'อาหาร': Utensils,
  'การเดินทาง': Car,
  'ความบันเทิง': Smile,
  'สาธารณูปโภค': Zap,
  'สุขภาพ': Heart,
  'ช็อปปิ้ง': ShoppingBag,
  'ค่าเช่า/ผ่อน': Home,
  'การศึกษา': BookOpen,
  'ค่าใช้จ่ายอื่นๆ': Info,
};

// --- Sub-Components ---

// Budget Form Component with Suggestions
const BudgetForm = ({ onFinished, month, existingBudgets }: { onFinished: () => void; month: string, existingBudgets: { category: string, amount: number }[] }) => {
  const { addBudget, transactions } = useSupabaseFinance();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ category: '', amount: '' });

  const availableCategories = allCategories.filter(cat => !existingBudgets.some(b => b.category === cat));

  const suggestedAmount = useMemo(() => {
    if (!form.category) return null;
    const threeMonthsAgo = subMonths(new Date(), 3);
    const relevantTransactions = transactions.filter(t =>
      t.type === 'expense' &&
      t.category === form.category &&
      new Date(t.date) >= threeMonthsAgo
    );
    if (relevantTransactions.length === 0) return null;
    const total = relevantTransactions.reduce((sum, t) => sum + t.amount, 0);
    const monthsOfData = Math.min(3, new Set(relevantTransactions.map(t => t.date.slice(0, 7))).size);
    return parseFloat((total / (monthsOfData || 1)).toFixed(2));
  }, [form.category, transactions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category || !form.amount || parseFloat(form.amount) <= 0) {
      toast({ title: "ข้อมูลไม่ครบถ้วน", description: "กรุณากรอกข้อมูลหมวดหมู่และจำนวนเงินที่ถูกต้อง", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await addBudget({ ...form, amount: parseFloat(form.amount), month });
      toast({ title: "บันทึกสำเร็จ", description: `งบประมาณสำหรับ ${form.category} ถูกบันทึกแล้ว`, variant: "success" });
      onFinished();
    } catch (error) {
      console.error("Error adding budget:", error);
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถบันทึกงบประมาณได้", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
      <div className="space-y-2">
        <Label htmlFor="budget-month" className="text-base font-semibold text-slate-800 dark:text-slate-200">เดือน</Label>
        <Input
          id="budget-month"
          type="month"
          value={month}
          disabled
          className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 cursor-not-allowed text-slate-600 dark:text-slate-400 h-12 text-base"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="budget-category" className="text-base font-semibold text-slate-800 dark:text-slate-200">หมวดหมู่</Label>
        <Select value={form.category} onValueChange={(value) => setForm(p => ({ ...p, category: value, amount: '' }))}>
          <SelectTrigger id="budget-category" className={cn(
            "h-12 text-base transition-all duration-200 border-slate-300 dark:border-slate-600",
            form.category ? "border-primary text-primary-foreground font-medium bg-primary/10" : ""
          )}>
            <SelectValue placeholder="เลือกหมวดหมู่" />
          </SelectTrigger>
          <SelectContent className="max-h-60 overflow-y-auto">
            {availableCategories.length > 0 ? (
              availableCategories.map(cat =>
                <SelectItem key={cat} value={cat} className="text-base py-3">{cat}</SelectItem>
              )
            ) : (
              <SelectItem value="no-more-categories" disabled className="text-muted-foreground text-center italic text-sm">
                ทุกหมวดหมู่ถูกตั้งงบแล้ว
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="budget-amount" className="text-base font-semibold text-slate-800 dark:text-slate-200">งบประมาณ</Label>
        <div className="relative">
          <Input
            id="budget-amount"
            type="number"
            value={form.amount}
            onChange={(e) => setForm(p => ({ ...p, amount: e.target.value }))}
            placeholder="0.00"
            required
            className="h-12 text-base transition-all duration-200 focus:border-primary focus:ring-primary border-slate-300 dark:border-slate-600"
          />
          {suggestedAmount && !form.amount && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -bottom-16 left-0 right-0 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800"
            >
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                💡 ยอดแนะนำจากประวัติการใช้จ่าย
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-9 text-sm"
                onClick={() => setForm(f => ({ ...f, amount: suggestedAmount.toString() }))}
              >
                ใช้ยอด {formatCurrency(suggestedAmount)}
              </Button>
            </motion.div>
          )}
        </div>
      </div>
      <Button
        type="submit"
        className="w-full h-12 text-base font-bold tracking-wide transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        disabled={loading}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            กำลังบันทึก...
          </span>
        ) : (
          'บันทึกงบประมาณ'
        )}
      </Button>
    </form>
  );
};

// --- Main Budget Component ---
const Budget = () => {
  // --- State & Hooks ---
  const { budgets, transactions, deleteBudget, addBudget, loading } = useSupabaseFinance();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const isMobile = useIsMobile();
  const [isFormOpen, setFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'monthly' | 'annual'>('monthly');
  const [isAnnualTableModalOpen, setAnnualTableModalOpen] = useState(false);

  // --- Memoized Calculations ---

  // Calculate overall yearly income, expense, and net balance for the currently selected year
  const yearlySummary = useMemo(() => {
    const currentYear = selectedMonth.slice(0, 4);
    const yearTransactions = transactions.filter(t => t.date.startsWith(currentYear));

    const totalIncome = yearTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = yearTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const netBalance = totalIncome - totalExpense;

    return { totalIncome, totalExpense, netBalance };
  }, [transactions, selectedMonth]);

  // Memoized analysis of monthly and annual budget data
  const analysis = useMemo(() => {
    const getAnalysisForMonth = (month: string) => {
      const monthTransactions = transactions.filter(t => t.type === 'expense' && t.date.startsWith(month));
      const monthBudgets = budgets.filter(b => b.month === month);

      const budgetTracking = monthBudgets.map(budget => {
        const spent = monthTransactions.filter(t => t.category === budget.category).reduce((sum, t) => sum + t.amount, 0);
        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
        const status = percentage > 100 ? 'over' : percentage > 90 ? 'warning' : 'good';
        return { ...budget, spent, remaining: budget.amount - spent, percentage, status };
      });

      const totalBudgeted = budgetTracking.reduce((sum, item) => sum + item.amount, 0);
      const totalSpent = budgetTracking.reduce((sum, item) => sum + item.spent, 0);
      return { budgetTracking, totalBudgeted, totalSpent, totalRemaining: totalBudgeted - totalSpent };
    }

    // Monthly analysis for the currently selected month
    const monthly = getAnalysisForMonth(selectedMonth);

    // Annual analysis, breaking down spending by category across all months in the selected year
    const year = selectedMonth.slice(0, 4);
    const annualData = allCategories.map(category => {
      const monthlyBreakdown = Array.from({ length: 12 }).map((_, i) => {
        const monthStr = `${year}-${(i + 1).toString().padStart(2, '0')}`;
        const budget = budgets.find(b => b.month === monthStr && b.category === category);
        const spent = transactions
          .filter(t => t.type === 'expense' && t.date.startsWith(monthStr) && t.category === category)
          .reduce((sum, t) => sum + t.amount, 0);

        const budgetAmount = budget ? budget.amount : 0;
        const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
        const status = percentage > 100 ? 'over' : percentage > 90 ? 'warning' : budgetAmount === 0 && spent > 0 ? 'no-budget-spent' : 'good';
        return { month: i, spent, budget: budgetAmount, status };
      });
      const totalBudget = monthlyBreakdown.reduce((sum, m) => sum + m.budget, 0);
      const totalSpent = monthlyBreakdown.reduce((sum, m) => sum + m.spent, 0);
      return { category, monthlyBreakdown, totalBudget, totalSpent };
    });

    return { monthly, annualData };
  }, [budgets, transactions, selectedMonth]);

  // --- Event Handlers & Callbacks ---

  // Handle copying budgets from the previous month
  const handleCopyBudget = async () => {
    const lastMonthDate = subMonths(new Date(selectedMonth + '-01'), 1);
    const lastMonthString = format(lastMonthDate, 'yyyy-MM');
    const budgetsToCopy = budgets.filter(b => b.month === lastMonthString);
    if (budgetsToCopy.length === 0) {
      toast({ title: "ไม่พบข้อมูล", description: "ไม่มีงบประมาณในเดือนก่อนหน้าให้คัดลอก", variant: "destructive" });
      return;
    }
    try {
      const existingBudgetsForCurrentMonth = budgets.filter(b => b.month === selectedMonth);
      const budgetsToAdd = budgetsToCopy.filter(b =>
        !existingBudgetsForCurrentMonth.some(existingB => existingB.category === b.category)
      );

      if (budgetsToAdd.length === 0) {
        toast({ title: "ไม่พบข้อมูล", description: "งบประมาณสำหรับเดือนนี้ตั้งค่าไว้แล้ว", variant: "default" });
        return;
      }

      await Promise.all(budgetsToAdd.map(b => addBudget({ category: b.category, amount: b.amount, month: selectedMonth })));
      toast({ title: "คัดลอกสำเร็จ", description: `คัดลอก ${budgetsToAdd.length} รายการจากเดือนที่แล้ว`, variant: "success" });
    } catch (error) {
      console.error("Error copying budget:", error);
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถคัดลอกงบประมาณได้", variant: "destructive" });
    }
  };

  // Export Functions
  const handleDownloadPng = useCallback(() => {
    const tableId = isMobile ? 'annual-budget-table-mobile' : 'annual-budget-table';
    const input = document.getElementById(tableId);

    if (input && typeof html2canvas !== 'undefined') {
      toast({ title: "กำลังสร้างรูปภาพ", description: "กรุณารอสักครู่เพื่อดาวน์โหลดภาพรายงาน", variant: "info" });
      const clonedInput = input.cloneNode(true) as HTMLElement;
      clonedInput.style.position = 'absolute';
      clonedInput.style.top = '0';
      clonedInput.style.left = '-9999px';
      clonedInput.querySelectorAll('.sticky').forEach(el => {
        el.classList.remove('sticky', 'left-0', 'right-0', 'bottom-0', 'bg-background', 'bg-card', 'bg-muted/50', 'z-10', 'z-20');
        el.style.zIndex = 'auto';
      });

      document.body.appendChild(clonedInput);

      html2canvas(clonedInput, { scale: 2, logging: false }).then((canvas: HTMLCanvasElement) => {
        const link = document.createElement('a');
        link.download = `annual-budget-report-${selectedMonth.slice(0, 4)}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        toast({ title: "ดาวน์โหลด PNG", description: "รายงานงบประมาณรายปีถูกดาวน์โหลดแล้ว", variant: "success" });
        document.body.removeChild(clonedInput);
      }).catch((error: any) => {
        console.error("Error generating PNG:", error);
        toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถสร้าง PNG ได้", variant: "destructive" });
        document.body.removeChild(clonedInput);
      });
    } else {
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่พบองค์ประกอบตารางหรือไลบรารี html2canvas", variant: "destructive" });
    }
  }, [selectedMonth, isMobile]);

  const handleExportToCsv = useCallback(() => {
    const year = selectedMonth.slice(0, 4);
    let csvContent = "data:text/csv;charset=utf-8,%EF%BB%BF";

    const monthHeaders = Array.from({ length: 12 }).map((_, i) => format(new Date(2000, i, 1), 'MMM', { locale: th }));
    csvContent += "หมวดหมู่," + monthHeaders.join(',') + ",รวม\n";

    allCategories.forEach(category => {
      const row = analysis.annualData.find(dataRow => dataRow.category === category);
      const monthlySpent = Array.from({ length: 12 }).map((_, i) =>
        (row?.monthlyBreakdown[i]?.spent || 0).toFixed(2)
      );
      const totalSpent = (row?.totalSpent || 0).toFixed(2);
      const rowData = [category, ...monthlySpent, totalSpent];
      csvContent += rowData.join(',') + "\n";
    });

    const totalRowData = ["รวม", ...Array.from({ length: 12 }).map((_, i) => {
      const monthTotal = allCategories.reduce((sum, category) => {
        const dataRow = analysis.annualData.find(row => row.category === category);
        return sum + (dataRow?.monthlyBreakdown[i]?.spent || 0);
      }, 0);
      return monthTotal.toFixed(2);
    }), allCategories.reduce((sum, category) => {
      const dataRow = analysis.annualData.find(row => row.category === category);
      return sum + (dataRow?.totalSpent || 0);
    }, 0).toFixed(2)];
    csvContent += totalRowData.join(',') + "\n";

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `annual-budget-report-${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "ส่งออก Excel", description: "รายงานงบประมาณรายปีถูกส่งออกเป็นไฟล์ CSV แล้ว", variant: "success" });
  }, [selectedMonth, analysis.annualData]);

  // Determine cell background color based on budget status for annual table
  const getCellColor = (status: string) => {
    switch (status) {
      case 'over': return 'bg-red-500/20 hover:bg-red-500/40';
      case 'warning': return 'bg-yellow-500/20 hover:bg-yellow-500/40';
      case 'good': return 'bg-green-500/20 hover:bg-green-500/40';
      case 'no-budget-spent': return 'bg-blue-500/10 hover:bg-blue-500/20';
      default: return 'bg-muted/50';
    }
  }

  // --- Render (Skeleton Loader) ---
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
              <Skeleton className="h-11 w-32" />
            </div>
          </div>
        </header>
        <main className="space-y-8">
          <Skeleton className="h-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </main>
      </div>
    </div>
  );

  // --- Main Component Render ---
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header Section - Enhanced Responsive */}
          <header className="mb-8">
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
              <div className="space-y-2">
                <h1 className="text-3xl xl:text-4xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                  งบประมาณ
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-base xl:text-lg">
                  ตั้งค่าและติดตามงบประมาณเพื่อควบคุมการใช้จ่าย
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <MonthYearPicker
                  selectedDate={selectedMonth}
                  onDateChange={setSelectedMonth}
                  className="min-w-48"
                />
                <Button
                  onClick={() => setFormOpen(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  ตั้งงบ
                </Button>
              </div>
            </div>
          </header>

          <main className="space-y-8">
            {/* Enhanced Yearly Financial Overview Card */}
            <section>
              <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-800 dark:text-slate-100">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600">
                      <BarChart2 className="h-5 w-5 text-white" />
                    </div>
                    ภาพรวมทางการเงินรายปี {parseInt(selectedMonth.slice(0, 4)) + 543}
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-300">
                    สรุปรายรับและรายจ่ายรวมสำหรับปี {parseInt(selectedMonth.slice(0, 4)) + 543}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/50 dark:to-emerald-950/50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-green-700 dark:text-green-300 uppercase tracking-wider">
                            รายรับรวม
                          </p>
                          <p className="text-2xl xl:text-3xl font-bold text-green-900 dark:text-green-100">
                            {formatCurrency(yearlySummary.totalIncome)}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600">
                          <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950/50 dark:to-rose-950/50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-red-700 dark:text-red-300 uppercase tracking-wider">
                            รายจ่ายรวม
                          </p>
                          <p className="text-2xl xl:text-3xl font-bold text-red-900 dark:text-red-100">
                            {formatCurrency(yearlySummary.totalExpense)}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-gradient-to-r from-red-500 to-rose-600">
                          <TrendingDown className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={cn(
                    "border-0 shadow-lg backdrop-blur-sm",
                    yearlySummary.netBalance >= 0
                      ? "bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-950/50 dark:to-cyan-950/50"
                      : "bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-950/50 dark:to-amber-950/50"
                  )}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <p className={cn(
                            "text-sm font-semibold uppercase tracking-wider",
                            yearlySummary.netBalance >= 0
                              ? "text-blue-700 dark:text-blue-300"
                              : "text-orange-700 dark:text-orange-300"
                          )}>
                            ยอดสุทธิ
                          </p>
                          <p className={cn(
                            "text-2xl xl:text-3xl font-bold",
                            yearlySummary.netBalance >= 0
                              ? "text-blue-900 dark:text-blue-100"
                              : "text-orange-900 dark:text-orange-100"
                          )}>
                            {formatCurrency(yearlySummary.netBalance)}
                          </p>
                        </div>
                        <div className={cn(
                          "p-3 rounded-lg bg-gradient-to-r",
                          yearlySummary.netBalance >= 0
                            ? "from-blue-500 to-cyan-600"
                            : "from-orange-500 to-amber-600"
                        )}>
                          <Wallet className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </section>

            {/* Enhanced Monthly/Annual Tabs */}
            <section>
              <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
                <CardContent className="p-0">
                  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-slate-100/50 dark:bg-slate-700/50">
                      <TabsTrigger value="monthly" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
                        มุมมองรายเดือน
                      </TabsTrigger>
                      <TabsTrigger value="annual" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
                        มุมมองรายปี
                      </TabsTrigger>
                    </TabsList>

                    <div className="p-6">
                      <TabsContent value="monthly" className="mt-0 space-y-6">
                        {/* Monthly Overview Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-950/50 dark:to-pink-950/50">
                            <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
                              <CardTitle className="text-sm font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                                งบทั้งหมด
                              </CardTitle>
                              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600">
                                <Target className="h-4 w-4 text-white" />
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <p className="text-2xl xl:text-3xl font-bold text-purple-900 dark:text-purple-100">
                                {formatCurrency(analysis.monthly.totalBudgeted)}
                              </p>
                            </CardContent>
                          </Card>

                          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950/50 dark:to-rose-950/50">
                            <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
                              <CardTitle className="text-sm font-semibold text-red-700 dark:text-red-300 uppercase tracking-wider">
                                ใช้ไปแล้ว
                              </CardTitle>
                              <div className="p-2 rounded-lg bg-gradient-to-r from-red-500 to-rose-600">
                                <TrendingDown className="h-4 w-4 text-white" />
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <p className="text-2xl xl:text-3xl font-bold text-red-900 dark:text-red-100">
                                {formatCurrency(analysis.monthly.totalSpent)}
                              </p>
                            </CardContent>
                          </Card>

                          <Card className={cn(
                            "border-0 shadow-lg backdrop-blur-sm",
                            analysis.monthly.totalRemaining >= 0
                              ? "bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/50 dark:to-emerald-950/50"
                              : "bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-950/50 dark:to-amber-950/50"
                          )}>
                            <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
                              <CardTitle className={cn(
                                "text-sm font-semibold uppercase tracking-wider",
                                analysis.monthly.totalRemaining >= 0
                                  ? "text-green-700 dark:text-green-300"
                                  : "text-orange-700 dark:text-orange-300"
                              )}>
                                คงเหลือ
                              </CardTitle>
                              <div className={cn(
                                "p-2 rounded-lg bg-gradient-to-r",
                                analysis.monthly.totalRemaining >= 0
                                  ? "from-green-500 to-emerald-600"
                                  : "from-orange-500 to-amber-600"
                              )}>
                                <Wallet className="h-4 w-4 text-white" />
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <p className={cn(
                                "text-2xl xl:text-3xl font-bold",
                                analysis.monthly.totalRemaining >= 0
                                  ? "text-green-900 dark:text-green-100"
                                  : "text-orange-900 dark:text-orange-100"
                              )}>
                                {formatCurrency(Math.abs(analysis.monthly.totalRemaining))}
                              </p>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Monthly Budget Tracking Details */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">การติดตามงบประมาณ</h2>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyBudget}
                            className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            คัดลอกจากเดือนก่อน
                          </Button>
                        </div>

                        {analysis.monthly.budgetTracking.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            <AnimatePresence>
                              {analysis.monthly.budgetTracking.map((item, index) => {
                                const StatusIcon = categoryIcons[item.category] || Info;
                                const statusConfig = {
                                  good: {
                                    color: "border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/50 dark:to-emerald-950/50",
                                    icon: CheckCircle,
                                    iconColor: "text-green-500",
                                    progressClass: "[&>div]:bg-green-500"
                                  },
                                  warning: {
                                    color: "border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-950/50 dark:to-amber-950/50",
                                    icon: AlertTriangle,
                                    iconColor: "text-yellow-500",
                                    progressClass: "[&>div]:bg-yellow-500"
                                  },
                                  over: {
                                    color: "border-0 shadow-lg bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950/50 dark:to-rose-950/50",
                                    icon: XCircle,
                                    iconColor: "text-red-500",
                                    progressClass: "[&>div]:bg-red-500"
                                  }
                                };
                                const config = statusConfig[item.status];
                                return (
                                  <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                    whileHover={{ scale: 1.02, y: -4 }}
                                  >
                                    <Card className={cn("transition-all duration-300 hover:shadow-xl", config.color)}>
                                      <CardHeader className="pb-4">
                                        <div className="flex items-center justify-between">
                                          <CardTitle className="text-base flex items-center gap-3">
                                            <div className={cn("p-2 rounded-lg bg-gradient-to-r",
                                              item.status === 'good' ? "from-green-500 to-emerald-600" :
                                                item.status === 'warning' ? "from-yellow-500 to-amber-600" :
                                                  "from-red-500 to-rose-600"
                                            )}>
                                              <StatusIcon className="h-4 w-4 text-white" />
                                            </div>
                                            <span className="font-bold text-slate-800 dark:text-slate-100">{item.category}</span>
                                          </CardTitle>
                                          <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="max-w-md">
                                              <AlertDialogHeader>
                                                <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
                                                <DialogDescription>
                                                  คุณแน่ใจหรือไม่ที่จะลบงบประมาณสำหรับ {item.category}?
                                                </DialogDescription>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                                <AlertDialogAction
                                                  onClick={async () => {
                                                    try {
                                                      await deleteBudget(item.id);
                                                      toast({ title: "ลบสำเร็จ", description: `งบประมาณสำหรับ ${item.category} ถูกลบแล้ว`, variant: "success" });
                                                    } catch (error) {
                                                      console.error("Error deleting budget:", error);
                                                      toast({ title: "เกิดข้อผิดพลาด", description: `ไม่สามารถลบงบประมาณสำหรับ ${item.category} ได้`, variant: "destructive" });
                                                    }
                                                  }}
                                                  className="bg-red-500 hover:bg-red-600"
                                                >
                                                  ลบ
                                                </AlertDialogAction>
                                              </AlertDialogFooter>
                                            </AlertDialogContent>
                                          </AlertDialog>
                                        </div>
                                      </CardHeader>
                                      <CardContent className="space-y-4">
                                        <Progress value={Math.min(item.percentage, 100)} className={cn("h-3", config.progressClass)} />
                                        <div className="flex justify-between text-sm">
                                          <span className="text-slate-600 dark:text-slate-300">ใช้ไป</span>
                                          <span className="font-medium text-slate-800 dark:text-slate-100">
                                            {formatCurrency(item.spent)} / {formatCurrency(item.amount)}
                                          </span>
                                        </div>
                                        <div className="pt-3 border-t border-slate-200 dark:border-slate-600 text-center">
                                          <p className="text-sm text-slate-600 dark:text-slate-300">
                                            {item.status === 'over' ? "เกินงบประมาณ" : "คงเหลือ"}
                                          </p>
                                          <p className={cn(
                                            "text-lg font-bold",
                                            item.status === 'over' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                                          )}>
                                            {formatCurrency(Math.abs(item.remaining))}
                                          </p>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </motion.div>
                                );
                              })}
                            </AnimatePresence>
                          </div>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-16 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg"
                          >
                            <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm max-w-md mx-auto">
                              <CardContent className="p-8">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950/50 dark:to-pink-950/50 flex items-center justify-center mx-auto mb-4">
                                  <Target className="h-8 w-8 text-purple-500" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
                                  ยังไม่มีงบประมาณสำหรับเดือนนี้
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                  กดปุ่ม '+' เพื่อเริ่มต้นตั้งงบประมาณ
                                </p>
                              </CardContent>
                            </Card>
                          </motion.div>
                        )}
                      </TabsContent>

                      <TabsContent value="annual" className="mt-0">
                        <Card className="border-0 shadow-lg bg-slate-50/50 dark:bg-slate-700/50">
                          <CardHeader className="pb-4">
                            <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
                              ภาพรวมงบประมาณรายปี {parseInt(selectedMonth.slice(0, 4)) + 543}
                            </CardTitle>
                            <CardDescription className="text-slate-600 dark:text-slate-300">
                              คลิกที่ปุ่มด้านล่างเพื่อดูรายงานงบประมาณรายปีแบบละเอียด
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-6 text-center">
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                              {analysis.annualData.length > 0 ?
                                `รายงานนี้สรุปการใช้จ่ายสำหรับ ${allCategories.length} หมวดหมู่ในปีนี้` :
                                `ไม่มีข้อมูลงบประมาณหรือการใช้จ่ายสำหรับปี ${parseInt(selectedMonth.slice(0, 4)) + 543}`
                              }
                            </p>
                            <Button
                              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                              onClick={() => setAnnualTableModalOpen(true)}
                              disabled={analysis.annualData.length === 0 && allCategories.length === 0}
                            >
                              <BarChart2 className="mr-2 h-4 w-4" />
                              ดูรายงานรายปีฉบับเต็ม
                            </Button>
                            {analysis.annualData.length === 0 && (
                              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                                <Info className="mx-auto h-10 w-10 mb-2" />
                                <p className="text-base">ไม่มีข้อมูลงบประมาณรายปีให้แสดง</p>
                                <p className="text-sm mt-1">กรุณาตั้งงบประมาณรายเดือนหรือบันทึกรายจ่ายเพื่อสร้างรายงาน</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </div>
                  </Tabs>
                </CardContent>
              </Card>
            </section>
          </main>

          {/* Floating Action Button for mobile */}
          {isMobile && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileTap={{ scale: 0.9 }}
              className="fixed bottom-6 right-6 z-50"
            >
              <Button
                className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-2xl hover:shadow-3xl transition-all duration-300 border-4 border-white/20 backdrop-blur-sm"
                onClick={() => setFormOpen(true)}
                aria-label="ตั้งงบประมาณใหม่"
              >
                <Plus className="h-8 w-8 text-white" />
              </Button>
            </motion.div>
          )}

          {/* Enhanced Dialog/Drawer for Budget Form */}
          <Dialog open={isFormOpen && !isMobile} onOpenChange={setFormOpen}>
            <DialogContent className="max-w-2xl p-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-slate-200/50 dark:border-slate-700/50">
              <DialogHeader className="p-6 pb-0 border-b border-slate-200/50 dark:border-slate-700/50">
                <DialogTitle className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  ตั้งงบประมาณใหม่
                </DialogTitle>
                <DialogDescription className="text-base text-slate-600 dark:text-slate-400">
                  กรอกข้อมูลให้ครบถ้วนเพื่อบันทึกงบประมาณ
                </DialogDescription>
              </DialogHeader>
              <BudgetForm onFinished={() => setFormOpen(false)} month={selectedMonth} existingBudgets={analysis.monthly.budgetTracking} />
            </DialogContent>
          </Dialog>

          <Drawer open={isFormOpen && isMobile} onClose={() => setFormOpen(false)}>
            <DrawerContent className="h-[95vh] flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg">
              <DrawerHeader className="flex-none pb-4 border-b border-slate-200/50 dark:border-slate-700/50">
                <DrawerTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  ตั้งงบประมาณใหม่
                </DrawerTitle>
                <DrawerDescription className="text-base text-slate-600 dark:text-slate-400">
                  กรอกข้อมูลให้ครบถ้วนเพื่อบันทึกงบประมาณ
                </DrawerDescription>
              </DrawerHeader>
              <div className="overflow-y-auto flex-1">
                <BudgetForm onFinished={() => setFormOpen(false)} month={selectedMonth} existingBudgets={analysis.monthly.budgetTracking} />
              </div>
            </DrawerContent>
          </Drawer>

          {/* Enhanced Annual Table Modal */}
          <Dialog open={isAnnualTableModalOpen && !isMobile} onOpenChange={setAnnualTableModalOpen}>
            <DialogContent className="w-[98vw] max-w-7xl h-[90vh] flex flex-col p-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-slate-200/50 dark:border-slate-700/50">
              <DialogHeader className="p-6 pb-4 border-b border-slate-200/50 dark:border-slate-700/50 flex-shrink-0">
                <DialogTitle className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  รายงานงบประมาณรายปี {parseInt(selectedMonth.slice(0, 4)) + 543}
                </DialogTitle>
                <DialogDescription className="text-base text-slate-600 dark:text-slate-400">
                  ตารางสรุปการใช้จ่ายในแต่ละหมวดหมู่และแต่ละเดือนของปี <br />
                  <span className="text-blue-600 font-semibold">กรุณาดาวน์โหลด PNG เพื่อดูข้อสรุปที่ชัดเจนยิ่งขึ้น</span>
                </DialogDescription>
              </DialogHeader>
              <div className="flex-none flex gap-3 mb-4 px-6">
                <Button
                  onClick={handleDownloadPng}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                >
                  <Download className="mr-2 h-4 w-4" />
                  ดาวน์โหลด PNG
                </Button>
                <Button
                  onClick={handleExportToCsv}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  ส่งออก Excel (CSV)
                </Button>
              </div>
              <div className="flex-grow overflow-auto border rounded-lg shadow-sm mx-6 mb-6">
                <Table id="annual-budget-table" className="min-w-max text-sm">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px] sticky left-0 bg-background z-10 font-bold text-slate-700 dark:text-slate-300">
                        หมวดหมู่
                      </TableHead>
                      {Array.from({ length: 12 }).map((_, i) => (
                        <TableHead key={i} className="text-center min-w-[100px] font-bold text-slate-700 dark:text-slate-300">
                          {format(new Date(2000, i, 1), 'LLL', { locale: th })}
                        </TableHead>
                      ))}
                      <TableHead className="text-right min-w-[120px] sticky right-0 bg-background z-10 font-bold text-slate-700 dark:text-slate-300">
                        รวม
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allCategories.map(category => {
                      const row = analysis.annualData.find(dataRow => dataRow.category === category);
                      const monthlyBreakdown = row ? row.monthlyBreakdown : Array.from({ length: 12 }).map(() => ({
                        month: 0, spent: 0, budget: 0, status: 'good'
                      }));
                      const totalSpent = row ? row.totalSpent : 0;

                      return (
                        <TableRow key={category}>
                          <TableCell className="font-semibold sticky left-0 bg-card z-10 truncate text-slate-800 dark:text-slate-200">
                            {category}
                          </TableCell>
                          {monthlyBreakdown.map((cell, i) => {
                            const percentage = cell.budget > 0 ? (cell.spent / cell.budget) * 100 : 0;
                            const cellStatus = percentage > 100 ? 'over' : percentage > 90 ? 'warning' : cell.budget === 0 && cell.spent > 0 ? 'no-budget-spent' : 'good';
                            const cellColorClass = getCellColor(cellStatus);

                            return (
                              <Tooltip key={i}>
                                <TooltipTrigger asChild>
                                  <TableCell className={cn("text-center cursor-pointer transition-colors break-all", cellColorClass)}>
                                    {cell.budget > 0 ? formatCurrency(cell.spent) : (cell.spent > 0 ? formatCurrency(cell.spent) : '-')}
                                  </TableCell>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>งบ: {formatCurrency(cell.budget)}</p>
                                  <p>ใช้ไป: {formatCurrency(cell.spent)}</p>
                                  {cell.status === 'no-budget-spent' && <p className="text-blue-300">ไม่มีงบประมาณ, มีการใช้จ่าย</p>}
                                  {cell.status === 'over' && <p className="text-red-300">เกินงบประมาณ!</p>}
                                  {cell.status === 'warning' && <p className="text-yellow-300">ใกล้เกินงบประมาณ</p>}
                                </TooltipContent>
                              </Tooltip>
                            )
                          })}
                          <TableCell className="text-right font-semibold sticky right-0 bg-card z-10 break-all text-slate-800 dark:text-slate-200">
                            {formatCurrency(totalSpent)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                  <TableFooter className="bg-muted/50 font-semibold sticky bottom-0 z-20">
                    <TableRow>
                      <TableCell className="font-bold sticky left-0 bg-muted/50 z-20">รวม</TableCell>
                      {Array.from({ length: 12 }).map((_, i) => {
                        const monthTotal = allCategories.reduce((sum, category) => {
                          const dataRow = analysis.annualData.find(row => row.category === category);
                          return sum + (dataRow?.monthlyBreakdown[i]?.spent || 0);
                        }, 0);
                        return <TableCell key={i} className="text-center font-bold break-all">{formatCurrency(monthTotal)}</TableCell>
                      })}
                      <TableCell className="text-right font-bold sticky right-0 bg-muted/50 z-20 break-all">
                        {formatCurrency(allCategories.reduce((sum, category) => {
                          const dataRow = analysis.annualData.find(row => row.category === category);
                          return sum + (dataRow?.totalSpent || 0);
                        }, 0))}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </DialogContent>
          </Dialog>

          <Drawer open={isAnnualTableModalOpen && isMobile} onClose={() => setAnnualTableModalOpen(false)}>
            <DrawerContent className="h-[95vh] flex flex-col">
              <DrawerHeader className="flex-none pb-4 border-b border-slate-200/50 dark:border-slate-700/50">
                <DrawerTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  รายงานงบประมาณรายปี {parseInt(selectedMonth.slice(0, 4)) + 543}
                </DrawerTitle>
                <DrawerDescription className="text-base text-slate-600 dark:text-slate-400">
                  ตารางสรุปการใช้จ่ายในแต่ละหมวดหมู่และแต่ละเดือนของปี <br />
                  <span className="text-blue-600 font-semibold">กรุณาดาวน์โหลด PNG เพื่อดูข้อสรุปที่ชัดเจนยิ่งขึ้น</span>
                </DrawerDescription>
              </DrawerHeader>
              <div className="flex-none flex gap-2 mb-4 px-6">
                <Button
                  onClick={handleDownloadPng}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                >
                  <Download className="mr-2 h-4 w-4" />
                  ดาวน์โหลด PNG
                </Button>
                <Button
                  onClick={handleExportToCsv}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  ส่งออก Excel (CSV)
                </Button>
              </div>
              <div className="flex-grow overflow-auto px-6 pb-6">
                <Table id="annual-budget-table-mobile" className="min-w-max text-xs">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[100px] sticky left-0 bg-background z-10 font-bold text-slate-700 dark:text-slate-300">
                        หมวดหมู่
                      </TableHead>
                      {Array.from({ length: 12 }).map((_, i) => (
                        <TableHead key={i} className="text-center min-w-[50px] font-bold text-slate-700 dark:text-slate-300">
                          {format(new Date(2000, i, 1), 'LLL', { locale: th })}
                        </TableHead>
                      ))}
                      <TableHead className="text-right min-w-[70px] sticky right-0 bg-background z-10 font-bold text-slate-700 dark:text-slate-300">
                        รวม
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allCategories.map(category => {
                      const row = analysis.annualData.find(dataRow => dataRow.category === category);
                      const monthlyBreakdown = row ? row.monthlyBreakdown : Array.from({ length: 12 }).map(() => ({
                        month: 0, spent: 0, budget: 0, status: 'good'
                      }));
                      const totalSpent = row ? row.totalSpent : 0;

                      return (
                        <TableRow key={category}>
                          <TableCell className="font-semibold sticky left-0 bg-card z-10 truncate text-slate-800 dark:text-slate-200">
                            {category}
                          </TableCell>
                          {monthlyBreakdown.map((cell, i) => {
                            const percentage = cell.budget > 0 ? (cell.spent / cell.budget) * 100 : 0;
                            const cellStatus = percentage > 100 ? 'over' : percentage > 90 ? 'warning' : cell.budget === 0 && cell.spent > 0 ? 'no-budget-spent' : 'good';
                            const cellColorClass = getCellColor(cellStatus);

                            return (
                              <Tooltip key={i}>
                                <TooltipTrigger asChild>
                                  <TableCell className={cn("text-center cursor-pointer transition-colors break-all", cellColorClass)}>
                                    {cell.budget > 0 ? formatCurrency(cell.spent) : (cell.spent > 0 ? formatCurrency(cell.spent) : '-')}
                                  </TableCell>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>งบ: {formatCurrency(cell.budget)}</p>
                                  <p>ใช้ไป: {formatCurrency(cell.spent)}</p>
                                  {cell.status === 'no-budget-spent' && <p className="text-blue-300">ไม่มีงบประมาณ, มีการใช้จ่าย</p>}
                                  {cell.status === 'over' && <p className="text-red-300">เกินงบประมาณ!</p>}
                                  {cell.status === 'warning' && <p className="text-yellow-300">ใกล้เกินงบประมาณ</p>}
                                </TooltipContent>
                              </Tooltip>
                            )
                          })}
                          <TableCell className="text-right font-semibold sticky right-0 bg-card z-10 break-all text-slate-800 dark:text-slate-200">
                            {formatCurrency(totalSpent)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                  <TableFooter className="bg-muted/50 font-semibold sticky bottom-0 z-20">
                    <TableRow>
                      <TableCell className="font-bold sticky left-0 bg-muted/50 z-20">รวม</TableCell>
                      {Array.from({ length: 12 }).map((_, i) => {
                        const monthTotal = allCategories.reduce((sum, category) => {
                          const dataRow = analysis.annualData.find(row => row.category === category);
                          return sum + (dataRow?.monthlyBreakdown[i]?.spent || 0);
                        }, 0);
                        return <TableCell key={i} className="text-center font-bold break-all">{formatCurrency(monthTotal)}</TableCell>
                      })}
                      <TableCell className="text-right font-bold sticky right-0 bg-muted/50 z-20 break-all">
                        {formatCurrency(allCategories.reduce((sum, category) => {
                          const dataRow = analysis.annualData.find(row => row.category === category);
                          return sum + (dataRow?.totalSpent || 0);
                        }, 0))}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Budget;