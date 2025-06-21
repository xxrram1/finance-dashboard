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

// Goal Form Component - Enhanced Responsive
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

    const GetIconComponent = goalIcons[icon] || Target;

    return (
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 p-3 sm:p-4">
            <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="goal-name" className="text-sm sm:text-base font-medium">ชื่อเป้าหมาย</Label>
                <Input 
                    id="goal-name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="เช่น ดาวน์บ้าน, ท่องเที่ยวญี่ปุ่น" 
                    className="h-9 sm:h-10 text-sm sm:text-base" 
                />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="goal-amount" className="text-sm sm:text-base font-medium">จำนวนเงินเป้าหมาย</Label>
                <Input 
                    id="goal-amount" 
                    type="number" 
                    value={targetAmount} 
                    onChange={(e) => setTargetAmount(e.target.value)} 
                    placeholder="฿" 
                    className="h-9 sm:h-10 text-sm sm:text-base" 
                />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-sm sm:text-base font-medium">ไอคอน</Label>
                <Select value={icon} onValueChange={setIcon}>
                    <SelectTrigger className="h-9 sm:h-10 text-sm sm:text-base flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <GetIconComponent size={16} className="text-primary sm:w-5 sm:h-5"/>
                            <SelectValue placeholder="เลือกไอคอน" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        {icons.map(i => {
                            const IconComponent = goalIcons[i] || Target;
                            return (
                                <SelectItem key={i} value={i}>
                                    <div className="flex items-center gap-2">
                                        <IconComponent size={16} className="sm:w-5 sm:h-5"/>
                                        <span className="text-sm sm:text-base">{i}</span>
                                    </div>
                                </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>
            </div>
            <Button 
                type="submit" 
                className="w-full h-9 sm:h-10 lg:h-11 text-sm sm:text-base lg:text-lg font-semibold mt-4"
            >
                {goal ? "บันทึกการเปลี่ยนแปลง" : "สร้างเป้าหมาย"}
            </Button>
        </form>
    );
};

const ITEMS_PER_PAGE_DEBT_PLAN = 10;

// Main Planning Component - Fully Responsive
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

  // Enhanced Skeleton loader for Planning component - Fully Responsive
  const PlanningSkeleton = () => (
    <div className="space-y-6 sm:space-y-8 p-2 sm:p-4 lg:p-6 xl:p-8">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-7 sm:h-8 lg:h-10 w-full sm:w-2/3 lg:w-1/2" />
        <Skeleton className="h-4 sm:h-5 lg:h-6 w-full sm:w-1/2 lg:w-1/3" />
      </div>
      
      {/* Goals section skeleton */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <Skeleton className="h-6 sm:h-7 lg:h-8 w-48 sm:w-64" />
          <Skeleton className="h-4 sm:h-5 w-full sm:w-80" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({length: 3}).map((_, i) => (
              <Skeleton key={i} className="h-36 sm:h-40 lg:h-48" />
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Debt section skeleton */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <Skeleton className="h-6 sm:h-7 lg:h-8 w-56 sm:w-72" />
          <Skeleton className="h-4 sm:h-5 w-full sm:w-96" />
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <Skeleton className="h-20 sm:h-24 w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-3 sm:space-y-4">
              <Skeleton className="h-6 sm:h-7 w-48" />
              {Array.from({length: 2}).map((_, i) => (
                <Skeleton key={i} className="h-32 sm:h-40 w-full" />
              ))}
            </div>
            <div className="space-y-3 sm:space-y-4">
              <Skeleton className="h-6 sm:h-7 w-48" />
              <Skeleton className="h-32 sm:h-40 w-full" />
              <Skeleton className="h-48 sm:h-64 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Show skeleton while transactions are loading
  if (transactionsLoading) return <PlanningSkeleton />;

  return (
    <TooltipProvider>
    <div className="space-y-6 sm:space-y-8 p-2 sm:p-4 lg:p-6 xl:p-8">
      {/* Header Section - Enhanced Responsive */}
      <div className="space-y-1 sm:space-y-2">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">วางแผนอนาคตทางการเงิน</h1>
        <p className="text-sm sm:text-base text-muted-foreground">ตั้งเป้าหมาย, วางแผนการชำระหนี้, และสร้างความมั่งคั่ง</p>
      </div>

      {/* Financial Goals Section - Enhanced Responsive */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl lg:text-2xl">
            <Target className="h-5 w-5 sm:h-6 sm:w-6"/>
            เป้าหมายทางการเงิน
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            ตั้งเป้าหมายและติดตามความคืบหน้าของคุณ
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                            <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                                <CardHeader className="pb-2 sm:pb-3">
                                  <div className="flex justify-between items-start gap-2">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div className="bg-primary/10 p-1.5 sm:p-2 rounded-lg text-primary flex-shrink-0">
                                          <GoalIconComponent size={isMobile ? 16 : 20} className="sm:w-6 sm:h-6" />
                                        </div>
                                        <CardTitle className="text-sm sm:text-base lg:text-lg font-semibold truncate">
                                          {goal.name}
                                        </CardTitle>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button 
                                              size="icon" 
                                              variant="ghost" 
                                              className="text-muted-foreground h-6 w-6 sm:h-8 sm:w-8 hover:bg-muted flex-shrink-0" 
                                              aria-label="ตัวเลือกเป้าหมาย"
                                            >
                                              <MoreHorizontal size={isMobile ? 12 : 16}/>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <DropdownMenuItem 
                                                      onSelect={e => e.preventDefault()} 
                                                      className="text-destructive focus:text-destructive focus:bg-red-100 text-xs sm:text-sm"
                                                    >
                                                      <Trash2 className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4"/>
                                                      ลบ
                                                    </DropdownMenuItem>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="w-[95vw] max-w-md">
                                                    <AlertDialogHeader>
                                                      <AlertDialogTitle className="text-sm sm:text-base">
                                                        ยืนยันการลบเป้าหมาย
                                                      </AlertDialogTitle>
                                                      <AlertDialogDescription className="text-xs sm:text-sm">
                                                        คุณแน่ใจหรือไม่ที่จะลบเป้าหมาย "{goal.name}"? การกระทำนี้ไม่สามารถย้อนกลับได้
                                                      </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                                      <AlertDialogCancel className="w-full sm:w-auto text-xs sm:text-sm">
                                                        ยกเลิก
                                                      </AlertDialogCancel>
                                                      <AlertDialogAction 
                                                        onClick={() => setGoals(g => g.filter(item => item.id !== goal.id))} 
                                                        className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs sm:text-sm"
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
                                <CardContent className="space-y-2 sm:space-y-3">
                                    <Progress 
                                      value={Math.max(0, Math.min(100, progressValue))} 
                                      className="h-2 sm:h-3"
                                    />
                                    <div className="text-xs sm:text-sm space-y-1">
                                        <p>
                                          <span className="font-semibold">ความคืบหน้า:</span> 
                                          <span className="break-all"> ฿{Math.max(0, totalSavings).toLocaleString()} / </span>
                                          <span className="text-muted-foreground break-all">฿{goal.targetAmount.toLocaleString()}</span>
                                        </p>
                                        {remainingAmount > 0 && averageMonthlySavings > 0 && (
                                          <p className="text-xs text-muted-foreground">
                                            คาดว่าจะสำเร็จในอีก <span className="font-semibold">{monthsToAchieve}</span> เดือน 
                                            <span className="block sm:inline"> (ออมเดือนละ ฿{averageMonthlySavings.toLocaleString()} โดยประมาณ)</span>
                                          </p>
                                        )}
                                        {remainingAmount <= 0 && (
                                          <p className="text-xs text-green-600 font-semibold">
                                            เป้าหมายนี้สำเร็จแล้ว! 🎉
                                          </p>
                                        )}
                                        {remainingAmount > 0 && averageMonthlySavings <= 0 && (
                                          <p className="text-xs text-orange-600 font-semibold">
                                            เพิ่มการออมเพื่อบรรลุเป้าหมาย
                                          </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
                </AnimatePresence>
                
                {/* Add New Goal Button - Enhanced Responsive */}
                <Dialog open={isGoalFormOpen} onOpenChange={setIsGoalFormOpen}>
                    <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="h-full min-h-[140px] sm:min-h-[160px] w-full flex-col gap-2 border-dashed text-muted-foreground hover:text-foreground hover:border-primary transition-colors duration-200"
                        >
                            <Plus size={isMobile ? 24 : 32}/>
                            <span className="text-xs sm:text-sm">เพิ่มเป้าหมายใหม่</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[95vw] max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-base sm:text-lg">สร้างเป้าหมายใหม่</DialogTitle>
                            <DialogDescription className="text-xs sm:text-sm">
                                ตั้งเป้าหมายทางการเงินของคุณ
                            </DialogDescription>
                        </DialogHeader>
                        <GoalForm onSave={handleSaveGoal}/>
                    </DialogContent>
                </Dialog>
            </div>
        </CardContent>
      </Card>

      {/* Debt Payoff Planner Section - Enhanced Responsive */}
      <Card id="debt-payoff-planner-section">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl lg:text-2xl">
            <Flame className="h-5 w-5 sm:h-6 sm:w-6" />
            เครื่องมือวางแผนชำระหนี้
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            เลือกกลยุทธ์และวางแผนเพื่ออิสรภาพทางการเงินของคุณ
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {/* Debt Strategy & Extra Payment Controls - Enhanced Responsive */}
          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-end gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-muted/50 border">
              <div className="w-full sm:flex-1 sm:min-w-[140px] md:min-w-[180px] space-y-1.5">
                  <Label htmlFor="extra-payment" className="text-xs sm:text-sm font-medium">
                    ยอดชำระเพิ่มเติม/เดือน
                  </Label>
                  <Input 
                    id="extra-payment" 
                    type="number" 
                    value={extraPayment} 
                    onChange={e => setExtraPayment(e.target.value)} 
                    placeholder="฿" 
                    className="h-9 sm:h-10 text-sm sm:text-base w-full"
                  />
              </div>
              <div className="w-full sm:flex-1 sm:min-w-[160px] md:min-w-[200px] space-y-1.5">
                  <Label className="text-xs sm:text-sm font-medium">กลยุทธ์</Label>
                <Select value={strategy} onValueChange={(v: any) => setStrategy(v)}>
                    <SelectTrigger className="h-9 sm:h-10 text-sm sm:text-base w-full">
                        <SelectValue placeholder="เลือกกลยุทธ์"/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="avalanche">
                            <Tooltip>
                              <TooltipTrigger className="flex items-center gap-2 w-full text-left">
                                <Flame size={14} className="sm:w-4 sm:h-4"/>
                                <span className="text-xs sm:text-sm">Debt Avalanche (จ่ายดอกเบี้ยสูงก่อน)</span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="font-semibold text-xs">Debt Avalanche:</p>
                                <p className="text-xs">มุ่งเน้นชำระหนี้ที่มีอัตราดอกเบี้ยสูงสุดก่อน ช่วยประหยัดดอกเบี้ยได้มากที่สุดในระยะยาว</p>
                              </TooltipContent>
                            </Tooltip>
                        </SelectItem>
                        <SelectItem value="snowball">
                            <Tooltip>
                              <TooltipTrigger className="flex items-center gap-2 w-full text-left">
                                <Snowflake size={14} className="sm:w-4 sm:h-4"/>
                                <span className="text-xs sm:text-sm">Debt Snowball (จ่ายยอดน้อยก่อน)</span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="font-semibold text-xs">Debt Snowball:</p>
                                <p className="text-xs">มุ่งเน้นชำระหนี้ที่มีจำนวนน้อยที่สุดก่อน เพื่อสร้างแรงจูงใจและความรู้สึกสำเร็จ</p>
                              </TooltipContent>
                            </Tooltip>
                        </SelectItem>
                    </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:flex-auto">
                <Alert className="w-full text-sm py-2 px-3 flex items-start sm:items-center">
                  <Info className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0 mt-0.5 sm:mt-0"/>
                  <AlertDescription className="text-xs sm:text-sm">
                    ใส่รายการหนี้สินของคุณในตารางด้านล่างเพื่อเริ่มวางแผน
                  </AlertDescription>
                </Alert>
              </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Debt List Management - Enhanced Responsive */}
            <div className="space-y-3 sm:space-y-4">
              <h4 className="font-semibold text-base sm:text-lg">รายการหนี้สินปัจจุบัน</h4>
              {debts.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                    <AnimatePresence mode="popLayout">
                    {debts.map((debt, index) => (
                    <motion.div
                        key={debt.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ duration: 0.2 }}
                        className="border rounded-lg shadow-sm"
                    >
                        <Collapsible>
                            <CollapsibleTrigger asChild>
                                <div className="flex items-center justify-between p-2.5 sm:p-3 cursor-pointer bg-muted/20 hover:bg-muted/30 rounded-t-lg">
                                    <div className="flex flex-col text-left flex-grow mr-2 min-w-0">
                                        <span className="font-semibold text-sm sm:text-base truncate">
                                          {debt.name || 'หนี้สินใหม่'}
                                        </span>
                                        <span className="text-xs sm:text-sm text-muted-foreground truncate">
                                          ฿{debt.amount.toLocaleString()} | {debt.interestRate}% ดอกเบี้ย | ฿{debt.minimumPayment.toLocaleString()}/เดือน
                                        </span>
                                    </div>
                                    <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 transition-transform data-[state=open]:rotate-180 flex-shrink-0" />
                                </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="p-2.5 sm:p-3 bg-card rounded-b-lg border-t">
                                <div className="flex flex-col gap-2 sm:gap-3">
                                    <div className="space-y-1 sm:space-y-1.5">
                                        <Label htmlFor={`debt-name-${debt.id}`} className="text-xs sm:text-sm">ชื่อหนี้</Label>
                                        <Input
                                            id={`debt-name-${debt.id}`}
                                            value={debt.name}
                                            placeholder="ชื่อหนี้"
                                            className="h-8 sm:h-9 text-sm sm:text-base w-full"
                                            onChange={(e) => setDebts(d => d.map(i => i.id === debt.id ? {...i, name: e.target.value} : i))}
                                            aria-label="ชื่อหนี้"
                                        />
                                    </div>
                                    <div className="space-y-1 sm:space-y-1.5">
                                        <Label htmlFor={`debt-amount-${debt.id}`} className="text-xs sm:text-sm">ยอดหนี้</Label>
                                        <Input
                                            id={`debt-amount-${debt.id}`}
                                            type="number"
                                            value={debt.amount}
                                            placeholder="ยอดหนี้"
                                            className="h-8 sm:h-9 text-sm sm:text-base w-full"
                                            onChange={(e) => setDebts(d => d.map(i => i.id === debt.id ? {...i, amount: parseFloat(e.target.value) || 0} : i))}
                                            aria-label="ยอดหนี้"
                                        />
                                    </div>
                                    <div className="space-y-1 sm:space-y-1.5">
                                        <Label htmlFor={`debt-interest-${debt.id}`} className="text-xs sm:text-sm">อัตราดอกเบี้ย (%)</Label>
                                        <Input
                                            id={`debt-interest-${debt.id}`}
                                            type="number"
                                            value={debt.interestRate}
                                            placeholder="%"
                                            className="h-8 sm:h-9 text-sm sm:text-base w-full"
                                            onChange={(e) => setDebts(d => d.map(i => i.id === debt.id ? {...i, interestRate: parseFloat(e.target.value) || 0} : i))}
                                            aria-label="อัตราดอกเบี้ย"
                                        />
                                    </div>
                                    <div className="space-y-1 sm:space-y-1.5">
                                        <Label htmlFor={`debt-min-payment-${debt.id}`} className="text-xs sm:text-sm">ผ่อนขั้นต่ำ/เดือน</Label>
                                        <Input
                                            id={`debt-min-payment-${debt.id}`}
                                            type="number"
                                            value={debt.minimumPayment}
                                            placeholder="ผ่อนขั้นต่ำ"
                                            className="h-8 sm:h-9 text-sm sm:text-base w-full"
                                            onChange={(e) => setDebts(d => d.map(i => i.id === debt.id ? {...i, minimumPayment: parseFloat(e.target.value) || 0} : i))}
                                            aria-label="ยอดผ่อนขั้นต่ำ"
                                        />
                                    </div>
                                    <Button 
                                      variant="outline" 
                                      className="w-full text-destructive hover:bg-destructive/10 mt-2 sm:mt-3 h-8 sm:h-9 text-xs sm:text-sm" 
                                      onClick={() => setDebts(d => d.filter(i => i.id !== debt.id))}
                                    >
                                      <Trash2 className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4"/>
                                      ลบหนี้สิน
                                    </Button>
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    </motion.div>
                    ))}
                    </AnimatePresence>
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <Info className="mx-auto h-8 w-8 sm:h-10 sm:w-10 mb-2"/>
                    <h5 className="font-semibold text-base sm:text-lg">ไม่มีรายการหนี้สิน</h5>
                    <p className="text-xs sm:text-sm">เพิ่มหนี้สินของคุณเพื่อเริ่มวางแผน</p>
                </div>
              )}
              <Button 
                onClick={() => setDebts(d => [...d, {id: Date.now().toString(), name: '', amount: 0, interestRate: 0, minimumPayment: 0}])} 
                className="w-full mt-3 sm:mt-4 flex items-center justify-center gap-2 h-8 sm:h-9 text-xs sm:text-sm"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4"/>
                เพิ่มรายการหนี้ใหม่
              </Button>
            </div>

            {/* Debt Payoff Plan Summary & Detailed Schedule - Enhanced Responsive */}
            <div className="space-y-3 sm:space-y-4">
              <h4 className="font-semibold text-base sm:text-lg">สรุปแผนการชำระหนี้</h4>
              {debts.length > 0 && (parseFloat(extraPayment) > 0 || debts.some(d => d.minimumPayment > 0)) ? (
                <>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 sm:p-4 rounded-lg bg-green-500/10 text-center space-y-1.5 sm:space-y-2 shadow-md"
                    >
                        <p className="text-xs sm:text-sm font-medium text-green-800 dark:text-green-200">
                          คุณจะปลอดหนี้ใน
                        </p>
                        <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-green-600 dark:text-green-400">
                          {debtPayoffPlan.totalMonths}
                        </p>
                        <p className="text-base sm:text-lg text-green-700 dark:text-green-300">เดือน</p>
                        <p className="text-xs sm:text-sm text-muted-foreground pt-1 sm:pt-2">
                          ประหยัดดอกเบี้ยไปประมาณ ฿{debtPayoffPlan.totalInterestPaid.toLocaleString()}
                        </p>
                    </motion.div>

                    <h5 className="font-semibold text-sm sm:text-base mt-4 sm:mt-6 mb-2">ตารางการชำระหนี้โดยละเอียด</h5>
                    <div className="overflow-x-auto border rounded-lg shadow-sm">
                        <Table className="min-w-full text-xs sm:text-sm">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-[40px] sm:min-w-[50px] lg:min-w-[70px] text-xs sm:text-sm">
                                      เดือน
                                    </TableHead>
                                    <TableHead className="min-w-[80px] sm:min-w-[100px] lg:min-w-[150px] text-xs sm:text-sm">
                                      ชื่อหนี้
                                    </TableHead>
                                    <TableHead className="text-right min-w-[60px] sm:min-w-[70px] lg:min-w-[100px] text-xs sm:text-sm">
                                      ชำระ
                                    </TableHead>
                                    <TableHead className="text-right min-w-[60px] sm:min-w-[70px] lg:min-w-[100px] text-xs sm:text-sm">
                                      ดอกเบี้ย
                                    </TableHead>
                                    <TableHead className="text-right min-w-[60px] sm:min-w-[70px] lg:min-w-[100px] text-xs sm:text-sm">
                                      ต้น
                                    </TableHead>
                                    <TableHead className="text-right min-w-[70px] sm:min-w-[90px] lg:min-w-[120px] text-xs sm:text-sm">
                                      คงเหลือ
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedDebtPlan.map((entry, idx) => (
                                    <TableRow 
                                      key={idx} 
                                      className={cn(
                                        entry.status === 'paid' ? 'bg-green-50/50 dark:bg-green-950/20' : '', 
                                        entry.remaining <= 0 ? 'text-green-700 dark:text-green-300 font-medium' : ''
                                      )}
                                    >
                                        <TableCell className="text-xs sm:text-sm">{entry.month}</TableCell>
                                        <TableCell className="text-xs sm:text-sm truncate">{entry.debtName}</TableCell>
                                        <TableCell className="text-right text-xs sm:text-sm">
                                          ฿{entry.payment.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right text-red-500 text-xs sm:text-sm">
                                          ฿{entry.interestPaid.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right text-xs sm:text-sm">
                                          ฿{entry.principalPaid.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right text-xs sm:text-sm">
                                          ฿{Math.max(0, entry.remaining).toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {paginatedDebtPlan.length === 0 && debtPayoffPlan.plan.length > 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground h-16 sm:h-20">
                                            <Info className="mx-auto h-4 w-4 sm:h-6 sm:w-6 mb-1 sm:mb-2"/>
                                            <span className="text-xs sm:text-sm">ไม่มีรายการในหน้านี้. โปรดลองหน้าอื่น.</span>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                            <TableFooter className="bg-muted/50 font-semibold">
                                <TableRow>
                                    <TableCell colSpan={2} className="font-bold text-xs sm:text-sm">
                                      รวมดอกเบี้ยที่จ่ายทั้งหมด:
                                    </TableCell>
                                    <TableCell colSpan={4} className="text-right font-bold text-red-600 text-xs sm:text-sm">
                                      ฿{debtPayoffPlan.totalInterestPaid.toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </div>
                    
                    {/* Enhanced Responsive Pagination */}
                    {totalDebtPlanPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 mt-3 sm:mt-4">
                            <Pagination className="flex-grow justify-center sm:justify-start">
                                <PaginationContent className="flex-wrap gap-1">
                                    <PaginationPrevious
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setCurrentDebtPlanPage(p => Math.max(1, p - 1));
                                        }}
                                        className={cn(
                                          currentDebtPlanPage === 1 ? 'pointer-events-none opacity-50' : '', 
                                          'h-7 w-7 sm:h-8 sm:w-8 p-1 text-xs sm:text-sm'
                                        )}
                                    />
                                    {paginationPages.map((page, index) => (
                                        <PaginationItem key={index}>
                                            {page === '...' ? (
                                                <span className="h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center text-muted-foreground text-xs sm:text-sm">
                                                  ...
                                                </span>
                                            ) : (
                                                <PaginationLink
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setCurrentDebtPlanPage(page as number);
                                                    }}
                                                    isActive={currentDebtPlanPage === page}
                                                    className="h-7 w-7 sm:h-8 sm:w-8 p-1 text-xs sm:text-sm"
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
                                          'h-7 w-7 sm:h-8 sm:w-8 p-1 text-xs sm:text-sm'
                                        )}
                                    />
                                </PaginationContent>
                            </Pagination>
                            
                            {/* Enhanced Select for direct page jump */}
                            <div className="flex items-center gap-2 mt-2 sm:mt-0">
                                <Label htmlFor="page-select" className="sr-only">เลือกหน้า</Label>
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
                                      className="h-8 sm:h-9 w-[100px] sm:w-[120px] text-xs sm:text-base"
                                    >
                                        <SelectValue placeholder={`หน้า ${currentDebtPlanPage}`} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: totalDebtPlanPages }, (_, i) => i + 1).map(page => (
                                            <SelectItem key={page} value={String(page)} className="text-xs sm:text-sm">
                                                หน้า {page}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                </>
              ) : (
                <div className="p-3 sm:p-4 rounded-lg bg-muted text-center text-muted-foreground">
                    <Info className="mx-auto h-6 w-6 sm:h-8 sm:w-8 mb-2"/>
                    <p className="text-xs sm:text-sm">
                      กรอกข้อมูลหนี้สินและยอดชำระเพิ่มเติมเพื่อดูแผนการชำระหนี้
                    </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </TooltipProvider>
  );
};

export default Planning;