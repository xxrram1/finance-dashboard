// src/components/Recurring.tsx

import React, { useState, useMemo } from 'react';
import { useSupabaseFinance, RecurringItem } from '../context/SupabaseFinanceContext';
import { 
  Plus, Trash2, Repeat, Edit, Calendar as CalendarIcon, TrendingUp, TrendingDown,
  Clock, DollarSign, Activity, Eye, EyeOff, Download, Filter,
  PauseCircle, PlayCircle, AlertTriangle, CheckCircle, RefreshCw, Target,
  CalendarDays, Settings, MoreHorizontal, Zap, XCircle, Info, List, LayoutGrid, ArrowRight,
  ChevronLeft, ChevronRight, Menu, X
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useIsMobile } from '@/hooks/use-mobile';
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from "@/components/ui/calendar"
import { cn } from '@/lib/utils';
import { format, addDays, addWeeks, addMonths, addYears, isSameDay, isAfter, isBefore, startOfDay, subMonths } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';

// --- Multi-Step Form Component ---
const RecurringItemForm = ({ onFinished, editingItem }: { 
  onFinished: () => void, 
  editingItem?: RecurringItem | null 
}) => {
  const { addRecurringItem, updateRecurringItem, transactions } = useSupabaseFinance();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: editingItem?.name || '', 
    type: editingItem?.type || ('expense' as 'income' | 'expense'), 
    category: editingItem?.category || '', 
    amount: editingItem?.amount.toString() || '',
    frequency: editingItem?.frequency || 'monthly',
    start_date: editingItem?.start_date ? format(new Date(editingItem.start_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    is_active: editingItem?.is_active ?? true
  });

  const isMobile = useIsMobile();

  const categories = {
    income: ['เงินเดือน', 'ฟรีแลนซ์', 'เงินลงทุน', 'ของขวัญ', 'รายรับอื่นๆ'],
    expense: ['อาหาร', 'การเดินทาง', 'ความบันเทิง', 'สาธารณูปโภค', 'สุขภาพ', 'ช็อปปิ้ง', 'ค่าเช่า/ผ่อน', 'การศึกษา', 'ค่าใช้จ่ายอื่นๆ']
  };

  const suggestedAmount = useMemo(() => {
    if (!form.category) return null;
    const threeMonthsAgo = subMonths(new Date(), 3);
    const relevantTransactions = transactions.filter(t => 
        t.type === form.type &&
        t.category === form.category &&
        new Date(t.date) >= threeMonthsAgo
    );
    if (relevantTransactions.length === 0) return null;
    const total = relevantTransactions.reduce((sum, t) => sum + t.amount, 0);
    const monthsOfData = Math.min(3, new Set(relevantTransactions.map(t => t.date.slice(0, 7))).size);
    return Math.round(total / (monthsOfData || 1));
  }, [form.category, form.type, transactions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.category || !form.amount) { 
      toast({ title: "ข้อมูลไม่ครบถ้วน", description: "กรุณากรอกข้อมูลให้ครบถ้วน", variant: "destructive" }); 
      return; 
    }
    setLoading(true);
    const itemData = { ...form, amount: parseFloat(form.amount) };
    try {
      if (editingItem) { 
        await updateRecurringItem(editingItem.id, itemData); 
        toast({ title: "สำเร็จ", description: "บันทึกข้อมูลรายการเกิดซ้ำเรียบร้อย", variant: "success" });
      } 
      else { 
        await addRecurringItem(itemData); 
        toast({ title: "สำเร็จ", description: "เพิ่มรายการเกิดซ้ำใหม่แล้ว", variant: "success" });
      }
      onFinished();
    } catch (error) {
      console.error("Error saving recurring item:", error);
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถบันทึกรายการได้", variant: "destructive"});
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = (stepNum: number) => {
    if(stepNum === 1) return !!form.type && !!form.category;
    if(stepNum === 2) return !!form.name && !!form.amount && parseFloat(form.amount) > 0;
    if(stepNum === 3) return !!form.frequency && !!form.start_date;
    return true;
  };

  const animProps = { 
    initial: { opacity: 0, x: isMobile ? 50 : 20 }, 
    animate: { opacity: 1, x: 0 }, 
    exit: { opacity: 0, x: isMobile ? -50 : -20 }, 
    transition: { duration: isMobile ? 0.2 : 0.3, ease: "easeInOut" } 
  };

  return (
    <div className="p-3 xs:p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Step Indicator - Ultra Responsive */}
      <div className="flex items-center justify-center mb-4 sm:mb-6 gap-1 xs:gap-2">
        {[1, 2, 3].map((i) => (
          <React.Fragment key={i}>
            <div className={cn(
              "w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs xs:text-sm sm:text-base font-bold transition-all duration-300 border-2",
              step >= i 
                ? "bg-primary text-primary-foreground border-primary scale-110 shadow-lg" 
                : "bg-background text-muted-foreground border-muted-foreground/30"
            )}>
              {step > i ? <CheckCircle className="w-3 h-3 xs:w-4 xs:h-4" /> : i}
            </div>
            {i < 3 && (
              <div className={cn(
                "h-0.5 xs:h-1 rounded-full transition-all duration-300",
                "w-8 xs:w-12 sm:w-16 md:w-20",
                step > i ? "bg-primary shadow-sm" : "bg-muted-foreground/20"
              )}/>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Progress Text - Mobile Only */}
      {isMobile && (
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            ขั้นตอนที่ {step} จาก 3 • {Math.round((step / 3) * 100)}% เสร็จสิ้น
          </p>
        </div>
      )}

      {/* Form Steps */}
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key={1} {...animProps} className="space-y-4 sm:space-y-6">
              <div className="text-center space-y-1 sm:space-y-2">
                <h3 className="text-base xs:text-lg sm:text-xl font-bold">ประเภทและหมวดหมู่</h3>
                <p className="text-xs xs:text-sm text-muted-foreground">เลือกประเภทรายการและหมวดหมู่ที่เหมาะสม</p>
              </div>
              
              {/* Type Selection - Responsive Grid */}
              <div className="grid grid-cols-2 gap-2 xs:gap-3 sm:gap-4">
                {([ 'income', 'expense' ] as const).map(type => (
                  <Button
                    key={type}
                    type="button"
                    variant={form.type === type ? "default" : "outline"}
                    className={cn(
                      "h-16 xs:h-20 sm:h-24 flex-col gap-1 xs:gap-2 transition-all duration-200",
                      "text-xs xs:text-sm sm:text-base",
                      form.type === type && "ring-2 ring-primary/20 shadow-lg scale-[1.02]"
                    )}
                    onClick={()=>setForm(p=>({...p, type, category:''}))}
                  >
                    {type==='income' ? (
                      <TrendingUp className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
                    ) : (
                      <TrendingDown className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
                    )}
                    <span className="font-semibold leading-tight">
                      {type==='income'?'รายรับ':'รายจ่าย'}
                    </span>
                  </Button>
                ))}
              </div>
              
              {/* Category Selection */}
              {form.type && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-2 sm:space-y-3"
                >
                  <Label htmlFor="category-select" className="text-sm xs:text-base font-medium">
                    หมวดหมู่
                  </Label>
                  <Select value={form.category} onValueChange={(v)=>setForm(p=>({...p,category:v}))}>
                    <SelectTrigger id="category-select" className="h-11 xs:h-12 text-sm xs:text-base w-full">
                      <SelectValue placeholder="เลือกหมวดหมู่" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {categories[form.type].map(cat=>(
                        <SelectItem 
                          key={cat} 
                          value={cat} 
                          className="text-sm xs:text-base py-2 xs:py-3"
                        >
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
            <motion.div key={2} {...animProps} className="space-y-4 sm:space-y-6">
              <div className="text-center space-y-1 sm:space-y-2">
                <h3 className="text-base xs:text-lg sm:text-xl font-bold">รายละเอียดรายการ</h3>
                <p className="text-xs xs:text-sm text-muted-foreground">กรอกชื่อและจำนวนเงิน</p>
              </div>
              
              <div className="space-y-4 sm:space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="item-name" className="text-sm xs:text-base font-medium">
                    ชื่อรายการ
                  </Label>
                  <Input 
                    id="item-name" 
                    value={form.name} 
                    onChange={e=>setForm(p=>({...p,name:e.target.value}))} 
                    required 
                    placeholder="เช่น ค่าบริการ Netflix, ค่าเช่าบ้าน" 
                    className="h-11 xs:h-12 text-sm xs:text-base w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="item-amount" className="text-sm xs:text-base font-medium">
                    จำนวนเงิน (บาท)
                  </Label>
                  <div className="relative">
                    <Input 
                      id="item-amount" 
                      type="number" 
                      step="0.01"
                      min="0"
                      value={form.amount} 
                      onChange={e=>setForm(p=>({...p,amount:e.target.value}))} 
                      required 
                      placeholder="0.00" 
                      className="h-11 xs:h-12 text-sm xs:text-base w-full pr-24 xs:pr-28"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-xs xs:text-sm text-muted-foreground">บาท</span>
                    </div>
                  </div>
                  
                  {/* Suggested Amount */}
                  {suggestedAmount && !form.amount && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-2 xs:p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800"
                    >
                      <p className="text-xs xs:text-sm text-blue-700 dark:text-blue-300 mb-2">
                        💡 ยอดแนะนำจากประวัติการใช้จ่าย
                      </p>
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="outline"
                        className="h-8 xs:h-9 text-xs xs:text-sm" 
                        onClick={() => setForm(f => ({...f, amount: suggestedAmount.toString()}))}
                      >
                        ใช้ยอด ฿{suggestedAmount.toLocaleString()}
                      </Button>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
          
          {step === 3 && (
            <motion.div key={3} {...animProps} className="space-y-4 sm:space-y-6">
              <div className="text-center space-y-1 sm:space-y-2">
                <h3 className="text-base xs:text-lg sm:text-xl font-bold">ความถี่และการตั้งค่า</h3>
                <p className="text-xs xs:text-sm text-muted-foreground">กำหนดรอบเวลาและวันที่เริ่มต้น</p>
              </div>
              
              <div className="space-y-4 sm:space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="frequency-select" className="text-sm xs:text-base font-medium">
                    ความถี่
                  </Label>
                  <Select value={form.frequency} onValueChange={v=>setForm(p=>({...p,frequency:v as any}))}>
                    <SelectTrigger id="frequency-select" className="h-11 xs:h-12 text-sm xs:text-base w-full">
                      <SelectValue/>
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        { value: 'daily', label: '🔄 รายวัน', desc: 'ทุกวัน' }, 
                        { value: 'weekly', label: '📅 รายสัปดาห์', desc: 'ทุกสัปดาห์' }, 
                        { value: 'monthly', label: '📆 รายเดือน', desc: 'ทุกเดือน' }, 
                        { value: 'yearly', label: '🎯 รายปี', desc: 'ทุกปี' }
                      ].map(f=>(
                        <SelectItem key={f.value} value={f.value} className="py-2 xs:py-3">
                          <div className="flex flex-col">
                            <span className="text-sm xs:text-base">{f.label}</span>
                            <span className="text-xs text-muted-foreground">{f.desc}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="start-date" className="text-sm xs:text-base font-medium">
                    วันที่เริ่มต้น
                  </Label>
                  <Input 
                    id="start-date" 
                    type="date" 
                    value={form.start_date} 
                    onChange={e=>setForm(p=>({...p,start_date:e.target.value}))} 
                    className="h-11 xs:h-12 text-sm xs:text-base w-full"
                  />
                </div>
                
                <motion.div 
                  className="flex items-center justify-between p-3 xs:p-4 rounded-xl border-2 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border-green-200 dark:border-green-800"
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <Label htmlFor="is_active" className="font-medium text-sm xs:text-base cursor-pointer">
                      เปิดใช้งานรายการนี้
                    </Label>
                  </div>
                  <Switch 
                    id="is_active" 
                    checked={form.is_active} 
                    onCheckedChange={c=>setForm(p=>({...p,is_active:c}))}
                    className="data-[state=checked]:bg-green-500"
                  />
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Navigation Buttons - Ultra Responsive */}
        <div className="flex gap-2 xs:gap-3 pt-4 sm:pt-6">
          {step > 1 && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setStep(s => s - 1)} 
              className="flex items-center gap-1 xs:gap-2 h-10 xs:h-11 sm:h-12 text-xs xs:text-sm sm:text-base px-3 xs:px-4 sm:px-6"
            >
              <ChevronLeft className="w-3 h-3 xs:w-4 xs:h-4" />
              <span className="hidden xs:inline">ย้อนกลับ</span>
              <span className="xs:hidden">กลับ</span>
            </Button>
          )}
          
          {step < 3 ? (
            <Button 
              type="button" 
              onClick={() => setStep(s => s + 1)} 
              disabled={!isStepValid(step)} 
              className="flex-1 flex items-center justify-center gap-1 xs:gap-2 h-10 xs:h-11 sm:h-12 text-xs xs:text-sm sm:text-base"
            >
              <span>ถัดไป</span>
              <ChevronRight className="w-3 h-3 xs:w-4 xs:h-4" />
            </Button>
          ) : (
            <Button 
              type="submit" 
              disabled={loading} 
              className="flex-1 flex items-center justify-center gap-1 xs:gap-2 h-10 xs:h-11 sm:h-12 text-xs xs:text-sm sm:text-base bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin w-3 h-3 xs:w-4 xs:h-4"/>
                  <span className="hidden xs:inline">กำลังบันทึก...</span>
                  <span className="xs:hidden">บันทึก...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-3 h-3 xs:w-4 xs:h-4" />
                  <span className="hidden sm:inline">
                    {editingItem ? 'บันทึกการแก้ไข' : 'สร้างรายการ'}
                  </span>
                  <span className="sm:hidden">
                    {editingItem ? 'บันทึก' : 'สร้าง'}
                  </span>
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

// --- Main Recurring Component ---
const Recurring = () => {
  const { recurringItems, deleteRecurringItem, toggleRecurringItem, loading } = useSupabaseFinance();
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'calendar' | 'timeline'>('grid');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const isMobile = useIsMobile();
  const handleEdit = (item: RecurringItem) => { setEditingItem(item); setFormOpen(true); };
  const handleAddNew = () => { setEditingItem(null); setFormOpen(true); };
  const handleModalClose = () => { setFormOpen(false); setEditingItem(null); };

  // Calculate recurring item statistics
  const statistics = useMemo(() => {
    const active = recurringItems.filter(i => i.is_active);
    const getMultiplier = (f: string) => ({ daily: 30.44, weekly: 4.345, monthly: 1, yearly: 1/12 }[f] || 0);
    const monthlyIncome = active.filter(i => i.type === 'income').reduce((s, i) => s + (i.amount * getMultiplier(i.frequency)), 0);
    const monthlyExpense = active.filter(i => i.type === 'expense').reduce((s, i) => s + (i.amount * getMultiplier(i.frequency)), 0);
    return { activeCount: active.length, inactiveCount: recurringItems.length - active.length, monthlyIncome, monthlyExpense, monthlyNet: monthlyIncome - monthlyExpense };
  }, [recurringItems]);

  // Prepare events for the calendar view
  const calendarEvents = useMemo(() => {
    const events: { date: Date; items: RecurringItem[] }[] = [];
    recurringItems.filter(i => i.is_active).forEach(item => {
      let currentDate = startOfDay(new Date(item.start_date));
      const today = startOfDay(new Date());
      const futureLimit = addYears(today, 1);
      
      while(isBefore(currentDate, futureLimit) || isSameDay(currentDate, futureLimit)) {
        if(isAfter(currentDate, subMonths(today, 1)) || isSameDay(currentDate, subMonths(today, 1))) {
            const existingEvent = events.find(e => isSameDay(e.date, currentDate));
            if(existingEvent) {
                existingEvent.items.push(item);
            } else {
                events.push({ date: currentDate, items: [item] });
            }
        }
        switch(item.frequency) {
            case 'daily': currentDate = addDays(currentDate, 1); break;
            case 'weekly': currentDate = addWeeks(currentDate, 1); break;
            case 'monthly': currentDate = addMonths(currentDate, 1); break;
            case 'yearly': currentDate = addYears(currentDate, 1); break;
            default: break;
        }
      }
    });
    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [recurringItems]);

  // Prepare events for the timeline view (next 30 days)
  const timelineEvents = useMemo(() => {
    const today = startOfDay(new Date());
    const thirtyDaysLater = addDays(today, 30);
    return calendarEvents.filter(event => 
      (isAfter(event.date, today) || isSameDay(event.date, today)) && 
      (isBefore(event.date, thirtyDaysLater) || isSameDay(event.date, thirtyDaysLater))
    ).sort((a,b) => a.date.getTime() - b.date.getTime());
  }, [calendarEvents]);
  
  // Reusable StatCard component for displaying metrics
  const StatCard = ({title, value, icon: Icon, color, gradient}: any) => (
    <Card className={cn(
      "transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer",
      gradient && "bg-gradient-to-br from-white to-gray-50 dark:from-gray-950 dark:to-gray-900"
    )}>
      <CardHeader className="pb-2 xs:pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xs xs:text-sm sm:text-base font-medium leading-tight">
          {title}
        </CardTitle>
        <div className={cn(
          "w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center",
          "bg-gradient-to-br", color
        )}>
          <Icon className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-white" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-lg xs:text-xl sm:text-2xl lg:text-3xl font-bold leading-tight">
          ฿{Math.abs(value).toLocaleString('th-TH',{maximumFractionDigits:0})}
        </p>
      </CardContent>
    </Card>
  );

  // Enhanced Skeleton loader
  const RecurringSkeleton = () => (
    <div className="p-2 xs:p-4 sm:p-6 lg:p-8 space-y-4 xs:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <Skeleton className="h-6 xs:h-8 sm:h-10 w-48 xs:w-64" />
          <Skeleton className="h-3 xs:h-4 w-32 xs:w-48" />
        </div>
        <Skeleton className="h-9 xs:h-10 w-24 xs:w-32" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 xs:gap-3 sm:gap-4">
        {Array.from({length:4}).map((_,i) => (
          <Skeleton key={i} className="h-20 xs:h-24 sm:h-28 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-48 xs:h-64 sm:h-80 w-full rounded-lg"/> 
    </div>
  );

  if (loading) return <RecurringSkeleton />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50/30 to-blue-50/30 dark:from-gray-950 dark:to-blue-950/50">
      <div className="container mx-auto p-2 xs:p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 xs:space-y-6">
        {/* Header section - Ultra Responsive */}
        <div className="space-y-3 xs:space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 xs:gap-4">
            <div className="space-y-1 xs:space-y-2">
              <h1 className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 dark:from-white dark:to-blue-400 bg-clip-text text-transparent">
                รายการเกิดซ้ำ
              </h1>
              <p className="text-xs xs:text-sm sm:text-base text-muted-foreground leading-relaxed">
                จัดการรายรับรายจ่ายประจำอัตโนมัติ
              </p>
            </div>
            
            {/* Add New button (desktop only) */}
            <Button 
              onClick={handleAddNew} 
              className="hidden sm:inline-flex items-center gap-2 h-10 sm:h-11 px-4 sm:px-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-medium">สร้างใหม่</span>
            </Button>
          </div>
          
          {/* View mode toggles - Full responsive */}
          <div className="flex justify-center sm:justify-end">
            <div className="p-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 flex w-full sm:w-auto">
              {[
                { mode: 'grid', icon: LayoutGrid, label: 'ตาราง', desc: 'มุมมองการ์ด' },
                { mode: 'calendar', icon: CalendarIcon, label: 'ปฏิทิน', desc: 'มุมมองปฏิทิน' },
                { mode: 'timeline', icon: List, label: 'ไทม์ไลน์', desc: 'มุมมองเวลา' }
              ].map(({ mode, icon: Icon, label, desc }) => (
                <Button 
                  key={mode}
                  size="sm" 
                  variant={viewMode === mode ? 'default' : 'ghost'}
                  onClick={() => setViewMode(mode as any)} 
                  className={cn(
                    "flex-1 sm:flex-none gap-1 xs:gap-2 h-9 xs:h-10 px-2 xs:px-3 sm:px-4 transition-all duration-200",
                    viewMode === mode && "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md"
                  )}
                  aria-label={desc}
                >
                  <Icon className="w-3 h-3 xs:w-4 xs:h-4" />
                  <span className="text-xs xs:text-sm font-medium">{label}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Statistics cards - Advanced Responsive Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 xs:gap-3 sm:gap-4">
          <Card className="col-span-2 sm:col-span-1 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50 border-blue-200/50 dark:border-blue-800/50 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-2 xs:pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs xs:text-sm font-medium text-blue-700 dark:text-blue-300">
                รายการที่ใช้งาน
              </CardTitle>
              <div className="w-8 h-8 xs:w-9 xs:h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Activity className="w-4 h-4 xs:w-5 xs:h-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-lg xs:text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-100">
                {statistics.activeCount}
              </p>
              <p className="text-xs xs:text-sm text-blue-600 dark:text-blue-400">
                จาก {recurringItems.length} รายการ
              </p>
            </CardContent>
          </Card>
          
          <StatCard 
            title="รายรับ/เดือน" 
            value={statistics.monthlyIncome} 
            icon={TrendingUp} 
            color="from-green-500 to-emerald-600"
            gradient={true}
          />
          
          <StatCard 
            title="รายจ่าย/เดือน" 
            value={statistics.monthlyExpense} 
            icon={TrendingDown} 
            color="from-red-500 to-rose-600"
            gradient={true}
          />
          
          <Card className="col-span-2 sm:col-span-1 bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-950/50 dark:to-pink-950/50 border-purple-200/50 dark:border-purple-800/50 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-2 xs:pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs xs:text-sm font-medium text-purple-700 dark:text-purple-300">
                สุทธิ/เดือน
              </CardTitle>
              <div className={cn(
                "w-8 h-8 xs:w-9 xs:h-9 rounded-full flex items-center justify-center",
                statistics.monthlyNet > 0 
                  ? "bg-gradient-to-br from-green-500 to-emerald-600" 
                  : "bg-gradient-to-br from-orange-500 to-red-500"
              )}>
                <DollarSign className="w-4 h-4 xs:w-5 xs:h-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className={cn(
                "text-lg xs:text-xl sm:text-2xl font-bold",
                statistics.monthlyNet > 0 
                  ? "text-green-600 dark:text-green-400" 
                  : "text-orange-600 dark:text-orange-400"
              )}>
                ฿{statistics.monthlyNet.toLocaleString('th-TH',{maximumFractionDigits:0})}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Content based on selected view mode */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={viewMode} 
            initial={{opacity:0, y: 20}} 
            animate={{opacity:1, y: 0}} 
            exit={{opacity:0, y: -20}}
            transition={{duration: 0.3}}
          >
            {/* Grid View - Ultra Responsive */}
            {viewMode === 'grid' && (
              recurringItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 xs:gap-4 sm:gap-6">
                  {recurringItems.map(item => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileHover={{ scale: 1.02, y: -4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className={cn(
                        "group relative overflow-hidden transition-all duration-300 hover:shadow-xl border-0",
                        !item.is_active && "opacity-60",
                        item.type === 'income' 
                          ? "bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/30 dark:to-emerald-950/30" 
                          : "bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950/30 dark:to-rose-950/30"
                      )}>
                        {/* Decorative gradient line */}
                        <div className={cn(
                          "absolute top-0 left-0 right-0 h-1",
                          item.type === 'income' 
                            ? "bg-gradient-to-r from-green-400 to-emerald-500" 
                            : "bg-gradient-to-r from-red-400 to-rose-500"
                        )} />
                        
                        <CardContent className="p-3 xs:p-4 sm:p-5">
                          <div className="space-y-3 xs:space-y-4">
                            {/* Header with title and actions */}
                            <div className="flex justify-between items-start gap-2 xs:gap-3">
                              <div className="flex items-start gap-2 xs:gap-3 flex-1 min-w-0">
                                <div className={cn(
                                  "w-10 h-10 xs:w-12 xs:h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg",
                                  item.type === 'income' 
                                    ? "bg-gradient-to-br from-green-500 to-emerald-600" 
                                    : "bg-gradient-to-br from-red-500 to-rose-600"
                                )}>
                                  {item.type === 'income' ? (
                                    <TrendingUp className="w-5 h-5 xs:w-6 xs:h-6 text-white" />
                                  ) : (
                                    <TrendingDown className="w-5 h-5 xs:w-6 xs:h-6 text-white" />
                                  )}
                                </div>
                                
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-bold text-sm xs:text-base sm:text-lg truncate text-gray-900 dark:text-gray-100">
                                    {item.name}
                                  </h3>
                                  <p className="text-xs xs:text-sm text-gray-600 dark:text-gray-400 truncate">
                                    {item.category}
                                  </p>
                                  {!item.is_active && (
                                    <Badge variant="secondary" className="mt-1 text-xs">
                                      หยุดชั่วคราว
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 xs:h-9 xs:w-9 opacity-60 group-hover:opacity-100 flex-shrink-0 hover:bg-white/50 dark:hover:bg-gray-800/50" 
                                    aria-label="ตัวเลือกรายการ"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem onClick={() => handleEdit(item)} className="gap-2">
                                    <Edit className="w-4 h-4" />
                                    แก้ไขรายการ
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={async() => {
                                      await toggleRecurringItem(item.id, !item.is_active);
                                      toast({
                                        title: "สถานะอัปเดต",
                                        description: item.is_active 
                                          ? `รายการ "${item.name}" ถูกหยุดชั่วคราวแล้ว` 
                                          : `รายการ "${item.name}" เริ่มใช้งานแล้ว`,
                                        variant: "success"
                                      });
                                    }}
                                    className="gap-2"
                                  >
                                    {item.is_active ? (
                                      <>
                                        <PauseCircle className="w-4 h-4" />
                                        หยุดชั่วคราว
                                      </>
                                    ) : (
                                      <>
                                        <PlayCircle className="w-4 h-4" />
                                        เริ่มใช้งาน
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem 
                                        onSelect={e => e.preventDefault()} 
                                        className="gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                        ลบรายการ
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="max-w-md">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle className="text-lg">
                                          ยืนยันการลบ
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="text-base">
                                          คุณแน่ใจหรือไม่ที่จะลบรายการ <span className="font-semibold">"{item.name}"</span>?
                                          <br />
                                          การกระทำนี้ไม่สามารถย้อนกลับได้
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter className="gap-2">
                                        <AlertDialogCancel className="sm:w-auto">
                                          ยกเลิก
                                        </AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={async() => {
                                            await deleteRecurringItem(item.id);
                                            toast({ 
                                              title: "ลบสำเร็จ", 
                                              description: `รายการ "${item.name}" ถูกลบแล้ว`, 
                                              variant: "success" 
                                            });
                                          }} 
                                          className="bg-red-500 hover:bg-red-600 sm:w-auto"
                                        >
                                          ยืนยันการลบ
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            
                            {/* Amount and frequency */}
                            <div className="flex justify-between items-end gap-2">
                              <div className="space-y-1">
                                <p className={cn(
                                  "font-bold text-lg xs:text-xl sm:text-2xl leading-tight",
                                  item.type === 'income' 
                                    ? "text-green-700 dark:text-green-400" 
                                    : "text-red-700 dark:text-red-400"
                                )}>
                                  ฿{item.amount.toLocaleString()}
                                </p>
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "text-xs border-current",
                                    item.type === 'income' 
                                      ? "text-green-600 dark:text-green-400" 
                                      : "text-red-600 dark:text-red-400"
                                  )}
                                >
                                  {item.frequency === 'daily' ? '📅 รายวัน' : 
                                   item.frequency === 'weekly' ? '🗓️ รายสัปดาห์' : 
                                   item.frequency === 'monthly' ? '📆 รายเดือน' : '🎯 รายปี'}
                                </Badge>
                              </div>
                              
                              <div className="text-right text-xs xs:text-sm text-gray-500 dark:text-gray-400">
                                <p className="font-medium">เริ่มต้น</p>
                                <p>
                                  {new Date(item.start_date).toLocaleDateString('th-TH', {
                                    day: 'numeric', 
                                    month: 'short',
                                    year: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 xs:space-y-6"
                >
                  <div className="w-20 h-20 xs:w-24 xs:h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-950/50 dark:to-purple-950/50 flex items-center justify-center">
                    <Repeat className="w-10 h-10 xs:w-12 xs:h-12 sm:w-16 sm:h-16 text-blue-500/60" />
                  </div>
                  <div className="space-y-2 xs:space-y-3">
                    <h3 className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                      ไม่มีรายการเกิดซ้ำ
                    </h3>
                    <p className="text-sm xs:text-base text-gray-600 dark:text-gray-400 max-w-md">
                      เริ่มต้นสร้างรายการเกิดซ้ำเพื่อจัดการการเงินอัตโนมัติ
                    </p>
                  </div>
                  <Button 
                    onClick={handleAddNew} 
                    className="mt-4 xs:mt-6 h-10 xs:h-11 px-6 xs:px-8 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Plus className="w-4 h-4 xs:w-5 xs:h-5 mr-2" />
                    เพิ่มรายการแรก
                  </Button>
                </motion.div>
              )
            )}
            
            {/* Calendar View - Enhanced */}
            {viewMode === 'calendar' && (
              <Card className="w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
                <CardHeader className="border-b border-gray-200/50 dark:border-gray-700/50">
                  <CardTitle className="text-lg xs:text-xl sm:text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    📅 ปฏิทินรายการเกิดซ้ำ
                  </CardTitle>
                  <CardDescription className="text-sm xs:text-base">
                    ภาพรวมรายการเกิดซ้ำของคุณในแต่ละเดือน
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-2 xs:p-4 sm:p-6">
                  <Calendar 
                    mode="multiple" 
                    selected={calendarEvents.map(e => e.date)} 
                    onMonthChange={setCurrentMonth} 
                    month={currentMonth} 
                    modifiers={{ events: calendarEvents.map(e => e.date) }} 
                    modifiersClassNames={{ 
                      events: "bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-full font-bold shadow-lg transform scale-110" 
                    }}
                    className="w-full max-w-none"
                  />
                </CardContent>
              </Card>
            )}

            {/* Timeline View - Enhanced */}
            {viewMode === 'timeline' && (
              <Card className="w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
                <CardHeader className="border-b border-gray-200/50 dark:border-gray-700/50">
                  <CardTitle className="text-lg xs:text-xl sm:text-2xl bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    🕒 ไทม์ไลน์ 30 วันข้างหน้า
                  </CardTitle>
                  <CardDescription className="text-sm xs:text-base">
                    รายการเกิดซ้ำที่กำลังจะมาถึง
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 xs:p-4 sm:p-6 space-y-4 xs:space-y-6">
                  {timelineEvents.length > 0 ? (
                    timelineEvents.map((event, index) => (
                      <motion.div 
                        key={event.date.toISOString()} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex gap-3 xs:gap-4 sm:gap-6 items-start"
                      >
                        {/* Enhanced Date indicator */}
                        <div className="flex-shrink-0 text-center">
                          <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 text-white flex flex-col items-center justify-center shadow-lg">
                            <p className="text-sm xs:text-base sm:text-lg font-bold leading-none">
                              {format(event.date, 'dd')}
                            </p>
                            <p className="text-xs leading-none opacity-90">
                              {format(event.date, 'MMM')}
                            </p>
                          </div>
                        </div>
                        
                        {/* Event list for the day */}
                        <div className="flex-1 space-y-2 xs:space-y-3">
                          {event.items.map(item => (
                            <motion.div 
                              key={item.id} 
                              whileHover={{ scale: 1.02 }}
                              className={cn(
                                "p-3 xs:p-4 rounded-xl transition-all duration-200 border shadow-sm hover:shadow-md",
                                item.type === 'income' 
                                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200/50 dark:border-green-800/50' 
                                  : 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-red-200/50 dark:border-red-800/50'
                              )}
                            >
                              <div className="flex justify-between items-start gap-2 xs:gap-3">
                                <div className="flex items-start gap-2 xs:gap-3 flex-1 min-w-0">
                                  <div className={cn(
                                    "w-8 h-8 xs:w-10 xs:h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                                    item.type === 'income' 
                                      ? "bg-gradient-to-br from-green-500 to-emerald-600" 
                                      : "bg-gradient-to-br from-red-500 to-rose-600"
                                  )}>
                                    {item.type === 'income' ? (
                                      <TrendingUp className="w-4 h-4 xs:w-5 xs:h-5 text-white" />
                                    ) : (
                                      <TrendingDown className="w-4 h-4 xs:w-5 xs:h-5 text-white" />
                                    )}
                                  </div>
                                  
                                  <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-sm xs:text-base truncate text-gray-900 dark:text-gray-100">
                                      {item.name}
                                    </p>
                                    <p className="text-xs xs:text-sm text-gray-600 dark:text-gray-400 truncate">
                                      {item.category}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="text-right flex-shrink-0">
                                  <p className={cn(
                                    "font-bold text-sm xs:text-base sm:text-lg",
                                    item.type === 'income' 
                                      ? 'text-green-700 dark:text-green-400' 
                                      : 'text-red-700 dark:text-red-400'
                                  )}>
                                    ฿{item.amount.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12 xs:py-16 space-y-4"
                    >
                      <div className="w-16 h-16 xs:w-20 xs:h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mx-auto">
                        <Info className="w-8 h-8 xs:w-10 xs:h-10 text-gray-400" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg xs:text-xl font-semibold text-gray-900 dark:text-gray-100">
                          ไม่มีรายการใน 30 วันข้างหน้า
                        </h3>
                        <p className="text-sm xs:text-base text-gray-600 dark:text-gray-400">
                          สร้างรายการเกิดซ้ำเพื่อดูในไทม์ไลน์
                        </p>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
        
        {/* Enhanced Floating Action Button for mobile */}
        {isMobile && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileTap={{ scale: 0.9 }}
            className="fixed bottom-4 xs:bottom-6 right-4 xs:right-6 z-50"
          >
            <Button 
              onClick={handleAddNew}
              className="w-14 h-14 xs:w-16 xs:h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-2xl hover:shadow-3xl transition-all duration-300 border-4 border-white/20 backdrop-blur-sm"
              aria-label="เพิ่มรายการใหม่"
            >
              <Plus className="w-6 h-6 xs:w-8 xs:h-8 text-white" />
            </Button>
          </motion.div>
        )}
        
        {/* Enhanced Dialog/Drawer for add/edit form */}
        <Dialog open={isFormOpen && !isMobile} onOpenChange={handleModalClose}>
          <DialogContent className="max-w-lg p-0 mx-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50">
            <DialogHeader className="p-4 xs:p-6 pb-0 border-b border-gray-200/50 dark:border-gray-700/50">
              <DialogTitle className="text-lg xs:text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {editingItem ? '✏️ แก้ไขรายการเกิดซ้ำ' : '✨ สร้างรายการเกิดซ้ำใหม่'}
              </DialogTitle>
              <DialogDescription className="text-sm xs:text-base text-gray-600 dark:text-gray-400">
                กรอกข้อมูลให้ครบถ้วนเพื่อจัดการรายการอัตโนมัติ
              </DialogDescription>
            </DialogHeader>
            <RecurringItemForm onFinished={handleModalClose} editingItem={editingItem}/>
          </DialogContent>
        </Dialog>
        
        <Drawer open={isFormOpen && isMobile} onClose={handleModalClose}>
          <DrawerContent className="max-h-[95vh] bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg">
            <DrawerHeader className="text-left px-4 xs:px-6 border-b border-gray-200/50 dark:border-gray-700/50">
              <DrawerTitle className="text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {editingItem ? '✏️ แก้ไขรายการเกิดซ้ำ' : '✨ สร้างรายการเกิดซ้ำใหม่'}
              </DrawerTitle>
              <DrawerDescription className="text-sm text-gray-600 dark:text-gray-400">
                กรอกข้อมูลให้ครบถ้วนเพื่อจัดการรายการอัตโนมัติ
              </DrawerDescription>
            </DrawerHeader>
            <div className="overflow-y-auto flex-1">
              <RecurringItemForm onFinished={handleModalClose} editingItem={editingItem}/>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
};

export default Recurring;