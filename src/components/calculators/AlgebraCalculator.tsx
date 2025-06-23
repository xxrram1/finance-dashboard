// src/components/calculators/AlgebraCalculator.tsx

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { HelpCircle, Sigma, KeyRound, Combine, DivideSquare, Radical, FunctionSquare, Superscript, Users } from 'lucide-react';
import { motion } from 'framer-motion';

// --- HELPER FUNCTIONS ---

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

const solveQuadratic = (a: number, b: number, c: number): { 
    solutions: { real: number[], complex?: string[] }, 
    discriminant: number, 
    steps: string 
} => {
    const discriminant = b * b - 4 * a * c;
    let steps = `### การแก้สมการกำลังสอง $${a}x^2 ${b >= 0 ? '+' : ''}${b}x ${c >= 0 ? '+' : ''}${c} = 0$\n\n`;
    
    steps += `#### 1. ระบุค่าสัมประสิทธิ์\n`;
    steps += `- $a = ${a}$\n`;
    steps += `- $b = ${b}$\n`;
    steps += `- $c = ${c}$\n\n`;
    
    steps += `#### 2. คำนวณ Discriminant (Δ)\n`;
    steps += `- $\\Delta = b^2 - 4ac$\n`;
    steps += `- $\\Delta = (${b})^2 - 4(${a})(${c})$\n`;
    steps += `- $\\Delta = ${b * b} - ${4 * a * c}$\n`;
    steps += `- $\\Delta = ${discriminant}$\n\n`;
    
    steps += `#### 3. วิเคราะห์ค่า Discriminant\n`;
    
    let solutions: { real: number[], complex?: string[] } = { real: [] };
    
    if (discriminant > 0) {
        steps += `- $\\Delta > 0$ → มี 2 คำตอบที่เป็นจำนวนจริงที่แตกต่างกัน\n\n`;
        steps += `#### 4. คำนวณคำตอบด้วยสูตร Quadratic\n`;
        steps += `- $x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}$\n`;
        
        const sqrtDisc = Math.sqrt(discriminant);
        const x1 = (-b + sqrtDisc) / (2 * a);
        const x2 = (-b - sqrtDisc) / (2 * a);
        
        steps += `- $x_1 = \\frac{${-b} + \\sqrt{${discriminant}}}{2(${a})} = \\frac{${-b} + ${sqrtDisc.toFixed(4)}}{${2 * a}} = ${x1.toFixed(4)}$\n`;
        steps += `- $x_2 = \\frac{${-b} - \\sqrt{${discriminant}}}{2(${a})} = \\frac{${-b} - ${sqrtDisc.toFixed(4)}}{${2 * a}} = ${x2.toFixed(4)}$\n`;
        
        solutions.real = [x1, x2];
    } else if (discriminant === 0) {
        steps += `- $\\Delta = 0$ → มี 1 คำตอบซ้ำ (repeated root)\n\n`;
        steps += `#### 4. คำนวณคำตอบ\n`;
        steps += `- $x = \\frac{-b}{2a}$\n`;
        
        const x = -b / (2 * a);
        steps += `- $x = \\frac{${-b}}{2(${a})} = \\frac{${-b}}{${2 * a}} = ${x.toFixed(4)}$\n`;
        
        solutions.real = [x];
    } else {
        steps += `- $\\Delta < 0$ → ไม่มีคำตอบในจำนวนจริง แต่มีคำตอบในจำนวนเชิงซ้อน\n\n`;
        steps += `#### 4. คำนวณคำตอบเชิงซ้อน\n`;
        steps += `- $x = \\frac{-b \\pm i\\sqrt{|\\Delta|}}{2a}$\n`;
        
        const realPart = -b / (2 * a);
        const imagPart = Math.sqrt(-discriminant) / (2 * a);
        
        steps += `- ส่วนจริง: $\\frac{${-b}}{2(${a})} = ${realPart.toFixed(4)}$\n`;
        steps += `- ส่วนจินตภาพ: $\\frac{\\sqrt{${-discriminant}}}{2(${a})} = ${imagPart.toFixed(4)}$\n`;
        steps += `- $x_1 = ${realPart.toFixed(4)} + ${imagPart.toFixed(4)}i$\n`;
        steps += `- $x_2 = ${realPart.toFixed(4)} - ${imagPart.toFixed(4)}i$\n`;
        
        solutions.complex = [
            `${realPart.toFixed(4)} + ${imagPart.toFixed(4)}i`,
            `${realPart.toFixed(4)} - ${imagPart.toFixed(4)}i`
        ];
    }
    
    return { solutions, discriminant, steps };
};

