// src/components/Budget.tsx

import React, { useState, useMemo, useCallback } from 'react';
import { useSupabaseFinance } from '../context/SupabaseFinanceContext';
import { 
  Plus, Target, Trash2, CheckCircle, AlertTriangle, XCircle, Wallet, 
  TrendingDown, TrendingUp, Copy, HelpCircle, Info, Utensils, Car, 
  Smile, GraduationCap, ShoppingBag, Home, Heart, BookOpen, 
  DollarSign as DollarIcon, Calendar as CalendarIcon, ChevronDown, 
  BarChart2, Zap, RefreshCw, Download, FileText // Consolidated Lucide imports
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
import { format, subMonths, getMonth, getYear } from 'date-fns'; 
import { th } from 'date-fns/locale'; 
import { MonthYearPicker } from '@/components/ui/month-year-picker';
import { Alert } from '@/components/ui/alert'; // Import Alert component

// For image export (html2canvas must be loaded via CDN in public/index.html or similar)
declare const html2canvas: any; 

const allCategories = ['อาหาร', 'การเดินทาง', 'ความบันเทิง', 'สาธารณูปโภค', 'สุขภาพ', 'ช็อปปิ้ง', 'ค่าเช่า/ผ่อน', 'การศึกษา', 'ค่าใช้จ่ายอื่นๆ'];

// Map categories to Lucide icons for better visual representation
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

// Budget Form Component with Suggestions
const BudgetForm = ({ onFinished, month, existingBudgets }: { onFinished: () => void; month: string, existingBudgets: {category: string, amount: number}[] }) => {
    const { addBudget, transactions } = useSupabaseFinance();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ category: '', amount: '' });

    // Filter out categories that already have a budget for the selected month
    const availableCategories = allCategories.filter(cat => !existingBudgets.some(b => b.category === cat));

    // Suggest amount based on past 3 months' average expense for the selected category
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
        return Math.round(total / (monthsOfData || 1));
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
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            <div className="grid gap-2">
                <Label htmlFor="budget-month" className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-200">เดือน</Label>
                <Input 
                    id="budget-month" 
                    type="month" 
                    value={month} 
                    disabled 
                    className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 cursor-not-allowed text-gray-600 dark:text-gray-400 text-sm sm:text-base h-10 sm:h-11" 
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="budget-category" className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-200">หมวดหมู่</Label>
                <Select value={form.category} onValueChange={(value) => setForm(p => ({...p, category: value, amount: ''}))}>
                    <SelectTrigger id="budget-category" className={cn(
                        "h-10 sm:h-11 text-sm sm:text-base transition-all duration-200 border-gray-300 dark:border-gray-600",
                        form.category ? "border-primary text-primary-foreground font-medium bg-primary/10" : ""
                    )}> 
                        <SelectValue placeholder="เลือกหมวดหมู่" />
                    </SelectTrigger>
                    <SelectContent className="max-h-48 sm:max-h-60 overflow-y-auto">
                        {availableCategories.length > 0 ? (
                            availableCategories.map(cat => 
                                <SelectItem key={cat} value={cat} className="text-sm sm:text-base py-2">{cat}</SelectItem>
                            )
                        ) : (
                            <SelectItem value="no-more-categories" disabled className="text-muted-foreground text-center italic text-sm">
                                ทุกหมวดหมู่ถูกตั้งงบแล้ว
                            </SelectItem>
                        )}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="budget-amount" className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-200">งบประมาณ</Label>
                <div className="relative">
                    <Input 
                        id="budget-amount" 
                        type="number" 
                        value={form.amount} 
                        onChange={(e) => setForm(p => ({...p, amount: e.target.value}))} 
                        placeholder="0.00" 
                        required
                        className="h-10 sm:h-11 text-base sm:text-lg transition-all duration-200 focus:border-primary focus:ring-primary border-gray-300 dark:border-gray-600 pr-2 sm:pr-4"
                    />
                    {suggestedAmount && !form.amount && (
                        <Button 
                            type="button" 
                            size="sm" 
                            variant="ghost"
                            className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 h-6 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-semibold"
                            onClick={() => setForm(f => ({...f, amount: suggestedAmount.toString()}))}
                        >
                            <span className="hidden sm:inline">ใช้ยอดแนะนำ ฿{suggestedAmount.toLocaleString()}?</span>
                            <span className="sm:hidden">฿{suggestedAmount.toLocaleString()}</span>
                        </Button>
                    )}
                </div>
            </div>
            <Button 
                type="submit" 
                className="w-full h-10 sm:h-12 text-base sm:text-lg font-bold tracking-wide transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                disabled={loading}
            >
                {loading ? (
                    <span className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" /> 
                        <span className="text-sm sm:text-base">กำลังบันทึก...</span>
                    </span>
                ) : (
                    <span className="text-sm sm:text-base">บันทึกงบประมาณ</span>
                )}
            </Button>
        </form>
    );
};

