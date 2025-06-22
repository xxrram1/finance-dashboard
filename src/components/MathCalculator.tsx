// src/components/MathCalculator.tsx

import React, { useState } from 'react';
import {
  Calculator, Plus, Minus, X, Divide, Equal, Delete,
  Settings, SortAsc, Zap, Binary, Sigma, KeyRound, Combine
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils'; // ADDED: แก้ไขข้อผิดพลาด cn is not defined
import { ArraySorter, LogicCalculator, BaseConverter, GcdLcmCalculator, PrimeNumberTool, SetOperationsTool } from './math-tools';

// --- Main Calculator UI & Logic (Simplified) ---
const MainCalculator = () => {
  const [expression, setExpression] = useState('');
  const [display, setDisplay] = useState('0');

  const handleInput = (value: string) => {
    if (display === 'Error') {
      setDisplay(value);
      setExpression(value);
      return;
    }
    const lastPart = expression.split(' ').pop() || '';
    if (lastPart.includes('.') && value === '.') return;

    setDisplay(current => (current === '0' || ['+', '-', '×', '÷'].includes(expression.slice(-2, -1))) ? value : current + value);
    setExpression(current => current + value);
  };
  
  const handleOperator = (op: string) => {
    if (display === 'Error' || expression.endsWith(' ')) return;
    setExpression(current => `${current} ${op} `);
  };

  const calculateResult = () => {
    if (display === 'Error' || expression.endsWith(' ')) return;
    try {
      const evalExpression = expression.replace(/×/g, '*').replace(/÷/g, '/');
      const result = new Function('return ' + evalExpression)();
      setDisplay(String(result));
      setExpression(String(result));
    } catch (error) {
      setDisplay('Error');
      setExpression('');
    }
  };

  const clear = () => {
    setDisplay('0');
    setExpression('');
  };

  const backspace = () => {
    if (display === 'Error') return clear();
    setDisplay(d => d.length > 1 ? d.slice(0, -1) : '0');
    setExpression(e => e.trim().length > 1 ? e.slice(0, -1) : '');
  };

  const CalcButton = ({ children, onClick, className, ...props }: any) => (
    <Button {...props} className={cn("h-16 text-2xl font-semibold shadow-md active:scale-95 transition-transform", className)} onClick={onClick}>
      {children}
    </Button>
  );

  return (
    <Card className="max-w-xs mx-auto bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden">
      <CardContent className="p-4">
        {/* Display */}
        <div className="bg-gray-800 text-white rounded-lg p-4 mb-4 text-right shadow-inner break-words">
          <div className="h-7 text-gray-400 font-mono text-xl truncate">{expression || ' '}</div>
          <div className="h-12 text-5xl font-bold font-mono truncate">{display}</div>
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          <CalcButton variant="secondary" onClick={clear}>C</CalcButton>
          <CalcButton variant="secondary" onClick={backspace}><Delete/></CalcButton>
          <CalcButton variant="secondary" className="bg-blue-500 hover:bg-blue-600 text-white" onClick={() => handleOperator('÷')}><Divide/></CalcButton>
          <CalcButton variant="secondary" className="bg-blue-500 hover:bg-blue-600 text-white" onClick={() => handleOperator('×')}><X/></CalcButton>
          
          <CalcButton onClick={() => handleInput('7')}>7</CalcButton>
          <CalcButton onClick={() => handleInput('8')}>8</CalcButton>
          <CalcButton onClick={() => handleInput('9')}>9</CalcButton>
          <CalcButton variant="secondary" className="bg-blue-500 hover:bg-blue-600 text-white" onClick={() => handleOperator('-')}><Minus/></CalcButton>
          
          <CalcButton onClick={() => handleInput('4')}>4</CalcButton>
          <CalcButton onClick={() => handleInput('5')}>5</CalcButton>
          <CalcButton onClick={() => handleInput('6')}>6</CalcButton>
          <CalcButton variant="secondary" className="bg-blue-500 hover:bg-blue-600 text-white" onClick={() => handleOperator('+')}><Plus/></CalcButton>

          <CalcButton onClick={() => handleInput('1')}>1</CalcButton>
          <CalcButton onClick={() => handleInput('2')}>2</CalcButton>
          <CalcButton onClick={() => handleInput('3')}>3</CalcButton>
          <CalcButton variant="secondary" className="bg-green-500 hover:bg-green-600 text-white row-span-2 h-auto" onClick={calculateResult}><Equal/></CalcButton>

          <CalcButton className="col-span-2" onClick={() => handleInput('0')}>0</CalcButton>
          <CalcButton onClick={() => handleInput('.')}>.</CalcButton>
        </div>
      </CardContent>
    </Card>
  );
};

// --- Main Component Wrapper ---
const MathCalculator = () => {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const tools = [
    { id: 'sorter', name: 'เรียงลำดับตัวเลข', icon: SortAsc, component: <ArraySorter/> },
    { id: 'logic', name: 'คำนวณวงจรลอจิก', icon: Zap, component: <LogicCalculator/> },
    { id: 'base', name: 'แปลงระบบเลขฐาน', icon: Binary, component: <BaseConverter/> },
    { id: 'gcd_lcm', name: 'หา ห.ร.ม. / ค.ร.น.', icon: Sigma, component: <GcdLcmCalculator/> },
    { id: 'prime', name: 'เครื่องมือจำนวนเฉพาะ', icon: KeyRound, component: <PrimeNumberTool/> },
    { id: 'set', name: 'คำนวณเซต', icon: Combine, component: <SetOperationsTool/> },
  ];

  const ToolDialog = ({ children }: { children: React.ReactNode }) => {
    const onOpenChange = (isOpen: boolean) => !isOpen && setActiveTool(null);
    if (isMobile) {
      return ( <Drawer open={!!activeTool} onOpenChange={onOpenChange}><DrawerContent className="p-4">{children}</DrawerContent></Drawer> )
    }
    return ( <Dialog open={!!activeTool} onOpenChange={onOpenChange}><DialogContent className="max-w-lg">{children}</DialogContent></Dialog> )
  };

  return (
    <div className="min-h-screen w-full bg-slate-100/50 dark:bg-gray-950">
      <div className="container mx-auto max-w-4xl px-4 py-8 space-y-10">
        <header className="text-center space-y-3">
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 100, delay: 0.1 }} className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <Calculator className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">เครื่องคำนวณ</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">เรียบง่าย ทรงพลัง และพร้อมสำหรับทุกการคำนวณ</p>
        </header>

        <MainCalculator />

        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl font-bold">
              <Settings className="w-6 h-6 text-purple-600" />
              เครื่องมือคณิตศาสตร์เพื่อการศึกษา
            </CardTitle>
            <CardDescription>เครื่องมือเฉพาะทางเพื่อช่วยแก้ปัญหาและเสริมความเข้าใจ</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool, index) => (
              <motion.div key={tool.id} initial={{opacity: 0, y:20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.05 * index}}>
                <Button 
                  variant="outline" 
                  className="h-auto w-full flex items-center justify-start p-4 text-left shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800 space-x-4"
                  onClick={() => setActiveTool(tool.id)}
                >
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <tool.icon className="w-6 h-6 text-purple-600 dark:text-purple-400"/>
                  </div>
                  <span className="font-semibold text-base text-gray-800 dark:text-gray-200">{tool.name}</span>
                </Button>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>

      <ToolDialog>
        {tools.find(t => t.id === activeTool)?.component}
      </ToolDialog>
    </div>
  );
};

export default MathCalculator;