const calculateLog = (base: number, value: number): { result: number, steps: string } => {
    if (base <= 0 || base === 1 || value <= 0) {
        return { 
            result: NaN, 
            steps: '❌ ฐานต้องเป็นจำนวนบวกที่ไม่ใช่ 1 และค่าที่ต้องการหา log ต้องเป็นจำนวนบวก' 
        };
    }
    
    const result = Math.log(value) / Math.log(base);
    
    let steps = `### การคำนวณ $\\log_{${base}} ${value}$\n\n`;
    steps += `#### 1. นิยามของลอการิทึม\n`;
    steps += `- $\\log_{${base}} ${value} = x$ หมายความว่า ${base}^x = ${value}$\n\n`;
    
    steps += `#### 2. การคำนวณโดยใช้สูตรเปลี่ยนฐาน\n`;
    steps += `- $\\log_{${base}} ${value} = \\frac{\\ln ${value}}{\\ln ${base}}$\n`;
    steps += `- $\\log_{${base}} ${value} = \\frac{${Math.log(value).toFixed(6)}}{${Math.log(base).toFixed(6)}}$\n`;
    steps += `- $\\log_{${base}} ${value} = ${result.toFixed(6)}$\n\n`;
    
    steps += `#### 3. ตรวจสอบคำตอบ\n`;
    steps += `- ${base}^{${result.toFixed(6)}} = ${Math.pow(base, result).toFixed(6)} ≈ ${value}$ ✓\n`;
    
    return { result, steps };
};

const solveExponential = (base: number, equals: number): { result: number, steps: string } => {
    if (base <= 0 || base === 1 || equals <= 0) {
        return { 
            result: NaN, 
            steps: '❌ ฐานต้องเป็นจำนวนบวกที่ไม่ใช่ 1 และค่าที่เท่ากับต้องเป็นจำนวนบวก' 
        };
    }
    
    const result = Math.log(equals) / Math.log(base);
    
    let steps = `### การแก้สมการเอ็กซ์โพเนนเชียล ${base}^x = ${equals}$\n\n`;
    steps += `#### 1. ใช้ logarithm ทั้งสองข้าง\n`;
    steps += `- $\\log(${base}^x) = \\log(${equals})$\n`;
    steps += `- $x \\cdot \\log(${base}) = \\log(${equals})$\n\n`;
    
    steps += `#### 2. หาค่า x\n`;
    steps += `- $x = \\frac{\\log(${equals})}{\\log(${base})}$\n`;
    steps += `- $x = \\frac{${Math.log10(equals).toFixed(6)}}{${Math.log10(base).toFixed(6)}}$ (ใช้ log ฐาน 10)\n`;
    steps += `- $x = ${result.toFixed(6)}$\n\n`;
    
    steps += `#### 3. ตรวจสอบคำตอบ\n`;
    steps += `- ${base}^{${result.toFixed(6)}} = ${Math.pow(base, result).toFixed(2)} ≈ ${equals}$ ✓\n`;
    
    return { result, steps };
};

const factorial = (n: number): bigint => {
    if (n < 0 || !Number.isInteger(n)) return BigInt(0);
    if (n === 0 || n === 1) return BigInt(1);
    let result = BigInt(1);
    for (let i = 2; i <= n; i++) {
        result *= BigInt(i);
    }
    return result;
};

