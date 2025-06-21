import React, { useState } from 'react';
import { useSupabaseFinance } from '../context/SupabaseFinanceContext';
import { Plus, Target, Trash2, MoreVertical } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Budget Form Component
const BudgetForm = ({ onFinished }: { onFinished: () => void }) => {
    const { addBudget } = useSupabaseFinance();
    const [form, setForm] = useState({
        category: '',
        amount: '',
        month: new Date().toISOString().slice(0, 7)
    });
    const categories = ['อาหาร', 'การเดินทาง', 'ความบันเทิง', 'สาธารณูปโภค', 'สุขภาพ', 'ช็อปปิ้ง', 'ค่าใช้จ่ายอื่นๆ'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.category || !form.amount) {
            toast({ title: "ข้อมูลไม่ครบถ้วน", variant: "destructive" });
            return;
        }
        await addBudget({ ...form, amount: parseFloat(form.amount) });
        onFinished();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
                <label>เดือน</label>
                <Input type="month" value={form.month} onChange={(e) => setForm(p => ({ ...p, month: e.target.value }))} />
            </div>
            <div className="grid gap-2">
                <label>หมวดหมู่</label>
                <Select value={form.category} onValueChange={(value) => setForm(p => ({...p, category: value}))}>
                    <SelectTrigger><SelectValue placeholder="เลือกหมวดหมู่" /></SelectTrigger>
                    <SelectContent>
                        {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
                <label>จำนวนเงินงบประมาณ</label>
                <Input type="number" value={form.amount} onChange={(e) => setForm(p => ({...p, amount: e.target.value}))} placeholder="0.00" required/>
            </div>
            <Button type="submit" className="w-full">บันทึกงบประมาณ</Button>
        </form>
    )
}

const Budget = () => {
  const { budgets, transactions, deleteBudget } = useSupabaseFinance();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isFormOpen, setFormOpen] = useState(false);

  const monthTransactions = transactions.filter(t => t.type === 'expense' && t.date.startsWith(selectedMonth));
  const monthBudgets = budgets.filter(b => b.month === selectedMonth);

  const budgetTracking = monthBudgets.map(budget => {
      const spent = monthTransactions.filter(t => t.category === budget.category).reduce((sum, t) => sum + t.amount, 0);
      const remaining = budget.amount - spent;
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      return { ...budget, spent, remaining, percentage: Math.min(percentage, 100) };
  });
  
  const totalBudgeted = budgetTracking.reduce((sum, item) => sum + item.amount, 0);
  const totalSpent = budgetTracking.reduce((sum, item) => sum + item.spent, 0);
  const totalRemaining = totalBudgeted - totalSpent;

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-900">งบประมาณ</h1>
            <p className="text-muted-foreground mt-1">ตั้งค่าและติดตามงบประมาณรายเดือนของคุณ</p>
        </div>
        <div className="flex gap-2">
          <Input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-48"/>
          <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
              <DialogTrigger asChild>
                  <Button><Plus className="mr-2 h-4 w-4" /> ตั้งงบประมาณ</Button>
              </DialogTrigger>
              <DialogContent>
                  <DialogHeader>
                      <DialogTitle>ตั้งงบประมาณใหม่</DialogTitle>
                      <DialogDescription>กำหนดงบประมาณสำหรับหมวดหมู่ในเดือนที่เลือก</DialogDescription>
                  </DialogHeader>
                  <BudgetForm onFinished={() => setFormOpen(false)} />
              </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">งบประมาณทั้งหมด</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">฿{totalBudgeted.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">ใช้ไปแล้ว</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">฿{totalSpent.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">คงเหลือ</CardTitle></CardHeader>
          <CardContent><div className={`text-2xl font-bold ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>฿{totalRemaining.toLocaleString()}</div></CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>การติดตามงบประมาณ - {new Date(selectedMonth).toLocaleDateString('th-TH', {month: 'long', year: 'numeric'})}</CardTitle>
          <CardDescription>ภาพรวมการใช้จ่ายเทียบกับงบประมาณในแต่ละหมวดหมู่</CardDescription>
        </CardHeader>
        <CardContent>
          {budgetTracking.length > 0 ? (
            <div className="space-y-6">
              {budgetTracking.map((item) => (
                <div key={item.category}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{item.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        ฿{item.spent.toLocaleString()} / <span className="font-medium text-foreground">฿{item.amount.toLocaleString()}</span>
                      </span>
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4"/></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                              <DropdownMenuItem className="text-red-500" onClick={() => deleteBudget(item.id || '', '')}>ลบ</DropdownMenuItem>
                          </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <Progress value={item.percentage} className="mt-2 h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{item.percentage.toFixed(0)}% ที่ใช้ไป</span>
                    <span className={item.remaining >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {item.remaining >= 0 ? `เหลือ ฿${item.remaining.toLocaleString()}` : `เกิน ฿${Math.abs(item.remaining).toLocaleString()}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Target className="mx-auto h-12 w-12" />
              <h3 className="mt-4 text-lg font-semibold">ยังไม่มีงบประมาณสำหรับเดือนนี้</h3>
              <p className="mt-1 text-sm">คลิก 'ตั้งงบประมาณ' เพื่อเริ่มต้น</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Budget;