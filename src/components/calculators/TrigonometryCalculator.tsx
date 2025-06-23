import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calculator, RotateCcw, BookOpen, TrendingUp, Circle, Activity, HelpCircle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// Helper functions for advanced trigonometry
const degToRad = (deg: number) => (deg * Math.PI) / 180;
const radToDeg = (rad: number) => (rad * 180) / Math.PI;

const normalizeAngle = (angle: number, range: '0-360' | '-180-180' = '0-360') => {
    const normalized = angle % 360;
    if (range === '0-360') {
        return normalized < 0 ? normalized + 360 : normalized;
    } else {
        return normalized > 180 ? normalized - 360 : normalized < -180 ? normalized + 360 : normalized;
    }
};

const sec = (angle: number) => 1 / Math.cos(angle);
const csc = (angle: number) => 1 / Math.sin(angle);
const cot = (angle: number) => 1 / Math.tan(angle);

interface TriangleResults {
    sides: { a: number; b: number; c: number };
    angles: { A: number; B: number; C: number };
    area: number;
    perimeter: number;
}

const TrigonometryCalculator = () => {
    // State declarations
    const [pythagorean, setPythagorean] = useState({ a: '', b: '', c: '' });
    const [rightTriangle, setRightTriangle] = useState({
        side1: '', side2: '', side3: '',
        angle1: '', angle2: '', angle3: '',
        hypotenuse: ''
    });
    const [generalTriangle, setGeneralTriangle] = useState({
        sideA: '', sideB: '', sideC: '',
        angleA: '', angleB: '', angleC: ''
    });
    const [trigFunc, setTrigFunc] = useState({
        angle: '45',
        unit: 'degree' as 'degree' | 'radian',
        quadrant: 1
    });
    const [unitCircle, setUnitCircle] = useState({
        angle: '30',
        showSpecialAngles: true
    });
    const [trigIdentity, setTrigIdentity] = useState({
        angle: '30',
        identityType: 'pythagorean' as 'pythagorean' | 'sum-difference' | 'double-angle' | 'half-angle'
    });
    const [inverseTrig, setInverseTrig] = useState({
        value: '0.5',
        function: 'arcsin' as 'arcsin' | 'arccos' | 'arctan'
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', steps: '' });

    // Memoized calculations
    const pythagoreanResult = useMemo(() => {
        const a = parseFloat(pythagorean.a);
        const b = parseFloat(pythagorean.b);
        const c = parseFloat(pythagorean.c);

        if (a && b && !c) {
            const result = Math.sqrt(a * a + b * b);
            return { result: result.toFixed(4), type: 'หาด้านตรง (c)', formula: 'c = √(a² + b²)' };
        } else if (a && !b && c) {
            const result = Math.sqrt(c * c - a * a);
            return result > 0 ? { result: result.toFixed(4), type: 'หาด้านประกอบ (b)', formula: 'b = √(c² - a²)' } : null;
        } else if (!a && b && c) {
            const result = Math.sqrt(c * c - b * b);
            return result > 0 ? { result: result.toFixed(4), type: 'หาด้านประกอบ (a)', formula: 'a = √(c² - b²)' } : null;
        }
        return null;
    }, [pythagorean]);

    const rightTriangleResult = useMemo(() => {
        const { side1, side2, angle1 } = rightTriangle;
        const s1 = parseFloat(side1);
        const s2 = parseFloat(side2);
        const a1 = parseFloat(angle1);

        if (s1 && a1 && !s2) {
            const angleRad = (a1 * Math.PI) / 180;
            const otherAngle = 90 - a1;
            
            let opposite, adjacent, hypotenuse;
            
            if (a1 < 90) {
                adjacent = s1;
                opposite = adjacent * Math.tan(angleRad);
                hypotenuse = adjacent / Math.cos(angleRad);
            }

            return {
                sides: {
                    opposite: opposite?.toFixed(4),
                    adjacent: adjacent?.toFixed(4),
                    hypotenuse: hypotenuse?.toFixed(4)
                },
                angles: {
                    given: a1,
                    other: otherAngle,
                    right: 90
                },
                formulas: [
                    `tan(${a1}°) = ตรงข้าม/ประชิด = ${opposite?.toFixed(4)}/${s1}`,
                    `cos(${a1}°) = ประชิด/ด้านตรง = ${s1}/${hypotenuse?.toFixed(4)}`,
                    `sin(${a1}°) = ตรงข้าม/ด้านตรง = ${opposite?.toFixed(4)}/${hypotenuse?.toFixed(4)}`
                ]
            };
        }
        return null;
    }, [rightTriangle]);

    const generalTriangleResult = useMemo(() => {
        const a = parseFloat(generalTriangle.sideA);
        const b = parseFloat(generalTriangle.sideB);
        const c = parseFloat(generalTriangle.sideC);
        const A = parseFloat(generalTriangle.angleA);
        const B = parseFloat(generalTriangle.angleB);
        const C = parseFloat(generalTriangle.angleC);

        if (a && b && C) {
            const angleC = (C * Math.PI) / 180;
            const sideC = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(angleC));
            
            const angleA = Math.asin((a * Math.sin(angleC)) / sideC) * (180 / Math.PI);
            const angleB = 180 - angleA - C;
            
            const area = 0.5 * a * b * Math.sin(angleC);
            const perimeter = a + b + sideC;

            return {
                sides: { a, b, c: sideC },
                angles: { A: angleA, B: angleB, C },
                area,
                perimeter,
                method: 'กฎของโคไซน์ (SAS)',
                formula: `c² = a² + b² - 2ab cos(C)`
            };
        }

        if (A && B && a) {
            const angleC = 180 - A - B;
            const angleA = (A * Math.PI) / 180;
            const angleB = (B * Math.PI) / 180;
            const angleC_rad = (angleC * Math.PI) / 180;
            
            const sideB = (a * Math.sin(angleB)) / Math.sin(angleA);
            const sideC = (a * Math.sin(angleC_rad)) / Math.sin(angleA);
            
            const area = 0.5 * a * sideB * Math.sin(angleC_rad);
            const perimeter = a + sideB + sideC;

            return {
                sides: { a, b: sideB, c: sideC },
                angles: { A, B, C: angleC },
                area,
                perimeter,
                method: 'กฎของไซน์ (AAS)',
                formula: `a/sin(A) = b/sin(B) = c/sin(C)`
            };
        }

        return null;
    }, [generalTriangle]);

    const trigFuncResult = useMemo(() => {
        const angleValue = parseFloat(trigFunc.angle);
        if (isNaN(angleValue)) return null;

        const angleRad = trigFunc.unit === 'degree' ? degToRad(angleValue) : angleValue;
        const angleDeg = trigFunc.unit === 'degree' ? angleValue : radToDeg(angleValue);

        const sinValue = Math.sin(angleRad);
        const cosValue = Math.cos(angleRad);
        const tanValue = Math.tan(angleRad);

        const normalizedAngle = normalizeAngle(angleDeg);
        const quadrant = Math.ceil(normalizedAngle / 90) || 1;

        let steps = `### การคำนวณฟังก์ชันตรีโกณมิติ\n\n`;
        steps += `#### 1. แปลงหน่วยมุม\n`;
        steps += `- มุมที่กำหนด: ${angleValue}${trigFunc.unit === 'degree' ? '°' : ' rad'}\n`;
        if (trigFunc.unit === 'degree') {
            steps += `- แปลงเป็นเรเดียน: ${angleValue}° × π/180 = ${angleRad.toFixed(6)} rad\n`;
        }
        steps += `- มุมปกติ (0-360°): ${normalizedAngle.toFixed(2)}°\n`;
        steps += `- อยู่ใน Quadrant ${quadrant}\n\n`;

        steps += `#### 2. คำนวณฟังก์ชันหลัก\n`;
        steps += `- sin(${angleValue}${trigFunc.unit === 'degree' ? '°' : ''}) = ${sinValue.toFixed(6)}\n`;
        steps += `- cos(${angleValue}${trigFunc.unit === 'degree' ? '°' : ''}) = ${cosValue.toFixed(6)}\n`;
        steps += `- tan(${angleValue}${trigFunc.unit === 'degree' ? '°' : ''}) = ${tanValue.toFixed(6)}\n\n`;

        steps += `#### 3. คำนวณฟังก์ชันส่วนกลับ\n`;
        steps += `- csc(${angleValue}${trigFunc.unit === 'degree' ? '°' : ''}) = 1/sin = ${(1/sinValue).toFixed(6)}\n`;
        steps += `- sec(${angleValue}${trigFunc.unit === 'degree' ? '°' : ''}) = 1/cos = ${(1/cosValue).toFixed(6)}\n`;
        steps += `- cot(${angleValue}${trigFunc.unit === 'degree' ? '°' : ''}) = 1/tan = ${(1/tanValue).toFixed(6)}\n`;

        return {
            angle: angleValue,
            unit: trigFunc.unit,
            quadrant,
            sin: sinValue,
            cos: cosValue,
            tan: tanValue,
            csc: 1/sinValue,
            sec: 1/cosValue,
            cot: 1/tanValue,
            steps
        };
    }, [trigFunc]);

    const unitCircleData = useMemo(() => {
        const angle = parseFloat(unitCircle.angle);
        if (isNaN(angle)) return null;

        const angleRad = degToRad(angle);
        const x = Math.cos(angleRad);
        const y = Math.sin(angleRad);

        const specialAngles = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330];
        
        return {
            angle,
            angleRad,
            x,
            y,
            specialAngles
        };
    }, [unitCircle]);

    const trigIdentityResult = useMemo(() => {
        const angle = parseFloat(trigIdentity.angle);
        if (isNaN(angle)) return null;

        const angleRad = degToRad(angle);
        const sin = Math.sin(angleRad);
        const cos = Math.cos(angleRad);
        const tan = Math.tan(angleRad);

        let result: any = {};
        let steps = '';

        switch (trigIdentity.identityType) {
            case 'pythagorean':
                result = {
                    sin2_cos2: Math.pow(sin, 2) + Math.pow(cos, 2),
                    tan2_1: 1 + Math.pow(tan, 2),
                    sec2: Math.pow(sec(angleRad), 2),
                    cot2_1: 1 + Math.pow(cot(angleRad), 2),
                    csc2: Math.pow(csc(angleRad), 2)
                };
                steps = `### เอกลักษณ์พีทาโกรัส\n\n`;
                steps += `#### สำหรับมุม ${angle}°:\n`;
                steps += `- sin²(${angle}°) + cos²(${angle}°) = ${Math.pow(sin, 2).toFixed(6)} + ${Math.pow(cos, 2).toFixed(6)} = ${result.sin2_cos2.toFixed(6)} ≈ 1\n`;
                steps += `- 1 + tan²(${angle}°) = 1 + ${Math.pow(tan, 2).toFixed(6)} = ${result.tan2_1.toFixed(6)} = sec²(${angle}°)\n`;
                steps += `- 1 + cot²(${angle}°) = 1 + ${Math.pow(cot(angleRad), 2).toFixed(6)} = ${result.cot2_1.toFixed(6)} = csc²(${angle}°)\n`;
                break;

            case 'double-angle':
                const sin2x = 2 * sin * cos;
                const cos2x_1 = Math.pow(cos, 2) - Math.pow(sin, 2);
                const cos2x_2 = 2 * Math.pow(cos, 2) - 1;
                const cos2x_3 = 1 - 2 * Math.pow(sin, 2);
                const tan2x = (2 * tan) / (1 - Math.pow(tan, 2));
                
                result = { sin2x, cos2x_1, cos2x_2, cos2x_3, tan2x };
                steps = `### สูตรมุมสองเท่า\n\n`;
                steps += `#### สำหรับมุม ${angle}° → ${2 * angle}°:\n`;
                steps += `- sin(2 × ${angle}°) = 2sin(${angle}°)cos(${angle}°) = 2 × ${sin.toFixed(4)} × ${cos.toFixed(4)} = ${sin2x.toFixed(6)}\n`;
                steps += `- cos(2 × ${angle}°) = cos²(${angle}°) - sin²(${angle}°) = ${cos2x_1.toFixed(6)}\n`;
                steps += `- cos(2 × ${angle}°) = 2cos²(${angle}°) - 1 = ${cos2x_2.toFixed(6)}\n`;
                steps += `- cos(2 × ${angle}°) = 1 - 2sin²(${angle}°) = ${cos2x_3.toFixed(6)}\n`;
                steps += `- tan(2 × ${angle}°) = 2tan(${angle}°) / (1 - tan²(${angle}°)) = ${tan2x.toFixed(6)}\n`;
                break;

            case 'half-angle':
                const sinHalf = Math.sqrt((1 - cos) / 2);
                const cosHalf = Math.sqrt((1 + cos) / 2);
                const tanHalf = sin / (1 + cos);
                
                result = { sinHalf, cosHalf, tanHalf };
                steps = `### สูตรมุมครึ่ง\n\n`;
                steps += `#### สำหรับมุม ${angle}° → ${angle/2}°:\n`;
                steps += `- sin(${angle/2}°) = ±√[(1 - cos(${angle}°))/2] = ±√[(1 - ${cos.toFixed(4)})/2] = ±${sinHalf.toFixed(6)}\n`;
                steps += `- cos(${angle/2}°) = ±√[(1 + cos(${angle}°))/2] = ±√[(1 + ${cos.toFixed(4)})/2] = ±${cosHalf.toFixed(6)}\n`;
                steps += `- tan(${angle/2}°) = sin(${angle}°) / (1 + cos(${angle}°)) = ${sin.toFixed(4)} / (1 + ${cos.toFixed(4)}) = ${tanHalf.toFixed(6)}\n`;
                steps += `\n*หมายเหตุ: เครื่องหมาย ± ขึ้นอยู่กับ quadrant ของมุม ${angle/2}°`;
                break;
        }

        return { ...result, steps, type: trigIdentity.identityType };
    }, [trigIdentity]);

    const inverseTrigResult = useMemo(() => {
        const value = parseFloat(inverseTrig.value);
        if (isNaN(value)) return null;

        let resultRad = 0;
        let resultDeg = 0;
        let steps = '';
        let isValid = true;

        switch (inverseTrig.function) {
            case 'arcsin':
                if (value < -1 || value > 1) {
                    isValid = false;
                    steps = '❌ ค่าของ arcsin ต้องอยู่ระหว่าง -1 ถึง 1';
                } else {
                    resultRad = Math.asin(value);
                    resultDeg = radToDeg(resultRad);
                    steps = `### การคำนวณ arcsin(${value})\n\n`;
                    steps += `- arcsin(${value}) = ${resultDeg.toFixed(4)}°\n`;
                    steps += `- arcsin(${value}) = ${resultRad.toFixed(6)} rad\n\n`;
                    steps += `#### ตรวจสอบ:\n`;
                    steps += `- sin(${resultDeg.toFixed(4)}°) = ${Math.sin(resultRad).toFixed(6)} ≈ ${value}\n`;
                    steps += `\n*ช่วงของ arcsin: [-90°, 90°] หรือ [-π/2, π/2]`;
                }
                break;

            case 'arccos':
                if (value < -1 || value > 1) {
                    isValid = false;
                    steps = '❌ ค่าของ arccos ต้องอยู่ระหว่าง -1 ถึง 1';
                } else {
                    resultRad = Math.acos(value);
                    resultDeg = radToDeg(resultRad);
                    steps = `### การคำนวณ arccos(${value})\n\n`;
                    steps += `- arccos(${value}) = ${resultDeg.toFixed(4)}°\n`;
                    steps += `- arccos(${value}) = ${resultRad.toFixed(6)} rad\n\n`;
                    steps += `#### ตรวจสอบ:\n`;
                    steps += `- cos(${resultDeg.toFixed(4)}°) = ${Math.cos(resultRad).toFixed(6)} ≈ ${value}\n`;
                    steps += `\n*ช่วงของ arccos: [0°, 180°] หรือ [0, π]`;
                }
                break;

            case 'arctan':
                resultRad = Math.atan(value);
                resultDeg = radToDeg(resultRad);
                steps = `### การคำนวณ arctan(${value})\n\n`;
                steps += `- arctan(${value}) = ${resultDeg.toFixed(4)}°\n`;
                steps += `- arctan(${value}) = ${resultRad.toFixed(6)} rad\n\n`;
                steps += `#### ตรวจสอบ:\n`;
                steps += `- tan(${resultDeg.toFixed(4)}°) = ${Math.tan(resultRad).toFixed(6)} ≈ ${value}\n`;
                steps += `\n*ช่วงของ arctan: (-90°, 90°) หรือ (-π/2, π/2)`;
                break;
        }

        return { value, resultRad, resultDeg, isValid, steps };
    }, [inverseTrig]);

    // Handler functions
    const clearPythagorean = () => setPythagorean({ a: '', b: '', c: '' });
    const clearRightTriangle = () => setRightTriangle({
        side1: '', side2: '', side3: '',
        angle1: '', angle2: '', angle3: '',
        hypotenuse: ''
    });
    const clearGeneralTriangle = () => setGeneralTriangle({
        sideA: '', sideB: '', sideC: '',
        angleA: '', angleB: '', angleC: ''
    });

    const showStepsModal = (title: string, steps: string) => {
        setModalContent({ title, steps });
        setIsModalOpen(true);
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="shadow-lg border-2 border-primary/20">
                    <CardHeader className="text-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
                        <CardTitle className="text-2xl md:text-3xl flex items-center justify-center gap-2">
                            <Calculator className="text-primary" />
                            เครื่องคำนวณตรีโกณมิติขั้นสูง
                        </CardTitle>
                        <CardDescription className="text-base">
                            คำนวณตรีโกณมิติทุกรูปแบบ พร้อมกราฟ Unit Circle และเอกลักษณ์ตรีโกณมิติ
                        </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="p-6">
                        <Tabs defaultValue="pythagorean" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 mb-6 h-auto gap-2">
                                <TabsTrigger value="pythagorean" className="text-xs sm:text-sm">
                                    พีทาโกรัส
                                </TabsTrigger>
                                <TabsTrigger value="right-triangle" className="text-xs sm:text-sm">
                                    มุมฉาก
                                </TabsTrigger>
                                <TabsTrigger value="general-triangle" className="text-xs sm:text-sm">
                                    ทั่วไป
                                </TabsTrigger>
                                <TabsTrigger value="trig-functions" className="text-xs sm:text-sm">
                                    ฟังก์ชัน
                                </TabsTrigger>
                                <TabsTrigger value="unit-circle" className="text-xs sm:text-sm">
                                    Unit Circle
                                </TabsTrigger>
                                <TabsTrigger value="identities" className="text-xs sm:text-sm">
                                    เอกลักษณ์
                                </TabsTrigger>
                                <TabsTrigger value="inverse" className="text-xs sm:text-sm">
                                    Inverse
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="pythagorean" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">ทฤษฎีพีทาโกรัส</CardTitle>
                                        <CardDescription>
                                            ใส่ค่า 2 ด้านเพื่อหาด้านที่เหลือ (a² + b² = c²)
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="pythagorean-a">ด้าน a</Label>
                                                <Input
                                                    id="pythagorean-a"
                                                    type="number"
                                                    placeholder="ใส่ความยาวด้าน a"
                                                    value={pythagorean.a}
                                                    onChange={(e) => setPythagorean(prev => ({ ...prev, a: e.target.value }))}
                                                    className="text-center"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="pythagorean-b">ด้าน b</Label>
                                                <Input
                                                    id="pythagorean-b"
                                                    type="number"
                                                    placeholder="ใส่ความยาวด้าน b"
                                                    value={pythagorean.b}
                                                    onChange={(e) => setPythagorean(prev => ({ ...prev, b: e.target.value }))}
                                                    className="text-center"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="pythagorean-c">ด้านตรง c</Label>
                                                <Input
                                                    id="pythagorean-c"
                                                    type="number"
                                                    placeholder="ใส่ความยาวด้านตรง c"
                                                    value={pythagorean.c}
                                                    onChange={(e) => setPythagorean(prev => ({ ...prev, c: e.target.value }))}
                                                    className="text-center"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-2 mb-6">
                                            <Button onClick={clearPythagorean} variant="outline" className="flex items-center gap-2">
                                                <RotateCcw size={16} />
                                                ล้างค่า
                                            </Button>
                                        </div>

                                        {pythagoreanResult && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="p-4 bg-green-50 border border-green-200 rounded-lg"
                                            >
                                                <div className="space-y-2">
                                                    <Badge variant="secondary" className="mb-2">
                                                        {pythagoreanResult.type}
                                                    </Badge>
                                                    <p className="text-lg font-semibold text-green-800">
                                                        ผลลัพธ์: {pythagoreanResult.result} หน่วย
                                                    </p>
                                                    <p className="text-sm text-green-600">
                                                        สูตร: {pythagoreanResult.formula}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="right-triangle" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">สามเหลี่ยมมุมฉาก (SOH-CAH-TOA)</CardTitle>
                                        <CardDescription>
                                            ใส่ด้านหนึ่งและมุมหนึ่งเพื่อหาด้านและมุมอื่นๆ
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                            <div className="space-y-4">
                                                <h4 className="font-semibold text-sm text-muted-foreground">ด้านของสามเหลี่ยม</h4>
                                                <div className="space-y-2">
                                                    <Label htmlFor="rt-side1">ด้านประชิดมุม (Adjacent)</Label>
                                                    <Input
                                                        id="rt-side1"
                                                        type="number"
                                                        placeholder="ใส่ความยาว"
                                                        value={rightTriangle.side1}
                                                        onChange={(e) => setRightTriangle(prev => ({ ...prev, side1: e.target.value }))}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="rt-side2">ด้านตรงข้ามมุม (Opposite)</Label>
                                                    <Input
                                                        id="rt-side2"
                                                        type="number"
                                                        placeholder="ใส่ความยาว"
                                                        value={rightTriangle.side2}
                                                        onChange={(e) => setRightTriangle(prev => ({ ...prev, side2: e.target.value }))}
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-4">
                                                <h4 className="font-semibold text-sm text-muted-foreground">มุมของสามเหลี่ยม</h4>
                                                <div className="space-y-2">
                                                    <Label htmlFor="rt-angle1">มุม (องศา)</Label>
                                                    <Input
                                                        id="rt-angle1"
                                                        type="number"
                                                        placeholder="ใส่มุมเป็นองศา"
                                                        value={rightTriangle.angle1}
                                                        onChange={(e) => setRightTriangle(prev => ({ ...prev, angle1: e.target.value }))}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mb-6">
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-blue-50 rounded-lg text-sm">
                                                <div className="text-center">
                                                    <strong>SOH:</strong> sin = ตรงข้าม/ด้านตรง
                                                </div>
                                                <div className="text-center">
                                                    <strong>CAH:</strong> cos = ประชิด/ด้านตรง
                                                </div>
                                                <div className="text-center">
                                                    <strong>TOA:</strong> tan = ตรงข้าม/ประชิด
                                                </div>
                                            </div>
                                        </div>

                                        <Button onClick={clearRightTriangle} variant="outline" className="mb-6">
                                            <RotateCcw size={16} className="mr-2" />
                                            ล้างค่า
                                        </Button>

                                        {rightTriangleResult && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4"
                                            >
                                                <Badge variant="secondary">ผลลัพธ์การคำนวณ</Badge>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <h4 className="font-semibold mb-2">ความยาวด้าน:</h4>
                                                        <ul className="space-y-1 text-sm">
                                                            <li>ด้านตรงข้าม: {rightTriangleResult.sides.opposite}</li>
                                                            <li>ด้านประชิด: {rightTriangleResult.sides.adjacent}</li>
                                                            <li>ด้านตรง: {rightTriangleResult.sides.hypotenuse}</li>
                                                        </ul>
                                                    </div>
                                                    
                                                    <div>
                                                        <h4 className="font-semibold mb-2">มุมทั้งหมด:</h4>
                                                        <ul className="space-y-1 text-sm">
                                                            <li>มุม A: {rightTriangleResult.angles.given}°</li>
                                                            <li>มุม B: {rightTriangleResult.angles.other}°</li>
                                                            <li>มุม C: {rightTriangleResult.angles.right}°</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                                
                                                <Separator />
                                                
                                                <div>
                                                    <h4 className="font-semibold mb-2">สูตรที่ใช้:</h4>
                                                    <ul className="space-y-1 text-xs">
                                                        {rightTriangleResult.formulas.map((formula, index) => (
                                                            <li key={index} className="font-mono bg-white p-2 rounded border">
                                                                {formula}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </motion.div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="general-triangle" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">สามเหลี่ยมทั่วไป (กฎไซน์/โคไซน์)</CardTitle>
                                        <CardDescription>
                                            ใช้กฎของไซน์และโคไซน์สำหรับสามเหลี่ยมทุกรูปแบบ
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                            <div className="space-y-4">
                                                <h4 className="font-semibold text-sm text-muted-foreground">ด้านของสามเหลี่ยม</h4>
                                                <div className="space-y-2">
                                                    <Label htmlFor="gt-sideA">ด้าน a</Label>
                                                    <Input
                                                        id="gt-sideA"
                                                        type="number"
                                                        placeholder="ความยาวด้าน a"
                                                        value={generalTriangle.sideA}
                                                        onChange={(e) => setGeneralTriangle(prev => ({ ...prev, sideA: e.target.value }))}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="gt-sideB">ด้าน b</Label>
                                                    <Input
                                                        id="gt-sideB"
                                                        type="number"
                                                        placeholder="ความยาวด้าน b"
                                                        value={generalTriangle.sideB}
                                                        onChange={(e) => setGeneralTriangle(prev => ({ ...prev, sideB: e.target.value }))}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="gt-sideC">ด้าน c</Label>
                                                    <Input
                                                        id="gt-sideC"
                                                        type="number"
                                                        placeholder="ความยาวด้าน c"
                                                        value={generalTriangle.sideC}
                                                        onChange={(e) => setGeneralTriangle(prev => ({ ...prev, sideC: e.target.value }))}
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-4">
                                                <h4 className="font-semibold text-sm text-muted-foreground">มุมของสามเหลี่ยม</h4>
                                                <div className="space-y-2">
                                                    <Label htmlFor="gt-angleA">มุม A (องศา)</Label>
                                                    <Input
                                                        id="gt-angleA"
                                                        type="number"
                                                        placeholder="มุม A"
                                                        value={generalTriangle.angleA}
                                                        onChange={(e) => setGeneralTriangle(prev => ({ ...prev, angleA: e.target.value }))}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="gt-angleB">มุม B (องศa)</Label>
                                                    <Input
                                                        id="gt-angleB"
                                                        type="number"
                                                        placeholder="มุม B"
                                                        value={generalTriangle.angleB}
                                                        onChange={(e) => setGeneralTriangle(prev => ({ ...prev, angleB: e.target.value }))}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="gt-angleC">มุม C (องศา)</Label>
                                                    <Input
                                                        id="gt-angleC"
                                                        type="number"
                                                        placeholder="มุม C"
                                                        value={generalTriangle.angleC}
                                                        onChange={(e) => setGeneralTriangle(prev => ({ ...prev, angleC: e.target.value }))}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mb-6">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-purple-50 rounded-lg text-sm">
                                                <div className="text-center">
                                                    <strong>กฎของไซน์:</strong> a/sin(A) = b/sin(B) = c/sin(C)
                                                </div>
                                                <div className="text-center">
                                                    <strong>กฎของโคไซน์:</strong> c² = a² + b² - 2ab cos(C)
                                                </div>
                                            </div>
                                        </div>

                                        <Button onClick={clearGeneralTriangle} variant="outline" className="mb-6">
                                            <RotateCcw size={16} className="mr-2" />
                                            ล้างค่า
                                        </Button>

                                        {generalTriangleResult && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-4"
                                            >
                                                <div className="flex items-center gap-2 mb-4">
                                                    <Badge variant="secondary">{generalTriangleResult.method}</Badge>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-3">
                                                        <div>
                                                            <h4 className="font-semibold mb-2">ความยาวด้าน:</h4>
                                                            <ul className="space-y-1 text-sm">
                                                                <li>ด้าน a: {generalTriangleResult.sides.a.toFixed(4)}</li>
                                                                <li>ด้าน b: {generalTriangleResult.sides.b.toFixed(4)}</li>
                                                                <li>ด้าน c: {generalTriangleResult.sides.c.toFixed(4)}</li>
                                                            </ul>
                                                        </div>
                                                        
                                                        <div>
                                                            <h4 className="font-semibold mb-2">มุมทั้งหมด:</h4>
                                                            <ul className="space-y-1 text-sm">
                                                                <li>มุม A: {generalTriangleResult.angles.A.toFixed(2)}°</li>
                                                                <li>มุม B: {generalTriangleResult.angles.B.toFixed(2)}°</li>
                                                                <li>มุม C: {generalTriangleResult.angles.C.toFixed(2)}°</li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="space-y-3">
                                                        <div>
                                                            <h4 className="font-semibold mb-2">คุณสมบัติเพิ่มเติม:</h4>
                                                            <ul className="space-y-1 text-sm">
                                                                <li>พื้นที่: {generalTriangleResult.area.toFixed(4)} ตร.หน่วย</li>
                                                                <li>เส้นรอบรูป: {generalTriangleResult.perimeter.toFixed(4)} หน่วย</li>
                                                            </ul>
                                                        </div>
                                                        
                                                        <div>
                                                            <h4 className="font-semibold mb-2">สูตรที่ใช้:</h4>
                                                            <p className="text-xs font-mono bg-white p-2 rounded border">
                                                                {generalTriangleResult.formula}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="trig-functions" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">คำนวณฟังก์ชันตรีโกณมิติ</CardTitle>
                                        <CardDescription>
                                            คำนวณค่า sin, cos, tan, csc, sec, cot จากมุมที่กำหนด
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="trig-angle">มุม</Label>
                                                <Input
                                                    id="trig-angle"
                                                    type="number"
                                                    placeholder="ใส่มุม"
                                                    value={trigFunc.angle}
                                                    onChange={(e) => setTrigFunc(prev => ({ ...prev, angle: e.target.value }))}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="trig-unit">หน่วย</Label>
                                                <Select 
                                                    value={trigFunc.unit} 
                                                    onValueChange={(value: 'degree' | 'radian') => setTrigFunc(prev => ({ ...prev, unit: value }))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="degree">องศา (Degree)</SelectItem>
                                                        <SelectItem value="radian">เรเดียน (Radian)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {trigFuncResult && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="space-y-4"
                                            >
                                                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <h4 className="font-semibold text-lg">ผลลัพธ์:</h4>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            onClick={() => showStepsModal('การคำนวณฟังก์ชันตรีโกณมิติ', trigFuncResult.steps)}
                                                        >
                                                            <HelpCircle className="mr-2 h-4 w-4"/>ดูวิธีทำ
                                                        </Button>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <h5 className="font-medium mb-2 text-sm text-muted-foreground">ฟังก์ชันหลัก</h5>
                                                            <div className="space-y-2 p-3 bg-white rounded-lg">
                                                                <div className="flex justify-between">
                                                                    <span>sin({trigFuncResult.angle}{trigFuncResult.unit === 'degree' ? '°' : ''})</span>
                                                                    <span className="font-mono font-bold">{trigFuncResult.sin.toFixed(6)}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span>cos({trigFuncResult.angle}{trigFuncResult.unit === 'degree' ? '°' : ''})</span>
                                                                    <span className="font-mono font-bold">{trigFuncResult.cos.toFixed(6)}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span>tan({trigFuncResult.angle}{trigFuncResult.unit === 'degree' ? '°' : ''})</span>
                                                                    <span className="font-mono font-bold">{trigFuncResult.tan.toFixed(6)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div>
                                                            <h5 className="font-medium mb-2 text-sm text-muted-foreground">ฟังก์ชันส่วนกลับ</h5>
                                                            <div className="space-y-2 p-3 bg-white rounded-lg">
                                                                <div className="flex justify-between">
                                                                    <span>csc({trigFuncResult.angle}{trigFuncResult.unit === 'degree' ? '°' : ''})</span>
                                                                    <span className="font-mono font-bold">{trigFuncResult.csc.toFixed(6)}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span>sec({trigFuncResult.angle}{trigFuncResult.unit === 'degree' ? '°' : ''})</span>
                                                                    <span className="font-mono font-bold">{trigFuncResult.sec.toFixed(6)}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span>cot({trigFuncResult.angle}{trigFuncResult.unit === 'degree' ? '°' : ''})</span>
                                                                    <span className="font-mono font-bold">{trigFuncResult.cot.toFixed(6)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="mt-4 p-3 bg-indigo-100 rounded">
                                                        <p className="text-sm">
                                                            <span className="font-medium">Quadrant:</span> {trigFuncResult.quadrant} 
                                                            <span className="ml-4 font-medium">มุมปกติ:</span> {normalizeAngle(parseFloat(trigFunc.angle)).toFixed(2)}°
                                                        </p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="unit-circle" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Unit Circle - วงกลมหนึ่งหน่วย</CardTitle>
                                        <CardDescription>
                                            แสดงค่า sin และ cos บนวงกลมหนึ่งหน่วย พร้อมมุมพิเศษ
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="unit-angle">มุม (องศา)</Label>
                                                    <Input
                                                        id="unit-angle"
                                                        type="number"
                                                        placeholder="ใส่มุมเป็นองศา"
                                                        value={unitCircle.angle}
                                                        onChange={(e) => setUnitCircle(prev => ({ ...prev, angle: e.target.value }))}
                                                    />
                                                </div>
                                                
                                                {unitCircleData && (
                                                    <div className="space-y-3">
                                                        <div className="p-4 bg-cyan-50 rounded-lg">
                                                            <h5 className="font-semibold mb-2">พิกัดบน Unit Circle:</h5>
                                                            <div className="space-y-1 text-sm">
                                                                <p>x = cos({unitCircleData.angle}°) = {unitCircleData.x.toFixed(6)}</p>
                                                                <p>y = sin({unitCircleData.angle}°) = {unitCircleData.y.toFixed(6)}</p>
                                                                <p>r = 1 (รัศมี)</p>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="p-4 bg-purple-50 rounded-lg">
                                                            <h5 className="font-semibold mb-2">ข้อมูลเพิ่มเติม:</h5>
                                                            <div className="space-y-1 text-sm">
                                                                <p>มุม (เรเดียน): {unitCircleData.angleRad.toFixed(6)} rad</p>
                                                                <p>tan({unitCircleData.angle}°) = {(unitCircleData.y / unitCircleData.x).toFixed(6)}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="flex items-center justify-center">
                                                {unitCircleData && (
                                                    <svg viewBox="-1.5 -1.5 3 3" className="w-full max-w-md">
                                                        <g stroke="currentColor" strokeWidth="0.01" opacity="0.2">
                                                            <line x1="-1.5" y1="0" x2="1.5" y2="0" />
                                                            <line x1="0" y1="-1.5" x2="0" y2="1.5" />
                                                        </g>
                                                        
                                                        <circle cx="0" cy="0" r="1" fill="none" stroke="currentColor" strokeWidth="0.02" />
                                                        
                                                        {unitCircle.showSpecialAngles && unitCircleData.specialAngles.map(angle => {
                                                            const rad = degToRad(angle);
                                                            const x = Math.cos(rad);
                                                            const y = Math.sin(rad);
                                                            return (
                                                                <g key={angle}>
                                                                    <circle cx={x} cy={-y} r="0.03" fill="currentColor" opacity="0.3" />
                                                                    <text x={x * 1.15} y={-y * 1.15} fontSize="0.08" textAnchor="middle" dominantBaseline="middle">
                                                                        {angle}°
                                                                    </text>
                                                                </g>
                                                            );
                                                        })}
                                                        
                                                        <g>
                                                            <line x1="0" y1="0" x2={unitCircleData.x} y2={-unitCircleData.y} stroke="blue" strokeWidth="0.02" />
                                                            <circle cx={unitCircleData.x} cy={-unitCircleData.y} r="0.05" fill="blue" />
                                                            
                                                            <line x1={unitCircleData.x} y1="0" x2={unitCircleData.x} y2={-unitCircleData.y} stroke="red" strokeWidth="0.015" strokeDasharray="0.02" />
                                                            <line x1="0" y1={-unitCircleData.y} x2={unitCircleData.x} y2={-unitCircleData.y} stroke="green" strokeWidth="0.015" strokeDasharray="0.02" />
                                                            
                                                            <text x={unitCircleData.x / 2} y="0.1" fontSize="0.08" fill="green" textAnchor="middle">cos</text>
                                                            <text x="-0.1" y={-unitCircleData.y / 2} fontSize="0.08" fill="red" textAnchor="middle">sin</text>
                                                        </g>
                                                        
                                                        <text x="1.3" y="0.05" fontSize="0.08" textAnchor="middle">x</text>
                                                        <text x="0.05" y="-1.3" fontSize="0.08" textAnchor="middle">y</text>
                                                    </svg>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="identities" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">เอกลักษณ์ตรีโกณมิติ</CardTitle>
                                        <CardDescription>
                                            ตรวจสอบและคำนวณเอกลักษณ์ตรีโกณมิติต่างๆ
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="identity-angle">มุม (องศา)</Label>
                                                <Input
                                                    id="identity-angle"
                                                    type="number"
                                                    placeholder="ใส่มุมเป็นองศา"
                                                    value={trigIdentity.angle}
                                                    onChange={(e) => setTrigIdentity(prev => ({ ...prev, angle: e.target.value }))}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="identity-type">ประเภทเอกลักษณ์</Label>
                                                <Select 
                                                    value={trigIdentity.identityType} 
                                                    onValueChange={(value: any) => setTrigIdentity(prev => ({ ...prev, identityType: value }))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="pythagorean">เอกลักษณ์พีทาโกรัส</SelectItem>
                                                        <SelectItem value="double-angle">สูตรมุมสองเท่า</SelectItem>
                                                        <SelectItem value="half-angle">สูตรมุมครึ่ง</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {trigIdentityResult && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="p-4 bg-amber-50 border border-amber-200 rounded-lg"
                                            >
                                                <div className="flex justify-between items-center mb-3">
                                                    <h4 className="font-semibold text-lg">ผลลัพธ์:</h4>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        onClick={() => showStepsModal('เอกลักษณ์ตรีโกณมิติ', trigIdentityResult.steps)}
                                                    >
                                                        <HelpCircle className="mr-2 h-4 w-4"/>ดูวิธีทำ
                                                    </Button>
                                                </div>
                                                
                                                <div className="space-y-3">
                                                    {trigIdentityResult.type === 'pythagorean' && (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            <div className="p-3 bg-white rounded border">
                                                                <p className="text-sm font-medium mb-1">sin² + cos² = 1</p>
                                                                <p className="font-mono">{trigIdentityResult.sin2_cos2.toFixed(6)} ≈ 1</p>
                                                            </div>
                                                            <div className="p-3 bg-white rounded border">
                                                                <p className="text-sm font-medium mb-1">1 + tan² = sec²</p>
                                                                <p className="font-mono">{trigIdentityResult.tan2_1.toFixed(6)} = {trigIdentityResult.sec2.toFixed(6)}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {trigIdentityResult.type === 'double-angle' && (
                                                        <div className="space-y-2">
                                                            <div className="p-3 bg-white rounded border">
                                                                <p className="text-sm font-medium">sin(2θ) = {trigIdentityResult.sin2x.toFixed(6)}</p>
                                                            </div>
                                                            <div className="p-3 bg-white rounded border">
                                                                <p className="text-sm font-medium">cos(2θ) = {trigIdentityResult.cos2x_1.toFixed(6)}</p>
                                                            </div>
                                                            <div className="p-3 bg-white rounded border">
                                                                <p className="text-sm font-medium">tan(2θ) = {trigIdentityResult.tan2x.toFixed(6)}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {trigIdentityResult.type === 'half-angle' && (
                                                        <div className="space-y-2">
                                                            <div className="p-3 bg-white rounded border">
                                                                <p className="text-sm font-medium">sin(θ/2) = ±{trigIdentityResult.sinHalf.toFixed(6)}</p>
                                                            </div>
                                                            <div className="p-3 bg-white rounded border">
                                                                <p className="text-sm font-medium">cos(θ/2) = ±{trigIdentityResult.cosHalf.toFixed(6)}</p>
                                                            </div>
                                                            <div className="p-3 bg-white rounded border">
                                                                <p className="text-sm font-medium">tan(θ/2) = {trigIdentityResult.tanHalf.toFixed(6)}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="inverse" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">ฟังก์ชันตรีโกณมิติผกผัน</CardTitle>
                                        <CardDescription>
                                            คำนวณค่า arcsin, arccos, arctan จากค่าที่กำหนด
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="inverse-value">ค่าอินพุต</Label>
                                                <Input
                                                    id="inverse-value"
                                                    type="number"
                                                    step="0.1"
                                                    placeholder="ใส่ค่า (-1 ถึง 1 สำหรับ arcsin, arccos)"
                                                    value={inverseTrig.value}
                                                    onChange={(e) => setInverseTrig(prev => ({ ...prev, value: e.target.value }))}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="inverse-function">ฟังก์ชันผกผัน</Label>
                                                <Select 
                                                    value={inverseTrig.function} 
                                                    onValueChange={(value: any) => setInverseTrig(prev => ({ ...prev, function: value }))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="arcsin">arcsin (sin⁻¹)</SelectItem>
                                                        <SelectItem value="arccos">arccos (cos⁻¹)</SelectItem>
                                                        <SelectItem value="arctan">arctan (tan⁻¹)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {inverseTrigResult && inverseTrigResult.isValid && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="p-4 bg-teal-50 border border-teal-200 rounded-lg"
                                            >
                                                <div className="flex justify-between items-center mb-3">
                                                    <h4 className="font-semibold text-lg">ผลลัพธ์:</h4>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        onClick={() => showStepsModal('ฟังก์ชันตรีโกณมิติผกผัน', inverseTrigResult.steps)}
                                                    >
                                                        <HelpCircle className="mr-2 h-4 w-4"/>ดูวิธีทำ
                                                    </Button>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="p-4 bg-white rounded border">
                                                        <p className="text-sm text-muted-foreground mb-1">ผลลัพธ์ (องศา)</p>
                                                        <p className="text-2xl font-bold text-teal-600">{inverseTrigResult.resultDeg.toFixed(4)}°</p>
                                                    </div>
                                                    <div className="p-4 bg-white rounded border">
                                                        <p className="text-sm text-muted-foreground mb-1">ผลลัพธ์ (เรเดียน)</p>
                                                        <p className="text-2xl font-bold text-teal-600">{inverseTrigResult.resultRad.toFixed(6)} rad</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="mt-4 p-3 bg-teal-100 rounded">
                                                    <p className="text-sm">
                                                        <span className="font-medium">ตรวจสอบ:</span> {inverseTrig.function === 'arcsin' ? 'sin' : inverseTrig.function === 'arccos' ? 'cos' : 'tan'}({inverseTrigResult.resultDeg.toFixed(4)}°) = {inverseTrigResult.value}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                        
                                        {inverseTrigResult && !inverseTrigResult.isValid && (
                                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                                <p className="text-red-600">{inverseTrigResult.steps}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </motion.div>
            
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <BookOpen className="text-primary" />
                            คู่มืออ้างอิงด่วน - ตรีโกณมิติขั้นสูง
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            <div className="space-y-2">
                                <h4 className="font-semibold">มุมพิเศษบน Unit Circle</h4>
                                <div className="space-y-1">
                                    <p className="font-mono bg-white p-1 rounded text-xs">0°: (1, 0)</p>
                                    <p className="font-mono bg-white p-1 rounded text-xs">30°: (√3/2, 1/2)</p>
                                    <p className="font-mono bg-white p-1 rounded text-xs">45°: (√2/2, √2/2)</p>
                                    <p className="font-mono bg-white p-1 rounded text-xs">60°: (1/2, √3/2)</p>
                                    <p className="font-mono bg-white p-1 rounded text-xs">90°: (0, 1)</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-semibold">เอกลักษณ์พื้นฐาน</h4>
                                <div className="space-y-1">
                                    <p className="font-mono bg-white p-1 rounded text-xs">sin²θ + cos²θ = 1</p>
                                    <p className="font-mono bg-white p-1 rounded text-xs">1 + tan²θ = sec²θ</p>
                                    <p className="font-mono bg-white p-1 rounded text-xs">1 + cot²θ = csc²θ</p>
                                    <p className="font-mono bg-white p-1 rounded text-xs">tan θ = sin θ/cos θ</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-semibold">สูตรมุมสองเท่า</h4>
                                <div className="space-y-1">
                                    <p className="font-mono bg-white p-1 rounded text-xs">sin(2θ) = 2sin θ cos θ</p>
                                    <p className="font-mono bg-white p-1 rounded text-xs">cos(2θ) = cos²θ - sin²θ</p>
                                    <p className="font-mono bg-white p-1 rounded text-xs">cos(2θ) = 2cos²θ - 1</p>
                                    <p className="font-mono bg-white p-1 rounded text-xs">cos(2θ) = 1 - 2sin²θ</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-semibold">ฟังก์ชันผกผัน</h4>
                                <div className="space-y-1">
                                    <p className="font-mono bg-white p-1 rounded text-xs">arcsin: [-1,1] → [-π/2,π/2]</p>
                                    <p className="font-mono bg-white p-1 rounded text-xs">arccos: [-1,1] → [0,π]</p>
                                    <p className="font-mono bg-white p-1 rounded text-xs">arctan: ℝ → (-π/2,π/2)</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{modalContent.title}</DialogTitle>
                        <DialogDescription>ขั้นตอนการคำนวณอย่างละเอียด</DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                        <div dangerouslySetInnerHTML={{ 
                            __html: modalContent.steps
                                .replace(/\$([^$]+)\$/g, '<span class="font-mono bg-blue-100 dark:bg-blue-900 px-1 rounded">$1</span>')
                                .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                                .replace(/### ([^\n]+)/g, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
                                .replace(/#### ([^\n]+)/g, '<h4 class="text-md font-semibold mt-3 mb-1">$1</h4>')
                                .replace(/\n/g, '<br/>') 
                        }} />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default TrigonometryCalculator;