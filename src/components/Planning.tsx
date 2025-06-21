import React, { useState } from 'react';
import { useSupabaseFinance } from '../context/SupabaseFinanceContext';
import { Calculator, Target, TrendingUp, PieChart, Wallet, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Planning = () => {
  // ... (hooks and state remain the same)
  const [netWorth, setNetWorth] = useState({ cash: '', investments: '', property: '', mortgage: '', loans: '', creditCard: '' });
  const [debtPayoff, setDebtPayoff] = useState({ debtAmount: '', interestRate: '', monthlyPayment: '' });
  const [rule503020, setRule503020] = useState({ monthlyIncome: '' });

  // Calculator functions
  const calculateNetWorth = () => {
    const totalAssets = parseFloat(netWorth.cash || '0') + parseFloat(netWorth.investments || '0') + parseFloat(netWorth.property || '0');
    const totalLiabilities = parseFloat(netWorth.mortgage || '0') + parseFloat(netWorth.loans || '0') + parseFloat(netWorth.creditCard || '0');
    return { totalAssets, totalLiabilities, netWorth: totalAssets - totalLiabilities };
  };

  const calculateDebtPayoff = () => {
    const debt = parseFloat(debtPayoff.debtAmount || '0');
    const rate = parseFloat(debtPayoff.interestRate || '0') / 100 / 12;
    const payment = parseFloat(debtPayoff.monthlyPayment || '0');
    if (debt <= 0 || payment <= 0 || rate < 0 || payment <= debt * rate) return { months: Infinity, totalInterest: 0 };
    const months = -Math.log(1 - (debt * rate) / payment) / Math.log(1 + rate);
    return { months: Math.ceil(months), totalInterest: (payment * Math.ceil(months)) - debt };
  };
  
  const calculate503020 = () => {
    const income = parseFloat(rule503020.monthlyIncome || '0');
    return { needs: income * 0.5, wants: income * 0.3, savings: income * 0.2 };
  };

  const netWorthResult = calculateNetWorth();
  const debtResult = calculateDebtPayoff();
  const ruleResult = calculate503020();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">เครื่องมือวางแผนการเงิน</h1>
        <p className="text-muted-foreground mt-1">วางแผนอนาคตทางการเงินของคุณด้วยเครื่องมือเหล่านี้</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Net Worth Calculator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wallet/>เครื่องคำนวณมูลค่าสุทธิ</CardTitle>
            <CardDescription>คำนวณความมั่งคั่งของคุณจากสินทรัพย์และหนี้สิน</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-green-600">สินทรัพย์</h4>
              <div className="grid gap-1.5"><Label htmlFor="nw-cash">เงินสด/เงินออม</Label><Input id="nw-cash" type="number" placeholder="฿" value={netWorth.cash} onChange={(e) => setNetWorth(p => ({ ...p, cash: e.target.value }))}/></div>
              <div className="grid gap-1.5"><Label htmlFor="nw-invest">การลงทุน</Label><Input id="nw-invest" type="number" placeholder="฿" value={netWorth.investments} onChange={(e) => setNetWorth(p => ({ ...p, investments: e.target.value }))}/></div>
              <div className="grid gap-1.5"><Label htmlFor="nw-prop">อสังหาริมทรัพย์</Label><Input id="nw-prop" type="number" placeholder="฿" value={netWorth.property} onChange={(e) => setNetWorth(p => ({ ...p, property: e.target.value }))}/></div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-red-600">หนี้สิน</h4>
              <div className="grid gap-1.5"><Label htmlFor="nw-mort">จำนอง</Label><Input id="nw-mort" type="number" placeholder="฿" value={netWorth.mortgage} onChange={(e) => setNetWorth(p => ({ ...p, mortgage: e.target.value }))}/></div>
              <div className="grid gap-1.5"><Label htmlFor="nw-loans">เงินกู้</Label><Input id="nw-loans" type="number" placeholder="฿" value={netWorth.loans} onChange={(e) => setNetWorth(p => ({ ...p, loans: e.target.value }))}/></div>
              <div className="grid gap-1.5"><Label htmlFor="nw-cc">บัตรเครดิต</Label><Input id="nw-cc" type="number" placeholder="฿" value={netWorth.creditCard} onChange={(e) => setNetWorth(p => ({ ...p, creditCard: e.target.value }))}/></div>
            </div>
             <div className="md:col-span-2 bg-muted rounded-lg p-4 text-center">
                <p className="text-sm font-medium text-muted-foreground">มูลค่าสุทธิของคุณคือ</p>
                <p className={`text-3xl font-bold ${netWorthResult.netWorth >= 0 ? 'text-primary' : 'text-destructive'}`}>฿{netWorthResult.netWorth.toLocaleString()}</p>
             </div>
          </CardContent>
        </Card>

        {/* Debt Payoff Calculator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Banknote/>เครื่องคำนวณการชำระหนี้</CardTitle>
            <CardDescription>วางแผนการชำระหนี้เพื่ออิสรภาพทางการเงิน</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-1.5"><Label htmlFor="d-amount">จำนวนหนี้ทั้งหมด</Label><Input id="d-amount" type="number" placeholder="฿" value={debtPayoff.debtAmount} onChange={(e) => setDebtPayoff(p => ({ ...p, debtAmount: e.target.value }))}/></div>
            <div className="grid gap-1.5"><Label htmlFor="d-rate">อัตราดอกเบี้ยต่อปี (%)</Label><Input id="d-rate" type="number" placeholder="%" value={debtPayoff.interestRate} onChange={(e) => setDebtPayoff(p => ({ ...p, interestRate: e.target.value }))}/></div>
            <div className="grid gap-1.5"><Label htmlFor="d-payment">ยอดชำระต่อเดือน</Label><Input id="d-payment" type="number" placeholder="฿" value={debtPayoff.monthlyPayment} onChange={(e) => setDebtPayoff(p => ({ ...p, monthlyPayment: e.target.value }))}/></div>
             <div className="bg-muted rounded-lg p-4 text-center">
                <p className="text-sm font-medium text-muted-foreground">คุณจะปลอดหนี้ใน</p>
                {debtResult.months === Infinity ? 
                    <p className="text-xl font-bold text-destructive">ยอดชำระน้อยเกินไป</p>
                    :
                    <>
                        <p className="text-3xl font-bold text-primary">{debtResult.months} เดือน</p>
                        <p className="text-xs text-muted-foreground">ดอกเบี้ยที่จ่ายทั้งหมด: ฿{debtResult.totalInterest.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                    </>
                }
             </div>
          </CardContent>
        </Card>
        
        {/* 50/30/20 Rule */}
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><PieChart/>กฎการเงิน 50/30/20</CardTitle>
                <CardDescription>แบ่งสัดส่วนรายได้เพื่อการใช้จ่ายและเก็บออมอย่างมีประสิทธิภาพ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid gap-1.5"><Label htmlFor="r-income">รายได้สุทธิต่อเดือน</Label><Input id="r-income" type="number" placeholder="฿" value={rule503020.monthlyIncome} onChange={(e) => setRule503020(p => ({ ...p, monthlyIncome: e.target.value }))}/></div>
                 <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-blue-800">50% ความจำเป็น</h4>
                        <p className="text-2xl font-bold text-blue-600">฿{ruleResult.needs.toLocaleString()}</p>
                    </div>
                     <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <h4 className="font-semibold text-purple-800">30% ความต้องการ</h4>
                        <p className="text-2xl font-bold text-purple-600">฿{ruleResult.wants.toLocaleString()}</p>
                    </div>
                     <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <h4 className="font-semibold text-green-800">20% การออม/ลงทุน</h4>
                        <p className="text-2xl font-bold text-green-600">฿{ruleResult.savings.toLocaleString()}</p>
                    </div>
                 </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Planning;