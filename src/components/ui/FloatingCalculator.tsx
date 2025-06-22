// src/components/ui/FloatingCalculator.tsx

import React, { useState, useRef } from 'react';
import Draggable from 'react-draggable';
import { Card, CardContent, CardHeader } from './card';
import { Button } from './button';
import { X as CloseIcon, GripVertical, Delete } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface FloatingCalculatorProps {
  onClose: () => void;
}

export const FloatingCalculator: React.FC<FloatingCalculatorProps> = ({ onClose }) => {
  const [display, setDisplay] = useState('0');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const nodeRef = useRef(null);

  const calculate = (n1: number, op: string, n2: number): number => {
    switch (op) {
      case '+': return n1 + n2;
      case '-': return n1 - n2;
      case '×': return n1 * n2;
      case '÷': return n1 / n2;
      default: return n2;
    }
  };

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const performOperation = (nextOperator: string) => {
    const inputValue = parseFloat(display);

    if (prevValue === null) {
      setPrevValue(inputValue);
    } else if (operator) {
      const result = calculate(prevValue, operator, inputValue);
      setPrevValue(result);
      setDisplay(String(result));
    }
    
    setWaitingForOperand(true);
    setOperator(nextOperator);
  };
  
  const handleEquals = () => {
    if (!operator || prevValue === null) return;
    const currentValue = parseFloat(display);
    const result = calculate(prevValue, operator, currentValue);
    
    setDisplay(String(result));
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(true);
  };

  const clear = () => {
    setDisplay('0');
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const toggleSign = () => {
    setDisplay(String(parseFloat(display) * -1));
  };

  const inputPercent = () => {
    setDisplay(String(parseFloat(display) / 100));
  };
  
  const backspace = () => {
    if(display.length > 1) {
        setDisplay(display.slice(0, -1));
    } else {
        setDisplay('0');
    }
  };

  const CalcButton = ({ children, onClick, className, variant = 'outline' }: any) => (
    <motion.div whileTap={{ scale: 0.95 }}>
        <Button variant={variant} className={cn("h-14 w-full text-xl font-semibold shadow-sm", className)} onClick={onClick}>
            {children}
        </Button>
    </motion.div>
  );

  return (
    <Draggable handle=".drag-handle" defaultPosition={{x: 0, y: 0}} nodeRef={nodeRef}>
        <div ref={nodeRef} className="fixed bottom-24 right-5 z-50">
            <Card className="w-[19rem] shadow-2xl rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-slate-200 dark:border-slate-700">
                <CardHeader className="drag-handle cursor-move p-2 flex flex-row items-center justify-between bg-slate-100 dark:bg-slate-800 rounded-t-2xl">
                    <div className="flex items-center gap-2">
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                        <span className="font-semibold text-sm">เครื่องคิดเลข</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                        <CloseIcon className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent className="p-3">
                    {/* Display */}
                    <div className="relative bg-slate-800 text-white rounded-lg p-3 mb-3 text-right shadow-inner">
                        <div className="h-6 text-slate-400 font-mono text-lg break-all truncate">
                            {prevValue !== null ? `${prevValue} ${operator}` : ''}
                        </div>
                        <div className="h-10 text-4xl font-bold font-mono break-all truncate">{display}</div>
                        <Button variant="ghost" size="icon" className="absolute left-1 bottom-1 h-8 w-8 text-slate-400 hover:bg-slate-700 hover:text-white" onClick={backspace}><Delete/></Button>
                    </div>

                    {/* Button Grid */}
                    <div className="grid grid-cols-4 gap-2">
                        <CalcButton onClick={clear} className="bg-slate-200 dark:bg-slate-700">C</CalcButton>
                        <CalcButton onClick={toggleSign} className="bg-slate-200 dark:bg-slate-700">+/-</CalcButton>
                        <CalcButton onClick={inputPercent} className="bg-slate-200 dark:bg-slate-700">%</CalcButton>
                        <CalcButton onClick={() => performOperation('÷')} className="bg-amber-500 text-white">÷</CalcButton>

                        <CalcButton onClick={() => inputDigit('7')}>7</CalcButton>
                        <CalcButton onClick={() => inputDigit('8')}>8</CalcButton>
                        <CalcButton onClick={() => inputDigit('9')}>9</CalcButton>
                        <CalcButton onClick={() => performOperation('×')} className="bg-amber-500 text-white">×</CalcButton>

                        <CalcButton onClick={() => inputDigit('4')}>4</CalcButton>
                        <CalcButton onClick={() => inputDigit('5')}>5</CalcButton>
                        <CalcButton onClick={() => inputDigit('6')}>6</CalcButton>
                        <CalcButton onClick={() => performOperation('-')} className="bg-amber-500 text-white">-</CalcButton>

                        <CalcButton onClick={() => inputDigit('1')}>1</CalcButton>
                        <CalcButton onClick={() => inputDigit('2')}>2</CalcButton>
                        <CalcButton onClick={() => inputDigit('3')}>3</CalcButton>
                        <CalcButton onClick={() => performOperation('+')} className="bg-amber-500 text-white">+</CalcButton>

                        <CalcButton onClick={() => inputDigit('0')} className="col-span-2">0</CalcButton>
                        <CalcButton onClick={inputDecimal}>.</CalcButton>
                        <CalcButton onClick={handleEquals} className="bg-primary text-primary-foreground">=</CalcButton>
                    </div>
                </CardContent>
            </Card>
        </div>
    </Draggable>
  );
};