const permutation = (n: number, r: number): { result: bigint, steps: string } => {
    if (n < 0 || r < 0 || !Number.isInteger(n) || !Number.isInteger(r) || r > n) {
        return { result: BigInt(0), steps: '❌ ค่า n และ r ต้องเป็นจำนวนเต็มที่ไม่ติดลบ และ r ≤ n' };
    }
    
    let steps = `### การคำนวณ Permutation P(${n}, ${r})\n\n`;
    steps += `#### 1. สูตร Permutation\n`;
    steps += `- $P(n, r) = \\frac{n!}{(n-r)!}$\n`;
    steps += `- $P(${n}, ${r}) = \\frac{${n}!}{(${n}-${r})!} = \\frac{${n}!}{${n-r}!}$\n\n`;
    
    const nFact = factorial(n);
    const nMinusRFact = factorial(n - r);
    const result = nFact / nMinusRFact;
    
    steps += `#### 2. คำนวณ factorial\n`;
    steps += `- ${n}! = ${nFact.toString()}$\n`;
    steps += `- ${n-r}! = ${nMinusRFact.toString()}$\n\n`;
    
    steps += `#### 3. ผลลัพธ์\n`;
    steps += `- $P(${n}, ${r}) = \\frac{${nFact.toString()}}{${nMinusRFact.toString()}} = ${result.toString()}$\n\n`;
    
    steps += `**ความหมาย:** มีวิธีจัดเรียง ${r} สิ่งจาก ${n} สิ่งโดยคำนึงถึงลำดับ ได้ ${result.toString()} วิธี\n`;
    
    return { result, steps };
};

const combination = (n: number, r: number): { result: bigint, steps: string } => {
    if (n < 0 || r < 0 || !Number.isInteger(n) || !Number.isInteger(r) || r > n) {
        return { result: BigInt(0), steps: '❌ ค่า n และ r ต้องเป็นจำนวนเต็มที่ไม่ติดลบ และ r ≤ n' };
    }
    
    let steps = `### การคำนวณ Combination C(${n}, ${r})\n\n`;
    steps += `#### 1. สูตร Combination\n`;
    steps += `- $C(n, r) = \\binom{n}{r} = \\frac{n!}{r!(n-r)!}$\n`;
    steps += `- $C(${n}, ${r}) = \\frac{${n}!}{${r}!(${n}-${r})!} = \\frac{${n}!}{${r}! \\cdot ${n-r}!}$\n\n`;
    
    const nFact = factorial(n);
    const rFact = factorial(r);
    const nMinusRFact = factorial(n - r);
    const result = nFact / (rFact * nMinusRFact);
    
    steps += `#### 2. คำนวณ factorial\n`;
    steps += `- ${n}! = ${nFact.toString()}$\n`;
    steps += `- ${r}! = ${rFact.toString()}$\n`;
    steps += `- ${n-r}! = ${nMinusRFact.toString()}$\n\n`;
    
    steps += `#### 3. ผลลัพธ์\n`;
    steps += `- $C(${n}, ${r}) = \\frac{${nFact.toString()}}{${rFact.toString()} \\times ${nMinusRFact.toString()}} = ${result.toString()}$\n\n`;
    
    steps += `**ความหมาย:** มีวิธีเลือก ${r} สิ่งจาก ${n} สิ่งโดยไม่คำนึงถึงลำดับ ได้ ${result.toString()} วิธี\n`;
    
    return { result, steps };
};

// --- SUB-COMPONENTS ---

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

