import React, { useState } from 'react';
import { useSupabaseFinance } from '../context/SupabaseFinanceContext';
import { Calculator, Target, TrendingUp, PieChart } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Planning = () => {
  const { recurringItems } = useSupabaseFinance();
  const [activeCalculator, setActiveCalculator] = useState('networth');

  // Net Worth Calculator
  const [netWorth, setNetWorth] = useState({
    cash: '',
    investments: '',
    property: '',
    mortgage: '',
    loans: '',
    creditCard: ''
  });

  // Debt Payoff Calculator
  const [debtPayoff, setDebtPayoff] = useState({
    debtAmount: '',
    interestRate: '',
    monthlyPayment: ''
  });

  // Financial Goal Calculator
  const [financialGoal, setFinancialGoal] = useState({
    goalAmount: '',
    initialSavings: '',
    monthlyContribution: '',
    interestRate: ''
  });

  // 50/30/20 Rule Calculator
  const [rule503020, setRule503020] = useState({
    monthlyIncome: ''
  });

  // Future Value Calculator
  const [futureValue, setFutureValue] = useState({
    presentValue: '',
    annualRate: '',
    years: '',
    annualContribution: ''
  });

  // Cash Flow Projection
  const [cashFlowProjection, setCashFlowProjection] = useState({
    startDate: new Date().toISOString().split('T')[0],
    months: '12'
  });

  const calculators = [
    { id: 'networth', label: 'มูลค่าสุทธิ', icon: Target },
    { id: 'debt', label: 'การชำระหนี้', icon: Calculator },
    { id: 'goal', label: 'เป้าหมายทางการเงิน', icon: TrendingUp },
    { id: 'rule', label: 'กฎ 50/30/20', icon: PieChart },
    { id: 'future', label: 'มูลค่าในอนาคต', icon: TrendingUp },
    { id: 'cashflow', label: 'ประมาณการกระแสเงินสด', icon: Calculator }
  ];

  // Calculator functions
  const calculateNetWorth = () => {
    const totalAssets = parseFloat(netWorth.cash || '0') + 
                       parseFloat(netWorth.investments || '0') + 
                       parseFloat(netWorth.property || '0');
    const totalLiabilities = parseFloat(netWorth.mortgage || '0') + 
                            parseFloat(netWorth.loans || '0') + 
                            parseFloat(netWorth.creditCard || '0');
    return totalAssets - totalLiabilities;
  };

  const calculateDebtPayoff = () => {
    const debt = parseFloat(debtPayoff.debtAmount || '0');
    const rate = parseFloat(debtPayoff.interestRate || '0') / 100 / 12;
    const payment = parseFloat(debtPayoff.monthlyPayment || '0');
    
    if (debt <= 0 || payment <= 0 || rate < 0) return { months: 0, totalInterest: 0 };
    
    const months = Math.log(1 + (debt * rate) / payment) / Math.log(1 + rate);
    const totalPaid = payment * months;
    const totalInterest = totalPaid - debt;
    
    return { months: Math.ceil(months), totalInterest };
  };

  const calculateFinancialGoal = () => {
    const goal = parseFloat(financialGoal.goalAmount || '0');
    const initial = parseFloat(financialGoal.initialSavings || '0');
    const monthly = parseFloat(financialGoal.monthlyContribution || '0');
    const rate = parseFloat(financialGoal.interestRate || '0') / 100 / 12;
    
    if (goal <= initial) return 0;
    
    const remaining = goal - initial;
    if (monthly <= 0) return Infinity;
    
    if (rate === 0) {
      return Math.ceil(remaining / monthly);
    }
    
    const months = Math.log(1 + (remaining * rate) / monthly) / Math.log(1 + rate);
    return Math.ceil(months);
  };

  const calculate503020 = () => {
    const income = parseFloat(rule503020.monthlyIncome || '0');
    return {
      needs: income * 0.5,
      wants: income * 0.3,
      savings: income * 0.2
    };
  };

  const calculateFutureValue = () => {
    const pv = parseFloat(futureValue.presentValue || '0');
    const rate = parseFloat(futureValue.annualRate || '0') / 100;
    const years = parseFloat(futureValue.years || '0');
    const annualContrib = parseFloat(futureValue.annualContribution || '0');
    
    const futureValuePV = pv * Math.pow(1 + rate, years);
    const futureValueContrib = annualContrib * ((Math.pow(1 + rate, years) - 1) / rate);
    
    return futureValuePV + (rate === 0 ? annualContrib * years : futureValueContrib);
  };

  const generateCashFlowProjection = () => {
    const months = parseInt(cashFlowProjection.months || '12');
    const startDate = new Date(cashFlowProjection.startDate);
    
    // Calculate monthly recurring income and expenses
    const monthlyIncome = recurringItems
      .filter(item => item.type === 'income')
      .reduce((sum, item) => {
        switch (item.frequency) {
          case 'daily': return sum + (item.amount * 30);
          case 'weekly': return sum + (item.amount * 4.33);
          case 'monthly': return sum + item.amount;
          case 'yearly': return sum + (item.amount / 12);
          default: return sum;
        }
      }, 0);

    const monthlyExpenses = recurringItems
      .filter(item => item.type === 'expense')
      .reduce((sum, item) => {
        switch (item.frequency) {
          case 'daily': return sum + (item.amount * 30);
          case 'weekly': return sum + (item.amount * 4.33);
          case 'monthly': return sum + item.amount;
          case 'yearly': return sum + (item.amount / 12);
          default: return sum;
        }
      }, 0);

    let runningBalance = 1000; // Starting balance assumption
    
    return Array.from({ length: months }, (_, i) => {
      const monthDate = new Date(startDate);
      monthDate.setMonth(monthDate.getMonth() + i);
      
      const netCashFlow = monthlyIncome - monthlyExpenses;
      runningBalance += netCashFlow;
      
      return {
        month: monthDate.toLocaleDateString('th-TH', { month: 'short', year: 'numeric' }),
        income: monthlyIncome,
        expenses: monthlyExpenses,
        netCashFlow,
        endingBalance: runningBalance
      };
    });
  };

  const renderCalculator = () => {
    switch (activeCalculator) {
      case 'networth':
        const netWorthValue = calculateNetWorth();
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">เครื่องคำนวณมูลค่าสุทธิ</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-700 mb-3">สินทรัพย์</h4>
                <div className="space-y-3">
                  <input
                    type="number"
                    placeholder="เงินสดและเงินออม"
                    value={netWorth.cash}
                    onChange={(e) => setNetWorth(prev => ({ ...prev, cash: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="การลงทุน"
                    value={netWorth.investments}
                    onChange={(e) => setNetWorth(prev => ({ ...prev, investments: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="มูลค่าทรัพย์สิน"
                    value={netWorth.property}
                    onChange={(e) => setNetWorth(prev => ({ ...prev, property: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-3">หนี้สิน</h4>
                <div className="space-y-3">
                  <input
                    type="number"
                    placeholder="จำนอง"
                    value={netWorth.mortgage}
                    onChange={(e) => setNetWorth(prev => ({ ...prev, mortgage: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="เงินกู้"
                    value={netWorth.loans}
                    onChange={(e) => setNetWorth(prev => ({ ...prev, loans: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="หนี้บัตรเครดิต"
                    value={netWorth.creditCard}
                    onChange={(e) => setNetWorth(prev => ({ ...prev, creditCard: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900">มูลค่าสุทธิของคุณ</h4>
              <p className={`text-2xl font-bold ${netWorthValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netWorthValue.toLocaleString()} บาท
              </p>
            </div>
          </div>
        );

      case 'debt':
        const debtResult = calculateDebtPayoff();
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">เครื่องคำนวณการชำระหนี้</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="number"
                placeholder="จำนวนหนี้"
                value={debtPayoff.debtAmount}
                onChange={(e) => setDebtPayoff(prev => ({ ...prev, debtAmount: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                placeholder="อัตราดอกเบี้ยต่อปี (%)"
                value={debtPayoff.interestRate}
                onChange={(e) => setDebtPayoff(prev => ({ ...prev, interestRate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                placeholder="การชำระเงินรายเดือน"
                value={debtPayoff.monthlyPayment}
                onChange={(e) => setDebtPayoff(prev => ({ ...prev, monthlyPayment: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-700">ระยะเวลาในการชำระหนี้</h4>
                  <p className="text-xl font-bold text-blue-600">
                    {debtResult.months} เดือน ({Math.floor(debtResult.months / 12)} ปี {debtResult.months % 12} เดือน)
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700">ดอกเบี้ยทั้งหมด</h4>
                  <p className="text-xl font-bold text-red-600">{debtResult.totalInterest.toFixed(2)} บาท</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'goal':
        const goalMonths = calculateFinancialGoal();
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">เครื่องคำนวณเป้าหมายทางการเงิน</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="เป้าหมายการออม"
                value={financialGoal.goalAmount}
                onChange={(e) => setFinancialGoal(prev => ({ ...prev, goalAmount: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                placeholder="เงินออมเริ่มต้น"
                value={financialGoal.initialSavings}
                onChange={(e) => setFinancialGoal(prev => ({ ...prev, initialSavings: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                placeholder="เงินสมทบรายเดือน"
                value={financialGoal.monthlyContribution}
                onChange={(e) => setFinancialGoal(prev => ({ ...prev, monthlyContribution: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                placeholder="อัตราดอกเบี้ยต่อปี (%)"
                value={financialGoal.interestRate}
                onChange={(e) => setFinancialGoal(prev => ({ ...prev, interestRate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-700">ระยะเวลาในการบรรลุเป้าหมาย</h4>
              <p className="text-2xl font-bold text-green-600">
                {goalMonths === Infinity ? 'ไม่สำเร็จ (เพิ่มเงินสมทบ)' : `${goalMonths} เดือน`}
              </p>
            </div>
          </div>
        );

      case 'rule':
        const ruleResult = calculate503020();
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">เครื่องคำนวณกฎ 50/30/20</h3>
            <input
              type="number"
              placeholder="รายได้สุทธิรายเดือน"
              value={rule503020.monthlyIncome}
              onChange={(e) => setRule503020(prev => ({ ...prev, monthlyIncome: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-700">ความจำเป็น (50%)</h4>
                <p className="text-xl font-bold text-blue-600">{ruleResult.needs.toFixed(2)} บาท</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-medium text-green-700">ความต้องการ (30%)</h4>
                <p className="text-xl font-bold text-green-600">{ruleResult.wants.toFixed(2)} บาท</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="font-medium text-purple-700">เงินออม (20%)</h4>
                <p className="text-xl font-bold text-purple-600">{ruleResult.savings.toFixed(2)} บาท</p>
              </div>
            </div>
          </div>
        );

      case 'future':
        const futureValueResult = calculateFutureValue();
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">เครื่องคำนวณมูลค่าในอนาคต</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="มูลค่าปัจจุบัน"
                value={futureValue.presentValue}
                onChange={(e) => setFutureValue(prev => ({ ...prev, presentValue: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                placeholder="อัตราต่อปี (%)"
                value={futureValue.annualRate}
                onChange={(e) => setFutureValue(prev => ({ ...prev, annualRate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                placeholder="ปี"
                value={futureValue.years}
                onChange={(e) => setFutureValue(prev => ({ ...prev, years: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                placeholder="เงินสมทบรายปี"
                value={futureValue.annualContribution}
                onChange={(e) => setFutureValue(prev => ({ ...prev, annualContribution: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-700">มูลค่าในอนาคต</h4>
              <p className="text-2xl font-bold text-green-600">{futureValueResult.toLocaleString()} บาท</p>
            </div>
          </div>
        );

      case 'cashflow':
        const projectionData = generateCashFlowProjection();
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">ประมาณการกระแสเงินสด</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="date"
                value={cashFlowProjection.startDate}
                onChange={(e) => setCashFlowProjection(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                placeholder="จำนวนเดือน"
                value={cashFlowProjection.months}
                onChange={(e) => setCashFlowProjection(prev => ({ ...prev, months: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={projectionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} บาท`, '']} />
                  <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="รายรับ" />
                  <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="รายจ่าย" />
                  <Line type="monotone" dataKey="endingBalance" stroke="#3b82f6" strokeWidth={2} name="ยอดคงเหลือ" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">การวางแผนทางการเงิน</h1>
        <p className="text-gray-600 mt-1">วางแผนอนาคตทางการเงินของคุณด้วยเครื่องคำนวณเหล่านี้</p>
      </div>

      {/* Calculator Tabs */}
      <div className="flex flex-wrap gap-2">
        {calculators.map((calc) => {
          const Icon = calc.icon;
          return (
            <button
              key={calc.id}
              onClick={() => setActiveCalculator(calc.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeCalculator === calc.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon size={16} />
              {calc.label}
            </button>
          );
        })}
      </div>

      {/* Calculator Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {renderCalculator()}
      </div>
    </div>
  );
};

export default Planning;