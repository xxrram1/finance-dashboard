// src/components/calculators/AlgebraCalculator.tsx

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
// Corrected: Changed 'SquareRoot' to 'Radical' for the icon import
import { HelpCircle, Sigma, KeyRound, Combine, DivideSquare, Radical } from 'lucide-react';
import { motion } from 'framer-motion';

// Helper functions (existing from AlgebraCalculator.tsx)
const gcd = (a: number, b: number): number => {
    while (b !== 0) {
        const temp = b;
        b = a % b;
        a = temp;
    }
    return a;
};

const lcm = (a: number, b: number): number => {
    return Math.abs(a * b) / gcd(a, b);
};

const isPrime = (n: number): boolean => {
    if (n < 2) return false;
    if (n === 2) return true;
    if (n % 2 === 0) return false;
    for (let i = 3; i <= Math.sqrt(n); i += 2) {
        if (n % i === 0) return false;
    }
    return true;
};

const getPrimeFactors = (n: number): number[] => {
    const factors: number[] = [];
    let divisor = 2;
    while (n > 1) {
        while (n % divisor === 0) {
            factors.push(divisor);
            n = n / divisor;
        }
        divisor++;
        if (divisor * divisor > n && n > 1) {
            factors.push(n);
            break;
        }
    }
    return factors;
};

const parseSet = (input: string): number[] => {
    try {
        return input.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x));
    } catch {
        return [];
    }
};

// --- NEW HELPER FUNCTIONS FOR INEQUALITIES AND ROOTS ---
const simplifyRoot = (n: number): { coefficient: number, radicand: number, steps: string } => {
    if (n < 0) return { coefficient: NaN, radicand: NaN, steps: 'ไม่สามารถหาค่ารากที่สองของจำนวนลบได้' };
    if (n === 0) return { coefficient: 0, radicand: 0, steps: '$\\sqrt{0} = 0$' };
    
    let coefficient = 1;
    let radicand = n;
    let steps = `### การถอดรากที่สองของ $\\sqrt{${n}}$\n\n`;
    steps += `- **เป้าหมาย:** แยกตัวประกอบของ ${n} เพื่อหาจำนวนที่เป็นกำลังสองสมบูรณ์\n\n`;

    for (let i = 2; i * i <= radicand; i++) {
        while (radicand % (i * i) === 0) {
            coefficient *= i;
            radicand /= (i * i);
            // Corrected: changed \\* to \\times for LaTeX multiplication symbol
            steps += `- ${n} = ${coefficient / i}^2 \\times ${radicand * (i * i)} = ${coefficient}^2 \\times ${radicand}$ (ดึง ${i} ออกมา)\n`;
        }
    }

    if (coefficient === 1 && radicand === n) {
        steps += `- ${n} ไม่มีตัวประกอบที่เป็นกำลังสองสมบูรณ์ที่สามารถถอดรากได้\n`;
        steps += `- **ผลลัพธ์:** $\\sqrt{${n}}$\n`;
    } else {
        steps += `- ตัวประกอบกำลังสองสมบูรณ์ที่ใหญ่ที่สุดที่หาร ${n} ได้ คือ ${coefficient * coefficient}\n`;
        steps += `- $\\sqrt{${n}} = \\sqrt{${coefficient * coefficient} \\times ${radicand}}$\n`;
        steps += `- $\\sqrt{${n}} = ${coefficient}\\sqrt{${radicand}}$\n`;
        steps += `- **ผลลัพธ์:** ${coefficient}\\sqrt{${radicand}}$\n`;
    }
    
    return { coefficient, radicand, steps };
};

// Calculation Steps Modal Component (existing from AlgebraCalculator.tsx)
const CalculationStepsModal = ({ isOpen, onClose, title, description, steps }: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: string;
    steps: string;
}) => (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            <div className="mt-4">
                <div dangerouslySetInnerHTML={{ __html: steps.replace(/\$([^$]+)\$/g, '<span class="font-mono bg-blue-100 dark:bg-blue-900 px-1 rounded">$1</span>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/### ([^\n]+)/g, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>').replace(/\n/g, '<br/>') }} />
            </div>
        </DialogContent>
    </Dialog>
);

