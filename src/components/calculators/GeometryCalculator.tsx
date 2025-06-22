import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Calculator, Info, BookOpen, X, ChevronRight } from 'lucide-react';

type Shape = 'cone' | 'cylinder' | 'sphere' | 'cube' | 'pyramid';

// Modal Component
const CalculationStepsModal = ({ isOpen, onClose, title, steps }: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  steps: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700">
          <div className="flex items-center space-x-3">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold">{title}</h2>
              <p className="text-sm text-muted-foreground">สูตรและขั้นตอนการคำนวณแบบละเอียด</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          <div 
            className="prose prose-slate dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ 
              __html: steps.replace(/\$\$(.*?)\$\$/g, '<span class="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-800 dark:text-blue-200 font-mono text-sm">$1</span>')
                          .replace(/\$(.*?)\$/g, '<span class="inline-block px-1 bg-slate-100 dark:bg-slate-800 rounded font-mono text-sm">$1</span>')
                          .replace(/\*\*(.*?)\*\*/g, '<strong class="text-blue-600 dark:text-blue-400">$1</strong>')
                          .replace(/###\s*(.*)/g, '<h3 class="text-lg font-bold mt-6 mb-3 text-slate-800 dark:text-slate-200 flex items-center"><span class="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs mr-2">$1</span></h3>')
                          .replace(/\n/g, '<br>')
            }}
          />
        </div>
      </motion.div>
    </div>
  );
};

// Enhanced SVG Components with better visual feedback
const ConeSVG = ({ r, h }: { r?: number; h?: number }) => (
  <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-sm">
    <defs>
      <linearGradient id="coneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" className="stop-blue-200" />
        <stop offset="100%" className="stop-blue-400" />
      </linearGradient>
    </defs>
    <polygon points="60,10 20,100 100,100" fill="url(#coneGrad)" className="stroke-blue-600" strokeWidth="2"/>
    <ellipse cx="60" cy="100" rx="40" ry="8" className="fill-blue-300 stroke-blue-600" strokeWidth="1"/>
    <line x1="20" y1="100" x2="100" y2="100" className="stroke-slate-400" strokeDasharray="3,2"/>
    <text x="58" y="95" textAnchor="middle" className="text-xs fill-slate-600 font-semibold">{r ? `r=${r}` : 'r'}</text>
    <line x1="60" y1="10" x2="60" y2="100" className="stroke-slate-400" strokeDasharray="3,2"/>
    <text x="65" y="55" className="text-xs fill-slate-600 font-semibold">{h ? `h=${h}` : 'h'}</text>
  </svg>
);

const CylinderSVG = ({ r, h }: { r?: number; h?: number }) => (
  <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-sm">
    <defs>
      <linearGradient id="cylGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" className="stop-green-200" />
        <stop offset="100%" className="stop-green-400" />
      </linearGradient>
    </defs>
    <ellipse cx="60" cy="20" rx="35" ry="8" className="fill-green-300 stroke-green-600" strokeWidth="2"/>
    <rect x="25" y="20" width="70" height="70" fill="url(#cylGrad)" className="stroke-green-600" strokeWidth="2"/>
    <ellipse cx="60" cy="90" rx="35" ry="8" className="fill-green-400 stroke-green-600" strokeWidth="2"/>
    <line x1="60" y1="20" x2="60" y2="90" className="stroke-slate-400" strokeDasharray="3,2"/>
    <text x="65" y="55" className="text-xs fill-slate-600 font-semibold">{h ? `h=${h}` : 'h'}</text>
    <line x1="60" y1="90" x2="95" y2="90" className="stroke-slate-400" strokeDasharray="3,2"/>
    <text x="77" y="94" className="text-xs fill-slate-600 font-semibold">{r ? `r=${r}` : 'r'}</text>
  </svg>
);

