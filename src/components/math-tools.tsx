// src/components/math-tools.tsx

import React, { useState, useCallback, useMemo } from 'react';
import {
  SortAsc, Zap, Binary, Hash, ArrowUp, ArrowDown,
  Info, AlertCircle, Sigma, KeyRound, Combine
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// --- Array Sorter Tool ---
export const ArraySorter = () => {
  const [numbers, setNumbers] = useState('');
  const [sortedResult, setSortedResult] = useState<number[] | null>(null);

  const sortArray = useCallback(() => {
    const numArray = numbers.split(/[\s,]+/).map(n => parseFloat(n.trim())).filter(n => !isNaN(n));
    if (numArray.length === 0) {
      toast({ title: "ข้อมูลไม่ถูกต้อง", description: "กรุณาใส่ตัวเลขคั่นด้วยช่องว่างหรือจุลภาค", variant: "destructive" });
      return;
    }
    const sorted = [...numArray].sort((a, b) => a - b);
    setSortedResult(sorted);
  }, [numbers]);

  return (
    <div>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2"><SortAsc /> เครื่องเรียงลำดับตัวเลข</DialogTitle>
        <DialogDescription>ใส่ตัวเลขแล้วโปรแกรมจะเรียงลำดับจากน้อยไปมากให้คุณ</DialogDescription>
      </DialogHeader>
      <div className="py-4 space-y-4">
        <Textarea
          placeholder="เช่น: 5 1 99 42 -10"
          value={numbers}
          onChange={(e) => setNumbers(e.target.value)}
          className="h-24 text-base font-mono"
        />
        <Button onClick={sortArray} className="w-full">เรียงลำดับ</Button>
        {sortedResult && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-4 space-y-2">
            <Label>ผลลัพธ์:</Label>
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-md font-mono text-lg text-center break-all">
              {sortedResult.join(', ')}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// --- Logic Gate Tool (Updated with X/Y labels) ---
export const LogicCalculator = () => {
  const [inputX, setInputX] = useState(false);
  const [inputY, setInputY] = useState(false);
  const [gateType, setGateType] = useState<'AND' | 'OR' | 'NOT' | 'NAND' | 'NOR' | 'XOR'>('AND');

  const result = useMemo(() => {
    switch (gateType) {
      case 'AND': return inputX && inputY;
      case 'OR': return inputX || inputY;
      case 'NOT': return !inputX;
      case 'NAND': return !(inputX && inputY);
      case 'NOR': return !(inputX || inputY);
      case 'XOR': return inputX !== inputY;
    }
  }, [inputX, inputY, gateType]);

  return (
    <div>
        <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Zap/> เครื่องคำนวณวงจรลอจิก</DialogTitle>
            <DialogDescription>เลือก Gate และปรับค่า Input เพื่อดูผลลัพธ์</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <Select value={gateType} onValueChange={(v: any) => setGateType(v)}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                    {['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR'].map(gate => <SelectItem key={gate} value={gate}>{gate}</SelectItem>)}
                </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg flex items-center justify-between">
                    <Label htmlFor="input-x">Input X: {inputX ? '1' : '0'}</Label>
                    <Switch id="input-x" checked={inputX} onCheckedChange={setInputX} />
                </div>
                <div className={cn("p-4 border rounded-lg flex items-center justify-between", gateType === 'NOT' && "opacity-50 pointer-events-none")}>
                    <Label htmlFor="input-y">Input Y: {inputY ? '1' : '0'}</Label>
                    <Switch id="input-y" checked={inputY} onCheckedChange={setInputY} disabled={gateType === 'NOT'}/>
                </div>
            </div>
             <div className="pt-4 text-center">
                <p className="text-sm text-muted-foreground">ผลลัพธ์</p>
                <p className="text-4xl font-bold">{result ? '1 (TRUE)' : '0 (FALSE)'}</p>
             </div>
        </div>
    </div>
  );
};

// --- Base Converter Tool ---
export const BaseConverter = () => {
    const [input, setInput] = useState('');
    const [fromBase, setFromBase] = useState('10');
    const [toBase, setToBase] = useState('2');
    const [result, setResult] = useState('');
    const [error, setError] = useState('');

    const convert = useCallback(() => {
        try {
            setError('');
            if(!input.trim()) return setResult('');
            const decimal = parseInt(input, parseInt(fromBase));
            if(isNaN(decimal)) {
                setError(`'${input}' ไม่ใช่ตัวเลขที่ถูกต้องสำหรับฐาน ${fromBase}`);
                return;
            }
            setResult(decimal.toString(parseInt(toBase)).toUpperCase());
        } catch(e) {
            setError('เกิดข้อผิดพลาดในการแปลง');
        }
    }, [input, fromBase, toBase]);
    
    return (
        <div>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Binary/> เครื่องแปลงระบบเลขฐาน</DialogTitle>
                <DialogDescription>แปลงตัวเลขระหว่างระบบเลขฐานต่างๆ</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <div className="space-y-2">
                    <Label>ตัวเลขที่ต้องการแปลง</Label>
                    <Input value={input} onChange={e => setInput(e.target.value)} placeholder={`ใส่ตัวเลขฐาน ${fromBase}`} className="font-mono text-lg"/>
                </div>
                <div className="grid grid-cols-2 gap-4 items-end">
                    <div className="space-y-2">
                        <Label>จากฐาน</Label>
                        <Select value={fromBase} onValueChange={setFromBase}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="2">Binary (2)</SelectItem><SelectItem value="8">Octal (8)</SelectItem><SelectItem value="10">Decimal (10)</SelectItem><SelectItem value="16">Hexadecimal (16)</SelectItem></SelectContent></Select>
                    </div>
                    <div className="space-y-2">
                        <Label>ไปยังฐาน</Label>
                        <Select value={toBase} onValueChange={setToBase}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="2">Binary (2)</SelectItem><SelectItem value="8">Octal (8)</SelectItem><SelectItem value="10">Decimal (10)</SelectItem><SelectItem value="16">Hexadecimal (16)</SelectItem></SelectContent></Select>
                    </div>
                </div>
                <Button onClick={convert} className="w-full">แปลงค่า</Button>
                {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
                {result && (
                    <div className="pt-4 space-y-2 text-center">
                         <Label>ผลลัพธ์</Label>
                        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-md font-mono text-2xl break-all">
                           {result}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- NEW: GCD & LCM Tool ---
export const GcdLcmCalculator = () => {
    const [numA, setNumA] = useState('');
    const [numB, setNumB] = useState('');
    const [result, setResult] = useState<{gcd: number, lcm: number} | null>(null);

    const calculate = () => {
        const a = parseInt(numA);
        const b = parseInt(numB);

        if(isNaN(a) || isNaN(b) || a === 0 || b === 0) {
            toast({ title: "ข้อมูลไม่ถูกต้อง", description: "กรุณาใส่ตัวเลขจำนวนเต็มบวกทั้งสองช่อง", variant: "destructive" });
            return;
        }

        const gcd = (x: number, y: number): number => (!y ? x : gcd(y, x % y));
        const lcm = (x: number, y: number): number => (Math.abs(x * y) / gcd(x, y));

        setResult({ gcd: gcd(a,b), lcm: lcm(a,b) });
    };

    return (
        <div>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Sigma/> เครื่องหา ห.ร.ม. และ ค.ร.น.</DialogTitle>
                <DialogDescription>หาค่าหารร่วมมากและคูณร่วมน้อยของตัวเลขสองจำนวน</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input type="number" placeholder="ตัวเลขที่ 1" value={numA} onChange={e => setNumA(e.target.value)} />
                    <Input type="number" placeholder="ตัวเลขที่ 2" value={numB} onChange={e => setNumB(e.target.value)} />
                </div>
                <Button onClick={calculate} className="w-full">คำนวณ</Button>
                {result && (
                    <div className="pt-4 grid grid-cols-2 gap-4 text-center">
                        <div>
                            <p className="text-sm text-muted-foreground">ห.ร.ม. (GCD)</p>
                            <p className="text-3xl font-bold">{result.gcd}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">ค.ร.น. (LCM)</p>
                            <p className="text-3xl font-bold">{result.lcm}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- NEW: Prime Number Tool ---
export const PrimeNumberTool = () => {
    const [checkInput, setCheckInput] = useState('');
    const [checkResult, setCheckResult] = useState<string | null>(null);
    const [generateLimit, setGenerateLimit] = useState('100');
    const [primes, setPrimes] = useState<number[]>([]);

    const isPrime = (num: number) => {
        if (num <= 1) return false;
        for (let i = 2; i * i <= num; i++) {
            if (num % i === 0) return false;
        }
        return true;
    };

    const handleCheck = () => {
        const num = parseInt(checkInput);
        if(isNaN(num)) {
            setCheckResult('กรุณาใส่ตัวเลขที่ถูกต้อง');
            return;
        }
        setCheckResult(isPrime(num) ? `${num} เป็นจำนวนเฉพาะ` : `${num} ไม่ใช่จำนวนเฉพาะ`);
    };

    const handleGenerate = () => {
        const limit = parseInt(generateLimit);
        if(isNaN(limit) || limit > 100000) { // Add a reasonable limit
            toast({title: "ขีดจำกัดไม่ถูกต้อง", description: "กรุณาใส่ตัวเลขไม่เกิน 100,000", variant: "destructive"});
            return;
        }
        const sieve = new Array(limit + 1).fill(true);
        sieve[0] = sieve[1] = false;
        for (let i = 2; i * i <= limit; i++) {
            if (sieve[i]) {
                for (let j = i * i; j <= limit; j += i) {
                    sieve[j] = false;
                }
            }
        }
        setPrimes(sieve.map((p, i) => (p ? i : -1)).filter(i => i !== -1));
    };

    return(
        <div>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><KeyRound/> เครื่องมือจำนวนเฉพาะ</DialogTitle>
                <DialogDescription>ตรวจสอบหรือสร้างรายการจำนวนเฉพาะ</DialogDescription>
            </DialogHeader>
             <Tabs defaultValue="checker" className="w-full mt-4">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="checker">ตรวจสอบ</TabsTrigger>
                    <TabsTrigger value="generator">สร้างรายการ</TabsTrigger>
                </TabsList>
                <TabsContent value="checker" className="space-y-4 pt-4">
                    <Input type="number" placeholder="ใส่ตัวเลขที่ต้องการตรวจสอบ" value={checkInput} onChange={e => setCheckInput(e.target.value)} />
                    <Button onClick={handleCheck} className="w-full">ตรวจสอบ</Button>
                    {checkResult && <p className="text-center font-semibold">{checkResult}</p>}
                </TabsContent>
                <TabsContent value="generator" className="space-y-4 pt-4">
                     <Input type="number" placeholder="หาจำนวนเฉพาะถึง..." value={generateLimit} onChange={e => setGenerateLimit(e.target.value)} />
                    <Button onClick={handleGenerate} className="w-full">สร้าง</Button>
                    {primes.length > 0 && <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-md max-h-48 overflow-y-auto font-mono break-all">{primes.join(', ')}</div>}
                </TabsContent>
            </Tabs>
        </div>
    )
};

// --- NEW: Set Operations Tool ---
export const SetOperationsTool = () => {
    const [setA, setSetA] = useState('1, 2, 3, 5');
    const [setB, setSetB] = useState('2, 3, 4, 6');
    const [result, setResult] = useState<string | null>(null);
    const [operation, setOperation] = useState<string | null>(null);

    const parseSet = (str: string): Set<number> => {
        return new Set(str.split(/[\s,]+/).map(n => parseFloat(n.trim())).filter(n => !isNaN(n)));
    };

    const handleOperation = (op: 'union' | 'intersection' | 'difference') => {
        const sA = parseSet(setA);
        const sB = parseSet(setB);
        let resultSet: Set<number>;
        let opSymbol = '';

        switch(op) {
            case 'union':
                resultSet = new Set([...sA, ...sB]);
                opSymbol = 'A ∪ B';
                break;
            case 'intersection':
                resultSet = new Set([...sA].filter(x => sB.has(x)));
                opSymbol = 'A ∩ B';
                break;
            case 'difference':
                resultSet = new Set([...sA].filter(x => !sB.has(x)));
                opSymbol = 'A - B';
                break;
        }
        setResult(`{ ${Array.from(resultSet).sort((a,b)=>a-b).join(', ')} }`);
        setOperation(opSymbol);
    };

    return(
        <div>
             <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Combine/> เครื่องคำนวณเซต</DialogTitle>
                <DialogDescription>คำนวณ Union, Intersection, และ Difference ของเซต</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Set A</Label><Textarea value={setA} onChange={e => setSetA(e.target.value)} placeholder="1, 2, 3"/></div>
                    <div className="space-y-2"><Label>Set B</Label><Textarea value={setB} onChange={e => setSetB(e.target.value)} placeholder="2, 3, 4"/></div>
                </div>
                 <div className="grid grid-cols-3 gap-2">
                    <Button onClick={() => handleOperation('union')}>Union (A ∪ B)</Button>
                    <Button onClick={() => handleOperation('intersection')}>Intersection (A ∩ B)</Button>
                    <Button onClick={() => handleOperation('difference')}>Difference (A - B)</Button>
                 </div>
                {result && <div className="pt-4 text-center"><p className="text-sm text-muted-foreground font-semibold">{operation}</p><p className="font-mono text-2xl">{result}</p></div>}
            </div>
        </div>
    )
}