// GCD/LCM Tool Component (existing from AlgebraCalculator.tsx)
const GcdLcmTool = () => {
    const [numA, setNumA] = useState('48');
    const [numB, setNumB] = useState('60');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { result, steps } = useMemo(() => {
        try {
            const a = parseInt(numA);
            const b = parseInt(numB);
            if (isNaN(a) || isNaN(b) || a <= 0 || b <= 0) return { result: null, steps: '' };

            const gcdResult = gcd(a, b);
            const lcmResult = lcm(a, b);
            
            // Generate step-by-step explanation
            let gcdSteps = `### 1. หา ห.ร.ม. (GCD) โดยใช้ Euclidean Algorithm\n`;
            let tempA = a, tempB = b;
            gcdSteps += `- เริ่มต้น: $GCD(${tempA}, ${tempB})$\n`;
            
            while (tempB !== 0) {
                const remainder = tempA % tempB;
                gcdSteps += `- $GCD(${tempA}, ${tempB}) = GCD(${tempB}, ${tempA} \\bmod ${tempB} = ${remainder})$\n`;
                tempA = tempB;
                tempB = remainder;
            }
            gcdSteps += `- **ผลลัพธ์: ห.ร.ม. = ${gcdResult}**`;

            const lcmSteps = `\n\n### 2. หา ค.ร.น. (LCM)\n**สูตร:** $LCM(a, b) = \\frac{|a \\times b|}{GCD(a, b)}$\n- $LCM = \\frac{${a} \\times ${b}}{${gcdResult}} = \\frac{${a * b}}{${gcdResult}}$\n- **ผลลัพธ์: ค.ร.น. = ${lcmResult}**`;

            return { result: { gcd: gcdResult, lcm: lcmResult }, steps: gcdSteps + lcmSteps };
        } catch {
            return { result: null, steps: '' };
        }
    }, [numA, numB]);

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="numA">จำนวนที่ 1</Label>
                    <Input 
                        id="numA" 
                        type="number" 
                        value={numA} 
                        onChange={e => setNumA(e.target.value)}
                        placeholder="ใส่จำนวนเต็มบวก"
                    />
                </div>
                <div>
                    <Label htmlFor="numB">จำนวนที่ 2</Label>
                    <Input 
                        id="numB" 
                        type="number" 
                        value={numB} 
                        onChange={e => setNumB(e.target.value)}
                        placeholder="ใส่จำนวนเต็มบวก"
                    />
                </div>
            </div>
            
            {result && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border"
                >
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-lg">ผลลัพธ์:</h4>
                        <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
                            <HelpCircle className="mr-2 h-4 w-4"/>ดูวิธีทำ
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">ห.ร.ม. (GCD)</p>
                            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{result.gcd}</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">ค.ร.น. (LCM)</p>
                            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{result.lcm}</p>
                        </div>
                    </div>
                </motion.div>
            )}
            
            <CalculationStepsModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title="ห.ร.ม. และ ค.ร.น." 
                description="ขั้นตอนการหาค่าด้วย Euclidean Algorithm และสูตร LCM" 
                steps={steps} 
            />
        </>
    );
};

