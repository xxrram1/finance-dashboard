import React, { useState } from 'react';
import { useSupabaseFinance } from '../context/SupabaseFinanceContext';
import { Plus, Trash2, Repeat } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

const RecurringItemForm = ({ onFinished }: { onFinished: () => void }) => {
  const { addRecurringItem } = useSupabaseFinance();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
    amount: '',
    frequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    start_date: new Date().toISOString().split('T')[0]
  });

  const categories = {
    income: ['เงินเดือน', 'ฟรีแลนซ์', 'เงินลงทุน', 'ของขวัญ', 'รายรับอื่นๆ'],
    expense: ['อาหาร', 'การเดินทาง', 'ความบันเทิง', 'สาธารณูปโภค', 'สุขภาพ', 'ช็อปปิ้ง', 'ค่าใช้จ่ายอื่นๆ']
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.category || !form.amount) {
        toast({ title: "ข้อมูลไม่ครบถ้วน", variant: "destructive" });
        return;
    }
    setLoading(true);
    await addRecurringItem({ ...form, amount: parseFloat(form.amount), is_active: true });
    setLoading(false);
    if (onFinished) onFinished();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-2"><Label htmlFor="rec-name">ชื่อรายการ</Label><Input id="rec-name" value={form.name} onChange={e => setForm(p=>({...p, name: e.target.value}))} required placeholder="เช่น ค่าเช่าบ้าน, Netflix"/></div>
        <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>ประเภท</Label><Select value={form.type} onValueChange={(v) => setForm(p=>({...p, type: v as any, category:''}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="expense">รายจ่าย</SelectItem><SelectItem value="income">รายรับ</SelectItem></SelectContent></Select></div>
            <div className="grid gap-2"><Label>หมวดหมู่</Label><Select value={form.category} onValueChange={(v) => setForm(p=>({...p, category: v}))} required><SelectTrigger><SelectValue placeholder="เลือกหมวดหมู่"/></SelectTrigger><SelectContent>{categories[form.type].map(c=><SelectItem value={c} key={c}>{c}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>จำนวนเงิน</Label><Input type="number" step="0.01" value={form.amount} onChange={e => setForm(p=>({...p, amount: e.target.value}))} required/></div>
            <div className="grid gap-2"><Label>ความถี่</Label><Select value={form.frequency} onValueChange={(v) => setForm(p=>({...p, frequency: v as any}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="daily">รายวัน</SelectItem><SelectItem value="weekly">รายสัปดาห์</SelectItem><SelectItem value="monthly">รายเดือน</SelectItem><SelectItem value="yearly">รายปี</SelectItem></SelectContent></Select></div>
        </div>
        <div className="grid gap-2"><Label>วันที่เริ่มต้น</Label><Input type="date" value={form.start_date} onChange={e => setForm(p=>({...p, start_date: e.target.value}))} /></div>
        <Button type="submit" className="w-full" disabled={loading}>{loading ? "กำลังบันทึก..." : "บันทึกรายการ"}</Button>
    </form>
  )
}

const Recurring = () => {
  const { recurringItems, deleteRecurringItem, loading } = useSupabaseFinance();
  const [isFormOpen, setFormOpen] = useState(false);

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">รายการเกิดซ้ำ</h1>
          <p className="text-muted-foreground mt-1">จัดการรายรับและรายจ่ายที่เกิดขึ้นเป็นประจำ</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4"/> เพิ่มรายการเกิดซ้ำ</Button></DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>เพิ่มรายการเกิดซ้ำ</DialogTitle>
                    <DialogDescription>สำหรับรายรับ-รายจ่ายที่เกิดขึ้นสม่ำเสมอ เช่น เงินเดือน, ค่าเช่า</DialogDescription>
                </DialogHeader>
                <RecurringItemForm onFinished={() => setFormOpen(false)}/>
            </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>รายการทั้งหมด</CardTitle><CardDescription>รายการทั้งหมดที่เกิดขึ้นเป็นประจำและยังใช้งานอยู่</CardDescription></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-[700px] md:min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อ</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>หมวดหมู่</TableHead>
                  <TableHead>จำนวนเงิน</TableHead>
                  <TableHead>ความถี่</TableHead>
                  <TableHead>วันที่เริ่ม</TableHead>
                  <TableHead className="text-center w-[80px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({length: 3}).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-8 w-full"/></TableCell></TableRow>
                  ))
                ) : recurringItems.length > 0 ? (
                  recurringItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell><span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.type === 'income' ? 'รายรับ' : 'รายจ่าย'}</span></TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell className={`font-medium ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>฿{item.amount.toLocaleString('th-TH', {minimumFractionDigits: 2})}</TableCell>
                      <TableCell className="capitalize">{item.frequency}</TableCell>
                      <TableCell>{new Date(item.start_date).toLocaleDateString('th-TH')}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" onClick={() => deleteRecurringItem(item.id)}><Trash2 className="h-4 w-4 text-muted-foreground"/></Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center">
                      <div className="flex flex-col items-center gap-4"><Repeat className="h-16 w-16 text-muted-foreground/30"/><h3 className="text-xl font-semibold">ยังไม่มีรายการเกิดซ้ำ</h3><p className="text-muted-foreground">เพิ่มรายการ เช่น ค่าบริการรายเดือน หรือเงินเดือน</p></div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Recurring;