// Main Budget Component
const Budget = () => {
  const { budgets, transactions, deleteBudget, addBudget, loading } = useSupabaseFinance();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const isMobile = useIsMobile();
  const [isFormOpen, setFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'monthly'|'annual'>('monthly');
  const [isAnnualTableModalOpen, setAnnualTableModalOpen] = useState(false);

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
        const monthlyBreakdown = Array.from({length: 12}).map((_, i) => {
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

  // Handle copying budgets from the previous month
  const handleCopyBudget = async () => {
      const lastMonthDate = subMonths(new Date(selectedMonth + '-01'), 1); 
      const lastMonthString = format(lastMonthDate, 'yyyy-MM');
      const budgetsToCopy = budgets.filter(b => b.month === lastMonthString);
      if (budgetsToCopy.length === 0) {
          toast({title: "ไม่พบข้อมูล", description: "ไม่มีงบประมาณในเดือนก่อนหน้าให้คัดลอก", variant: "destructive"});
          return;
      }
      try {
          const existingBudgetsForCurrentMonth = budgets.filter(b => b.month === selectedMonth);
          const budgetsToAdd = budgetsToCopy.filter(b => 
              !existingBudgetsForCurrentMonth.some(existingB => existingB.category === b.category)
          );

          if (budgetsToAdd.length === 0) {
              toast({title: "ไม่พบข้อมูล", description: "งบประมาณสำหรับเดือนนี้ตั้งค่าไว้แล้ว", variant: "default"});
              return;
          }

          await Promise.all(budgetsToAdd.map(b => addBudget({ category: b.category, amount: b.amount, month: selectedMonth })));
          toast({title: "คัดลอกสำเร็จ", description: `คัดลอก ${budgetsToAdd.length} รายการจากเดือนที่แล้ว`, variant: "success"});
      } catch (error) {
          console.error("Error copying budget:", error);
          toast({title: "เกิดข้อผิดพลาด", description: "ไม่สามารถคัดลอกงบประมาณได้", variant: "destructive"});
      }
  };

  // Determine cell background color based on budget status for annual table
  const getCellColor = (status: string) => {
    switch(status) {
      case 'over': return 'bg-red-500/20 hover:bg-red-500/40';
      case 'warning': return 'bg-yellow-500/20 hover:bg-yellow-500/40';
      case 'good': return 'bg-green-500/20 hover:bg-green-500/40';
      case 'no-budget-spent': return 'bg-blue-500/10 hover:bg-blue-500/20'; 
      default: return 'bg-muted/50';
    }
  }

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
        link.download = `annual-budget-report-${selectedMonth.slice(0,4)}.png`;
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

    const monthHeaders = Array.from({length: 12}).map((_, i) => format(new Date(2000, i, 1), 'MMM', {locale: th}));
    csvContent += "หมวดหมู่," + monthHeaders.join(',') + ",รวม\n";

    allCategories.forEach(category => {
      const row = analysis.annualData.find(dataRow => dataRow.category === category);
      const monthlySpent = Array.from({length: 12}).map((_, i) => 
          (row?.monthlyBreakdown[i]?.spent || 0).toFixed(2)
      );
      const totalSpent = (row?.totalSpent || 0).toFixed(2);
      const rowData = [category, ...monthlySpent, totalSpent];
      csvContent += rowData.join(',') + "\n";
    });

    const totalRowData = ["รวม", ...Array.from({length: 12}).map((_, i) => {
        const monthTotal = allCategories.reduce((sum, category) => {
            const dataRow = analysis.annualData.find(row => row.category === category);
            return sum + (dataRow?.monthlyBreakdown[i]?.spent || 0);
        }, 0);
        return monthTotal.toFixed(2);
    }), allCategories.reduce((sum, category) => {
        const dataRow = analysis.annualData.find(row => dataRow.category === category);
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

  // Skeleton loader for the Budget component 
  if (loading) return (
    <div className="p-2 sm:p-4 lg:p-6 xl:p-8 space-y-4 sm:space-y-6">
        <Skeleton className="h-8 sm:h-10 w-full sm:w-2/3" />
        <Skeleton className="h-4 sm:h-6 w-full sm:w-1/2 mt-1 sm:mt-2" />
        <Skeleton className="h-8 sm:h-10 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {Array.from({length:3}).map((_,i) => <Skeleton key={i} className="h-20 sm:h-24" />)}
        </div>
        <Skeleton className="h-6 sm:h-8 w-32 sm:w-48 mb-3 sm:mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({length:3}).map((_,i) => <Skeleton key={i} className="h-48 sm:h-56"/>)}
        </div>
    </div>
  );

  return (
    <TooltipProvider> 
      <div className="p-2 sm:p-4 lg:p-6 xl:p-8 space-y-4 sm:space-y-6">
        {/* Header Section - Fully Responsive */}
        <div className="flex flex-col space-y-3 sm:space-y-4 lg:flex-row lg:justify-between lg:items-start lg:space-y-0 gap-3 lg:gap-4">
          <div className="space-y-1 sm:space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">งบประมาณ</h1>
            <p className="text-sm sm:text-base text-muted-foreground">ตั้งค่าและติดตามงบประมาณเพื่อควบคุมการใช้จ่าย</p>
          </div>
          <div className="flex flex-col sm:flex-row w-full lg:w-auto items-stretch sm:items-center gap-2 sm:gap-3">
            <div className="w-full sm:w-auto">
              <MonthYearPicker selectedDate={selectedMonth} onDateChange={setSelectedMonth} />
            </div>
            <div className="hidden sm:block"> 
              <Button 
                onClick={() => setFormOpen(true)}
                className="w-full sm:w-auto h-9 sm:h-10 text-sm sm:text-base"
              >
                <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4"/>
                <span className="sm:inline">ตั้งงบ</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Yearly Financial Overview Card - Enhanced Responsive */}
        <Card className="w-full">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
              <BarChart2 className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              <span className="text-sm sm:text-base lg:text-lg">ภาพรวมทางการเงินรายปี {parseInt(selectedMonth.slice(0,4)) + 543}</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              สรุปรายรับและรายจ่ายรวมสำหรับปี {parseInt(selectedMonth.slice(0,4)) + 543}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            <div className="space-y-1 p-3 sm:p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">รายรับรวม</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 break-all">
                ฿{yearlySummary.totalIncome.toLocaleString()}
              </p>
            </div>
            <div className="space-y-1 p-3 sm:p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">รายจ่ายรวม</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600 break-all">
                ฿{yearlySummary.totalExpense.toLocaleString()}
              </p>
            </div>
            <div className="space-y-1 p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg sm:col-span-2 lg:col-span-1">
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">ยอดสุทธิ</p>
              <p className={cn(
                "text-lg sm:text-xl lg:text-2xl font-bold break-all", 
                yearlySummary.netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'
              )}>
                ฿{yearlySummary.netBalance.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Monthly/Annual Tabs - Enhanced Responsive */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full"> 
          <TabsList className="grid w-full grid-cols-2 h-9 sm:h-10">
            <TabsTrigger value="monthly" className="text-xs sm:text-sm">มุมมองรายเดือน</TabsTrigger>
            <TabsTrigger value="annual" className="text-xs sm:text-sm">มุมมองรายปี</TabsTrigger>
          </TabsList>
          
          <TabsContent value="monthly" className="mt-3 sm:mt-4 space-y-4 sm:space-y-6">
            {/* Monthly Overview Cards - Enhanced Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <Card className="w-full">
                <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs sm:text-sm font-medium">งบทั้งหมด</CardTitle>
                  <Target className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground"/>
                </CardHeader>
                <CardContent className="pt-2">
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold break-all">
                    ฿{analysis.monthly.totalBudgeted.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="w-full">
                <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs sm:text-sm font-medium">ใช้ไปแล้ว</CardTitle>
                  <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-500"/>
                </CardHeader>
                <CardContent className="pt-2">
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold break-all">
                    ฿{analysis.monthly.totalSpent.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="w-full sm:col-span-2 lg:col-span-1">
                <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs sm:text-sm font-medium">คงเหลือ</CardTitle>
                  <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground"/>
                </CardHeader>
                <CardContent className="pt-2">
                  <p className={cn(
                    "text-lg sm:text-xl lg:text-2xl font-bold break-all", 
                    analysis.monthly.totalRemaining >= 0 ? 'text-green-600' : 'text-orange-600'
                  )}>
                    ฿{Math.abs(analysis.monthly.totalRemaining).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Monthly Budget Tracking Details - Enhanced Responsive */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-2">
              <h2 className="text-lg sm:text-xl font-semibold">การติดตามงบประมาณ</h2> 
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopyBudget}
                className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9"
              >
                <Copy className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> 
                <span className="sm:inline">คัดลอกจากเดือนก่อน</span>
              </Button>
            </div>
            
            {analysis.monthly.budgetTracking.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {analysis.monthly.budgetTracking.map((item) => {
                    const StatusIcon = categoryIcons[item.category] || Info;
                    const statusConfig = {
                        good: { color: "border-green-500/20 bg-green-500/5", icon: CheckCircle, iconColor: "text-green-500", progressClass: "[&>div]:bg-green-500" },
                        warning: { color: "border-yellow-500/20 bg-yellow-500/5", icon: AlertTriangle, iconColor: "text-yellow-500", progressClass: "[&>div]:bg-yellow-500" },
                        over: { color: "border-red-500/20 bg-red-500/5", icon: XCircle, iconColor: "text-red-500", progressClass: "[&>div]:bg-red-500" }
                    };
                    const config = statusConfig[item.status];
                    return (
                      <Card key={item.id} className={cn("transition-all hover:shadow-lg w-full", config.color)}> 
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm sm:text-base flex items-center gap-2 truncate">
                                <StatusIcon className={cn("h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0", config.iconColor || "text-muted-foreground")}/>
                                <span className="truncate">{item.category}</span>
                              </CardTitle>
                              <AlertDialog> 
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground flex-shrink-0">
                                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4"/>
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="w-[95vw] max-w-md">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="text-sm sm:text-base">ยืนยันการลบ</AlertDialogTitle>
                                      <DialogDescription className="text-xs sm:text-sm">
                                        คุณแน่ใจหรือไม่ที่จะลบงบประมาณสำหรับ {item.category}?
                                      </DialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                      <AlertDialogCancel className="w-full sm:w-auto text-xs sm:text-sm">ยกเลิก</AlertDialogCancel>
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
                                        className="w-full sm:w-auto text-xs sm:text-sm"
                                      >
                                        ลบ
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3 sm:space-y-4">
                              <Progress value={Math.min(item.percentage, 100)} className={cn("h-2 sm:h-3", config.progressClass)} /> 
                              <div className="flex justify-between text-xs sm:text-sm">
                                <span className="text-muted-foreground">ใช้ไป</span>
                                <span className="font-medium break-all text-right">
                                  ฿{item.spent.toLocaleString()} / ฿{item.amount.toLocaleString()}
                                </span>
                              </div>
                              <div className="pt-2 border-t text-center">
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  {item.status === 'over' ? "เกินงบประมาณ" : "คงเหลือ"}
                                </p>
                                <p className={cn(
                                  "text-base sm:text-lg font-bold break-all", 
                                  item.status === 'over' ? 'text-red-600' : 'text-green-600'
                                )}>
                                  ฿{Math.abs(item.remaining).toLocaleString()}
                                </p>
                              </div>
                          </CardContent>
                      </Card>
                    );
                })}
              </div>
            ) : (
              <div className="text-center py-12 sm:py-16 text-muted-foreground border-2 border-dashed rounded-lg">
                <Target className="mx-auto h-8 w-8 sm:h-12 sm:w-12" />
                <h3 className="mt-3 sm:mt-4 text-base sm:text-lg font-semibold">ยังไม่มีงบประมาณสำหรับเดือนนี้</h3>
                <p className="mt-1 text-xs sm:text-sm">กดปุ่ม '+' เพื่อเริ่มต้นตั้งงบประมาณ</p>
              </div>
            )}
          </TabsContent>
          
          {/* Annual Tab Content - Enhanced Responsive */}
          <TabsContent value="annual" className="mt-3 sm:mt-4">
              <Card className="w-full">
                  <CardHeader className="pb-3 sm:pb-4">
                      <CardTitle className="text-base sm:text-lg lg:text-xl">
                        ภาพรวมงบประมาณรายปี {parseInt(selectedMonth.slice(0,4)) + 543}
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        คลิกที่ปุ่มด้านล่างเพื่อดูรายงานงบประมาณรายปีแบบละเอียด
                      </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-center">
                      <p className="text-xs sm:text-sm text-muted-foreground">
                          {analysis.annualData.length > 0 ? 
                              `รายงานนี้สรุปการใช้จ่ายสำหรับ ${allCategories.length} หมวดหมู่ในปีนี้` :
                              `ไม่มีข้อมูลงบประมาณหรือการใช้จ่ายสำหรับปี ${parseInt(selectedMonth.slice(0,4)) + 543}`
                          }
                      </p>
                      <Button 
                          className="w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10" 
                          onClick={() => setAnnualTableModalOpen(true)}
                          disabled={analysis.annualData.length === 0 && allCategories.length === 0}
                      >
                          <BarChart2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> 
                          ดูรายงานรายปีฉบับเต็ม
                      </Button>
                       {analysis.annualData.length === 0 && (
                          <div className="text-center py-6 sm:py-8 text-muted-foreground">
                              <Info className="mx-auto h-8 w-8 sm:h-10 sm:w-10 mb-2"/>
                              <p className="text-sm sm:text-base">ไม่มีข้อมูลงบประมาณรายปีให้แสดง</p>
                              <p className="text-xs sm:text-sm mt-1">กรุณาตั้งงบประมาณรายเดือนหรือบันทึกรายจ่ายเพื่อสร้างรายงาน</p>
                          </div>
                      )}
                  </CardContent>
              </Card>
          </TabsContent>
        </Tabs>

        {/* Floating Action Button for mobile - Enhanced */}
        <div className="sm:hidden">
          <Button 
            className="fixed bottom-4 right-4 h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg z-50 transition-all hover:scale-110 active:scale-95" 
            onClick={() => setFormOpen(true)} 
            aria-label="ตั้งงบประมาณใหม่"
          >
              <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
        </div>

        {/* Dialog for desktop (Budget Form), Drawer for mobile (Budget Form) - Enhanced Responsive */}
        <Dialog open={isFormOpen && !isMobile} onOpenChange={setFormOpen} aria-describedby="budget-form-description"> 
          <DialogContent className="w-[95vw] max-w-lg p-0">
            <DialogHeader className="p-4 sm:p-6 pb-0">
              <DialogTitle className="text-base sm:text-lg">ตั้งงบประมาณใหม่</DialogTitle>
              <DialogDescription id="budget-form-description" className="text-xs sm:text-sm">
                กรอกข้อมูลให้ครบถ้วนเพื่อบันทึกงบประมาณ
              </DialogDescription> 
            </DialogHeader>
            <BudgetForm onFinished={() => setFormOpen(false)} month={selectedMonth} existingBudgets={analysis.monthly.budgetTracking}/>
          </DialogContent>
        </Dialog>
        
        <Drawer open={isFormOpen && isMobile} onClose={() => setFormOpen(false)}> 
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader className="pb-2">
              <DrawerTitle className="text-base">ตั้งงบประมาณใหม่</DrawerTitle>
              <DrawerDescription className="text-xs sm:text-sm">
                กรอกข้อมูลให้ครบถ้วนเพื่อบันทึกงบประมาณ
              </DrawerDescription>
            </DrawerHeader>
            <div className="overflow-y-auto max-h-[70vh]">
              <BudgetForm onFinished={() => setFormOpen(false)} month={selectedMonth} existingBudgets={analysis.monthly.budgetTracking}/>
            </div>
          </DrawerContent>
        </Drawer>

        {/* Dialog for desktop (Annual Table), Drawer for mobile (Annual Table) - Enhanced Responsive */}
        <Dialog open={isAnnualTableModalOpen && !isMobile} onOpenChange={setAnnualTableModalOpen}>
          <DialogContent className="w-[98vw] max-w-7xl h-[90vh] flex flex-col p-4 sm:p-6">
              <DialogHeader className="pb-3 sm:pb-4 flex-shrink-0">
                  <DialogTitle className="text-base sm:text-lg lg:text-xl">
                    รายงานงบประมาณรายปี {parseInt(selectedMonth.slice(0,4)) + 543}
                  </DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm">
                      ตารางสรุปการใช้จ่ายในแต่ละหมวดหมู่และแต่ละเดือนของปี <br/>
                      <span className="text-blue-600 font-semibold">กรุณาดาวน์โหลด PNG เพื่อดูข้อสรุปที่ชัดเจนยิ่งขึ้น</span>
                  </DialogDescription>
              </DialogHeader>
              <div className="flex-none flex flex-wrap gap-2 mb-3 sm:mb-4">
                  <Button 
                    onClick={handleDownloadPng}
                    className="flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9"
                  >
                    <Download className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4"/> 
                    ดาวน์โหลด PNG
                  </Button>
                  <Button 
                    onClick={handleExportToCsv}
                    className="flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9"
                  >
                    <FileText className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4"/> 
                    ส่งออก Excel (CSV)
                  </Button>
              </div>
              <div className="flex-grow overflow-auto border rounded-lg shadow-sm">
                  <Table id="annual-budget-table" className="min-w-max text-xs sm:text-sm">
                      <TableHeader>
                          <TableRow>
                              <TableHead className="min-w-[120px] sm:min-w-[150px] sticky left-0 bg-background z-10 text-xs sm:text-sm">
                                หมวดหมู่
                              </TableHead>
                              {Array.from({length: 12}).map((_, i) => (
                                  <TableHead key={i} className="text-center min-w-[60px] sm:min-w-[80px] lg:min-w-[100px] text-xs sm:text-sm">
                                      {format(new Date(2000, i, 1), 'LLL', {locale: th})}
                                  </TableHead>
                              ))}
                              <TableHead className="text-right min-w-[80px] sm:min-w-[120px] sticky right-0 bg-background z-10 text-xs sm:text-sm">
                                รวม
                              </TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {allCategories.map(category => {
                              const row = analysis.annualData.find(dataRow => dataRow.category === category);
                              const monthlyBreakdown = row ? row.monthlyBreakdown : Array.from({length: 12}).map(() => ({
                                  month: 0, spent: 0, budget: 0, status: 'good'
                              }));
                              const totalSpent = row ? row.totalSpent : 0;

                              return (
                                  <TableRow key={category}>
                                      <TableCell className="font-semibold sticky left-0 bg-card z-10 text-xs sm:text-sm truncate">
                                        {category}
                                      </TableCell>
                                      {monthlyBreakdown.map((cell, i) => {
                                          const percentage = cell.budget > 0 ? (cell.spent / cell.budget) * 100 : 0;
                                          const cellStatus = percentage > 100 ? 'over' : percentage > 90 ? 'warning' : cell.budget === 0 && cell.spent > 0 ? 'no-budget-spent' : 'good';
                                          const cellColorClass = getCellColor(cellStatus);
                                          
                                          return (
                                          <Tooltip key={i}>
                                            <TooltipTrigger asChild>
                                              <TableCell className={cn("text-center cursor-pointer transition-colors text-xs sm:text-sm break-all", cellColorClass)}>
                                                {cell.budget > 0 ? `฿${cell.spent.toLocaleString()}` : (cell.spent > 0 ? `฿${cell.spent.toLocaleString()}` : '-')}
                                              </TableCell>
                                            </TooltipTrigger>
                                            <TooltipContent className="text-xs">
                                                <p>งบ: ฿{cell.budget.toLocaleString()}</p>
                                                <p>ใช้ไป: ฿{cell.spent.toLocaleString()}</p>
                                                {cell.status === 'no-budget-spent' && <p className="text-blue-300">ไม่มีงบประมาณ, มีการใช้จ่าย</p>}
                                                {cell.status === 'over' && <p className="text-red-300">เกินงบประมาณ!</p>}
                                                {cell.status === 'warning' && <p className="text-yellow-300">ใกล้เกินงบประมาณ</p>}
                                            </TooltipContent>
                                          </Tooltip>
                                      )})}
                                      <TableCell className="text-right font-semibold sticky right-0 bg-card z-10 text-xs sm:text-sm break-all">
                                        ฿{totalSpent.toLocaleString()}
                                      </TableCell>
                                  </TableRow>
                              )
                          })}
                      </TableBody>
                      <TableFooter className="bg-muted/50 font-semibold sticky bottom-0 z-20">
                          <TableRow>
                              <TableCell className="font-bold sticky left-0 bg-muted/50 z-20 text-xs sm:text-sm">รวม</TableCell>
                              {Array.from({length: 12}).map((_, i) => {
                                  const monthTotal = allCategories.reduce((sum, category) => {
                                      const dataRow = analysis.annualData.find(row => row.category === category);
                                      return sum + (dataRow?.monthlyBreakdown[i]?.spent || 0);
                                  }, 0);
                                  return <TableCell key={i} className="text-center font-bold text-xs sm:text-sm break-all">฿{monthTotal.toLocaleString()}</TableCell>
                              })}
                              <TableCell className="text-right font-bold sticky right-0 bg-muted/50 z-20 text-xs sm:text-sm break-all">
                                  ฿{allCategories.reduce((sum, category) => {
                                      const dataRow = analysis.annualData.find(row => row.category === category);
                                      return sum + (dataRow?.totalSpent || 0);
                                  }, 0).toLocaleString()}
                              </TableCell>
                          </TableRow>
                      </TableFooter>
                  </Table>
            </div>
          </DialogContent>
        </Dialog>
        
        <Drawer open={isAnnualTableModalOpen && isMobile} onClose={() => setAnnualTableModalOpen(false)}>
          <DrawerContent className="h-[95vh] flex flex-col">
            <DrawerHeader className="flex-none pb-3 sm:pb-4">
              <DrawerTitle className="text-sm sm:text-base">
                รายงานงบประมาณรายปี {parseInt(selectedMonth.slice(0,4)) + 543}
              </DrawerTitle>
              <DrawerDescription className="text-xs sm:text-sm">
                  ตารางสรุปการใช้จ่ายในแต่ละหมวดหมู่และแต่ละเดือนของปี <br/>
                  <span className="text-blue-600 font-semibold">กรุณาดาวน์โหลด PNG เพื่อดูข้อสรุปที่ชัดเจนยิ่งขึ้น</span>
              </DrawerDescription>
            </DrawerHeader>
            <div className="flex-none flex flex-col sm:flex-row gap-2 mb-3 sm:mb-4 px-4 sm:px-6">
                  <Button 
                    onClick={handleDownloadPng} 
                    className="w-full text-xs sm:text-sm h-8 sm:h-9"
                  >
                    <Download className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4"/> 
                    ดาวน์โหลด PNG
                  </Button>
                  <Button 
                    onClick={handleExportToCsv} 
                    className="w-full text-xs sm:text-sm h-8 sm:h-9"
                  >
                    <FileText className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4"/> 
                    ส่งออก Excel (CSV)
                  </Button>
              </div>
            <div className="flex-grow overflow-auto px-4 sm:px-6 pb-4 sm:pb-6">
                  <Table id="annual-budget-table-mobile" className="min-w-max text-xs">
                      <TableHeader>
                          <TableRow>
                              <TableHead className="min-w-[100px] sticky left-0 bg-background z-10 text-xs">
                                หมวดหมู่
                              </TableHead>
                              {Array.from({length: 12}).map((_, i) => (
                                  <TableHead key={i} className="text-center min-w-[50px] text-xs">
                                      {format(new Date(2000, i, 1), 'LLL', {locale: th})}
                                  </TableHead>
                              ))}
                              <TableHead className="text-right min-w-[70px] sticky right-0 bg-background z-10 text-xs">
                                รวม
                              </TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {allCategories.map(category => {
                              const row = analysis.annualData.find(dataRow => dataRow.category === category);
                              const monthlyBreakdown = row ? row.monthlyBreakdown : Array.from({length: 12}).map(() => ({
                                  month: 0, spent: 0, budget: 0, status: 'good'
                              }));
                              const totalSpent = row ? row.totalSpent : 0;

                              return (
                                  <TableRow key={category}>
                                      <TableCell className="font-semibold sticky left-0 bg-card z-10 text-xs truncate">
                                        {category}
                                      </TableCell>
                                      {monthlyBreakdown.map((cell, i) => {
                                          const percentage = cell.budget > 0 ? (cell.spent / cell.budget) * 100 : 0;
                                          const cellStatus = percentage > 100 ? 'over' : percentage > 90 ? 'warning' : cell.budget === 0 && cell.spent > 0 ? 'no-budget-spent' : 'good';
                                          const cellColorClass = getCellColor(cellStatus);
                                          
                                          return (
                                          <Tooltip key={i}>
                                            <TooltipTrigger asChild>
                                              <TableCell className={cn("text-center cursor-pointer transition-colors text-xs break-all", cellColorClass)}>
                                                {cell.budget > 0 ? `฿${cell.spent.toLocaleString()}` : (cell.spent > 0 ? `฿${cell.spent.toLocaleString()}` : '-')}
                                              </TableCell>
                                            </TooltipTrigger>
                                            <TooltipContent className="text-xs">
                                                <p>งบ: ฿{cell.budget.toLocaleString()}</p>
                                                <p>ใช้ไป: ฿{cell.spent.toLocaleString()}</p>
                                                {cell.status === 'no-budget-spent' && <p className="text-blue-300">ไม่มีงบประมาณ, มีการใช้จ่าย</p>}
                                                {cell.status === 'over' && <p className="text-red-300">เกินงบประมาณ!</p>}
                                                {cell.status === 'warning' && <p className="text-yellow-300">ใกล้เกินงบประมาณ</p>}
                                            </TooltipContent>
                                          </Tooltip>
                                      )})}
                                      <TableCell className="text-right font-semibold sticky right-0 bg-card z-10 text-xs break-all">
                                        ฿{totalSpent.toLocaleString()}
                                      </TableCell>
                                  </TableRow>
                              )
                          })}
                      </TableBody>
                      <TableFooter className="bg-muted/50 font-semibold sticky bottom-0 z-20">
                          <TableRow>
                              <TableCell className="font-bold sticky left-0 bg-muted/50 z-20 text-xs">รวม</TableCell>
                              {Array.from({length: 12}).map((_, i) => {
                                  const monthTotal = allCategories.reduce((sum, category) => {
                                      const dataRow = analysis.annualData.find(row => row.category === category);
                                      return sum + (dataRow?.monthlyBreakdown[i]?.spent || 0);
                                  }, 0);
                                  return <TableCell key={i} className="text-center font-bold text-xs break-all">฿{monthTotal.toLocaleString()}</TableCell>
                              })}
                              <TableCell className="text-right font-bold sticky right-0 bg-muted/50 z-20 text-xs break-all">
                                  ฿{allCategories.reduce((sum, category) => {
                                      const dataRow = analysis.annualData.find(row => row.category === category);
                                      return sum + (dataRow?.totalSpent || 0);
                                  }, 0).toLocaleString()}
                              </TableCell>
                          </TableRow>
                      </TableFooter>
                  </Table>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </TooltipProvider>
  );
};

export default Budget;