// Prime Number Tool Component (existing from AlgebraCalculator.tsx)
const PrimeTool = () => {
    const [number, setNumber] = useState('97');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { result, steps } = useMemo(() => {
        try {
            const n = parseInt(number);
            if (isNaN(n) || n < 1) return { result: null, steps: '' };

            const primeCheck = isPrime(n);
            const factors = getPrimeFactors(n);
            
            let steps = `### การตรวจสอบจำนวนเฉพาะของ ${n}\n\n`;
            
            if (n === 1) {
                steps += `- 1 ไม่ใช่จำนวนเฉพาะและไม่ใช่จำนวนประกอบ\n`;
            } else if (n === 2) {
                steps += `- 2 เป็นจำนวนเฉพาะเพียงตัวเดียวที่เป็นเลขคู่\n`;
            } else if (primeCheck) {
                steps += `- ตรวจสอบการหารด้วยจำนวนเฉพาะตั้งแต่ 2 ถึง $\\sqrt{${n}} ≈ ${Math.sqrt(n).toFixed(2)}$\n`;
                for (let i = 2; i <= Math.sqrt(n); i++) {
                    if (isPrime(i)) {
                        steps += `- ${n} ÷ ${i} = ${(n/i).toFixed(2)} ${n % i === 0 ? '(หารลงตัว)' : '(ไม่หารลงตัว)'}\n`;
                    }
                }
                steps += `- **${n} เป็นจำนวนเฉพาะ** เพราะหารด้วยจำนวนเฉพาะอื่นไม่ลงตัว\n`;
            } else {
                steps += `### การแยกตัวประกอบเฉพาะ:\n`;
                const factorCounts: {[key: number]: number} = {};
                factors.forEach(f => factorCounts[f] = (factorCounts[f] || 0) + 1);
                
                const factorExpression = Object.entries(factorCounts)
                    .map(([prime, count]) => count === 1 ? prime : `${prime}^${count}`)
                    .join(' × ');
                
                steps += `- $${n} = ${factorExpression}$\n`;
                steps += `- **${n} ไม่เป็นจำนวนเฉพาะ** เพราะมีตัวประกอบอื่นนอกจาก 1 และตัวมันเอง\n`;
            }

            return { 
                result: { 
                    isPrime: primeCheck, 
                    factors: factors,
                    factorization: factors.length > 1 ? factors : null 
                }, 
                steps 
            };
        } catch {
            return { result: null, steps: '' };
        }
    }, [number]);

    return (
        <>
            <div className="space-y-4">
                <div>
                    <Label htmlFor="number">จำนวนที่ต้องการตรวจสอบ</Label>
                    <Input 
                        id="number" 
                        type="number" 
                        value={number} 
                        onChange={e => setNumber(e.target.value)}
                        placeholder="ใส่จำนวนเต็มบวก"
                    />
                </div>
            </div>
            
            {result && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 space-y-4"
                >
                    <div className={`p-4 rounded-lg border ${result.isPrime ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700'}`}>
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-lg">ผลการตรวจสอบ:</h4>
                            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
                                <HelpCircle className="mr-2 h-4 w-4"/>ดูวิธีทำ
                            </Button>
                        </div>
                        <div className="text-center">
                            <p className={`text-2xl font-bold ${result.isPrime ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                {number} {result.isPrime ? 'เป็นจำนวนเฉพาะ' : 'ไม่เป็นจำนวนเฉพาะ'}
                            </p>
                            {result.factorization && (
                                <p className="text-sm text-muted-foreground mt-2">
                                    ตัวประกอบเฉพาะ: {result.factorization.join(' × ')}
                                </p>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
            
            <CalculationStepsModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title="การตรวจสอบจำนวนเฉพาะ" 
                description="ขั้นตอนการตรวจสอบและแยกตัวประกอบเฉพาะ" 
                steps={steps} 
            />
        </>
    );
};

// Set Operations Tool Component (existing from AlgebraCalculator.tsx)
const SetTool = () => {
    const [setA, setSetA] = useState('1, 2, 3, 4, 5');
    const [setB, setSetB] = useState('3, 4, 5, 6, 7');
    const [operation, setOperation] = useState('union');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { result, steps } = useMemo(() => {
        try {
            const arrayA = parseSet(setA);
            const arrayB = parseSet(setB);
            
            if (arrayA.length === 0 || arrayB.length === 0) return { result: null, steps: '' };

            const uniqueA = [...new Set(arrayA)].sort((a, b) => a - b);
            const uniqueB = [...new Set(arrayB)].sort((a, b) => a - b);
            
            let resultSet: number[] = [];
            let steps = `### การดำเนินการเซต\n\n`;
            steps += `**เซต A:** {${uniqueA.join(', ')}}\n`;
            steps += `**เซต B:** {${uniqueB.join(', ')}}\n\n`;

            switch (operation) {
                case 'union':
                    resultSet = [...new Set([...uniqueA, ...uniqueB])].sort((a, b) => a - b);
                    steps += `### การรวมเซต (A ∪ B)\n`;
                    steps += `- รวมสมาชิกทุกตัวจากทั้งสองเซต โดยไม่นับซ้ำ\n`;
                    steps += `- **A ∪ B = {${resultSet.join(', ')}}**\n`;
                    break;
                case 'intersection':
                    resultSet = uniqueA.filter(x => uniqueB.includes(x));
                    steps += `### การตัดเซต (A ∩ B)\n`;
                    steps += `- หาสมาชิกที่อยู่ในทั้งสองเซต\n`;
                    steps += `- สมาชิกที่ซ้ำกัน: ${resultSet.length > 0 ? resultSet.join(', ') : 'ไม่มี'}\n`;
                    steps += `- **A ∩ B = {${resultSet.join(', ')}}**\n`;
                    break;
                case 'difference':
                    resultSet = uniqueA.filter(x => !uniqueB.includes(x));
                    steps += `### การลบเซต (A - B)\n`;
                    steps += `- หาสมาชิกที่อยู่ในเซต A แต่ไม่อยู่ในเซต B\n`;
                    steps += `- **A - B = {${resultSet.join(', ')}}**\n`;
                    break;
            }

            return { 
                result: { 
                    operation, 
                    setA: uniqueA, 
                    setB: uniqueB, 
                    resultSet 
                }, 
                steps 
            };
        } catch {
            return { result: null, steps: '' };
        }
    }, [setA, setB, operation]);

    const operationLabels = {
        union: 'รวมเซต (A ∪ B)',
        intersection: 'ตัดเซต (A ∩ B)',
        difference: 'ลบเซต (A - B)'
    };

    return (
        <>
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="setA">เซต A</Label>
                        <Input 
                            id="setA" 
                            value={setA} 
                            onChange={e => setSetA(e.target.value)}
                            placeholder="เช่น 1, 2, 3, 4"
                        />
                    </div>
                    <div>
                        <Label htmlFor="setB">เซต B</Label>
                        <Input 
                            id="setB" 
                            value={setB} 
                            onChange={e => setSetB(e.target.value)}
                            placeholder="เช่น 3, 4, 5, 6"
                        />
                    </div>
                </div>
                
                <div>
                    <Label htmlFor="operation">การดำเนินการ</Label>
                    <Select value={operation} onValueChange={setOperation}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="union">รวมเซต (A ∪ B)</SelectItem>
                            <SelectItem value="intersection">ตัดเซต (A ∩ B)</SelectItem>
                            <SelectItem value="difference">ลบเซต (A - B)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            
            {result && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border"
                >
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-lg">ผลลัพธ์:</h4>
                        <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
                            <HelpCircle className="mr-2 h-4 w-4"/>ดูวิธีทำ
                        </Button>
                    </div>
                    
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                                <p className="font-medium text-blue-700 dark:text-blue-300">เซต A:</p>
                                <p className="font-mono">{`{${result.setA.join(', ')}}`}</p>
                            </div>
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded">
                                <p className="font-medium text-green-700 dark:text-green-300">เซต B:</p>
                                <p className="font-mono">{`{${result.setB.join(', ')}}`}</p>
                            </div>
                        </div>
                        
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700 text-center">
                            <p className="text-sm text-purple-700 dark:text-purple-300 mb-2">{operationLabels[operation as keyof typeof operationLabels]}</p>
                            <p className="text-2xl font-bold font-mono text-purple-800 dark:text-purple-200">
                                {`{${result.resultSet.join(', ')}}`}
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
            
            <CalculationStepsModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title="การดำเนินการเซต" 
                description="ขั้นตอนการคำนวณการดำเนินการเซต" 
                steps={steps} 
            />
        </>
    );
};

// --- NEW COMPONENT: Linear Inequality Solver ---
const InequalitySolver = () => {
    const [expression, setExpression] = useState('2x + 5 > 15');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { result, steps } = useMemo(() => {
        let solution = '';
        let stepByStep = '';

        // Basic regex to parse linear inequality: ax + b [operator] c
        const match = expression.match(/(-?\d*\.?\d*)\s*([a-zA-Z])\s*([+\-])\s*(-?\d*\.?\d*)\s*(<|>|<=|>=|==|!=)\s*(-?\d*\.?\d*)/);
        const matchSimple = expression.match(/([a-zA-Z])\s*(<|>|<=|>=|==|!=)\s*(-?\d*\.?\d*)/);

        if (match) {
            let a = parseFloat(match[1]);
            const xVar = match[2];
            const opSign = match[3];
            let b = parseFloat(match[4]);
            const operator = match[5];
            const c = parseFloat(match[6]);

            if (isNaN(a) || isNaN(b) || isNaN(c)) {
                return { result: null, steps: '❌ รูปแบบสมการไม่ถูกต้อง (เช่น 2x + 5 > 10)' };
            }

            // Handle cases like "x + 5 > 10" (a is implied as 1)
            if (match[1] === '-' && !isNaN(parseFloat(match[2]))) { // e.g., -5x
                 a = -parseFloat(match[2]);
            } else if (match[1] === '') { // e.g., x
                a = 1;
            } else if (match[1] === '-') { // e.g., -x
                a = -1;
            }

            // Adjust b based on operator (e.g., if "2x - 5 > 10", b is -5)
            if (opSign === '-') {
                b = -b;
            }

            stepByStep += `### 1. สมการเริ่มต้น\n`;
            stepByStep += `- $${a}${xVar} ${opSign} ${Math.abs(b)} ${operator} ${c}$\n\n`;

            stepByStep += `### 2. ย้ายค่าคงที่ (b) ไปอีกข้าง\n`;
            stepByStep += `- ลบ ${b} ทั้งสองข้าง (ถ้า $b$ เป็นบวก) หรือบวก ${Math.abs(b)} ทั้งสองข้าง (ถ้า $b$ เป็นลบ)\n`;
            
            let c_after_b = c - b;
            stepByStep += `- $${a}${xVar} ${operator} ${c} ${opSign === '+' ? '-' : '+'} ${Math.abs(b)}$\n`;
            stepByStep += `- $${a}${xVar} ${operator} ${c_after_b}$\n\n`;

            stepByStep += `### 3. หารด้วยสัมประสิทธิ์ของ x (a)\n`;
            stepByStep += `- หาร ${c_after_b} ด้วย ${a}$\n`;

            let finalOperator = operator;
            if (a < 0) {
                stepByStep += `- **ข้อควรระวัง:** เมื่อหารหรือคูณด้วยจำนวนลบ ต้องกลับเครื่องหมายอสมการ!\n`;
                if (operator === '>') finalOperator = '<';
                else if (operator === '<') finalOperator = '>';
                else if (operator === '>=') finalOperator = '<=';
                else if (operator === '<=') finalOperator = '>=';
            }
            const x_solution = c_after_b / a;
            solution = `${xVar} ${finalOperator} ${x_solution.toFixed(4)}`;
            stepByStep += `- $${xVar} ${finalOperator} \\frac{${c_after_b}}{${a}}$\n`;
            stepByStep += `- **ผลลัพธ์:** $${solution}$\n`;
            
            return { result: solution, steps: stepByStep };

        } else if (matchSimple) { // For simpler forms like "x > 5"
            const xVar = matchSimple[1];
            const operator = matchSimple[2];
            const value = parseFloat(matchSimple[3]);

            if (isNaN(value)) {
                 return { result: null, steps: '❌ รูปแบบสมการไม่ถูกต้อง (เช่น x > 5)' };
            }
            solution = `${xVar} ${operator} ${value}`;
            stepByStep += `### 1. สมการเริ่มต้น\n`;
            stepByStep += `- ${xVar} ${operator} ${value}\n\n`;
            stepByStep += `- **ผลลัพธ์:** $${solution}$\n`;
            return { result: solution, steps: stepByStep };
        }
        
        return { result: null, steps: '❌ รูปแบบสมการไม่ถูกต้อง ตัวอย่าง: 2x + 5 > 10 หรือ x < 7' };

    }, [expression]);

    return (
        <>
            <div className="space-y-4">
                <div>
                    <Label htmlFor="inequality-expr">สมการอสมการเชิงเส้น</Label>
                    <Input 
                        id="inequality-expr" 
                        type="text" 
                        value={expression} 
                        onChange={e => setExpression(e.target.value)}
                        placeholder="เช่น 2x + 5 > 15 หรือ -3y <= 9"
                    />
                </div>
            </div>
            
            {result && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border"
                >
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-lg">ผลลัพธ์:</h4>
                        <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
                            <HelpCircle className="mr-2 h-4 w-4"/>ดูวิธีทำ
                        </Button>
                    </div>
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">เซตคำตอบของอสมการ</p>
                        <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 font-mono">{result}</p>
                    </div>
                </motion.div>
            )}
            
            <CalculationStepsModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title="การแก้อสมการเชิงเส้น" 
                description="ขั้นตอนการแก้สมการอสมการเชิงเส้นอย่างละเอียด" 
                steps={steps} 
            />
        </>
    );
};

