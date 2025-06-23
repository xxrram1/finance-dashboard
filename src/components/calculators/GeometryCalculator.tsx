import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, X, Copy, Layers, Calculator, Share2, Trash2, Zap, Target,
    Maximize2, TrendingUp, BarChart3, AlertTriangle, CheckCircle, HelpCircle, RefreshCw
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { create, all } from 'mathjs';
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css';
import { Separator } from '@/components/ui/separator';

// --- MATH.JS CONFIGURATION ---
const math = create(all, { number: 'BigNumber', precision: 64 });

// --- TYPE DEFINITIONS ---
type Shape = 'cone' | 'cylinder' | 'sphere' | 'cube' | 'pyramid' | 'prism' | 'torus' | 'hemisphere' | 'frustum';
type InputField = { key: string; name: string; };

// --- SVG COMPONENTS ---
const ConeSVG = ({ r, h }: { r?: string; h?: string }) => ( <motion.svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-xl" initial={{ opacity: 0}} animate={{ opacity: 1}}><defs><linearGradient id="coneGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" className="stop-blue-200" /><stop offset="50%" className="stop-blue-400" /><stop offset="100%" className="stop-blue-600" /></linearGradient></defs><polygon points="60,15 25,95 95,95" fill="url(#coneGrad)" stroke="#1e40af" strokeWidth="2.5" /><ellipse cx="60" cy="95" rx="35" ry="10" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2" /><line x1="25" y1="95" x2="95" y2="95" stroke="#64748b" strokeDasharray="4,3" strokeWidth="1.5"/><text x="58" y="88" textAnchor="middle" className="text-sm fill-slate-700 font-bold">{r ? `r=${r}` : 'r'}</text><line x1="60" y1="15" x2="60" y2="95" stroke="#64748b" strokeDasharray="4,3" strokeWidth="1.5"/><text x="70" y="55" className="text-sm fill-slate-700 font-bold">{h ? `h=${h}` : 'h'}</text></motion.svg>);
const CylinderSVG = ({ r, h }: { r?: string; h?: string }) => ( <motion.svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-xl" initial={{ opacity: 0}} animate={{ opacity: 1}}><defs><linearGradient id="cylGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" className="stop-green-200" /><stop offset="50%" className="stop-green-400" /><stop offset="100%" className="stop-green-600" /></linearGradient></defs><ellipse cx="60" cy="25" rx="32" ry="10" fill="#22c55e" stroke="#16a34a" strokeWidth="2.5"/><rect x="28" y="25" width="64" height="60" fill="url(#cylGrad)" stroke="#16a34a" strokeWidth="2.5"/><ellipse cx="60" cy="85" rx="32" ry="10" fill="#16a34a" stroke="#15803d" strokeWidth="2.5"/><line x1="60" y1="25" x2="60" y2="85" stroke="#64748b" strokeDasharray="4,3" strokeWidth="1.5"/><text x="72" y="55" className="text-sm fill-slate-700 font-bold">{h ? `h=${h}` : 'h'}</text><line x1="60" y1="85" x2="92" y2="85" stroke="#64748b" strokeDasharray="4,3" strokeWidth="1.5"/><text x="76" y="88" className="text-sm fill-slate-700 font-bold">{r ? `r=${r}` : 'r'}</text></motion.svg>);
const SphereSVG = ({ r }: { r?: string }) => ( <motion.svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-xl" initial={{ opacity: 0}} animate={{ opacity: 1}}><defs><radialGradient id="sphereGrad" cx="30%" cy="30%"><stop offset="0%" className="stop-purple-200" /><stop offset="40%" className="stop-purple-400" /><stop offset="100%" className="stop-purple-700" /></radialGradient></defs><circle cx="60" cy="60" r="38" fill="url(#sphereGrad)" stroke="#7c3aed" strokeWidth="2.5" /><line x1="60" y1="60" x2="98" y2="60" stroke="#fff" strokeDasharray="4,3" strokeWidth="1.5"/><text x="79" y="55" className="text-sm fill-white font-bold">{r ? `r=${r}` : 'r'}</text></motion.svg>);
const CubeSVG = ({ a }: { a?: string }) => ( <motion.svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-xl" initial={{ opacity: 0}} animate={{ opacity: 1}}><defs><linearGradient id="cubeGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" className="stop-red-300" /><stop offset="100%" className="stop-red-500" /></linearGradient></defs><rect x="30" y="40" width="60" height="60" fill="url(#cubeGrad)" stroke="#c2410c" strokeWidth="2.5" /><polygon points="30,40 50,20 110,20 90,40" fill="#fb923c" stroke="#c2410c" strokeWidth="2.5"/><polygon points="90,40 110,20 110,80 90,100" fill="#f97316" stroke="#c2410c" strokeWidth="2.5"/><text x="55" y="75" className="text-sm fill-white font-bold">{a ? `a=${a}` : 'a'}</text></motion.svg>);
const PyramidSVG = ({ b, h }: { b?: string; h?: string }) => ( <motion.svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-xl" initial={{ opacity: 0}} animate={{ opacity: 1}}><defs><linearGradient id="pyramidGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" className="stop-yellow-200" /><stop offset="100%" className="stop-yellow-500" /></linearGradient></defs><polygon points="60,15 20,100 100,100" fill="url(#pyramidGrad)" stroke="#ca8a04" strokeWidth="2" /><polygon points="60,15 100,100 80,105" fill="#facc15" stroke="#ca8a04" strokeWidth="2"/><polygon points="20,100 100,100 80,105 0,105" fill="#eab308" stroke="#ca8a04" strokeWidth="2"/><line x1="60" y1="15" x2="60" y2="102" stroke="#4b5563" strokeDasharray="4,3" strokeWidth="1.5"/><text x="65" y="60" className="text-sm fill-slate-800 font-bold">{h ? `h=${h}` : 'h'}</text><line x1="20" y1="100" x2="100" y2="100" stroke="#4b5563" strokeDasharray="4,3" strokeWidth="1.5"/><text x="55" y="112" className="text-sm fill-slate-800 font-bold">{b ? `b=${b}` : 'b'}</text></motion.svg>);
const PrismSVG = ({ w, d, h }: { w?: string, d?: string, h?: string }) => ( <motion.svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-xl" initial={{ opacity: 0}} animate={{ opacity: 1}}><defs><linearGradient id="prismGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" className="stop-teal-300" /><stop offset="100%" className="stop-teal-500" /></linearGradient></defs><rect x="25" y="45" width="70" height="50" fill="url(#prismGrad)" stroke="#0d9488" strokeWidth="2.5"/><polygon points="25,45 45,25 115,25 95,45" fill="#2dd4bf" stroke="#0d9488" strokeWidth="2.5"/><polygon points="95,45 115,25 115,75 95,95" fill="#14b8a6" stroke="#0d9488" strokeWidth="2.5"/><text x="55" y="75" className="text-xs fill-white font-bold">{h ? `h=${h}` : 'h'}</text><text x="65" y="40" className="text-xs fill-slate-800 font-bold">{w ? `w=${w}` : 'w'}</text><text x="100" y="65" className="text-xs fill-white font-bold">{d ? `d=${d}` : 'd'}</text></motion.svg>);
const TorusSVG = ({ R, r }: { R?: string, r?: string }) => ( <motion.svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-xl" initial={{ opacity: 0}} animate={{ opacity: 1}}><defs><radialGradient id="torusGrad" cx="50%" cy="50%" r="50%" fx="30%" fy="30%"><stop offset="0%" className="stop-pink-300" /><stop offset="100%" className="stop-pink-600" /></radialGradient></defs><circle cx="60" cy="60" r="40" fill="url(#torusGrad)" stroke="#be185d" strokeWidth="2.5" /><circle cx="60" cy="60" r="18" fill="white" className="dark:fill-slate-900"/><line x1="60" y1="60" x2="100" y2="60" stroke="#4b5563" strokeDasharray="3,2" strokeWidth="1.5"/><text x="80" y="56" className="text-xs fill-slate-800 dark:fill-slate-200 font-bold">{R ? `R=${R}` : 'R'}</text><line x1="78" y1="60" x2="78" y2="78" stroke="#4b5563" strokeDasharray="3,2" strokeWidth="1.5"/><text x="68" y="75" className="text-xs fill-slate-800 dark:fill-slate-200 font-bold">{r ? `r=${r}` : 'r'}</text></motion.svg>);
const HemisphereSVG = ({ r }: { r?: string }) => ( <motion.svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-xl" initial={{ opacity: 0}} animate={{ opacity: 1}}><defs><radialGradient id="hemiGrad" cx="40%" cy="40%"><stop offset="0%" className="stop-indigo-200" /><stop offset="100%" className="stop-indigo-500" /></radialGradient></defs><path d="M25,95 A50,40 0 0,1 95,95" fill="url(#hemiGrad)" stroke="#4338ca" strokeWidth="2.5" /><ellipse cx="60" cy="95" rx="35" ry="10" fill="#6366f1" stroke="#4338ca" strokeWidth="2"/><line x1="60" y1="95" x2="95" y2="95" stroke="#4b5563" strokeDasharray="4,3" strokeWidth="1.5"/><text x="75" y="90" className="text-sm fill-slate-800 font-bold">{r ? `r=${r}` : 'r'}</text></motion.svg>);
const FrustumSVG = ({ r1, r2, h }: { r1?: string, r2?: string, h?: string }) => ( <motion.svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-xl" initial={{ opacity: 0}} animate={{ opacity: 1}}><defs><linearGradient id="frustumGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" className="stop-cyan-200" /><stop offset="100%" className="stop-cyan-500" /></linearGradient></defs><ellipse cx="60" cy="25" rx="20" ry="6" fill="#67e8f9" stroke="#0891b2" strokeWidth="2"/><polygon points="40,25 25,95 95,95 80,25" fill="url(#frustumGrad)" stroke="#0891b2" strokeWidth="2.5" /><ellipse cx="60" cy="95" rx="35" ry="10" fill="#22d3ee" stroke="#0891b2" strokeWidth="2"/><line x1="60" y1="25" x2="60" y2="95" stroke="#4b5563" strokeDasharray="4,3" strokeWidth="1.5"/><text x="65" y="60" className="text-sm fill-slate-700 font-bold">{h ? `h=${h}` : 'h'}</text><line x1="60" y1="25" x2="80" y2="25" stroke="#4b5563" strokeDasharray="4,3" strokeWidth="1.5"/><text x="70" y="22" className="text-sm fill-slate-700 font-bold">{r1 ? `r1=${r1}` : 'r1'}</text><line x1="60" y1="95" x2="95" y2="95" stroke="#4b5563" strokeDasharray="4,3" strokeWidth="1.5"/><text x="75" y="92" className="text-sm fill-slate-700 font-bold">{r2 ? `r2=${r2}` : 'r2'}</text></motion.svg>);

// --- SHAPE CONFIGURATION ---
const shapeConfig: { [key in Shape]: { name: string; icon: React.ElementType; inputs: InputField[]; svg: React.FC<any>; calculate: (values: any) => any; } } = {
    cone: {
        name: 'กรวย', icon: Zap,
        inputs: [{ key: 'r', name: 'รัศมี (r)' }, { key: 'h', name: 'ความสูง (h)' }],
        svg: ConeSVG,
        calculate: ({ r, h }) => {
            const R = parseFloat(r), H = parseFloat(h);
            const emptyResult = { volume: 0, lateralSurfaceArea: 0, totalSurfaceArea: 0, steps: "กรุณาใส่ค่ารัศมีและความสูงเป็นบวก" };
            if (isNaN(R) || isNaN(H) || R <= 0 || H <= 0) return emptyResult;
            const slantHeight = Math.sqrt(R * R + H * H);
            const volume = (1 / 3) * Math.PI * R * R * H;
            const lateralSurfaceArea = Math.PI * R * slantHeight;
            const totalSurfaceArea = Math.PI * R * (R + slantHeight);
            const steps = `### 1. คำนวณปริมาตร (Volume)
ใช้สูตร: $$V = \\frac{1}{3} \\pi r^2 h$$
แทนค่า: $$V = \\frac{1}{3} \\pi (${R}^2) (${H})$$
**ผลลัพธ์: V ≈ ${volume.toFixed(4)}**

### 2. คำนวณพื้นที่ผิวข้าง (Lateral Surface Area)
ก่อนอื่น หาความสูงเอียง (l): $$l = \\sqrt{r^2 + h^2}$$
$$l = \\sqrt{${R}^2 + ${H}^2} \\approx ${slantHeight.toFixed(4)}$$
ใช้สูตร: $$A_{ข้าง} = \\pi r l$$
แทนค่า: $$A_{ข้าง} = \\pi (${R}) (${slantHeight.toFixed(4)})$$
**ผลลัพธ์: A ≈ ${lateralSurfaceArea.toFixed(4)}**

### 3. คำนวณพื้นที่ผิวทั้งหมด (Total Surface Area)
ใช้สูตร: $$A_{รวม} = A_{ข้าง} + A_{ฐาน} = \\pi r l + \\pi r^2$$
แทนค่า: $$A_{รวม} \\approx ${lateralSurfaceArea.toFixed(4)} + \\pi (${R}^2)$$
**ผลลัพธ์: A ≈ ${totalSurfaceArea.toFixed(4)}**`;
            return { volume, lateralSurfaceArea, totalSurfaceArea, steps };
        }
    },
    cylinder: {
        name: 'ทรงกระบอก', icon: Layers,
        inputs: [{ key: 'r', name: 'รัศมี (r)' }, { key: 'h', name: 'ความสูง (h)' }],
        svg: CylinderSVG,
        calculate: ({ r, h }) => {
            const R = parseFloat(r), H = parseFloat(h);
            const emptyResult = { volume: 0, lateralSurfaceArea: 0, totalSurfaceArea: 0, steps: "กรุณาใส่ค่ารัศมีและความสูงเป็นบวก" };
            if (isNaN(R) || isNaN(H) || R <= 0 || H <= 0) return emptyResult;
            const volume = Math.PI * R * R * H;
            const lateralSurfaceArea = 2 * Math.PI * R * H;
            const totalSurfaceArea = 2 * Math.PI * R * (R + H);
            const steps = `### 1. คำนวณปริมาตร (Volume)
ใช้สูตร: $$V = \\pi r^2 h$$
แทนค่า: $$V = \\pi (${R}^2) (${H})$$
**ผลลัพธ์: V ≈ ${volume.toFixed(4)}**
### 2. คำนวณพื้นที่ผิวข้าง (Lateral Surface Area)
ใช้สูตร: $$A_{ข้าง} = 2 \\pi r h$$
แทนค่า: $$A_{ข้าง} = 2 \\pi (${R}) (${H})$$
**ผลลัพธ์: A ≈ ${lateralSurfaceArea.toFixed(4)}**
### 3. คำนวณพื้นที่ผิวทั้งหมด (Total Surface Area)
ใช้สูตร: $$A_{รวม} = 2 \\pi r (r + h)$$
แทนค่า: $$A_{รวม} = 2 \\pi (${R}) (${R} + ${H})$$
**ผลลัพธ์: A ≈ ${totalSurfaceArea.toFixed(4)}**`;
            return { volume, lateralSurfaceArea, totalSurfaceArea, steps };
        }
    },
    sphere: {
        name: 'ทรงกลม', icon: Target,
        inputs: [{ key: 'r', name: 'รัศมี (r)' }],
        svg: SphereSVG,
        calculate: ({ r }) => {
            const R = parseFloat(r);
            const emptyResult = { volume: 0, lateralSurfaceArea: 0, totalSurfaceArea: 0, steps: "กรุณาใส่ค่ารัศมีเป็นบวก" };
            if (isNaN(R) || R <= 0) return emptyResult;
            const volume = (4 / 3) * Math.PI * Math.pow(R, 3);
            const totalSurfaceArea = 4 * Math.PI * R * R;
            const steps = `### 1. คำนวณปริมาตร (Volume)
ใช้สูตร: $$V = \\frac{4}{3} \\pi r^3$$
แทนค่า: $$V = \\frac{4}{3} \\pi (${R}^3)$$
**ผลลัพธ์: V ≈ ${volume.toFixed(4)}**
### 2. คำนวณพื้นที่ผิวทั้งหมด (Total Surface Area)
สำหรับทรงกลม พื้นที่ผิวข้างจะเท่ากับพื้นที่ผิวทั้งหมด
ใช้สูตร: $$A = 4 \\pi r^2$$
แทนค่า: $$A = 4 \\pi (${R}^2)$$
**ผลลัพธ์: A ≈ ${totalSurfaceArea.toFixed(4)}**`;
            return { volume, lateralSurfaceArea: totalSurfaceArea, totalSurfaceArea, steps };
        }
    },
    cube: {
        name: 'ลูกบาศก์', icon: Maximize2,
        inputs: [{ key: 'a', name: 'ความยาวด้าน (a)' }],
        svg: CubeSVG,
        calculate: ({ a }) => {
            const A = parseFloat(a);
            const emptyResult = { volume: 0, lateralSurfaceArea: 0, totalSurfaceArea: 0, steps: "กรุณาใส่ความยาวด้านเป็นบวก" };
            if (isNaN(A) || A <= 0) return emptyResult;
            const volume = Math.pow(A, 3);
            const lateralSurfaceArea = 4 * A * A;
            const totalSurfaceArea = 6 * A * A;
            const steps = `### 1. คำนวณปริมาตร (Volume)
ใช้สูตร: $$V = a^3$$
แทนค่า: $$V = ${A}^3$$
**ผลลัพธ์: V = ${volume.toFixed(4)}**
### 2. คำนวณพื้นที่ผิวข้าง (Lateral Surface Area)
คือพื้นที่ 4 ด้าน (ไม่รวมบน-ล่าง)
ใช้สูตร: $$A_{ข้าง} = 4a^2$$
แทนค่า: $$A_{ข้าง} = 4 \\times ${A}^2$$
**ผลลัพธ์: A = ${lateralSurfaceArea.toFixed(4)}**
### 3. คำนวณพื้นที่ผิวทั้งหมด (Total Surface Area)
คือพื้นที่ 6 ด้าน
ใช้สูตร: $$A_{รวม} = 6a^2$$
แทนค่า: $$A_{รวม} = 6 \\times ${A}^2$$
**ผลลัพธ์: A = ${totalSurfaceArea.toFixed(4)}**`;
            return { volume, lateralSurfaceArea, totalSurfaceArea, steps };
        }
    },
    pyramid: {
        name: 'พีระมิดฐานสี่เหลี่ยม', icon: TrendingUp,
        inputs: [{ key: 'b', name: 'ความยาวฐาน (b)' }, { key: 'h', name: 'ความสูง (h)' }],
        svg: PyramidSVG,
        calculate: ({ b, h }) => {
            const B = parseFloat(b), H = parseFloat(h);
            const emptyResult = { volume: 0, lateralSurfaceArea: 0, totalSurfaceArea: 0, steps: "กรุณาใส่ความยาวฐานและความสูงเป็นบวก" };
            if (isNaN(B) || isNaN(H) || B <= 0 || H <= 0) return emptyResult;
            const slantHeight = Math.sqrt(H * H + (B / 2) * (B / 2));
            const volume = (1/3) * B * B * H;
            const lateralSurfaceArea = 2 * B * slantHeight;
            const totalSurfaceArea = (B * B) + lateralSurfaceArea;
            const steps = `### 1. คำนวณปริมาตร (Volume)
ใช้สูตร: $$V = \\frac{1}{3} b^2 h$$
แทนค่า: $$V = \\frac{1}{3} (${B}^2) (${H})$$
**ผลลัพธ์: V ≈ ${volume.toFixed(4)}**
### 2. คำนวณพื้นที่ผิวข้าง (Lateral Surface Area)
หาความสูงเอียง (l): $$l = \\sqrt{h^2 + (b/2)^2}$$
$$l = \\sqrt{${H}^2 + (${B}/2)^2} \\approx ${slantHeight.toFixed(4)}$$
ใช้สูตร: $$A_{ข้าง} = 2bl$$
แทนค่า: $$A_{ข้าง} = 2(${B})(${slantHeight.toFixed(4)})$$
**ผลลัพธ์: A ≈ ${lateralSurfaceArea.toFixed(4)}**
### 3. คำนวณพื้นที่ผิวทั้งหมด (Total Surface Area)
ใช้สูตร: $$A_{รวม} = b^2 + A_{ข้าง}$$
แทนค่า: $$A_{รวม} = ${B}^2 + ${lateralSurfaceArea.toFixed(4)}$$
**ผลลัพธ์: A ≈ ${totalSurfaceArea.toFixed(4)}**`;
            return { volume, lateralSurfaceArea, totalSurfaceArea, steps };
        }
    },
    prism: {
        name: 'ปริซึมสี่เหลี่ยม', icon: BarChart3,
        inputs: [{ key: 'w', name: 'ความกว้าง (w)' }, { key: 'd', name: 'ความลึก (d)' }, { key: 'h', name: 'ความสูง (h)' }],
        svg: PrismSVG,
        calculate: ({ w, d, h }) => {
            const W = parseFloat(w), D = parseFloat(d), H = parseFloat(h);
            const emptyResult = { volume: 0, lateralSurfaceArea: 0, totalSurfaceArea: 0, steps: "กรุณาใส่ค่าทั้งหมดเป็นบวก" };
            if (isNaN(W) || isNaN(D) || isNaN(H) || W <= 0 || D <= 0 || H <= 0) return emptyResult;
            const volume = W * D * H;
            const lateralSurfaceArea = 2 * (W * H + D * H);
            const totalSurfaceArea = 2 * (W*D + W*H + D*H);
            const steps = `### 1. คำนวณปริมาตร (Volume)
ใช้สูตร: $$V = w \\times d \\times h$$
แทนค่า: $$V = ${W} \\times ${D} \\times ${H}$$
**ผลลัพธ์: V = ${volume.toFixed(4)}**
### 2. คำนวณพื้นที่ผิวข้าง (Lateral Surface Area)
ใช้สูตร: $$A_{ข้าง} = 2(wh + dh)$$
แทนค่า: $$A_{ข้าง} = 2((${W} \\times ${H}) + (${D} \\times ${H}))$$
**ผลลัพธ์: A = ${lateralSurfaceArea.toFixed(4)}**
### 3. คำนวณพื้นที่ผิวทั้งหมด (Total Surface Area)
ใช้สูตร: $$A_{รวม} = 2(wd + wh + dh)$$
แทนค่า: $$A_{รวม} = 2((${W} \\times ${D}) + (${W} \\times ${H}) + (${D} \\times ${H}))$$
**ผลลัพธ์: A = ${totalSurfaceArea.toFixed(4)}**`;
            return { volume, lateralSurfaceArea, totalSurfaceArea, steps };
        }
    },
    torus: {
        name: 'ทอรัส', icon: RefreshCw,
        inputs: [{ key: 'R', name: 'รัศมีวงนอก (R)' }, { key: 'r', name: 'รัศมีวงใน (r)' }],
        svg: TorusSVG,
        calculate: ({ R, r }) => {
            const majorR = parseFloat(R), minorR = parseFloat(r);
            const emptyResult = { volume: 0, lateralSurfaceArea: 0, totalSurfaceArea: 0, steps: "รัศมีวงนอก (R) ต้องมากกว่ารัศมีวงใน (r)" };
            if (isNaN(majorR) || isNaN(minorR) || majorR <= 0 || minorR <= 0 || majorR <= minorR) return emptyResult;
            const volume = 2 * Math.pow(Math.PI, 2) * majorR * minorR * minorR;
            const totalSurfaceArea = 4 * Math.pow(Math.PI, 2) * majorR * minorR;
            const steps = `### 1. คำนวณปริมาตร (Volume)
ใช้สูตร: $$V = 2\\pi^2Rr^2$$
แทนค่า: $$V = 2\\pi^2(${majorR})(${minorR}^2)$$
**ผลลัพธ์: V ≈ ${volume.toFixed(4)}**
### 2. คำนวณพื้นที่ผิวทั้งหมด (Surface Area)
สำหรับทอรัส พื้นที่ผิวข้างคือพื้นที่ผิวทั้งหมด
ใช้สูตร: $$A = 4\\pi^2Rr$$
แทนค่า: $$A = 4\\pi^2(${majorR})(${minorR})$$
**ผลลัพธ์: A ≈ ${totalSurfaceArea.toFixed(4)}**`;
            return { volume, lateralSurfaceArea: totalSurfaceArea, totalSurfaceArea, steps };
        }
    },
    hemisphere: {
        name: 'ครึ่งทรงกลม', icon: Target,
        inputs: [{ key: 'r', name: 'รัศมี (r)' }],
        svg: HemisphereSVG,
        calculate: ({ r }) => {
            const R = parseFloat(r);
            const emptyResult = { volume: 0, lateralSurfaceArea: 0, totalSurfaceArea: 0, steps: "กรุณาใส่ค่ารัศมีเป็นบวก" };
            if (isNaN(R) || R <= 0) return emptyResult;
            const volume = (2 / 3) * Math.PI * Math.pow(R, 3);
            const lateralSurfaceArea = 2 * Math.PI * R * R;
            const totalSurfaceArea = 3 * Math.PI * R * R;
            const steps = `### 1. คำนวณปริมาตร (Volume)
ใช้สูตร: $$V = \\frac{2}{3} \\pi r^3$$
แทนค่า: $$V = \\frac{2}{3} \\pi (${R}^3)$$
**ผลลัพธ์: V ≈ ${volume.toFixed(4)}**
### 2. คำนวณพื้นที่ผิวข้าง (Lateral Surface Area)
คือพื้นที่ส่วนโค้ง
ใช้สูตร: $$A_{ข้าง} = 2 \\pi r^2$$
แทนค่า: $$A_{ข้าง} = 2 \\pi (${R}^2)$$
**ผลลัพธ์: A ≈ ${lateralSurfaceArea.toFixed(4)}**
### 3. คำนวณพื้นที่ผิวทั้งหมด (Total Surface Area)
คือพื้นที่ส่วนโค้ง + พื้นที่ฐานวงกลม
ใช้สูตร: $$A_{รวม} = 3 \\pi r^2$$
แทนค่า: $$A_{รวม} = 3 \\pi (${R}^2)$$
**ผลลัพธ์: A ≈ ${totalSurfaceArea.toFixed(4)}**`;
            return { volume, lateralSurfaceArea, totalSurfaceArea, steps };
        }
    },
    frustum: {
        name: 'กรวยยอดตัด', icon: Zap,
        inputs: [{ key: 'r1', name: 'รัศมีบน (r1)' }, { key: 'r2', name: 'รัศมีล่าง (r2)' }, { key: 'h', name: 'ความสูง (h)' }],
        svg: FrustumSVG,
        calculate: ({ r1, r2, h }) => {
            const R1 = parseFloat(r1), R2 = parseFloat(r2), H = parseFloat(h);
            const emptyResult = { volume: 0, lateralSurfaceArea: 0, totalSurfaceArea: 0, steps: "กรุณาใส่ค่าทั้งหมดเป็นบวก" };
            if (isNaN(R1) || isNaN(R2) || isNaN(H) || R1 <= 0 || R2 <= 0 || H <= 0) return emptyResult;
            const [rLarge, rSmall] = R2 > R1 ? [R2, R1] : [R1, R2];
            const volume = (1/3) * Math.PI * H * (rLarge*rLarge + rSmall*rSmall + rLarge*rSmall);
            const slantHeight = Math.sqrt(Math.pow(rLarge - rSmall, 2) + H*H);
            const lateralSurfaceArea = Math.PI * (rLarge + rSmall) * slantHeight;
            const totalSurfaceArea = lateralSurfaceArea + Math.PI * rLarge*rLarge + Math.PI * rSmall*rSmall;
            const steps = `### 1. คำนวณปริมาตร (Volume)
ใช้สูตร: $$V = \\frac{1}{3} \\pi h (R^2 + r^2 + Rr)$$
แทนค่า: $$V = \\frac{1}{3} \\pi (${H}) (${rLarge}^2 + ${rSmall}^2 + ${rLarge} \\times ${rSmall})$$
**ผลลัพธ์: V ≈ ${volume.toFixed(4)}**
### 2. คำนวณพื้นที่ผิวข้าง (Lateral Surface Area)
หาความสูงเอียง (l): $$l = \\sqrt{(R-r)^2 + h^2}$$
$$l = \\sqrt{(${rLarge}-${rSmall})^2 + ${H}^2} \\approx ${slantHeight.toFixed(4)}$$
ใช้สูตร: $$A_{ข้าง} = \\pi (R+r) l$$
แทนค่า: $$A_{ข้าง} = \\pi (${rLarge}+${rSmall})(${slantHeight.toFixed(4)})$$
**ผลลัพธ์: A ≈ ${lateralSurfaceArea.toFixed(4)}**
### 3. คำนวณพื้นที่ผิวทั้งหมด (Total Surface Area)
ใช้สูตร: $$A_{รวม} = A_{ข้าง} + \\pi R^2 + \\pi r^2$$
แทนค่า: $$A_{รวม} \\approx ${lateralSurfaceArea.toFixed(4)} + \\pi(${rLarge}^2) + \\pi(${rSmall}^2)$$
**ผลลัพธ์: A ≈ ${totalSurfaceArea.toFixed(4)}**`;
            return { volume, lateralSurfaceArea, totalSurfaceArea, steps };
        }
    },
};

// --- RESULTS MODAL COMPONENT ---
const ResultsModal = ({ isOpen, onClose, shape, values, results }) => {
    if (!isOpen) return null;

    const CurrentShapeSVG = shapeConfig[shape].svg;
    const f = (num) => math.format(num, { notation: 'fixed', precision: 4 });

    const shareCalculation = () => {
        const params = new URLSearchParams();
        params.set('shape', shape);
        Object.entries(values).forEach(([key, value]) => {
            if (value) params.set(key, value as string);
        });
        const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
        navigator.clipboard.writeText(url);
        alert("คัดลอกลิงก์ผลลัพธ์ไปยังคลิปบอร์ดแล้ว!");
    };
    
    const valuesDisplayText = useMemo(() => {
        const shapeInputs = shapeConfig[shape]?.inputs || [];
        return Object.entries(values)
            .filter(([, v]) => v)
            .map(([key, value]) => {
                const inputConfig = shapeInputs.find(i => i.key === key);
                const name = inputConfig ? inputConfig.name : key;
                return `${name}=${value}`;
            })
            .join(', ');
    }, [shape, values]);
    
    const processedSteps = useMemo(() => {
        if (!results.steps) return "";
        return results.steps
            .replace(/###\s*(.*?)\n/g, `<h4>$1</h4>`)
            .replace(/\*\*(.*?)\*\*/g, `<strong>$1</strong>`);
    }, [results.steps]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]"
                    >
                        <Tabs defaultValue="results" className="w-full flex flex-col min-h-0">
                            <div className="flex-shrink-0 border-b dark:border-slate-700">
                                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4">
                                    <div className='flex items-center gap-4'>
                                        <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-2 rounded-lg shadow-md">
                                            <CheckCircle className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg sm:text-xl text-slate-800 dark:text-white">ผลการคำนวณ: {shapeConfig[shape]?.name}</CardTitle>
                                            <CardDescription className="text-xs mt-1">ค่าที่ใช้: {valuesDisplayText}</CardDescription>
                                        </div>
                                    </div>
                                    <TabsList className="w-full sm:w-auto">
                                        <TabsTrigger value="results" className="w-1/2 sm:w-auto">ผลลัพธ์</TabsTrigger>
                                        <TabsTrigger value="steps" className="w-1/2 sm:w-auto">ขั้นตอน</TabsTrigger>
                                    </TabsList>
                                </CardHeader>
                            </div>
                            
                            <div className="flex-grow overflow-y-auto">
                                <TabsContent value="results" className="p-4 md:p-6">
                                    <div className="flex flex-col lg:flex-row gap-6">
                                        <div className="lg:w-1/3 flex-shrink-0">
                                             <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-xl h-48 lg:h-full flex items-center justify-center">
                                                <CurrentShapeSVG {...values} />
                                            </div>
                                        </div>
                                        <div className="lg:w-2/3 space-y-3 border dark:border-slate-800 rounded-lg p-4">
                                            <div>
                                                <Label className="text-xs text-blue-700 dark:text-blue-300">ปริมาตร (Volume)</Label>
                                                <p className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-white">{f(results.volume)} <span className="text-sm font-normal">หน่วย³</span></p>
                                            </div>
                                            <Separator/>
                                            <div>
                                                <Label className="text-xs text-green-700 dark:text-green-300">พื้นที่ผิวข้าง (Lateral Surface Area)</Label>
                                                <p className="text-xl sm:text-2xl font-bold text-green-900 dark:text-white">{f(results.lateralSurfaceArea)} <span className="text-sm font-normal">หน่วย²</span></p>
                                            </div>
                                            <Separator/>
                                            <div>
                                                <Label className="text-xs text-purple-700 dark:text-purple-300">พื้นที่ผิวทั้งหมด (Total Surface Area)</Label>
                                                <p className="text-xl sm:text-2xl font-bold text-purple-900 dark:text-white">{f(results.totalSurfaceArea)} <span className="text-sm font-normal">หน่วย²</span></p>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                                <TabsContent value="steps">
                                    <div className="p-4 md:p-6 prose prose-sm dark:prose-invert max-w-none prose-h4:font-semibold prose-h4:mb-2 prose-h4:mt-4 prose-strong:text-blue-600 dark:prose-strong:text-blue-400 overflow-x-auto">
                                        <Latex delimiters={[{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }]}>
                                            {processedSteps}
                                        </Latex>
                                    </div>
                                </TabsContent>
                            </div>
                        </Tabs>

                        <div className="flex-shrink-0 flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 border-t dark:border-slate-700 rounded-b-2xl">
                            <Button variant="ghost" onClick={shareCalculation}><Share2 className="mr-2 h-4 w-4" /> แชร์ผลลัพธ์</Button>
                            <Button onClick={onClose}>ปิด</Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

// --- MAIN APPLICATION COMPONENT ---
export default function VolumeCalculator() {
    const [selectedShape, setSelectedShape] = useState<Shape>('cone');
    const [inputValues, setInputValues] = useState<{ [key: string]: string }>({});
    const [isResultsModalOpen, setResultsModalOpen] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const shapeKey = params.get('shape') as Shape;
        if (shapeKey && shapeConfig[shapeKey]) {
            setSelectedShape(shapeKey);
            const newValues = {};
            shapeConfig[shapeKey].inputs.forEach(inputField => {
                const value = params.get(inputField.key);
                if (value) { newValues[inputField.key] = value; }
            });
            setInputValues(newValues);
        }
    }, []);

    const results = useMemo(() => {
        return shapeConfig[selectedShape].calculate(inputValues) || { volume: 0, lateralSurfaceArea: 0, totalSurfaceArea: 0, steps: "" };
    }, [selectedShape, inputValues]);
    
    const isInputValid = useMemo(() => {
      const inputs = shapeConfig[selectedShape].inputs;
      if (inputs.length === 0) return true;
      return inputs.every(inputField => {
        const val = parseFloat(inputValues[inputField.key]);
        return !isNaN(val) && val > 0;
      });
    }, [inputValues, selectedShape]);

    return (
        <TooltipProvider>
            <div className="container mx-auto p-4 sm:p-6 md:p-8 font-sans">
                <Card className="max-w-4xl mx-auto shadow-2xl rounded-3xl overflow-hidden border">
                    <CardHeader className="bg-slate-50 dark:bg-slate-900/50 p-6 sm:p-8 border-b">
                        <div className="flex items-center space-x-4">
                            <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-3 rounded-2xl shadow-lg"><Calculator className="h-8 w-8 text-white" /></div>
                            <div>
                                <CardTitle className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white">เครื่องคำนวณเรขาคณิต 3D</CardTitle>
                                <CardDescription className="text-slate-600 dark:text-slate-400 mt-1">คำนวณปริมาตรและพื้นที่ผิวของรูปทรงต่างๆ</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 lg:p-8">
                        <div className="flex flex-col gap-6">
                            <div>
                                <Label className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-2 block">1. เลือกรูปทรง</Label>
                                <Select onValueChange={(v) => { setSelectedShape(v as Shape); setInputValues({}); }} value={selectedShape}>
                                    <SelectTrigger className="w-full text-base py-6 rounded-xl"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(shapeConfig).map(([key, { name, icon: Icon }]) => (
                                            <SelectItem key={key} value={key} className="text-base py-2"><div className="flex items-center"><Icon className="h-5 w-5 mr-3 text-slate-500" />{name}</div></SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
                                <div className="bg-gradient-to-br from-slate-100 to-gray-200 dark:from-slate-800 dark:to-slate-900/50 p-4 rounded-2xl h-52 flex items-center justify-center border shadow-inner order-last lg:order-first">
                                    {shapeConfig[selectedShape].svg(inputValues)}
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <Label className="text-base font-semibold text-slate-700 dark:text-slate-300">2. ป้อนค่า</Label>
                                        <Tooltip>
                                            <TooltipTrigger asChild><Button variant="ghost" size="sm" onClick={() => setInputValues({})}><Trash2 className="h-4 w-4 mr-1.5" />ล้างค่า</Button></TooltipTrigger>
                                            <TooltipContent><p>ล้างข้อมูลที่ป้อนทั้งหมด</p></TooltipContent>
                                        </Tooltip>
                                    </div>
                                    <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border">
                                        {shapeConfig[selectedShape].inputs.map((inputField) => (
                                            <div key={inputField.key} className="grid grid-cols-3 items-center gap-4">
                                                <Label htmlFor={inputField.key} className="text-sm font-medium text-slate-600 dark:text-slate-400 text-right">{inputField.name}</Label>
                                                <Input id={inputField.key} name={inputField.key} type="number" placeholder={`ค่า...`} value={inputValues[inputField.key] || ''} onChange={(e) => setInputValues(prev => ({ ...prev, [e.target.name]: e.target.value }))} className="col-span-2 text-base py-5 rounded-lg" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="pt-4">
                                <Button size="lg" className="w-full py-7 text-lg rounded-xl" onClick={() => setResultsModalOpen(true)} disabled={!isInputValid}>
                                    <CheckCircle className="mr-2 h-5 w-5" /> คำนวณและดูผลลัพธ์
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <ResultsModal isOpen={isResultsModalOpen} onClose={() => setResultsModalOpen(false)} shape={selectedShape} values={inputValues} results={results} />
            </div>
        </TooltipProvider>
    );
}