import React, { useState } from 'react';
import { useSupabaseFinance } from '../context/SupabaseFinanceContext';
import { Plus, Trash2, List } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';

const TransactionForm = ({ onFinished }: { onFinished?: () => void }) => {
  const { addTransaction } = useSupabaseFinance();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'expense' as 'income' | 'expense',
    category: '',
    amount: '',
    note: ''
  });

  const categories = {
    income: ['เงินเดือน', 'ฟรีแลนซ์', 'เงินลงทุน', 'ของขวัญ', 'รายรับอื่นๆ'],
    expense: ['อาหาร', 'การเดินทาง', 'ความบันเทิง', 'สาธารณูปโภค', 'สุขภาพ', 'ช็อปปิ้ง', 'ค่าใช้จ่ายอื่นๆ']
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category || !form.amount) {
      toast({ title: "ข้อมูลไม่ครบ", description: "กรุณากรอกข้อมูลที่จำเป็น", variant: "destructive" });
      return;
    }
    setLoading(true);
    await addTransaction({ ...form, amount: parseFloat(form.amount) });
    setLoading(false);
    setForm({ date: new Date().toISOString().split('T')[0], type: 'expense', category: '', amount: '', note: '' });
    if(onFinished) onFinished();
  };

  return (
    <form onSubmit={handleSubmit} className="grid items-start gap-4">
      <div className="grid gap-2">
        <Label htmlFor="type">ประเภท</Label>
        <Select value={form.type} onValueChange={(value) => setForm(prev => ({ ...prev, type: value as 'income'|'expense', category: '' }))}>
          <SelectTrigger id="type"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="expense">รายจ่าย</SelectItem>
            <SelectItem value="income">รายรับ</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="category">หมวดหมู่</Label>
        <Select value={form.category} onValueChange={(value) => setForm(prev => ({...prev, category: value}))}>
          <SelectTrigger id="category"><SelectValue placeholder="เลือกหมวดหมู่" /></SelectTrigger>
          <SelectContent>
            {categories[form.type].map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="amount">จำนวนเงิน</Label>
        <Input id="amount" type="number" step="0.01" value={form.amount} onChange={e => setForm(p => ({...p, amount: e.target.value}))} placeholder="0.00" required />
      </div>
       <div className="grid gap-2">
        <Label htmlFor="date">วันที่</Label>
        <Input id="date" type="date" value={form.date} onChange={e => setForm(p => ({...p, date: e.target.value}))} />
      </div>
       <div className="grid gap-2">
        <Label htmlFor="note">หมายเหตุ</Label>
        <Input id="note" value={form.note} onChange={e => setForm(p => ({...p, note: e.target.value}))} placeholder="หมายเหตุ (ถ้ามี)" />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>{loading ? "กำลังบันทึก..." : "บันทึกรายการ"}</Button>
    </form>
  )
}

const AddTransaction = () => {
    const isMobile = useIsMobile();
    const [open, setOpen] = React.useState(false);

    const FormComponent = <TransactionForm onFinished={() => setOpen(false)} />;

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={setOpen}>
                <DrawerTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> เพิ่มรายการ</Button></DrawerTrigger>
                <DrawerContent>
                    <DrawerHeader className="text-left"><DrawerTitle>เพิ่มรายการใหม่</DrawerTitle><DrawerDescription>บันทึกรายรับ-รายจ่ายของคุณ</DrawerDescription></DrawerHeader>
                    <div className="p-4">{FormComponent}</div>
                </DrawerContent>
            </Drawer>
        )
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> เพิ่มรายการ</Button></DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>เพิ่มรายการใหม่</DialogTitle><DialogDescription>บันทึกรายรับ-รายจ่ายของคุณ</DialogDescription></DialogHeader>
                {FormComponent}
            </DialogContent>
        </Dialog>
    )
}

const Transactions = () => {
  const { transactions, deleteTransaction, loading } = useSupabaseFinance();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">รายการธุรกรรม</h1>
          <p className="text-muted-foreground mt-1">จัดการรายรับและรายจ่ายทั้งหมดของคุณ</p>
        </div>
        <AddTransaction />
      </div>

      <Card>
        <CardHeader><CardTitle>ประวัติรายการ</CardTitle><CardDescription>แสดง 50 รายการล่าสุดของคุณ</CardDescription></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-[600px] md:min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>วันที่</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>หมวดหมู่</TableHead>
                  <TableHead>หมายเหตุ</TableHead>
                  <TableHead className="text-right">จำนวนเงิน</TableHead>
                  <TableHead className="text-center w-[80px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({length: 5}).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : transactions.length > 0 ? (
                  transactions.slice(0, 50).map((t) => (
                    <TableRow key={t.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{new Date(t.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric'})}</TableCell>
                      <TableCell><span className={`px-2 py-1 text-xs font-semibold rounded-full ${t.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{t.type === 'income' ? 'รายรับ' : 'รายจ่าย'}</span></TableCell>
                      <TableCell>{t.category}</TableCell>
                      <TableCell className="text-muted-foreground">{t.note || '-'}</TableCell>
                      <TableCell className={`text-right font-medium ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'income' ? '+' : '-'}฿{t.amount.toLocaleString('th-TH', {minimumFractionDigits: 2})}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" onClick={() => deleteTransaction(t.id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center">
                      <div className="flex flex-col items-center gap-4"><List className="h-16 w-16 text-muted-foreground/30"/><h3 className="text-xl font-semibold">ยังไม่มีรายการ</h3><p className="text-muted-foreground">เริ่มเพิ่มรายการแรกของคุณได้โดยคลิกปุ่ม 'เพิ่มรายการ'</p></div>
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

export default Transactions;