// --- NEW COMPONENT: Root Simplifier ---
const RootSimplifier = () => {
    const [numberToSimplify, setNumberToSimplify] = useState('72');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { result, steps } = useMemo(() => {
        const n = parseFloat(numberToSimplify);
        if (isNaN(n) || n < 0 || !Number.isInteger(n)) {
            return { result: null, steps: '❌ กรุณาใส่จำนวนเต็มบวกเท่านั้น' };
        }
        
        const { coefficient, radicand, steps: simplifySteps } = simplifyRoot(n);

        let formattedResult = '';
        if (coefficient === 0 && radicand === 0) {
            formattedResult = '0';
        } else if (coefficient === 1 && radicand === n) {
            formattedResult = `√${n}`;
        } else if (radicand === 1) {
            formattedResult = `${coefficient}`;
        } else {
            formattedResult = `${coefficient}√${radicand}`;
        }

        return { result: formattedResult, steps: simplifySteps };

    }, [numberToSimplify]);

    return (
        <>
            <div className="space-y-4">
                <div>
                    <Label htmlFor="root-number">จำนวนที่ต้องการถอดรากที่สอง</Label>
                    <Input 
                        id="root-number" 
                        type="number" 
                        value={numberToSimplify} 
                        onChange={e => setNumberToSimplify(e.target.value)}
                        placeholder="เช่น 72 หรือ 50"
                    />
                </div>
            </div>
            
            {result && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border"
                >
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-lg">ผลลัพธ์:</h4>
                        <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
                            <HelpCircle className="mr-2 h-4 w-4"/>ดูวิธีทำ
                        </Button>
                    </div>
                    <div className="text-center p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">รูปแบบอย่างง่าย</p>
                        <p className="text-3xl font-bold text-teal-600 dark:text-teal-400 font-mono">{result}</p>
                    </div>
                </motion.div>
            )}
            
            <CalculationStepsModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title="การถอดรากที่สอง" 
                description="ขั้นตอนการถอดรากที่สองให้อยู่ในรูปอย่างง่าย" 
                steps={steps} 
            />
        </>
    );
};