const SphereSVG = ({ r }: { r?: number }) => (
  <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-sm">
    <defs>
      <radialGradient id="sphereGrad" cx="40%" cy="40%">
        <stop offset="0%" className="stop-purple-200" />
        <stop offset="100%" className="stop-purple-500" />
      </radialGradient>
    </defs>
    <circle cx="60" cy="60" r="40" fill="url(#sphereGrad)" className="stroke-purple-600" strokeWidth="2"/>
    <ellipse cx="60" cy="60" rx="40" ry="12" className="fill-none stroke-purple-400" strokeWidth="1" strokeDasharray="4,2"/>
    <ellipse cx="60" cy="60" rx="12" ry="40" className="fill-none stroke-purple-400" strokeWidth="1" strokeDasharray="4,2"/>
    <line x1="60" y1="60" x2="100" y2="60" className="stroke-slate-400" strokeDasharray="3,2"/>
    <text x="80" y="58" className="text-xs fill-slate-600 font-semibold">{r ? `r=${r}` : 'r'}</text>
  </svg>
);

const CubeSVG = ({ s }: { s?: number }) => (
  <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-sm">
    <defs>
      <linearGradient id="cubeGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" className="stop-orange-200" />
        <stop offset="100%" className="stop-orange-400" />
      </linearGradient>
      <linearGradient id="cubeGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" className="stop-orange-300" />
        <stop offset="100%" className="stop-orange-500" />
      </linearGradient>
    </defs>
    <path d="M25 45 L 70 45 L 70 90 L 25 90 Z" fill="url(#cubeGrad1)" className="stroke-orange-600" strokeWidth="2"/>
    <path d="M25 45 L 40 30 L 85 30 L 70 45 Z" fill="url(#cubeGrad2)" className="stroke-orange-600" strokeWidth="2" />
    <path d="M70 45 L 85 30 L 85 75 L 70 90 Z" fill="url(#cubeGrad2)" className="stroke-orange-600" strokeWidth="2" />
    <text x="47" y="105" textAnchor="middle" className="text-xs fill-slate-600 font-semibold">{s ? `s=${s}` : 's'}</text>
  </svg>
);

const PyramidSVG = ({ s, h }: { s?: number; h?: number }) => (
  <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-sm">
    <defs>
      <linearGradient id="pyramidGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" className="stop-red-200" />
        <stop offset="100%" className="stop-red-500" />
      </linearGradient>
    </defs>
    <path d="M25 100 L 95 100 L 60 15 Z" fill="url(#pyramidGrad)" className="stroke-red-600" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M25 100 L 60 80 L 95 100" className="fill-none stroke-red-400" strokeWidth="1"/>
    <path d="M60 80 L 60 15" className="fill-none stroke-red-400" strokeWidth="1"/>
    <line x1="60" y1="15" x2="60" y2="100" className="stroke-slate-400" strokeDasharray="3,2"/>
    <text x="65" y="57" className="text-xs fill-slate-600 font-semibold">{h ? `h=${h}` : 'h'}</text>
    <text x="60" y="110" textAnchor="middle" className="text-xs fill-slate-600 font-semibold">{s ? `s=${s}` : 's'}</text>
  </svg>
);

const shapeConfig: Record<Shape, any> = {
  cone: { 
    name: 'ทรงกรวย (Cone)', 
    inputs: ['r', 'h'], 
    svg: ConeSVG, 
    example: {r: '7', h: '15', s: ''},
    description: 'รูปทรงที่มีฐานเป็นวงกลมและยอดแหลม',
    color: 'blue'
  },
  cylinder: { 
    name: 'ทรงกระบอก (Cylinder)', 
    inputs: ['r', 'h'], 
    svg: CylinderSVG, 
    example: {r: '5', h: '10', s: ''},
    description: 'รูปทรงที่มีฐานและด้านบนเป็นวงกลมเท่ากัน',
    color: 'green'
  },
  sphere: { 
    name: 'ทรงกลม (Sphere)', 
    inputs: ['r'], 
    svg: SphereSVG, 
    example: {r: '9', h: '', s: ''},
    description: 'รูปทรงกลมสมบูรณ์ที่ทุกจุดห่างจากจุดศูนย์กลางเท่ากัน',
    color: 'purple'
  },
  cube: { 
    name: 'ลูกบาศก์ (Cube)', 
    inputs: ['s'], 
    svg: CubeSVG, 
    example: {r: '', h: '', s: '8'},
    description: 'รูปทรงที่มี 6 หน้าเป็นสี่เหลี่ยมจัตุรัสเท่ากันทั้งหมด',
    color: 'orange'
  },
  pyramid: { 
    name: 'พีระมิดฐานสี่เหลี่ยม', 
    inputs: ['s', 'h'], 
    svg: PyramidSVG, 
    example: {r: '', h: '8', s: '12'},
    description: 'รูปทรงที่มีฐานเป็นสี่เหลี่ยมจัตุรัสและ 4 หน้าเป็นสามเหลี่ยม',
    color: 'red'
  },
};

