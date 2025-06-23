// src/components/Planning.tsx

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, Target, Trash2, Edit, TrendingUp, Snowflake, Flame, Info, Home, Car, GraduationCap, Plane, Heart, Wallet, Briefcase, Handshake, RefreshCw, MoreHorizontal, BarChart2, DollarSign as DollarIcon, Utensils, Zap, BookOpen, Smile as EntertainmentSmile, CheckCircle, AlertTriangle, XCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useSupabaseFinance } from '../context/SupabaseFinanceContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format, subMonths } from 'date-fns';

// Interfaces for this component
interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  icon: string;
}
interface Debt {
  id: string;
  name: string;
  amount: number;
  interestRate: number;
  minimumPayment: number;
}

// Map goal icon names to Lucide icons
const goalIcons: Record<string, React.ElementType> = {
  "Target": Target,
  "Home": Home,
  "Car": Car,
  "GraduationCap": GraduationCap,
  "Plane": Plane,
  "Heart": Heart,
  "PiggyBank": Wallet,
  "Briefcase": Briefcase,
  "Handshake": Handshake,
};

// Goal Form Component - Enhanced Formal & Responsive
const GoalForm = ({ onSave, goal }: { onSave: (goal: Omit<Goal, 'id' | 'savedAmount'>) => void, goal?: Goal }) => {
    const [name, setName] = useState(goal?.name || '');
    const [targetAmount, setTargetAmount] = useState(goal?.targetAmount.toString() || '');
    const [icon, setIcon] = useState(goal?.icon || 'Target');
    const icons = ["Target", "Home", "Car", "GraduationCap", "Plane", "Heart", "PiggyBank", "Briefcase", "Handshake"];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !targetAmount || parseFloat(targetAmount) <= 0) {
            toast({ title: "ข้อมูลไม่ถูกต้อง", description: "กรุณากรอกชื่อเป้าหมายและจำนวนเงินที่ถูกต้อง", variant: "destructive" });
            return;
        }
        onSave({ name, targetAmount: parseFloat(targetAmount), icon });
    };

    const formatCurrency = (amount: number) => `฿${amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const GetIconComponent = goalIcons[icon] || Target;

    return (
        <div className="w-full max-w-full overflow-hidden">
            <form onSubmit={handleSubmit} className="space-y-4 p-4 w-full">
                <div className="space-y-2">
                    <Label htmlFor="goal-name" className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        ชื่อเป้าหมาย
                    </Label>
                    <Input 
                        id="goal-name" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        placeholder="เช่น ดาวน์บ้าน, ท่องเที่ยวญี่ปุ่น" 
                        className="w-full h-11 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500" 
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="goal-amount" className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        จำนวนเงินเป้าหมาย (บาท)
                    </Label>
                    <Input 
                        id="goal-amount" 
                        type="number" 
                        value={targetAmount} 
                        onChange={(e) => setTargetAmount(e.target.value)} 
                        placeholder="0" 
                        className="w-full h-11 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500" 
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">เลือกไอคอน</Label>
                    <Select value={icon} onValueChange={setIcon}>
                        <SelectTrigger className="w-full h-11 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                            <div className="flex items-center gap-3">
                                <GetIconComponent size={20} className="text-blue-600"/>
                                <SelectValue placeholder="เลือกไอคอน" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                            {icons.map(i => {
                                const IconComponent = goalIcons[i] || Target;
                                return (
                                    <SelectItem key={i} value={i} className="py-3">
                                        <div className="flex items-center gap-3">
                                            <IconComponent size={18} className="text-blue-600"/>
                                            <span className="text-base">{i}</span>
                                        </div>
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                </div>
                <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-semibold mt-6 bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                >
                    {goal ? "บันทึกการเปลี่ยนแปลง" : "สร้างเป้าหมาย"}
                </Button>
            </form>
        </div>
    );
};

const ITEMS_PER_PAGE_DEBT_PLAN = 10;

// Main Planning Component - Fully Formal & Responsive
const Planning = () => {
  const { transactions, loading: transactionsLoading } = useSupabaseFinance();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [debts, setDebts] = useState<Debt[]>([
    { id: '1', name: 'บัตรเครดิต', amount: 50000, interestRate: 18, minimumPayment: 1500 },
    { id: '2', name: 'สินเชื่อรถยนต์', amount: 300000, interestRate: 5, minimumPayment: 6000 }
  ]);
  const [extraPayment, setExtraPayment] = useState('1000');
  const [strategy, setStrategy] = useState<'snowball' | 'avalanche'>('avalanche');
  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);
  const isMobile = useIsMobile();
  const [currentDebtPlanPage, setCurrentDebtPlanPage] = useState(1);

  // Load goals from local storage on mount
  useEffect(() => {
    const savedGoals = localStorage.getItem('financialGoals');
    if (savedGoals) {
      setGoals(JSON.parse(savedGoals));
    }
  }, []);

  // Save goals to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('financialGoals', JSON.stringify(goals));
  }, [goals]);

  // Calculate total income, expense, and savings from transactions
  const { totalIncome, totalExpense, totalSavings } = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { totalIncome: income, totalExpense: expense, totalSavings: income - expense };
  }, [transactions]);

  // Calculate average monthly savings based on all transaction history
  const averageMonthlySavings = useMemo(() => {
      const savingsByMonth: {[key: string]: number} = {};
      transactions.forEach(t => {
          const month = t.date.slice(0, 7);
          if(!savingsByMonth[month]) savingsByMonth[month] = 0;
          savingsByMonth[month] += t.type === 'income' ? t.amount : -t.amount;
      });
      const monthlyValues = Object.values(savingsByMonth);
      if(monthlyValues.length === 0) return 0;
      const total = monthlyValues.reduce((sum, val) => sum + val, 0);
      return total / monthlyValues.length;
  }, [transactions]);

  // Handle saving a new or edited goal
  const handleSaveGoal = useCallback((goalData: Omit<Goal, 'id' | 'savedAmount'>) => {
    setGoals(prev => {
        if (goalData.id) {
            return prev.map(g => g.id === goalData.id ? { ...g, ...goalData } : g);
        }
        return [...prev, { ...goalData, id: Date.now().toString(), savedAmount: 0 }];
    });
    setIsGoalFormOpen(false);
  }, []);

  // Debt Payoff Plan calculation (Snowball vs. Avalanche)
  const debtPayoffPlan = useMemo(() => {
    if (debts.length === 0) return { plan: [], totalMonths: 0, totalInterestPaid: 0 };

    let remainingDebts = JSON.parse(JSON.stringify(debts));

    if (strategy === 'snowball') {
      remainingDebts.sort((a: Debt, b: Debt) => a.amount - b.amount);
    } else {
      remainingDebts.sort((a: Debt, b: Debt) => b.interestRate - a.interestRate);
    }

    let months = 0;
    let totalInterestPaid = 0;
    const plan: { month: number; debtName: string; payment: number; interestPaid: number; principalPaid: number; remaining: number; status: 'paid' | 'paying' }[] = [];
    let extraAmountAvailable = parseFloat(extraPayment) || 0;

    const maxMonths = 360;

    while(remainingDebts.some((d: Debt) => d.amount > 0) && months < maxMonths) {
        months++;

        for (const debt of remainingDebts) {
            if (debt.amount <= 0) continue;

            const monthlyInterestRate = debt.interestRate / 100 / 12;
            const interestForThisMonth = debt.amount * monthlyInterestRate;

            const principalComponentOfMinPayment = Math.max(0, debt.minimumPayment - interestForThisMonth);
            const interestComponentOfMinPayment = Math.min(debt.minimumPayment, interestForThisMonth);

            debt.amount += interestForThisMonth;
            debt.amount -= principalComponentOfMinPayment;

            totalInterestPaid += interestForThisMonth;

            plan.push({
                month: months,
                debtName: debt.name,
                payment: debt.minimumPayment,
                interestPaid: interestComponentOfMinPayment,
                principalPaid: principalComponentOfMinPayment,
                remaining: debt.amount,
                status: debt.amount <= 0 ? 'paid' : 'paying',
            });
        }

        if (strategy === 'snowball') {
            remainingDebts.sort((a: Debt, b: Debt) => a.amount - b.amount);
        } else {
            remainingDebts.sort((a: Debt, b: Debt) => b.interestRate - a.interestRate);
        }

        for (const debt of remainingDebts) {
            if (debt.amount <= 0 || extraAmountAvailable <= 0) continue;

            const paymentFromPool = Math.min(debt.amount, extraAmountAvailable);
            if (paymentFromPool > 0) {
                const monthlyInterestRate = debt.interestRate / 100 / 12;
                const theoreticalInterestForPayment = Math.min(debt.amount * monthlyInterestRate, paymentFromPool);

                debt.amount -= paymentFromPool;
                extraAmountAvailable -= paymentFromPool;

                const existingEntryIndex = plan.findIndex(entry => entry.month === months && entry.debtName === debt.name);
                if (existingEntryIndex !== -1) {
                    plan[existingEntryIndex].payment += paymentFromPool;
                    plan[existingEntryIndex].principalPaid += paymentFromPool;
                    plan[existingEntryIndex].remaining = debt.amount;
                    plan[existingEntryIndex].status = debt.amount <= 0 ? 'paid' : 'paying';
                } else {
                    plan.push({
                        month: months,
                        debtName: debt.name,
                        payment: paymentFromPool,
                        interestPaid: 0,
                        principalPaid: paymentFromPool,
                        remaining: debt.amount,
                        status: debt.amount <= 0 ? 'paid' : 'paying',
                    });
                }
            }
        }

        if (strategy === 'snowball') {
            for (const debt of remainingDebts) {
                if (debt.amount <= 0 && debt.minimumPayment > 0 && !(debt as any).rolledUp) {
                    extraAmountAvailable += debt.minimumPayment;
                    (debt as any).rolledUp = true;
                }
            }
        }
    }

    const consolidatedPlan: typeof plan = [];
    plan.forEach(entry => {
        const existing = consolidatedPlan.find(cpEntry => cpEntry.month === entry.month && cpEntry.debtName === entry.debtName);
        if (existing) {
            existing.payment += entry.payment;
            existing.interestPaid += entry.interestPaid;
            existing.principalPaid += entry.principalPaid;
            existing.remaining = entry.remaining;
            existing.status = entry.status;
        } else {
            consolidatedPlan.push({ ...entry });
        }
    });

    const finalFilteredPlan = consolidatedPlan.filter(entry => entry.payment > 0 || entry.status === 'paid');

    return { plan: finalFilteredPlan, totalMonths: months, totalInterestPaid: Math.round(totalInterestPaid) };
  }, [debts, extraPayment, strategy]);

  const totalDebtPlanPages = Math.ceil(debtPayoffPlan.plan.length / ITEMS_PER_PAGE_DEBT_PLAN);
  const paginatedDebtPlan = debtPayoffPlan.plan.slice(
    (currentDebtPlanPage - 1) * ITEMS_PER_PAGE_DEBT_PLAN,
    currentDebtPlanPage * ITEMS_PER_PAGE_DEBT_PLAN
  );

  // Helper function to generate pagination pages dynamically
  const getPaginationPages = (currentPage: number, totalPages: number) => {
    const pages: (number | string)[] = [];
    const displayRange = isMobile ? 1 : 2;

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > displayRange + 2) {
        pages.push('...');
      }

      const start = Math.max(2, currentPage - displayRange);
      const end = Math.min(totalPages - 1, currentPage + displayRange);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - displayRange - 1) {
        pages.push('...');
      }

      if (totalPages > 1 && !pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const paginationPages = getPaginationPages(currentDebtPlanPage, totalDebtPlanPages);

  // Render goals icon dynamically
  const GetGoalIcon = (iconName: string) => {
    const IconComponent = goalIcons[iconName] || Target;
    return <IconComponent size={isMobile ? 20 : 24} />;
  }

  // Enhanced Formal Skeleton loader - 100% Responsive
  const PlanningSkeleton = () => (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 space-y-8 max-w-7xl">
        {/* Header skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-6 w-full max-w-lg" />
        </div>
        
        {/* Goals section skeleton */}
        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-96" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({length: 3}).map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Debt section skeleton */}
        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-5 w-full max-w-2xl" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Skeleton className="h-7 w-48" />
                {Array.from({length: 2}).map((_, i) => (
                  <Skeleton key={i} className="h-40 w-full" />
                ))}
              </div>
              <div className="space-y-4">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Show skeleton while transactions are loading
  if (transactionsLoading) return <PlanningSkeleton />;

  return (
    <TooltipProvider>
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 space-y-8 max-w-7xl">
        {/* Header Section - Formal & Responsive */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
            วางแผนอนาคตทางการเงิน
          </h1>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-300">
            ตั้งเป้าหมาย วางแผนการชำระหนี้ และสร้างความมั่งคั่งอย่างเป็นระบบ
          </p>
        </div>

        {/* Financial Goals Section - Formal & 100% Responsive */}
        <Card className="shadow-lg border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-4 bg-white dark:bg-gray-800 rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              <Target className="h-6 w-6 md:h-7 md:w-7 text-blue-600"/>
              เป้าหมายทางการเงิน
            </CardTitle>
            <CardDescription className="text-sm md:text-base text-gray-600 dark:text-gray-300">
              ตั้งเป้าหมายและติดตามความคืบหน้าของคุณอย่างเป็นระบบ
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  <AnimatePresence>
                  {goals.map(goal => {
                      const progressValue = (totalSavings / goal.targetAmount) * 100;
                      const remainingAmount = goal.targetAmount - totalSavings;
                      const monthsToAchieve = averageMonthlySavings > 0 ? Math.ceil(remainingAmount / averageMonthlySavings) : null;
                      const GoalIconComponent = goalIcons[goal.icon] || Target;

                      return (
                          <motion.div 
                              key={goal.id} 
                              layout 
                              initial={{ opacity: 0, scale: 0.9 }} 
                              animate={{ opacity: 1, scale: 1 }} 
                              exit={{ opacity: 0, scale: 0.9 }} 
                              transition={{ duration: 0.3 }} 
                              className="w-full"
                          >
                              <Card className="h-full hover:shadow-xl transition-all duration-300 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                  <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start gap-3">
                                      <div className="flex items-center gap-3 flex-1 min-w-0">
                                          <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg text-blue-600 dark:text-blue-400 flex-shrink-0">
                                            <GoalIconComponent size={24} />
                                          </div>
                                          <CardTitle className="text-base md:text-lg font-bold truncate text-gray-900 dark:text-white">
                                            {goal.name}
                                          </CardTitle>
                                      </div>
                                      <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                              <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                className="text-gray-500 dark:text-gray-400 h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0" 
                                                aria-label="ตัวเลือกเป้าหมาย"
                                              >
                                                <MoreHorizontal size={16}/>
                                              </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                              <AlertDialog>
                                                  <AlertDialogTrigger asChild>
                                                      <DropdownMenuItem 
                                                        onSelect={e => e.preventDefault()} 
                                                        className="text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950 text-sm"
                                                      >
                                                        <Trash2 className="mr-2 h-4 w-4"/>
                                                        ลบเป้าหมาย
                                                      </DropdownMenuItem>
                                                  </AlertDialogTrigger>
                                                  <AlertDialogContent className="w-[95vw] max-w-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                                      <AlertDialogHeader>
                                                        <AlertDialogTitle className="text-base md:text-lg text-gray-900 dark:text-white">
                                                          ยืนยันการลบเป้าหมาย
                                                        </AlertDialogTitle>
                                                        <AlertDialogDescription className="text-sm md:text-base text-gray-600 dark:text-gray-300">
                                                          คุณแน่ใจหรือไม่ที่จะลบเป้าหมาย "{goal.name}"? การกระทำนี้ไม่สามารถย้อนกลับได้
                                                        </AlertDialogDescription>
                                                      </AlertDialogHeader>
                                                      <AlertDialogFooter className="flex-col sm:flex-row gap-3">
                                                        <AlertDialogCancel className="w-full sm:w-auto text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600">
                                                          ยกเลิก
                                                        </AlertDialogCancel>
                                                        <AlertDialogAction 
                                                          onClick={() => setGoals(g => g.filter(item => item.id !== goal.id))} 
                                                          className="w-full sm:w-auto bg-red-600 text-white hover:bg-red-700 text-sm"
                                                        >
                                                          ยืนยันการลบ
                                                        </AlertDialogAction>
                                                      </AlertDialogFooter>
                                                  </AlertDialogContent>
                                              </AlertDialog>
                                          </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                      <Progress 
                                        value={Math.max(0, Math.min(100, progressValue))} 
                                        className="h-3"
                                      />
                                      <div className="text-sm space-y-2">
                                          <div className="flex flex-wrap items-center gap-1">
                                            <span className="font-semibold text-gray-900 dark:text-white">ความคืบหน้า:</span> 
                                            <span className="font-bold text-green-600 dark:text-green-400">
                                              ฿{Math.max(0, totalSavings).toLocaleString()}
                                            </span>
                                            <span className="text-gray-500 dark:text-gray-400">/</span>
                                            <span className="text-gray-600 dark:text-gray-300">
                                              ฿{goal.targetAmount.toLocaleString()}
                                            </span>
                                          </div>
                                          {remainingAmount > 0 && averageMonthlySavings > 0 && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                              คาดว่าจะสำเร็จในอีก <span className="font-semibold text-blue-600 dark:text-blue-400">{monthsToAchieve}</span> เดือน 
                                              <br className="sm:hidden" />
                                              <span className="hidden sm:inline"> (</span>
                                              <span className="sm:inline">ออมเดือนละ ฿{averageMonthlySavings.toLocaleString()} โดยประมาณ</span>
                                              <span className="hidden sm:inline">)</span>
                                            </p>
                                          )}
                                          {remainingAmount <= 0 && (
                                            <p className="text-sm text-green-600 dark:text-green-400 font-semibold">
                                              🎉 เป้าหมายนี้สำเร็จแล้ว!
                                            </p>
                                          )}
                                          {remainingAmount > 0 && averageMonthlySavings <= 0 && (
                                            <p className="text-sm text-orange-600 dark:text-orange-400 font-semibold">
                                              ⚠️ เพิ่มการออมเพื่อบรรลุเป้าหมาย
                                            </p>
                                          )}
                                      </div>
                                  </CardContent>
                              </Card>
                          </motion.div>
                      );
                  })}
                  </AnimatePresence>
                  
                  {/* Add New Goal Button - Formal & Responsive */}
                  <Dialog open={isGoalFormOpen} onOpenChange={setIsGoalFormOpen}>
                      <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            className="h-full min-h-[200px] w-full flex-col gap-4 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-200 bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-950"
                          >
                              <Plus size={32} className="text-current"/>
                              <span className="text-base font-semibold">เพิ่มเป้าหมายใหม่</span>
                          </Button>
                      </DialogTrigger>
                      <DialogContent className="w-[95vw] max-w-2xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                          <DialogHeader>
                              <DialogTitle className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                                สร้างเป้าหมายใหม่
                              </DialogTitle>
                              <DialogDescription className="text-base text-gray-600 dark:text-gray-300">
                                  กำหนดเป้าหมายทางการเงินของคุณอย่างชัดเจน
                              </DialogDescription>
                          </DialogHeader>
                          <GoalForm onSave={handleSaveGoal}/>
                      </DialogContent>
                  </Dialog>
              </div>
          </CardContent>
        </Card>

        {/* Debt Payoff Planner Section - Formal & 100% Responsive */}
        <Card id="debt-payoff-planner-section" className="shadow-lg border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-4 bg-white dark:bg-gray-800 rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              <Flame className="h-6 w-6 md:h-7 md:w-7 text-red-600" />
              เครื่องมือวางแผนชำระหนี้
            </CardTitle>
            <CardDescription className="text-sm md:text-base text-gray-600 dark:text-gray-300">
              เลือกกลยุทธ์และวางแผนเพื่ออิสรภาพทางการเงินของคุณอย่างเป็นระบบ
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            {/* Debt Strategy & Extra Payment Controls - Formal & Responsive */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-700 border border-blue-200 dark:border-gray-600">
                <div className="space-y-2">
                    <Label htmlFor="extra-payment" className="text-sm font-bold text-gray-900 dark:text-white">
                      ยอดชำระเพิ่มเติมต่อเดือน
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-semibold">
                        ฿
                      </span>
                      <Input 
                        id="extra-payment" 
                        type="number" 
                        value={extraPayment} 
                        onChange={e => setExtraPayment(e.target.value)} 
                        placeholder="0" 
                        className="h-12 pl-8 text-base font-semibold border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-800"
                      />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-bold text-gray-900 dark:text-white">กลยุทธ์การชำระหนี้</Label>
                  <Select value={strategy} onValueChange={(v: any) => setStrategy(v)}>
                      <SelectTrigger className="h-12 text-base font-semibold border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-800">
                          <SelectValue placeholder="เลือกกลยุทธ์"/>
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                          <SelectItem value="avalanche" className="py-3">
                              <Tooltip>
                                <TooltipTrigger className="flex items-center gap-3 w-full text-left">
                                  <Flame size={18} className="text-red-600"/>
                                  <div className="text-left">
                                    <div className="font-semibold">Debt Avalanche</div>
                                    <div className="text-xs text-gray-500">จ่ายดอกเบี้ยสูงก่อน</div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                  <p className="font-semibold text-sm">Debt Avalanche:</p>
                                  <p className="text-sm">มุ่งเน้นชำระหนี้ที่มีอัตราดอกเบี้ยสูงสุดก่อน ช่วยประหยัดดอกเบี้ยได้มากที่สุดในระยะยาว</p>
                                </TooltipContent>
                              </Tooltip>
                          </SelectItem>
                          <SelectItem value="snowball" className="py-3">
                              <Tooltip>
                                <TooltipTrigger className="flex items-center gap-3 w-full text-left">
                                  <Snowflake size={18} className="text-blue-600"/>
                                  <div className="text-left">
                                    <div className="font-semibold">Debt Snowball</div>
                                    <div className="text-xs text-gray-500">จ่ายยอดน้อยก่อน</div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                  <p className="font-semibold text-sm">Debt Snowball:</p>
                                  <p className="text-sm">มุ่งเน้นชำระหนี้ที่มีจำนวนน้อยที่สุดก่อน เพื่อสร้างแรงจูงใจและความรู้สึกสำเร็จ</p>
                                </TooltipContent>
                              </Tooltip>
                          </SelectItem>
                      </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Alert className="w-full border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-950">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400"/>
                    <AlertDescription className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                      ใส่รายการหนี้สินของคุณในตารางด้านล่างเพื่อเริ่มวางแผน
                    </AlertDescription>
                  </Alert>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Debt List Management - Formal & Responsive */}
              <div className="space-y-6">
                <h4 className="font-bold text-lg md:text-xl text-gray-900 dark:text-white flex items-center gap-2">
                  <DollarIcon className="h-5 w-5 text-red-600"/>
                  รายการหนี้สินปัจจุบัน
                </h4>
                {debts.length > 0 ? (
                  <div className="space-y-4">
                      <AnimatePresence mode="popLayout">
                      {debts.map((debt, index) => (
                      <motion.div
                          key={debt.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                          transition={{ duration: 0.2 }}
                          className="border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800"
                      >
                          <Collapsible>
                              <CollapsibleTrigger asChild>
                                  <div className="flex items-center justify-between p-4 cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-t-xl transition-colors">
                                      <div className="flex flex-col text-left flex-grow mr-3 min-w-0">
                                          <span className="font-bold text-base text-gray-900 dark:text-white truncate">
                                            {debt.name || 'หนี้สินใหม่'}
                                          </span>
                                          <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
                                          {formatCurrency(debt.amount)} | {debt.interestRate}% ดอกเบี้ย | {formatCurrency(debt.minimumPayment)}/เดือน
                                          </span>
                                      </div>
                                      <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform data-[state=open]:rotate-180 flex-shrink-0" />
                                  </div>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="p-4 bg-white dark:bg-gray-800 rounded-b-xl border-t border-gray-200 dark:border-gray-700">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                          <Label htmlFor={`debt-name-${debt.id}`} className="text-sm font-semibold text-gray-900 dark:text-white">
                                            ชื่อหนี้สิน
                                          </Label>
                                          <Input
                                              id={`debt-name-${debt.id}`}
                                              value={debt.name}
                                              placeholder="ชื่อหนี้สิน"
                                              className="h-11 text-base border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-800"
                                              onChange={(e) => setDebts(d => d.map(i => i.id === debt.id ? {...i, name: e.target.value} : i))}
                                              aria-label="ชื่อหนี้สิน"
                                          />
                                      </div>
                                      <div className="space-y-2">
                                          <Label htmlFor={`debt-amount-${debt.id}`} className="text-sm font-semibold text-gray-900 dark:text-white">
                                            ยอดหนี้คงเหลือ (บาท)
                                          </Label>
                                          <Input
                                              id={`debt-amount-${debt.id}`}
                                              type="number"
                                              value={debt.amount}
                                              placeholder="0"
                                              className="h-11 text-base border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-800"
                                              onChange={(e) => setDebts(d => d.map(i => i.id === debt.id ? {...i, amount: parseFloat(e.target.value) || 0} : i))}
                                              aria-label="ยอดหนี้คงเหลือ"
                                          />
                                      </div>
                                      <div className="space-y-2">
                                          <Label htmlFor={`debt-interest-${debt.id}`} className="text-sm font-semibold text-gray-900 dark:text-white">
                                            อัตราดอกเบี้ยต่อปี (%)
                                          </Label>
                                          <Input
                                              id={`debt-interest-${debt.id}`}
                                              type="number"
                                              step="0.01"
                                              value={debt.interestRate}
                                              placeholder="0.00"
                                              className="h-11 text-base border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-800"
                                              onChange={(e) => setDebts(d => d.map(i => i.id === debt.id ? {...i, interestRate: parseFloat(e.target.value) || 0} : i))}
                                              aria-label="อัตราดอกเบี้ย"
                                          />
                                      </div>
                                      <div className="space-y-2">
                                          <Label htmlFor={`debt-min-payment-${debt.id}`} className="text-sm font-semibold text-gray-900 dark:text-white">
                                            ยอดผ่อนขั้นต่ำต่อเดือน (บาท)
                                          </Label>
                                          <Input
                                              id={`debt-min-payment-${debt.id}`}
                                              type="number"
                                              value={debt.minimumPayment}
                                              placeholder="0"
                                              className="h-11 text-base border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-800"
                                              onChange={(e) => setDebts(d => d.map(i => i.id === debt.id ? {...i, minimumPayment: parseFloat(e.target.value) || 0} : i))}
                                              aria-label="ยอดผ่อนขั้นต่ำ"
                                          />
                                      </div>
                                  </div>
                                  <Button 
                                    variant="outline" 
                                    className="w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 border-red-300 dark:border-red-600 mt-4 h-11 text-base font-semibold" 
                                    onClick={() => setDebts(d => d.filter(i => i.id !== debt.id))}
                                  >
                                    <Trash2 className="mr-2 h-5 w-5"/>
                                    ลบรายการหนี้สิน
                                  </Button>
                              </CollapsibleContent>
                          </Collapsible>
                      </motion.div>
                      ))}
                      </AnimatePresence>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800">
                      <Info className="mx-auto h-12 w-12 mb-4 text-gray-400"/>
                      <h5 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">ไม่มีรายการหนี้สิน</h5>
                      <p className="text-base">เพิ่มหนี้สินของคุณเพื่อเริ่มวางแผนการชำระ</p>
                  </div>
                )}
                <Button 
                  onClick={() => setDebts(d => [...d, {id: Date.now().toString(), name: '', amount: 0, interestRate: 0, minimumPayment: 0}])} 
                  className="w-full flex items-center justify-center gap-3 h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                >
                  <Plus className="h-5 w-5"/>
                  เพิ่มรายการหนี้ใหม่
                </Button>
              </div>

              {/* Debt Payoff Plan Summary & Detailed Schedule - Formal & Responsive */}
              <div className="space-y-6">
                <h4 className="font-bold text-lg md:text-xl text-gray-900 dark:text-white flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-green-600"/>
                  สรุปแผนการชำระหนี้
                </h4>
                {debts.length > 0 && (parseFloat(extraPayment) > 0 || debts.some(d => d.minimumPayment > 0)) ? (
                  <>
                      <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-6 rounded-xl bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900 dark:to-emerald-800 text-center space-y-3 shadow-lg border border-green-200 dark:border-green-700"
                      >
                          <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                            คุณจะปลอดหนี้ใน
                          </p>
                          <p className="text-5xl md:text-6xl font-black text-green-700 dark:text-green-300">
                            {debtPayoffPlan.totalMonths}
                          </p>
                          <p className="text-xl font-bold text-green-700 dark:text-green-300">เดือน</p>
                          <p className="text-sm font-medium text-green-600 dark:text-green-400 pt-2">
                            ประหยัดดอกเบี้ยรวม ฿{debtPayoffPlan.totalInterestPaid.toLocaleString()}
                          </p>
                      </motion.div>

                      <div className="space-y-4">
                        <h5 className="font-bold text-base md:text-lg text-gray-900 dark:text-white">
                          ตารางการชำระหนี้โดยละเอียด
                        </h5>
                        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800">
                            <Table className="min-w-full">
                                <TableHeader className="bg-gray-50 dark:bg-gray-700">
                                    <TableRow>
                                        <TableHead className="min-w-[60px] text-sm font-bold text-gray-900 dark:text-white">
                                          เดือน
                                        </TableHead>
                                        <TableHead className="min-w-[120px] text-sm font-bold text-gray-900 dark:text-white">
                                          ชื่อหนี้สิน
                                        </TableHead>
                                        <TableHead className="text-right min-w-[90px] text-sm font-bold text-gray-900 dark:text-white">
                                          ยอดชำระ
                                        </TableHead>
                                        <TableHead className="text-right min-w-[90px] text-sm font-bold text-gray-900 dark:text-white">
                                          ดอกเบี้ย
                                        </TableHead>
                                        <TableHead className="text-right min-w-[90px] text-sm font-bold text-gray-900 dark:text-white">
                                          เงินต้น
                                        </TableHead>
                                        <TableHead className="text-right min-w-[100px] text-sm font-bold text-gray-900 dark:text-white">
                                          คงเหลือ
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedDebtPlan.map((entry, idx) => (
                                        <TableRow 
                                          key={idx} 
                                          className={cn(
                                            entry.status === 'paid' 
                                              ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
                                              : 'hover:bg-gray-50 dark:hover:bg-gray-700', 
                                            entry.remaining <= 0 ? 'text-green-700 dark:text-green-300 font-semibold' : ''
                                          )}
                                        >
                                            <TableCell className="text-sm font-medium">{entry.month}</TableCell>
                                            <TableCell className="text-sm font-medium truncate">{entry.debtName}</TableCell>
                                            <TableCell className="text-right text-sm font-semibold">
                                              ฿{entry.payment.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right text-sm font-semibold text-red-600 dark:text-red-400">
                                              ฿{entry.interestPaid.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right text-sm font-semibold text-blue-600 dark:text-blue-400">
                                              ฿{entry.principalPaid.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right text-sm font-semibold">
                                              ฿{Math.max(0, entry.remaining).toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {paginatedDebtPlan.length === 0 && debtPayoffPlan.plan.length > 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center text-gray-500 dark:text-gray-400 h-20">
                                                <Info className="mx-auto h-8 w-8 mb-2"/>
                                                <span className="text-base">ไม่มีรายการในหน้านี้ โปรดลองหน้าอื่น</span>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                                <TableFooter className="bg-gray-100 dark:bg-gray-700">
                                    <TableRow>
                                        <TableCell colSpan={3} className="font-bold text-sm text-gray-900 dark:text-white">
                                          รวมดอกเบี้ยที่จ่ายทั้งหมด:
                                        </TableCell>
                                        <TableCell colSpan={3} className="text-right font-bold text-base text-red-600 dark:text-red-400">
                                          ฿{debtPayoffPlan.totalInterestPaid.toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </div>
                        
                        {/* Enhanced Formal Pagination - 100% Responsive */}
                        {totalDebtPlanPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                <Pagination className="flex-grow justify-center sm:justify-start">
                                    <PaginationContent className="flex-wrap gap-2">
                                        <PaginationPrevious
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setCurrentDebtPlanPage(p => Math.max(1, p - 1));
                                            }}
                                            className={cn(
                                              currentDebtPlanPage === 1 ? 'pointer-events-none opacity-50' : '', 
                                              'h-10 w-10 text-sm font-semibold border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-950'
                                            )}
                                        />
                                        {paginationPages.map((page, index) => (
                                            <PaginationItem key={index}>
                                                {page === '...' ? (
                                                    <span className="h-10 w-10 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm font-semibold">
                                                      ...
                                                    </span>
                                                ) : (
                                                    <PaginationLink
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setCurrentDebtPlanPage(page as number);
                                                        }}
                                                        isActive={currentDebtPlanPage === page}
                                                        className="h-10 w-10 text-sm font-semibold border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                                                    >
                                                        {page}
                                                    </PaginationLink>
                                                )}
                                            </PaginationItem>
                                        ))}
                                        <PaginationNext
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setCurrentDebtPlanPage(p => Math.min(totalDebtPlanPages, p + 1));
                                            }}
                                            className={cn(
                                              currentDebtPlanPage === totalDebtPlanPages ? 'pointer-events-none opacity-50' : '', 
                                              'h-10 w-10 text-sm font-semibold border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-950'
                                            )}
                                        />
                                    </PaginationContent>
                                </Pagination>
                                
                                {/* Enhanced Page Jump Select */}
                                <div className="flex items-center gap-3 mt-3 sm:mt-0">
                                    <Label htmlFor="page-select" className="text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                      ไปยังหน้า:
                                    </Label>
                                    <Select 
                                      value={String(currentDebtPlanPage)} 
                                      onValueChange={(value) => {
                                        setCurrentDebtPlanPage(Number(value));
                                        const planningSection = document.getElementById('debt-payoff-planner-section');
                                        if (planningSection) {
                                            planningSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }
                                      }}
                                    >
                                        <SelectTrigger 
                                          id="page-select" 
                                          className="h-10 w-[120px] text-sm font-semibold border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                                        >
                                            <SelectValue placeholder={`หน้า ${currentDebtPlanPage}`} />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                            {Array.from({ length: totalDebtPlanPages }, (_, i) => i + 1).map(page => (
                                                <SelectItem key={page} value={String(page)} className="text-sm font-medium">
                                                    หน้า {page}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                      </div>
                  </>
                ) : (
                  <div className="p-8 rounded-xl bg-gray-100 dark:bg-gray-800 text-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                      <Info className="mx-auto h-12 w-12 mb-4 text-gray-400"/>
                      <h5 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">
                        ยังไม่มีข้อมูลสำหรับการวางแผน
                      </h5>
                      <p className="text-base">
                        กรอกข้อมูลหนี้สินและยอดชำระเพิ่มเติมเพื่อดูแผนการชำระหนี้โดยละเอียด
                      </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </TooltipProvider>
  );
};

export default Planning;