// Main AlgebraCalculator Component
const AlgebraCalculator = () => {
    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            <Card className="shadow-lg border-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-3 text-2xl">
                        <Sigma className="h-8 w-8 text-blue-600" />
                        เครื่องคำนวณพีชคณิต
                    </CardTitle>
                    <CardDescription className="text-base">
                        เครื่องมือสำหรับทฤษฎีจำนวน การตรวจสอบจำนวนเฉพาะ และการดำเนินการเซต
                    </CardDescription>
                </CardHeader>
                
                <CardContent className="p-6">
                    <Tabs defaultValue="gcd-lcm" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 mb-6 h-auto"> {/* Adjusted grid-cols for more tabs */}
                            <TabsTrigger value="gcd-lcm" className="flex items-center gap-2">
                                <KeyRound className="h-4 w-4" />
                                <span className="hidden sm:inline">ห.ร.ม. / ค.ร.น.</span>
                                <span className="sm:hidden">GCD/LCM</span>
                            </TabsTrigger>
                            <TabsTrigger value="prime" className="flex items-center gap-2">
                                <HelpCircle className="h-4 w-4" />
                                <span className="hidden sm:inline">จำนวนเฉพาะ</span>
                                <span className="sm:hidden">Prime</span>
                            </TabsTrigger>
                            <TabsTrigger value="sets" className="flex items-center gap-2">
                                <Combine className="h-4 w-4" />
                                <span className="hidden sm:inline">การดำเนินการเซต</span>
                                <span className="sm:hidden">Sets</span>
                            </TabsTrigger>
                            {/* NEW TABS */}
                            <TabsTrigger value="inequality" className="flex items-center gap-2">
                                <DivideSquare className="h-4 w-4" />
                                <span className="hidden sm:inline">อสมการเชิงเส้น</span>
                                <span className="sm:hidden">Inequality</span>
                            </TabsTrigger>
                            {/* Corrected icon usage: changed SquareRoot to Radical */}
                            <TabsTrigger value="roots" className="flex items-center gap-2">
                                <Radical className="h-4 w-4" />
                                <span className="hidden sm:inline">การถอดราก</span>
                                <span className="sm:hidden">Roots</span>
                            </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="gcd-lcm" className="space-y-4">
                            <div className="text-center mb-4">
                                <h3 className="text-xl font-semibold mb-2">หาห.ร.ม. และ ค.ร.น.</h3>
                                <p className="text-muted-foreground">ใส่จำนวนเต็มบวกสองจำนวนเพื่อหาตัวหารร่วมมากและตัวคูณร่วมน้อย</p>
                            </div>
                            <GcdLcmTool />
                        </TabsContent>
                        
                        <TabsContent value="prime" className="space-y-4">
                            <div className="text-center mb-4">
                                <h3 className="text-xl font-semibold mb-2">ตรวจสอบจำนวนเฉพาะ</h3>
                                <p className="text-muted-foreground">ใส่จำนวนเต็มบวกเพื่อตรวจสอบว่าเป็นจำนวนเฉพาะหรือไม่ และแยกตัวประกอบเฉพาะ</p>
                            </div>
                            <PrimeTool />
                        </TabsContent>
                        
                        <TabsContent value="sets" className="space-y-4">
                            <div className="text-center mb-4">
                                <h3 className="text-xl font-semibold mb-2">การดำเนินการเซต</h3>
                                <p className="text-muted-foreground">ใส่สมาชิกของเซตแล้วเลือกการดำเนินการที่ต้องการ (คั่นด้วยเครื่องหมายจุลภาค)</p>
                            </div>
                            <SetTool />
                        </TabsContent>

                        {/* NEW TAB CONTENT: Linear Inequality Solver */}
                        <TabsContent value="inequality" className="space-y-4">
                            <div className="text-center mb-4">
                                <h3 className="text-xl font-semibold mb-2">แก้อสมการเชิงเส้น</h3>
                                <p className="text-muted-foreground">กรอกอสมการเชิงเส้นเพื่อหาเซตคำตอบ</p>
                            </div>
                            <InequalitySolver />
                        </TabsContent>

                        {/* NEW TAB CONTENT: Root Simplifier */}
                        <TabsContent value="roots" className="space-y-4">
                            <div className="text-center mb-4">
                                <h3 className="text-xl font-semibold mb-2">ถอดรากที่สอง</h3>
                                <p className="text-muted-foreground">ใส่จำนวนเต็มบวกเพื่อถอดรากที่สองให้อยู่ในรูปอย่างง่าย</p>
                            </div>
                            <RootSimplifier />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
};

export default AlgebraCalculator;