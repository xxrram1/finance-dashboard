// src/components/Transactions.tsx

import React, { useState, useMemo, useCallback } from 'react';
import { useSupabaseFinance, Transaction } from '../context/SupabaseFinanceContext';
import { 
  Plus, Trash2, List, Edit, Search, Calendar as CalendarIcon, 
  Filter, X, Download, Upload, TrendingUp, TrendingDown, 
  DollarSign, Wallet, RefreshCw, 
  ArrowRight, Info, ChevronLeft, ChevronRight,
  Check, Eye, EyeOff, Users, Grid, Table as TableIcon
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { 
  format, subMonths, startOfDay, isToday, isYesterday, 
  startOfWeek, endOfWeek, startOfMonth, endOfMonth
} from "date-fns"; 
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { AnimatePresence, motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Alert } from '@/components/ui/alert';

const ITEMS_PER_PAGE = 12;

// Helper to format currency
const formatCurrency = (amount: number) => `฿${amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Enhanced Transaction Form Component
const TransactionForm = ({ onFinished, transactionToEdit }: { onFinished: () => void, transactionToEdit?: Transaction | null }) => {
  const { addTransaction, updateTransaction, transactions: allTransactions } = useSupabaseFinance();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); 
  const [form, setForm] = useState({
    date: transactionToEdit?.date ? format(new Date(transactionToEdit.date), 'yyyy-MM-dd') : new Date().toISOString().split('T')[0],
    type: transactionToEdit?.type || ('expense' as 'income' | 'expense'),
    category: transactionToEdit?.category || '',
    amount: transactionToEdit?.amount.toString() || '',
    note: transactionToEdit?.note || ''
  });

  const isMobile = useIsMobile();

  const categories = {
    income: ['เงินเดือน', 'ฟรีแลนซ์', 'เงินลงทุน', 'ของขวัญ', 'รายรับอื่นๆ'],
    expense: ['อาหาร', 'การเดินทาง', 'ความบันเทิง', 'สาธารณูปโภค', 'สุขภาพ', 'ช็อปปิ้ง', 'ค่าเช่า/ผ่อน', 'การศึกษา', 'ค่าใช้จ่ายอื่นๆ']
  };

  // Suggest amount based on past 3 months' average for the selected category
  const suggestedAmount = useMemo(() => {
    if (!form.category) return null;
    const threeMonthsAgo = subMonths(new Date(), 3);
    const relevantTransactions = allTransactions.filter(t => 
        t.type === form.type &&
        t.category === form.category &&
        new Date(t.date) >= threeMonthsAgo
    );
    if (relevantTransactions.length === 0) return null;
    const total = relevantTransactions.reduce((sum, t) => sum + t.amount, 0);
    return Math.round(total / (relevantTransactions.length / 3)); 
  }, [form.category, form.type, allTransactions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category || !form.amount || parseFloat(form.amount) <= 0) {
      toast({ title: "ข้อมูลไม่ถูกต้อง", description: "กรุณากรอกข้อมูลให้ครบและถูกต้อง", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    try {
      const transactionData = { ...form, amount: parseFloat(form.amount) };
      if (transactionToEdit) {
        await updateTransaction(transactionToEdit.id, transactionData);
        toast({ title: "อัปเดตสำเร็จ", description: "รายการธุรกรรมถูกอัปเดตแล้ว" });
      } else {
        await addTransaction(transactionData);
        toast({ title: "บันทึกสำเร็จ", description: "เพิ่มรายการธุรกรรมใหม่แล้ว" });
      }
      onFinished();
    } catch (error) {
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถบันทึกรายการได้", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Validation for each step in the multi-step form
  const isStepValid = (stepNum: number) => {
    if (stepNum === 1) return !!form.type && !!form.category;
    if (stepNum === 2) return !!form.amount && parseFloat(form.amount) > 0;
    if (stepNum === 3) return !!form.date;
    return true;
  };

  // Animation properties for form steps
  const formStepAnimProps = {
    initial: { opacity: 0, x: isMobile ? 50 : 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: isMobile ? -50 : -20 },
    transition: { duration: isMobile ? 0.2 : 0.3, ease: "easeInOut" }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Enhanced Step indicator */}
      <div className="flex items-center justify-center mb-6 gap-2">
        {[1, 2, 3].map((i) => (
          <React.Fragment key={i}> 
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-2",
              step >= i 
                ? "bg-primary text-primary-foreground border-primary scale-110 shadow-lg" 
                : "bg-background text-muted-foreground border-muted-foreground/30"
            )}>
              {step > i ? <Check className="w-4 h-4" /> : i}
            </div>
            {i < 3 && <div className={cn(
              "h-1 rounded-full transition-all duration-300",
              "w-16",
              step > i ? "bg-primary shadow-sm" : "bg-muted-foreground/20"
            )}/>}
          </React.Fragment>
        ))}
      </div>

      {/* Progress Text */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          ขั้นตอนที่ {step} จาก 3 • {Math.round((step / 3) * 100)}% เสร็จสิ้น
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key={1} {...formStepAnimProps} className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold">ประเภทและหมวดหมู่</h3>
                <p className="text-sm text-muted-foreground">เลือกประเภทรายการและหมวดหมู่ที่เหมาะสม</p>
              </div>
              
              {/* Type Selection - Enhanced */}
              <div className="grid grid-cols-2 gap-4">
                {([ 'income', 'expense' ] as const).map(type => (
                  <Button 
                    key={type} 
                    type="button" 
                    variant={form.type === type ? "default":"outline"} 
                    className={cn(
                      "h-24 flex-col gap-2 transition-all duration-200",
                      form.type === type && "ring-2 ring-primary/20 shadow-lg scale-[1.02]"
                    )}
                    onClick={()=>setForm(p=>({...p, type, category:''}))}
                  >
                    {type === 'income' ? (
                      <TrendingUp className="w-6 h-6"/>
                    ) : (
                      <TrendingDown className="w-6 h-6"/>
                    )}
                    <span className="font-semibold">
                      {type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                    </span>
                  </Button>
                ))}
              </div>
              
              {/* Category Selection - Enhanced */}
              {form.type && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-3"
                >
                  <Label htmlFor="category" className="text-base font-medium">หมวดหมู่</Label>
                  <Select value={form.category} onValueChange={(v) => setForm(p => ({...p, category: v}))}>
                    <SelectTrigger id="category" className="h-12 text-base">
                      <SelectValue placeholder="เลือกหมวดหมู่" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {categories[form.type].map(cat => (
                        <SelectItem key={cat} value={cat} className="text-base py-3">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </motion.div>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key={2} {...formStepAnimProps} className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold">จำนวนเงิน</h3>
                <p className="text-sm text-muted-foreground">กรอกจำนวนเงินที่ต้องการบันทึก</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-base font-medium">จำนวนเงิน (บาท)</Label>
                  <div className="relative">
                    <Input 
                      id="amount"
                      type="number" 
                      step="0.01"
                      min="0"
                      value={form.amount} 
                      onChange={e => setForm(p => ({...p, amount: e.target.value}))} 
                      placeholder="0.00" 
                      required 
                      className="h-12 text-base pr-24"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-sm text-muted-foreground">บาท</span>
                    </div>
                  </div>
                  
                  {/* Suggested Amount - Enhanced */}
                  {suggestedAmount && !form.amount && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800"
                    >
                      <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                        💡 ยอดแนะนำจากประวัติการใช้จ่าย
                      </p>
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="outline" 
                        className="h-9 text-sm" 
                        onClick={() => setForm(f => ({...f, amount: suggestedAmount.toString()}))}
                      >
                        ใช้ยอด {formatCurrency(suggestedAmount)}
                      </Button>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key={3} {...formStepAnimProps} className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold">วันที่และหมายเหตุ</h3>
                <p className="text-sm text-muted-foreground">เลือกวันที่และเพิ่มหมายเหตุ (ถ้าต้องการ)</p>
              </div>
              
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-base font-medium">วันที่</Label>
                  <Input 
                    id="date"
                    type="date" 
                    value={form.date} 
                    onChange={e => setForm(p => ({...p, date: e.target.value}))} 
                    required 
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="note" className="text-base font-medium">หมายเหตุ (ไม่บังคับ)</Label>
                  <Textarea 
                    id="note"
                    value={form.note || ''} 
                    onChange={e => setForm(p => ({...p, note: e.target.value}))} 
                    placeholder="รายละเอียดเพิ่มเติม..." 
                    className="h-20 text-base resize-none"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons - Enhanced */}
        <div className="flex gap-3 pt-6">
          {step > 1 && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setStep(s => s - 1)} 
              className="flex items-center gap-2 h-12 text-base px-6"
            >
              <ChevronLeft className="w-4 h-4" />
              ย้อนกลับ
            </Button>
          )}
          {step < 3 ? (
            <Button 
              type="button" 
              onClick={() => setStep(s => s + 1)} 
              disabled={!isStepValid(step)} 
              className="flex-1 flex items-center justify-center gap-2 h-12 text-base"
            >
              ถัดไป
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button 
              type="submit" 
              disabled={loading} 
              className="flex-1 flex items-center justify-center gap-2 h-12 text-base bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin w-4 h-4" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {transactionToEdit ? 'บันทึกการแก้ไข' : 'สร้างรายการ'}
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

// Enhanced Transaction Card Component for Mobile
const TransactionCard = ({ transaction, onEdit, onSelect, isSelected }: {
  transaction: Transaction;
  onEdit: (t: Transaction) => void;
  onSelect: (id: string) => void;
  isSelected: boolean;
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return "วันนี้";
    if (isYesterday(date)) return "เมื่อวาน";
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card className={cn(
        "border-0 shadow-lg bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02]",
        isSelected && "ring-2 ring-primary/20 border-primary/30"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Checkbox */}
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onSelect(transaction.id)}
              className="mt-1"
            />
            
            {/* Transaction Icon */}
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
              transaction.type === 'income' 
                ? "bg-gradient-to-r from-green-500 to-emerald-600" 
                : "bg-gradient-to-r from-red-500 to-rose-600"
            )}>
              {transaction.type === 'income' ? (
                <TrendingUp className="w-6 h-6 text-white" />
              ) : (
                <TrendingDown className="w-6 h-6 text-white" />
              )}
            </div>
            
            {/* Transaction Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-base truncate text-slate-800 dark:text-slate-100">
                    {transaction.category}
                  </h4>
                  {transaction.note && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-1 mt-1">
                      {transaction.note}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs px-2 py-1",
                        transaction.type === 'income' 
                          ? "border-green-200 text-green-700 bg-green-50 dark:border-green-800 dark:text-green-400 dark:bg-green-950/30"
                          : "border-red-200 text-red-700 bg-red-50 dark:border-red-800 dark:text-red-400 dark:bg-red-950/30"
                      )}
                    >
                      {formatDate(transaction.date)}
                    </Badge>
                  </div>
                </div>
                
                {/* Amount and Actions */}
                <div className="text-right flex-shrink-0">
                  <p className={cn(
                    "font-bold text-base",
                    transaction.type === 'income' 
                      ? "text-green-600 dark:text-green-400" 
                      : "text-red-600 dark:text-red-400"
                  )}>
                    {formatCurrency(transaction.amount)}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(transaction)}
                    className="mt-1 h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Main Transactions Component
const Transactions = () => {
  const { transactions, deleteTransaction, addTransaction, loading } = useSupabaseFinance();
  const isMobile = useIsMobile();
  
  const [filters, setFilters] = useState({ 
    type: 'all', 
    searchTerm: '', 
    sortBy: 'date', 
    sortOrder: 'desc' as 'asc' | 'desc' 
  });
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isFormOpen, setFormOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [showFilters, setShowFilters] = useState(false);

  const handleEdit = (transaction: Transaction) => { setEditingTransaction(transaction); setFormOpen(true); };
  const handleAddNew = () => { setEditingTransaction(null); setFormOpen(true); };
  const handleModalClose = () => { setFormOpen(false); setEditingTransaction(null); };

  // Quick date filters
  const quickDateFilters = [
    { 
      label: 'วันนี้', 
      value: 'today',
      action: () => {
        const today = new Date();
        setDateRange({ from: today, to: today });
      }
    },
    { 
      label: 'สัปดาห์นี้', 
      value: 'week',
      action: () => {
        const today = new Date();
        setDateRange({ from: startOfWeek(today), to: endOfWeek(today) });
      }
    },
    { 
      label: 'เดือนนี้', 
      value: 'month',
      action: () => {
        const today = new Date();
        setDateRange({ from: startOfMonth(today), to: endOfMonth(today) });
      }
    },
    { 
      label: 'ล้างวันที่', 
      value: 'clear',
      action: () => setDateRange(undefined)
    }
  ];

  const filteredTransactions = useMemo(() => {
    let items = transactions
      .filter(t => filters.type === 'all' || t.type === filters.type)
      .filter(t => !filters.searchTerm || 
        t.category.toLowerCase().includes(filters.searchTerm.toLowerCase()) || 
        t.note?.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );

    if (dateRange?.from) items = items.filter(t => new Date(t.date) >= startOfDay(dateRange.from as Date));
    if (dateRange?.to) items = items.filter(t => new Date(t.date) <= startOfDay(dateRange.to as Date));

    return items.sort((a, b) => {
      const valA = filters.sortBy === 'date' ? new Date(a.date).getTime() : a.amount;
      const valB = filters.sortBy === 'date' ? new Date(b.date).getTime() : b.amount;
      return filters.sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  }, [transactions, filters, dateRange]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Statistics
  const statistics = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return {
      totalTransactions: filteredTransactions.length,
      totalIncome: income,
      totalExpense: expense,
      netAmount: income - expense
    };
  }, [filteredTransactions]);

  const handleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };
  
  const handleSelectAll = (isChecked: boolean | 'indeterminate') => {
    if (isChecked === true) {
      setSelectedIds(new Set(paginatedTransactions.map(t => t.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    try {
        await Promise.all(Array.from(selectedIds).map(id => deleteTransaction(id)));
        toast({ title: "ลบสำเร็จ", description: `ลบ ${selectedIds.size} รายการเรียบร้อยแล้ว` });
        setSelectedIds(new Set());
    } catch (error) {
        toast({ title: "เกิดข้อผิดพลาดในการลบ", variant: 'destructive' });
    }
  };

  const exportToCSV = () => {
    const headers = ['id', 'date', 'type', 'category', 'amount', 'note'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(t => headers.map(header => JSON.stringify(t[header as keyof Transaction])).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `transactions_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    toast({title: "ส่งออกข้อมูลสำเร็จ"});
  };
  
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        const text = e.target?.result as string;
        const rows = text.split('\n').slice(1);
        const newTransactions = rows.map(row => {
            const [id, date, type, category, amount, note] = row.split(',').map(s => JSON.parse(s));
            return { date, type, category, amount: parseFloat(amount), note };
        });
        
        try {
            await Promise.all(newTransactions.map(t => addTransaction(t as any)));
            toast({title: "นำเข้าข้อมูลสำเร็จ", description: `เพิ่ม ${newTransactions.length} รายการใหม่`});
        } catch (error) {
            toast({title: "เกิดข้อผิดพลาดในการนำเข้า", description: "รูปแบบไฟล์ไม่ถูกต้องหรือเกิดข้อผิดพลาดในการบันทึก", variant: 'destructive'});
        }
    };
    reader.readAsText(file);
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
            <div className="space-y-2">
              <Skeleton className="h-10 w-80" />
              <Skeleton className="h-5 w-96" />
            </div>
            <div className="flex gap-3 flex-wrap">
              <Skeleton className="h-11 w-32" />
              <Skeleton className="h-11 w-32" />
              <Skeleton className="h-11 w-32" />
            </div>
          </div>
        </header>
        <main className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-64" />
          <Skeleton className="h-96" />
        </main>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Enhanced Header */}
        <header className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl xl:text-4xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                ธุรกรรมทั้งหมด
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-base xl:text-lg">
                จัดการรายรับรายจ่ายและติดตามการเงินของคุณ
              </p>
            </div>
            
            {/* Action Buttons - Enhanced */}
            <div className="flex items-center gap-3 flex-wrap">
              <input type="file" id="csv-importer" accept=".csv" onChange={handleImport} className="hidden" />
              
              {/* Import/Export */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => document.getElementById('csv-importer')?.click()}
                className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800"
              >
                <Upload className="w-4 h-4 mr-2"/>
                นำเข้า
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={exportToCSV}
                className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800"
              >
                <Download className="w-4 h-4 mr-2"/>
                ส่งออก
              </Button>
              
              {/* View Mode Toggle */}
              <div className="hidden md:flex p-0.5 bg-slate-100/50 dark:bg-slate-700/50 rounded-lg">
                <Button 
                  variant={viewMode === 'cards' ? 'secondary' : 'ghost'} 
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  className="h-8 px-3"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button 
                  variant={viewMode === 'table' ? 'secondary' : 'ghost'} 
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="h-8 px-3"
                >
                  <TableIcon className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Add New Button */}
              <Button 
                onClick={handleAddNew}
                size="sm"
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2"/>
                เพิ่มรายการ
              </Button>
            </div>
          </div>
        </header>

        <main className="space-y-8">
          {/* Enhanced Statistics Cards */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                      รายการทั้งหมด
                    </p>
                    <p className="text-2xl xl:text-3xl font-bold text-blue-900 dark:text-blue-100">
                      {statistics.totalTransactions}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600">
                    <List className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/50 dark:to-emerald-950/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-green-700 dark:text-green-300 uppercase tracking-wider">
                      รายรับ
                    </p>
                    <p className="text-2xl xl:text-3xl font-bold text-green-900 dark:text-green-100">
                      {formatCurrency(statistics.totalIncome)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950/50 dark:to-rose-950/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-red-700 dark:text-red-300 uppercase tracking-wider">
                      รายจ่าย
                    </p>
                    <p className="text-2xl xl:text-3xl font-bold text-red-900 dark:text-red-100">
                      {formatCurrency(statistics.totalExpense)}
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
              statistics.netAmount >= 0 
                ? "bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-950/50 dark:to-pink-950/50"
                : "bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-950/50 dark:to-amber-950/50"
            )}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className={cn(
                      "text-sm font-semibold uppercase tracking-wider",
                      statistics.netAmount >= 0 
                        ? "text-purple-700 dark:text-purple-300"
                        : "text-orange-700 dark:text-orange-300"
                    )}>
                      สุทธิ
                    </p>
                    <p className={cn(
                      "text-2xl xl:text-3xl font-bold",
                      statistics.netAmount >= 0 
                        ? "text-purple-900 dark:text-purple-100"
                        : "text-orange-900 dark:text-orange-100"
                    )}>
                      {formatCurrency(statistics.netAmount)}
                    </p>
                  </div>
                  <div className={cn(
                    "p-3 rounded-lg bg-gradient-to-r",
                    statistics.netAmount >= 0 
                      ? "from-purple-500 to-pink-600" 
                      : "from-orange-500 to-amber-600"
                  )}>
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Enhanced Filters */}
          <section>
            <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
              <CardContent className="p-6 space-y-6">
                {/* Search and Quick Actions */}
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <Input 
                      placeholder="ค้นหาตามหมวดหมู่หรือหมายเหตุ..." 
                      className="pl-10 h-12 text-base bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600" 
                      value={filters.searchTerm} 
                      onChange={e => setFilters(p => ({...p, searchTerm: e.target.value}))}
                    />
                  </div>
                  
                  {/* Filter Toggle - Mobile */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden h-12 px-4 bg-white/50 dark:bg-slate-700/50"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    ตัวกรอง
                  </Button>
                </div>

                {/* Advanced Filters */}
                <div className={cn(
                  "space-y-4 transition-all duration-300",
                  showFilters || !isMobile ? "block" : "hidden lg:block"
                )}>
                  {/* Type Filter and Date Range */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Type Filter */}
                    <Select value={filters.type} onValueChange={v => setFilters(p => ({...p, type: v}))}>
                      <SelectTrigger className="w-full sm:w-48 h-12 text-base bg-white/50 dark:bg-slate-700/50">
                        <SelectValue placeholder="ประเภท" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">ทุกประเภท</SelectItem>
                        <SelectItem value="income">รายรับ</SelectItem>
                        <SelectItem value="expense">รายจ่าย</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {/* Date Range Picker */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full sm:w-auto justify-start text-left font-normal h-12 text-base bg-white/50 dark:bg-slate-700/50"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4"/>
                          {dateRange?.from ? 
                            `${format(dateRange.from, 'dd/MM/yy')} ${dateRange.to ? `- ${format(dateRange.to, 'dd/MM/yy')}` : ''}` 
                            : "เลือกวันที่"
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar 
                          mode="range" 
                          selected={dateRange} 
                          onSelect={setDateRange} 
                          numberOfMonths={isMobile ? 1 : 2}
                        />
                        <div className="p-2 pt-0">
                          <Button 
                            variant="ghost" 
                            className="w-full" 
                            onClick={() => setDateRange(undefined)}
                          >
                            ล้างวันที่
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  {/* Quick Date Filters */}
                  <div className="flex flex-wrap gap-2">
                    {quickDateFilters.map((filter) => (
                      <Button
                        key={filter.value}
                        variant="outline"
                        size="sm"
                        onClick={filter.action}
                        className="h-9 px-4 text-sm bg-white/50 dark:bg-slate-700/50"
                      >
                        {filter.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Bulk Action Bar */}
                <AnimatePresence>
                  {selectedIds.size > 0 && (
                    <motion.div 
                      initial={{opacity:0, y: -10}} 
                      animate={{opacity:1, y: 0}} 
                      exit={{opacity:0, y: -10}} 
                      className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg flex items-center justify-between"
                    >
                      <span className="text-base font-medium text-slate-800 dark:text-slate-200">
                        {selectedIds.size} รายการถูกเลือก
                      </span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="h-10">
                            <Trash2 className="mr-2 h-4 w-4"/> 
                            ลบที่เลือก
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
                            <AlertDialogDescription>
                              คุณแน่ใจหรือไม่ที่จะลบ {selectedIds.size} รายการที่เลือก? 
                              การกระทำนี้ไม่สามารถย้อนกลับได้
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteSelected}>ยืนยัน</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </section>
          
          {/* Enhanced Transactions Display */}
          <section>
            {isMobile || viewMode === 'cards' ? (
              /* Mobile Card View */
              <div className="space-y-4">
                <AnimatePresence>
                  {paginatedTransactions.length > 0 ? (
                    paginatedTransactions.map(transaction => (
                      <TransactionCard
                        key={transaction.id}
                        transaction={transaction}
                        onEdit={handleEdit}
                        onSelect={handleSelect}
                        isSelected={selectedIds.has(transaction.id)}
                      />
                    ))
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-16"
                    >
                      <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
                        <CardContent className="p-12">
                          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                            <Info className="w-10 h-10 text-slate-500 dark:text-slate-400" />
                          </div>
                          <h3 className="text-xl font-semibold mb-3 text-slate-800 dark:text-slate-200">
                            ไม่พบข้อมูลธุรกรรม
                          </h3>
                          <p className="text-base text-slate-600 dark:text-slate-300 mb-6">
                            ไม่พบข้อมูลธุรกรรมสำหรับเงื่อนไขที่เลือก
                          </p>
                          <Button onClick={handleAddNew} size="lg" className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
                            <Plus className="w-5 h-5 mr-2" />
                            เพิ่มรายการแรก
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* Desktop Table View */
              <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200 dark:border-slate-700">
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={selectedIds.size > 0 && paginatedTransactions.length > 0 && selectedIds.size === paginatedTransactions.length ? true : selectedIds.size > 0 ? "indeterminate" : false}
                          onCheckedChange={handleSelectAll}
                          aria-label="เลือกทั้งหมด"
                        />
                      </TableHead>
                      <TableHead className="min-w-[100px] font-semibold text-slate-700 dark:text-slate-300">วันที่</TableHead>
                      <TableHead className="min-w-[100px] font-semibold text-slate-700 dark:text-slate-300">ประเภท</TableHead>
                      <TableHead className="min-w-[200px] font-semibold text-slate-700 dark:text-slate-300">หมวดหมู่/หมายเหตุ</TableHead>
                      <TableHead className="text-right min-w-[120px] font-semibold text-slate-700 dark:text-slate-300">จำนวนเงิน</TableHead>
                      <TableHead className="text-right w-[80px] font-semibold text-slate-700 dark:text-slate-300">การดำเนินการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTransactions.length > 0 ? paginatedTransactions.map(t => (
                      <TableRow key={t.id} data-state={selectedIds.has(t.id) && "selected"} className="group border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <TableCell>
                          <Checkbox 
                            checked={selectedIds.has(t.id)} 
                            onCheckedChange={() => handleSelect(t.id)} 
                            aria-label={`เลือกรายการ ${t.note || t.category}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-slate-800 dark:text-slate-200">
                          {new Date(t.date).toLocaleDateString('th-TH')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(
                            "font-medium",
                            t.type === 'income' 
                              ? 'border-green-200 text-green-700 bg-green-50 dark:border-green-800 dark:text-green-400 dark:bg-green-950/30' 
                              : 'border-red-200 text-red-700 bg-red-50 dark:border-red-800 dark:text-red-400 dark:bg-red-950/30'
                          )}>
                            {t.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-slate-800 dark:text-slate-200">{t.category}</div>
                          {t.note && <div className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs">{t.note}</div>}
                        </TableCell>
                        <TableCell className={cn(
                          "font-bold text-right",
                          t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        )}>
                          {formatCurrency(t.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEdit(t)} 
                            className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100 dark:hover:bg-slate-600" 
                            aria-label="แก้ไขรายการ"
                          >
                            <Edit className="h-4 w-4"/>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-slate-500 dark:text-slate-400">
                          <div className="flex flex-col items-center gap-3">
                            <Info className="h-8 w-8"/>
                            <span className="text-base">ไม่พบข้อมูลธุรกรรมสำหรับเงื่อนไขที่เลือก</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            )}
          </section>
          
          {/* Enhanced Pagination */}
          {totalPages > 1 && (
            <section>
              <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
                <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    แสดง {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)} จาก {filteredTransactions.length} รายการ
                    {selectedIds.size > 0 && ` • เลือกแล้ว ${selectedIds.size} รายการ`}
                  </div>
                  <Pagination>
                    <PaginationContent className="gap-1">
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(p => Math.max(1, p-1))} 
                        className={cn(
                          "h-10 px-4 text-sm",
                          currentPage === 1 && 'pointer-events-none opacity-50'
                        )}
                      />
                      {Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                        let page;
                        if (totalPages <= 5) {
                          page = i + 1;
                        } else if (currentPage <= 3) {
                          page = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          page = totalPages - 4 + i;
                        } else {
                          page = currentPage - 2 + i;
                        }
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink 
                              onClick={() => setCurrentPage(page)} 
                              isActive={currentPage === page}
                              className="h-10 px-4 text-sm"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      <PaginationNext 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} 
                        className={cn(
                          "h-10 px-4 text-sm",
                          currentPage === totalPages && 'pointer-events-none opacity-50'
                        )}
                      />
                    </PaginationContent>
                  </Pagination>
                </CardContent>
              </Card>
            </section>
          )}
        </main>
        
        {/* Enhanced Dialog/Drawer for add/edit form */}
        <Dialog open={isFormOpen && !isMobile} onOpenChange={handleModalClose}>
          <DialogContent className="max-w-2xl p-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-slate-200/50 dark:border-slate-700/50">
            <DialogHeader className="p-6 pb-0 border-b border-slate-200/50 dark:border-slate-700/50">
              <DialogTitle className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {editingTransaction ? '✏️ แก้ไขรายการ' : '✨ เพิ่มรายการใหม่'}
              </DialogTitle>
              <DialogDescription className="text-base text-slate-600 dark:text-slate-400">
                กรอกข้อมูลให้ครบถ้วนเพื่อบันทึกรายการธุรกรรม
              </DialogDescription>
            </DialogHeader>
            <TransactionForm onFinished={handleModalClose} transactionToEdit={editingTransaction}/>
          </DialogContent>
        </Dialog>
        
        <Drawer open={isFormOpen && isMobile} onClose={handleModalClose}>
          <DrawerContent className="max-h-[95vh] bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg">
            <DrawerHeader className="text-left px-6 border-b border-slate-200/50 dark:border-slate-700/50">
              <DrawerTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {editingTransaction ? '✏️ แก้ไขรายการ' : '✨ เพิ่มรายการใหม่'}
              </DrawerTitle>
              <DrawerDescription className="text-base text-slate-600 dark:text-slate-400">
                กรอกข้อมูลให้ครบถ้วนเพื่อบันทึกรายการธุรกรรม
              </DrawerDescription>
            </DrawerHeader>
            <div className="overflow-y-auto flex-1">
              <TransactionForm onFinished={handleModalClose} transactionToEdit={editingTransaction}/>
            </div>
          </DrawerContent>
        </Drawer>

        {/* Floating Action Button for Mobile */}
        {isMobile && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileTap={{ scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button 
              onClick={handleAddNew}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 shadow-2xl hover:shadow-3xl transition-all duration-300 border-4 border-white/20 backdrop-blur-sm"
              aria-label="เพิ่มรายการใหม่"
            >
              <Plus className="w-8 h-8 text-white" />
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Transactions;