const InequalitySolver = () => {
    const [expression, setExpression] = useState('2x + 5 > 15');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { result, steps } = useMemo(() => {
        let solution = '';
        let stepByStep = '';

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

            if (match[1] === '-' && !isNaN(parseFloat(match[2]))) {
                 a = -parseFloat(match[2]);
            } else if (match[1] === '') {
                a = 1;
            } else if (match[1] === '-') {
                a = -1;
            }

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

        } else if (matchSimple) {
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

const QuadraticSolver = () => {
    const [a, setA] = useState('1');
    const [b, setB] = useState('-5');
    const [c, setC] = useState('6');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { result, steps } = useMemo(() => {
        const aNum = parseFloat(a);
        const bNum = parseFloat(b);
        const cNum = parseFloat(c);
        
        if (isNaN(aNum) || isNaN(bNum) || isNaN(cNum) || aNum === 0) {
            return { result: null, steps: '❌ กรุณาใส่ตัวเลขที่ถูกต้อง และ a ≠ 0' };
        }
        
        return solveQuadratic(aNum, bNum, cNum);
    }, [a, b, c]);

    const formatSolution = (solutions: { real: number[], complex?: string[] }) => {
        if (solutions.complex) {
            return solutions.complex.join(', ');
        }
        return solutions.real.map(x => Number.isInteger(x) ? x.toString() : x.toFixed(4)).join(', ');
    };

    return (
        <>
            <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <Label htmlFor="quad-a">ค่า a</Label>
                        <Input 
                            id="quad-a" 
                            type="number" 
                            value={a} 
                            onChange={e => setA(e.target.value)}
                            placeholder="สัมประสิทธิ์ของ x²"
                        />
                    </div>
                    <div>
                        <Label htmlFor="quad-b">ค่า b</Label>
                        <Input 
                            id="quad-b" 
                            type="number" 
                            value={b} 
                            onChange={e => setB(e.target.value)}
                            placeholder="สัมประสิทธิ์ของ x"
                        />
                    </div>
                    <div>
                        <Label htmlFor="quad-c">ค่า c</Label>
                        <Input 
                            id="quad-c" 
                            type="number" 
                            value={c} 
                            onChange={e => setC(e.target.value)}
                            placeholder="ค่าคงที่"
                        />
                    </div>
                </div>
                
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-lg font-mono">
                        {a}x² {parseFloat(b) >= 0 ? '+' : ''} {b}x {parseFloat(c) >= 0 ? '+' : ''} {c} = 0
                    </p>
                </div>
            </div>
            
            {result && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 space-y-4"
                >
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-semibold text-lg">ผลลัพธ์:</h4>
                            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
                                <HelpCircle className="mr-2 h-4 w-4"/>ดูวิธีทำ
                            </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                <p className="text-sm text-muted-foreground mb-1">Discriminant (Δ)</p>
                                <p className={`text-2xl font-bold ${result.discriminant > 0 ? 'text-green-600' : result.discriminant === 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                                    {result.discriminant}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {result.discriminant > 0 ? '2 คำตอบจริง' : result.discriminant === 0 ? '1 คำตอบซ้ำ' : 'คำตอบเชิงซ้อน'}
                                </p>
                            </div>
                            
                            <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                                <p className="text-sm text-muted-foreground mb-1">คำตอบ</p>
                                <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                                    x = {formatSolution(result.solutions)}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
            
            <CalculationStepsModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title="การแก้สมการกำลังสอง" 
                description="ขั้นตอนการใช้สูตร Quadratic Formula" 
                steps={steps} 
            />
        </>
    );
};

const LogExpCalculator = () => {
    const [mode, setMode] = useState<'log' | 'exp'>('log');
    const [base, setBase] = useState('10');
    const [value, setValue] = useState('100');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { result, steps } = useMemo(() => {
        const baseNum = parseFloat(base);
        const valueNum = parseFloat(value);
        
        if (isNaN(baseNum) || isNaN(valueNum)) {
            return { result: null, steps: '❌ กรุณาใส่ตัวเลขที่ถูกต้อง' };
        }
        
        if (mode === 'log') {
            const { result: logResult, steps: logSteps } = calculateLog(baseNum, valueNum);
            return { result: logResult, steps: logSteps };
        } else {
            const { result: expResult, steps: expSteps } = solveExponential(baseNum, valueNum);
            return { result: expResult, steps: expSteps };
        }
    }, [mode, base, value]);

    return (
        <>
            <div className="space-y-4">
                <div>
                    <Label>เลือกประเภทการคำนวณ</Label>
                    <Select value={mode} onValueChange={(v) => setMode(v as 'log' | 'exp')}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="log">Logarithm (log)</SelectItem>
                            <SelectItem value="exp">Exponential (aˣ = b)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="log-base">ฐาน {mode === 'log' ? '(base)' : '(a)'}</Label>
                        <Input 
                            id="log-base" 
                            type="number" 
                            value={base} 
                            onChange={e => setBase(e.target.value)}
                            placeholder="เช่น 10, 2, e"
                        />
                    </div>
                    <div>
                        <Label htmlFor="log-value">
                            {mode === 'log' ? 'ค่าที่ต้องการหา log' : 'ค่าที่เท่ากับ (b)'}
                        </Label>
                        <Input 
                            id="log-value" 
                            type="number" 
                            value={value} 
                            onChange={e => setValue(e.target.value)}
                            placeholder="เช่น 100"
                        />
                    </div>
                </div>
                
                <div className="text-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                    <p className="text-lg font-mono">
                        {mode === 'log' 
                            ? `log₍${base}₎(${value}) = ?`
                            : `${base}ˣ = ${value}, x = ?`
                        }
                    </p>
                </div>
            </div>
            
            {result !== null && !isNaN(result) && (
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
                    
                    <div className="text-center p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">
                            {mode === 'log' ? 'ค่า Logarithm' : 'ค่า x'}
                        </p>
                        <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400 font-mono">
                            {result.toFixed(6)}
                        </p>
                    </div>
                    
                    {mode === 'log' && (
                        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-2">การแสดงผล:</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-center">
                                <div className="p-2 bg-white dark:bg-gray-900 rounded border">
                                    <p className="text-xs text-muted-foreground">ฐาน</p>
                                    <p className="font-mono font-bold">{base}</p>
                                </div>
                                <div className="p-2 bg-white dark:bg-gray-900 rounded border">
                                    <p className="text-xs text-muted-foreground">ยกกำลัง</p>
                                    <p className="font-mono font-bold">{result.toFixed(4)}</p>
                                </div>
                                <div className="p-2 bg-white dark:bg-gray-900 rounded border">
                                    <p className="text-xs text-muted-foreground">ได้ผลลัพธ์</p>
                                    <p className="font-mono font-bold">{value}</p>
                                </div>
                            </div>
                            <p className="text-xs text-center mt-2 text-muted-foreground">
                                {base}<sup>{result.toFixed(4)}</sup> ≈ {value}
                            </p>
                        </div>
                    )}
                </motion.div>
            )}
            
            <CalculationStepsModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={mode === 'log' ? 'การคำนวณ Logarithm' : 'การแก้สมการ Exponential'} 
                description="ขั้นตอนการคำนวณอย่างละเอียด" 
                steps={steps} 
            />
        </>
    );
};

const PermCombCalculator = () => {
    const [n, setN] = useState('10');
    const [r, setR] = useState('3');
    const [mode, setMode] = useState<'perm' | 'comb'>('comb');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { result, steps } = useMemo(() => {
        const nNum = parseInt(n);
        const rNum = parseInt(r);
        
        if (isNaN(nNum) || isNaN(rNum)) {
            return { result: null, steps: '❌ กรุณาใส่จำนวนเต็มที่ถูกต้อง' };
        }
        
        if (mode === 'perm') {
            return permutation(nNum, rNum);
        } else {
            return combination(nNum, rNum);
        }
    }, [n, r, mode]);

    return (
        <>
            <div className="space-y-4">
                <div>
                    <Label>เลือกประเภทการคำนวณ</Label>
                    <Select value={mode} onValueChange={(v) => setMode(v as 'perm' | 'comb')}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="perm">Permutation (วิธีจัดเรียง)</SelectItem>
                            <SelectItem value="comb">Combination (วิธีเลือก)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="perm-n">จำนวนทั้งหมด (n)</Label>
                        <Input 
                            id="perm-n" 
                            type="number" 
                            value={n} 
                            onChange={e => setN(e.target.value)}
                            placeholder="จำนวนสิ่งทั้งหมด"
                        />
                    </div>
                    <div>
                        <Label htmlFor="perm-r">จำนวนที่เลือก (r)</Label>
                        <Input 
                            id="perm-r" 
                            type="number" 
                            value={r} 
                            onChange={e => setR(e.target.value)}
                            placeholder="จำนวนที่ต้องการเลือก"
                        />
                    </div>
                </div>
                
                <div className="text-center p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                    <p className="text-lg font-mono">
                        {mode === 'perm' ? 'P' : 'C'}({n}, {r}) = ?
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                        {mode === 'perm' 
                            ? `วิธีจัดเรียง ${r} สิ่งจาก ${n} สิ่ง (คำนึงถึงลำดับ)`
                            : `วิธีเลือก ${r} สิ่งจาก ${n} สิ่ง (ไม่คำนึงถึงลำดับ)`
                        }
                    </p>
                </div>
            </div>
            
            {result && result.toString() !== '0' && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 space-y-4"
                >
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-semibold text-lg">ผลลัพธ์:</h4>
                            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
                                <HelpCircle className="mr-2 h-4 w-4"/>ดูวิธีทำ
                            </Button>
                        </div>
                        
                        <div className="text-center p-4 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">จำนวนวิธี</p>
                            <p className="text-3xl font-bold text-rose-600 dark:text-rose-400">
                                {result.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {mode === 'perm' ? 'วิธีจัดเรียง' : 'วิธีเลือก'}
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
            
            <CalculationStepsModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={mode === 'perm' ? 'การคำนวณ Permutation' : 'การคำนวณ Combination'} 
                description="ขั้นตอนการคำนวณด้วยสูตร factorial" 
                steps={steps} 
            />
        </>
    );
};


// --- MAIN COMPONENT ---

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
                        เครื่องมือสำหรับทฤษฎีจำนวน การแก้สมการ และอื่นๆ
                    </CardDescription>
                </CardHeader>
                
                <CardContent className="p-6">
                    <Tabs defaultValue="gcd-lcm" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 mb-6 h-auto">
                            <TabsTrigger value="gcd-lcm" className="flex items-center gap-2"><KeyRound className="h-4 w-4" /> <span className="hidden sm:inline">ห.ร.ม./ค.ร.น.</span><span className="sm:hidden">ห.ร.ม./ค.ร.น.</span></TabsTrigger>
                            <TabsTrigger value="prime" className="flex items-center gap-2"><HelpCircle className="h-4 w-4" /> <span className="hidden sm:inline">จำนวนเฉพาะ</span><span className="sm:hidden">จำนวนเฉพาะ</span></TabsTrigger>
                            <TabsTrigger value="sets" className="flex items-center gap-2"><Combine className="h-4 w-4" /> <span className="hidden sm:inline">เซต</span><span className="sm:hidden">เซต</span></TabsTrigger>
                            <TabsTrigger value="inequality" className="flex items-center gap-2"><DivideSquare className="h-4 w-4" /> <span className="hidden sm:inline">อสมการ</span><span className="sm:hidden">อสมการ</span></TabsTrigger>
                            <TabsTrigger value="roots" className="flex items-center gap-2"><Radical className="h-4 w-4" /> <span className="hidden sm:inline">ราก</span><span className="sm:hidden">ราก</span></TabsTrigger>
                            <TabsTrigger value="quadratic" className="flex items-center gap-2"><Superscript className="h-4 w-4" /> <span className="hidden sm:inline">กำลังสอง</span><span className="sm:hidden">กำลังสอง</span></TabsTrigger>
                            <TabsTrigger value="log-exp" className="flex items-center gap-2"><FunctionSquare className="h-4 w-4" /> <span className="hidden sm:inline">Log/Exp</span><span className="sm:hidden">Log/Exp</span></TabsTrigger>
                            <TabsTrigger value="perm-comb" className="flex items-center gap-2"><Users className="h-4 w-4" /> <span className="hidden sm:inline">เรียง/เลือก</span><span className="sm:hidden">เรียง/เลือก</span></TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="gcd-lcm" className="space-y-4">
                            <div className="text-center mb-4"><h3 className="text-xl font-semibold mb-2">หาห.ร.ม. และ ค.ร.น.</h3><p className="text-muted-foreground">ใส่จำนวนเต็มบวกสองจำนวนเพื่อหาตัวหารร่วมมากและตัวคูณร่วมน้อย</p></div>
                            <GcdLcmTool />
                        </TabsContent>
                        
                        <TabsContent value="prime" className="space-y-4">
                            <div className="text-center mb-4"><h3 className="text-xl font-semibold mb-2">ตรวจสอบจำนวนเฉพาะ</h3><p className="text-muted-foreground">ใส่จำนวนเต็มบวกเพื่อตรวจสอบและแยกตัวประกอบ</p></div>
                            <PrimeTool />
                        </TabsContent>
                        
                        <TabsContent value="sets" className="space-y-4">
                             <div className="text-center mb-4"><h3 className="text-xl font-semibold mb-2">การดำเนินการเซต</h3><p className="text-muted-foreground">ใส่สมาชิกของเซตแล้วเลือกการดำเนินการ (คั่นด้วยจุลภาค)</p></div>
                            <SetTool />
                        </TabsContent>

                        <TabsContent value="inequality" className="space-y-4">
                            <div className="text-center mb-4"><h3 className="text-xl font-semibold mb-2">แก้อสมการเชิงเส้น</h3><p className="text-muted-foreground">กรอกอสมการเชิงเส้นเพื่อหาเซตคำตอบ</p></div>
                            <InequalitySolver />
                        </TabsContent>

                        <TabsContent value="roots" className="space-y-4">
                            <div className="text-center mb-4"><h3 className="text-xl font-semibold mb-2">ถอดรากที่สอง</h3><p className="text-muted-foreground">ใส่จำนวนเต็มบวกเพื่อถอดรากที่สองให้อยู่ในรูปอย่างง่าย</p></div>
                            <RootSimplifier />
                        </TabsContent>

                        <TabsContent value="quadratic" className="space-y-4">
                            <div className="text-center mb-4"><h3 className="text-xl font-semibold mb-2">แก้สมการกำลังสอง</h3><p className="text-muted-foreground">ใช้สูตร ax² + bx + c = 0</p></div>
                            <QuadraticSolver />
                        </TabsContent>

                        <TabsContent value="log-exp" className="space-y-4">
                             <div className="text-center mb-4"><h3 className="text-xl font-semibold mb-2">คำนวณ Logarithm & Exponential</h3><p className="text-muted-foreground">หาค่าลอการิทึมหรือแก้สมการเลขชี้กำลัง</p></div>
                            <LogExpCalculator />
                        </TabsContent>

                        <TabsContent value="perm-comb" className="space-y-4">
                             <div className="text-center mb-4"><h3 className="text-xl font-semibold mb-2">คำนวณวิธีเรียงสับเปลี่ยนและวิธีเลือก</h3><p className="text-muted-foreground">หาจำนวนวิธีในการจัดเรียงหรือเลือกสิ่งของ</p></div>
                            <PermCombCalculator />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
};

export default AlgebraCalculator;