const GeometryCalculator = () => {
  const [shape, setShape] = useState<Shape>('cone');
  const [values, setValues] = useState(shapeConfig.cone.example);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (/^\d*\.?\d*$/.test(value)) {
      setValues(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleShapeChange = (val: Shape) => {
    setShape(val);
    setValues(shapeConfig[val].example);
  };
  
  const { result, steps } = useMemo(() => {
    const r = parseFloat(values.r);
    const h = parseFloat(values.h);
    const s = parseFloat(values.s);
    let calcResult: any = { volume: 0, surfaceArea: 0, lateralSurfaceArea: 0 };
    let calcSteps = '';

    try {
      switch (shape) {
        case 'cone':
          if (r > 0 && h > 0) {
            const l = Math.sqrt(r*r + h*h);
            calcResult.volume = (1/3) * Math.PI * r*r * h;
            calcResult.lateralSurfaceArea = Math.PI * r * l;
            calcResult.surfaceArea = Math.PI * r * (r + l);
            calcSteps = `
              ### 1 การคำนวณปริมาตรทรงกรวย
              
              🎯 **สูตรที่ใช้:** $$V = \\frac{1}{3}\\pi r^2 h$$
              
              **อธิบายสูตร:** ปริมาตรของทรงกรวยจะเท่ากับ 1/3 ของปริมาตรทรงกระบอกที่มีรัศมีและความสูงเท่ากัน
              
              **แทนค่า:**
              - รัศมี (r) = ${r} หน่วย
              - ความสูง (h) = ${h} หน่วย
              
              **ขั้นตอนการคำนวณ:**
              1. คำนวณ $r^2$: ${r}² = ${r*r}
              2. คำนวณ $\\pi r^2 h$: π × ${r*r} × ${h} = π × ${r*r * h} = ${(Math.PI * r*r * h).toFixed(2)}
              3. หาร 3: ${(Math.PI * r*r * h).toFixed(2)} ÷ 3 = **${calcResult.volume.toFixed(2)}**
              
              ### 2 การคำนวณพื้นที่ผิวข้างทรงกรวย
              
              🎯 **สูตรที่ใช้:** $A_{lateral} = \\pi r l$
              
              **อธิบายสูตร:** พื้นที่ผิวข้าง = พื้นที่ด้านโค้งของกรวย (ไม่รวมฐาน)
              
              **ขั้นตอนการคำนวณพื้นที่ผิวข้าง:**
              - คำนวณ $\\pi r l$: π × ${r} × ${l.toFixed(2)} = **${calcResult.lateralSurfaceArea.toFixed(2)}**
              
              ### 3 การคำนวณพื้นที่ผิวทั้งหมดทรงกรวย
              
              🎯 **สูตรที่ใช้:** $A_{total} = \\pi r(r + l)$
              
              **อธิบายสูตร:** พื้นที่ผิวทั้งหมด = พื้นที่ฐาน + พื้นที่ด้านข้าง
              
              **ขั้นตอนการหาความยาวเส้นรอบรูป (l):**
              - สูตร: $l = \\sqrt{r^2 + h^2}$ (ทฤษฎีบทพีทาโกรัส)
              - $l = \\sqrt{${r}^2 + ${h}^2} = \\sqrt{${r*r} + ${h*h}} = \\sqrt{${r*r + h*h}} = ${l.toFixed(2)}$
              
              **ขั้นตอนการคำนวณพื้นที่ผิวทั้งหมด:**
              1. พื้นที่ฐาน $\\pi r^2$: π × ${r}² = ${(Math.PI * r*r).toFixed(2)}
              2. พื้นที่ผิวข้าง $\\pi r l$: ${calcResult.lateralSurfaceArea.toFixed(2)}
              3. รวมทั้งหมด: ${(Math.PI * r*r).toFixed(2)} + ${calcResult.lateralSurfaceArea.toFixed(2)} = **${calcResult.surfaceArea.toFixed(2)}**
            `;
          } else {
            calcSteps = '❌ กรุณากรอกค่ารัศมี (r) และความสูง (h) ที่มากกว่า 0';
          }
          break;
          
        case 'cylinder':
          if (r > 0 && h > 0) {
            calcResult.volume = Math.PI * r*r * h;
            calcResult.lateralSurfaceArea = 2 * Math.PI * r * h;
            calcResult.surfaceArea = 2 * Math.PI * r * (h + r);
            calcSteps = `
              ### 1 การคำนวณปริมาตรทรงกระบอก
              
              🎯 **สูตรที่ใช้:** $$V = \\pi r^2 h$$
              
              **อธิบายสูตร:** ปริมาตร = พื้นที่ฐาน × ความสูง โดยฐานเป็นวงกลม
              
              **แทนค่า:**
              - รัศมี (r) = ${r} หน่วย
              - ความสูง (h) = ${h} หน่วย
              
              **ขั้นตอนการคำนวณ:**
              1. คำนวณพื้นที่ฐาน $\\pi r^2$: π × ${r}² = π × ${r*r} = ${(Math.PI * r*r).toFixed(2)}
              2. คูณด้วยความสูง: ${(Math.PI * r*r).toFixed(2)} × ${h} = **${calcResult.volume.toFixed(2)}**
              
              ### 2 การคำนวณพื้นที่ผิวข้างทรงกระบอก
              
              🎯 **สูตรที่ใช้:** $A_{lateral} = 2\\pi r h$
              
              **อธิบายสูตร:** พื้นที่ผิวข้าง = พื้นที่ด้านโค้งของกระบอก (ไม่รวมฐานทั้ง 2 หน้า)
              
              **ขั้นตอนการคำนวณพื้นที่ผิวข้าง:**
              - คำนวณ $2\\pi r h$: 2 × π × ${r} × ${h} = **${calcResult.lateralSurfaceArea.toFixed(2)}**
              
              ### 3 การคำนวณพื้นที่ผิวทั้งหมดทรงกระบอก
              
              🎯 **สูตรที่ใช้:** $$A = 2\\pi r h + 2\\pi r^2$$
              
              **อธิบายสูตร:** พื้นที่ผิว = พื้นที่ด้านข้าง + พื้นที่ฐาน 2 หน้า
              
              **ขั้นตอนการคำนวณ:**
              1. พื้นที่ด้านข้าง $2\\pi r h$: 2 × π × ${r} × ${h} = ${(2 * Math.PI * r * h).toFixed(4)}
              2. พื้นที่ฐาน 2 หน้า $2\\pi r^2$: 2 × π × ${r}² = ${(2 * Math.PI * r*r).toFixed(4)}
              3. รวมทั้งหมด: ${(2 * Math.PI * r * h).toFixed(4)} + ${(2 * Math.PI * r*r).toFixed(4)} = **${calcResult.surfaceArea.toFixed(4)}**
            `;
          } else {
            calcSteps = '❌ กรุณากรอกค่ารัศมี (r) และความสูง (h) ที่มากกว่า 0';
          }
          break;
          
        case 'sphere':
          if (r > 0) {
            calcResult.volume = (4/3) * Math.PI * Math.pow(r, 3);
            calcResult.lateralSurfaceArea = calcResult.surfaceArea = 4 * Math.PI * r*r; // ทรงกลมไม่มีพื้นที่ผิวข้างแยก
            calcSteps = `
              ### 1 การคำนวณปริมาตรทรงกลม
              
              🎯 **สูตรที่ใช้:** $$V = \\frac{4}{3}\\pi r^3$$
              
              **อธิบายสูตร:** สูตรนี้มาจากการหมุนครึ่งวงกลมรอบเส้นผ่านศูนย์กลาง
              
              **แทนค่า:**
              - รัศมี (r) = ${r} หน่วย
              
              **ขั้นตอนการคำนวณ:**
              1. คำนวณ $r^3$: ${r}³ = ${Math.pow(r, 3)}
              2. คำนวณ $\\frac{4}{3}\\pi r^3$: $\\frac{4}{3}$ × π × ${Math.pow(r, 3)} = **${calcResult.volume.toFixed(2)}**
              
              ### 2 การคำนวณพื้นที่ผิวทรงกลม
              
              🎯 **สูตรที่ใช้:** $A = 4\\pi r^2$
              
              **อธิบายสูตร:** พื้นที่ผิวทรงกลมเท่ากับ 4 เท่าของพื้นที่วงกลมใหญ่
              
              **หมายเหตุ:** ทรงกลมไม่มีการแบ่งพื้นที่ผิวข้างและพื้นที่ฐาน เพราะเป็นผิวโค้งต่อเนื่อง
              
              **ขั้นตอนการคำนวณ:**
              1. คำนวณ $r^2$: ${r}² = ${r*r}
              2. คำนวณ $4\\pi r^2$: 4 × π × ${r*r} = **${calcResult.surfaceArea.toFixed(2)}**
            `;
          } else {
            calcSteps = '❌ กรุณากรอกค่ารัศมี (r) ที่มากกว่า 0';
          }
          break;
          
        case 'cube':
          if (s > 0) {
            calcResult.volume = Math.pow(s, 3);
            calcResult.lateralSurfaceArea = 4 * s * s; // 4 หน้าข้าง
            calcResult.surfaceArea = 6 * s * s;
            calcSteps = `
              ### 1 การคำนวณปริมาตรลูกบาศก์
              
              🎯 **สูตรที่ใช้:** $$V = s^3$$
              
              **อธิบายสูตร:** ปริมาตร = ความยาว × ความกว้าง × ความสูง (ซึ่งมีค่าเท่ากันทั้งหมด)
              
              **แทนค่า:**
              - ความยาวด้าน (s) = ${s} หน่วย
              
              **ขั้นตอนการคำนวณ:**
              - $V = s^3 = ${s}^3 = **${calcResult.volume}**
              
              ### 2 การคำนวณพื้นที่ผิวข้างลูกบาศก์
              
              🎯 **สูตรที่ใช้:** $A_{lateral} = 4s^2$
              
              **อธิบายสูตร:** ลูกบาศก์มี 4 หน้าข้าง แต่ละหน้าเป็นสี่เหลี่ยมจัตุรัสที่มีพื้นที่ $s^2$
              
              **ขั้นตอนการคำนวณพื้นที่ผิวข้าง:**
              - พื้นที่ 4 หน้าข้าง: 4 × ${s}² = 4 × ${s*s} = **${calcResult.lateralSurfaceArea}**
              
              ### 3 การคำนวณพื้นที่ผิวทั้งหมดลูกบาศก์
              
              🎯 **สูตรที่ใช้:** $A_{total} = 6s^2$
              
              **อธิบายสูตร:** ลูกบาศก์มี 6 หน้า (4 หน้าข้าง + 2 หน้าฐาน) แต่ละหน้าเป็นสี่เหลี่ยมจัตุรัสที่มีพื้นที่ $s^2$
              
              **ขั้นตอนการคำนวณพื้นที่ผิวทั้งหมด:**
              1. พื้นที่ 4 หน้าข้าง: ${calcResult.lateralSurfaceArea}
              2. พื้นที่ 2 หน้าฐาน: 2 × ${s*s} = ${2 * s*s}
              3. รวมทั้งหมด: ${calcResult.lateralSurfaceArea} + ${2 * s*s} = **${calcResult.surfaceArea}**
            `;
          } else {
            calcSteps = '❌ กรุณากรอกค่าความยาวด้าน (s) ที่มากกว่า 0';
          }
          break;
          
        case 'pyramid':
          if (s > 0 && h > 0) {
            const l = Math.sqrt(Math.pow(s/2, 2) + h*h);
            calcResult.volume = (1/3) * s*s * h;
            calcResult.lateralSurfaceArea = 2 * s * l; // 4 หน้าสามเหลี่ยม
            calcResult.surfaceArea = (s*s) + (2 * s * l);
            calcSteps = `
              ### 1 การคำนวณปริมาตรพีระมิดฐานสี่เหลี่ยม
              
              🎯 **สูตรที่ใช้:** $$V = \\frac{1}{3} s^2 h$$
              
              **อธิบายสูตร:** ปริมาตร = 1/3 × พื้นที่ฐาน × ความสูง
              
              **แทนค่า:**
              - ความยาวด้านฐาน (s) = ${s} หน่วย
              - ความสูง (h) = ${h} หน่วย
              
              **ขั้นตอนการคำนวณ:**
              1. พื้นที่ฐาน $s^2$: ${s}² = ${s*s}
              2. คำนวณ $\\frac{1}{3} s^2 h$: $\\frac{1}{3}$ × ${s*s} × ${h} = **${calcResult.volume.toFixed(2)}**
              
              ### 2 การคำนวณพื้นที่ผิวข้างพีระมิด
              
              🎯 **สูตรที่ใช้:** $A_{lateral} = 2sl$
              
              **อธิบายสูตร:** พื้นที่ผิวข้าง = พื้นที่หน้าสามเหลี่ยม 4 หน้า (ไม่รวมฐาน)
              
              **ขั้นตอนการคำนวณพื้นที่ผิวข้าง:**
              - พื้นที่หน้าสามเหลี่ยม 4 หน้า: 2 × ${s} × ${l.toFixed(2)} = **${calcResult.lateralSurfaceArea.toFixed(2)}**
              
              ### 3 การคำนวณพื้นที่ผิวทั้งหมดพีระมิด
              
              🎯 **สูตรที่ใช้:** $A_{total} = s^2 + 2sl$
              
              **อธิบายสูตร:** พื้นที่ผิวทั้งหมด = พื้นที่ฐาน + พื้นที่หน้าสามเหลี่ยม 4 หน้า
              
              **ขั้นตอนการคำนวณพื้นที่ผิวทั้งหมด:**
              1. พื้นที่ฐาน: ${s}² = ${s*s}
              2. พื้นที่ผิวข้าง: ${calcResult.lateralSurfaceArea.toFixed(2)}
              3. รวมทั้งหมด: ${s*s} + ${calcResult.lateralSurfaceArea.toFixed(2)} = **${calcResult.surfaceArea.toFixed(2)}**
            `;
          } else {
            calcSteps = '❌ กรุณากรอกค่าความยาวด้านฐาน (s) และความสูง (h) ที่มากกว่า 0';
          }
          break;
      }
    } catch (e) {
      return { result: null, steps: '⚠️ เกิดข้อผิดพลาดในการคำนวณ กรุณาตรวจสอบค่าที่กรอก' };
    }
    return { result: calcResult.volume > 0 ? calcResult : null, steps: calcSteps };
  }, [shape, values]);
  
  const currentConfig = shapeConfig[shape];
  const SvgComponent = currentConfig.svg;
  const { r, h, s } = values;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-2 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 sm:mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <Calculator className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600 mr-3" />
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              เครื่องคำนวณเรขาคณิต 3 มิติ
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto">
            เครื่องมือคำนวณปริมาตรและพื้นที่ผิวของรูปทรงเรขาคณิต 3 มิติ พร้อมคำอธิบายขั้นตอนแบบละเอียด
          </p>
        </motion.div>

        <Card className="shadow-2xl overflow-hidden border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 border-b dark:border-slate-600 p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl flex items-center">
              <Info className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-blue-600" />
              การตั้งค่าและคำนวณ
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              เลือกรูปทรงและกรอกค่าพารามิเตอร์เพื่อดูผลลัพธ์และวิธีการคำนวณ
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-4 sm:p-6 lg:p-8">
            {/* Shape Selection */}
            <div className="mb-6 sm:mb-8">
              <Label className="text-base sm:text-lg font-semibold mb-3 block">เลือกรูปทรงเรขาคณิต</Label>
              <Select value={shape} onValueChange={handleShapeChange}>
                <SelectTrigger className="text-sm sm:text-base h-12 sm:h-14 bg-white dark:bg-slate-800 border-2 hover:border-blue-300 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800">
                  {Object.entries(shapeConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key} className="text-sm sm:text-base py-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-700">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full bg-${config.color}-500 mr-3`}></div>
                        <div>
                          <div className="font-medium">{config.name}</div>
                          <div className="text-xs text-slate-500">{config.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8 items-start">
              {/* Input Section */}
              <div className="space-y-6">
                <motion.div 
                  key={shape} 
                  initial={{opacity: 0, x: -20}} 
                  animate={{opacity: 1, x: 0}}
                  className="p-4 sm:p-6 border-2 border-dashed border-blue-200 dark:border-slate-600 rounded-xl bg-gradient-to-br from-blue-50/50 to-white dark:from-slate-800/50 dark:to-slate-900/50"
                >
                  <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center">
                    <ChevronRight className="h-5 w-5 mr-2 text-blue-600" />
                    ใส่ค่าพารามิเตอร์
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {currentConfig.inputs.includes('r') && (
                      <div className="space-y-2">
                        <Label htmlFor="r" className="text-sm font-medium flex items-center">
                          <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center text-xs font-bold mr-2">r</span>
                          รัศมี (Radius)
                        </Label>
                        <Input 
                          id="r" 
                          name="r" 
                          value={values.r} 
                          onChange={handleInputChange}
                          placeholder="กรอกค่ารัศมี"
                          className="h-12 text-center text-lg font-semibold border-2 focus:border-blue-400"
                        />
                      </div>
                    )}
                    
                    {currentConfig.inputs.includes('h') && (
                      <div className="space-y-2">
                        <Label htmlFor="h" className="text-sm font-medium flex items-center">
                          <span className="w-6 h-6 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 rounded-full flex items-center justify-center text-xs font-bold mr-2">h</span>
                          ความสูง (Height)
                        </Label>
                        <Input 
                          id="h" 
                          name="h" 
                          value={values.h} 
                          onChange={handleInputChange}
                          placeholder="กรอกค่าความสูง"
                          className="h-12 text-center text-lg font-semibold border-2 focus:border-green-400"
                        />
                      </div>
                    )}
                    
                    {currentConfig.inputs.includes('s') && (
                      <div className="space-y-2">
                        <Label htmlFor="s" className="text-sm font-medium flex items-center">
                          <span className="w-6 h-6 bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300 rounded-full flex items-center justify-center text-xs font-bold mr-2">s</span>
                          {shape === 'cube' ? 'ความยาวด้าน (Side)' : 'ด้านฐาน (Base Side)'}
                        </Label>
                        <Input 
                          id="s" 
                          name="s" 
                          value={values.s} 
                          onChange={handleInputChange}
                          placeholder={shape === 'cube' ? 'กรอกความยาวด้าน' : 'กรอกความยาวด้านฐาน'}
                          className="h-12 text-center text-lg font-semibold border-2 focus:border-orange-400"
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Current Values Display */}
                  <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">ค่าปัจจุบัน:</p>
                    <div className="flex flex-wrap gap-2">
                      {currentConfig.inputs.map((input: string) => (
                        <span key={input} className="inline-flex items-center px-2 py-1 bg-white dark:bg-slate-700 rounded text-xs font-mono">
                          {input} = {values[input as keyof typeof values] || '0'}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Visualization Section */}
              <div className="flex flex-col items-center justify-center">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }} 
                  animate={{ scale: 1, opacity: 1 }} 
                  key={shape}
                  className="w-full max-w-sm aspect-square p-4 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700"
                >
                  <SvgComponent r={parseFloat(r)} h={parseFloat(h)} s={parseFloat(s)} />
                </motion.div>
                
                <div className="mt-4 text-center">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                    {currentConfig.name}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs">
                    {currentConfig.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Results Section */}
            <AnimatePresence>
              {result && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{opacity: 0, y: -20}}
                  className="mt-8"
                >
                  <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 border-2 border-green-200 dark:border-slate-600 shadow-lg">
                    <CardHeader className="flex-row items-center justify-between pb-4">
                      <div>
                        <CardTitle className="text-lg sm:text-xl flex items-center text-green-800 dark:text-green-300">
                          <Calculator className="h-5 w-5 mr-2" />
                          ผลลัพธ์การคำนวณ
                        </CardTitle>
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                          คำนวณจากค่าที่กรอก: {currentConfig.inputs.map((input: string) => `${input}=${values[input as keyof typeof values]}`).join(', ')}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setIsModalOpen(true)}
                        className="text-sm sm:text-base border-2 border-blue-300 hover:bg-blue-50 dark:hover:bg-slate-700 transition-all duration-200"
                      >
                        <BookOpen className="mr-2 h-4 w-4"/> 
                        <span className="hidden sm:inline">ดูวิธีทำ</span>
                        <span className="sm:hidden">วิธีทำ</span>
                      </Button>
                    </CardHeader>
                    
                    <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-blue-200 dark:border-slate-600"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">ปริมาตร (Volume)</p>
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 font-mono">
                          {result.volume.toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">ลูกบาศก์หน่วย</p>
                      </motion.div>
                      
                      {shape !== 'sphere' && (
                        <motion.div 
                          whileHover={{ scale: 1.02 }}
                          className="p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-green-200 dark:border-slate-600"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                              พื้นที่ผิวข้าง {shape === 'cube' ? '(4 หน้า)' : '(Lateral)'}
                            </p>
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          </div>
                          <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400 font-mono">
                            {result.lateralSurfaceArea.toFixed(2)}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">ตารางหน่วย</p>
                        </motion.div>
                      )}
                      
                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-purple-200 dark:border-slate-600"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                            พื้นที่ผิว{shape === 'sphere' ? '' : 'ทั้งหมด'} (Surface Area)
                          </p>
                          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400 font-mono">
                          {result.surfaceArea.toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">ตารางหน่วย</p>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* No result message */}
            {!result && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-8 text-center p-6 sm:p-8 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600"
              >
                <HelpCircle className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg">
                  กรุณากรอกค่าพารามิเตอร์ที่ถูกต้องและมากกว่า 0 เพื่อดูผลลัพธ์
                </p>
                <p className="text-slate-500 dark:text-slate-500 text-sm mt-2">
                  ระบบจะคำนวณปริมาตรและพื้นที่ผิวให้โดยอัตโนมัติ
                </p>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8 text-slate-500 dark:text-slate-400 text-sm"
        >
          <p>💡 เครื่องคำนวณเรขาคณิต 3 มิติ - เครื่องมือช่วยเรียนรู้คณิตศาสตร์</p>
        </motion.div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <CalculationStepsModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            title={`วิธีการคำนวณ ${currentConfig.name}`}
            steps={steps} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default GeometryCalculator;