// src/components/MathCalculator.tsx

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  Calculator, Plus, Minus, X, Divide, Equal, Delete, RotateCcw,
  Hash, Sigma, Pi, Infinity, Square, SquareRoot, Power, LogIn,
  ArrowUp, ArrowDown, ShuffleIcon, SortAsc, SortDesc, TrendingUp,
  Zap, ToggleLeft, ToggleRight, CheckCircle, XCircle, AlertCircle,
  Binary, FileText, BookOpen, Lightbulb, Settings, Download,
  Copy, Check, History, Play, Pause, RefreshCw, Target,
  MoreHorizontal, ChevronLeft, ChevronRight, Menu, Grid3X3,
  HelpCircle, Info, Sparkles, Award, Users, Clock, Percent
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useIsMobile } from '@/hooks/use-mobile';
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

// --- Enhanced Tutorial Component ---
const TutorialTooltip = ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <div 
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="cursor-help"
      >
        {children}
      </div>
      
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl border"
          >
            <div className="font-semibold mb-1">{title}</div>
            <div className="text-gray-300">{description}</div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Enhanced Scientific Calculator Component ---
const ScientificCalculator = () => {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [showHelp, setShowHelp] = useState(false);

  const calculate = useCallback((firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case '+': return firstValue + secondValue;
      case '-': return firstValue - secondValue;
      case '*': return firstValue * secondValue;
      case '/': return secondValue !== 0 ? firstValue / secondValue : NaN;
      case '^': return Math.pow(firstValue, secondValue);
      case 'mod': return firstValue % secondValue;
      case 'log': return Math.log10(firstValue);
      case 'ln': return Math.log(firstValue);
      case 'Percent': return firstValue * (secondValue / 100);
      default: return secondValue;
    }
  }, []);

  const inputNumber = useCallback((num: string) => {
    if (waitingForNewValue) {
      setDisplay(num);
      setWaitingForNewValue(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  }, [display, waitingForNewValue]);

  const inputOperation = useCallback((nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);
      
      setDisplay(String(newValue));
      setPreviousValue(newValue);
      setHistory(prev => [...prev, `${currentValue} ${operation} ${inputValue} = ${newValue}`]);
    }

    setWaitingForNewValue(true);
    setOperation(nextOperation);
  }, [display, previousValue, operation, calculate]);

  const performCalculation = useCallback(() => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(String(newValue));
      setHistory(prev => [...prev, `${previousValue} ${operation} ${inputValue} = ${newValue}`]);
      setPreviousValue(null);
      setOperation(null);
      setWaitingForNewValue(true);
    }
  }, [display, previousValue, operation, calculate]);

  const clear = useCallback(() => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNewValue(false);
  }, []);

  const scientificFunction = useCallback((func: string) => {
    const value = parseFloat(display);
    let result: number;

    switch (func) {
      case 'sin': result = Math.sin(value * Math.PI / 180); break;
      case 'cos': result = Math.cos(value * Math.PI / 180); break;
      case 'tan': result = Math.tan(value * Math.PI / 180); break;
      case 'sqrt': result = Math.sqrt(value); break;
      case 'square': result = value * value; break;
      case 'factorial': 
        result = value >= 0 && value <= 170 ? Array.from({length: value}, (_, i) => i + 1).reduce((a, b) => a * b, 1) : NaN;
        break;
      case 'log': result = Math.log10(value); break;
      case 'ln': result = Math.log(value); break;
      case '1/x': result = 1 / value; break;
      case 'pi': result = Math.PI; break;
      case 'e': result = Math.E; break;
      default: result = value;
    }

    setDisplay(String(result));
    setHistory(prev => [...prev, `${func}(${value}) = ${result}`]);
    setWaitingForNewValue(true);
  }, [display]);

  return (
    <div className="space-y-4">
      {/* Tutorial Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                💡 วิธีใช้: กดตัวเลข → เลือกฟังก์ชัน → กด = เพื่อดูผลลัพธ์
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowHelp(!showHelp)}
              className="text-blue-600 hover:text-blue-700"
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
          </div>
          
          <AnimatePresence>
            {showHelp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700"
              >
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 text-xs text-blue-600 dark:text-blue-400">
                  <div>• <strong>sin, cos, tan:</strong> ฟังก์ชันตรีโกณมิติ</div>
                  <div>• <strong>√, x²:</strong> รากที่สอง, ยกกำลังสอง</div>
                  <div>• <strong>log, ln:</strong> ลอการิทึม ฐาน 10, e</div>
                  <div>• <strong>π, e:</strong> ค่าคงที่ทางคณิตศาสตร์</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Enhanced Display */}
      <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white shadow-2xl">
        <CardContent className="p-6">
          <div className="text-right space-y-3">
            <div className="text-sm opacity-60 h-6 font-mono">
              {operation && previousValue !== null && (
                <span className="bg-blue-600/20 px-2 py-1 rounded">
                  {previousValue} {operation}
                </span>
              )}
            </div>
            <div className="text-3xl xs:text-4xl sm:text-5xl font-mono font-bold break-all min-h-[1.2em] flex items-center justify-end">
              <span className={cn(
                "transition-all duration-300",
                waitingForNewValue && "text-blue-400"
              )}>
                {display}
              </span>
            </div>
            <div className="text-xs opacity-50">
              เครื่องคิดเลขวิทยาศาสตร์ • กด ? เพื่อดูวิธีใช้
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 xs:grid-cols-4 gap-2">
        <TutorialTooltip title="ล้างข้อมูล" description="ล้างหน้าจอและเริ่มใหม่">
          <Button variant="destructive" onClick={clear} className="h-12 text-sm font-semibold">
            <RotateCcw className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </TutorialTooltip>
        
        <TutorialTooltip title="ลบตัวอักษร" description="ลบตัวเลขตัวสุดท้าย">
          <Button 
            variant="secondary" 
            onClick={() => setDisplay(display.slice(0, -1) || '0')} 
            className="h-12 text-sm font-semibold"
          >
            <Delete className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </TutorialTooltip>
        
        <TutorialTooltip title="ค่า Pi" description="แทรกค่า π (3.14159...)">
          <Button 
            variant="outline" 
            onClick={() => scientificFunction('pi')} 
            className="h-12 text-sm font-semibold"
          >
            <Pi className="w-4 h-4 mr-1" />
            π
          </Button>
        </TutorialTooltip>
        
        <TutorialTooltip title="ค่า e" description="แทรกค่า e (2.71828...)">
          <Button 
            variant="outline" 
            onClick={() => scientificFunction('e')} 
            className="h-12 text-sm font-semibold"
          >
            e
          </Button>
        </TutorialTooltip>
      </div>

      {/* Scientific Functions with Categories */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-medium text-purple-700 dark:text-purple-300">ฟังก์ชันตรีโกณมิติ</span>
        </div>
        <div className="grid grid-cols-3 xs:grid-cols-6 gap-2">
          {[
            { func: 'sin', label: 'sin', desc: 'ไซน์' },
            { func: 'cos', label: 'cos', desc: 'โคไซน์' },
            { func: 'tan', label: 'tan', desc: 'แทนเจนต์' },
            { func: 'log', label: 'log', desc: 'ลอการิทึม ฐาน 10' },
            { func: 'ln', label: 'ln', desc: 'ลอการิทึม ธรรมชาติ' },
            { func: 'sqrt', label: '√', desc: 'รากที่สอง' }
          ].map(({ func, label, desc }) => (
            <TutorialTooltip key={func} title={label} description={desc}>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => scientificFunction(func)} 
                className="h-10 xs:h-12 text-xs xs:text-sm font-semibold hover:bg-purple-50 dark:hover:bg-purple-950/20"
              >
                {label}
              </Button>
            </TutorialTooltip>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-700 dark:text-green-300">ฟังก์ชันขั้นสูง</span>
        </div>
        <div className="grid grid-cols-3 xs:grid-cols-6 gap-2">
          {[
            { func: 'square', label: 'x²', desc: 'ยกกำลังสอง' },
            { func: '^', label: 'x^y', desc: 'ยกกำลัง y', isOperation: true },
            { func: 'factorial', label: 'x!', desc: 'แฟกทอเรียล' },
            { func: '1/x', label: '1/x', desc: 'หนึ่งหารด้วย x' },
            { func: 'mod', label: 'mod', desc: 'หารเอาเศษ', isOperation: true },
            { func: 'Percent', label: '%', desc: 'เปอร์เซ็นต์', isOperation: true }
          ].map(({ func, label, desc, isOperation }) => (
            <TutorialTooltip key={func} title={label} description={desc}>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => isOperation ? inputOperation(func) : scientificFunction(func)} 
                className="h-10 xs:h-12 text-xs xs:text-sm font-semibold hover:bg-green-50 dark:hover:bg-green-950/20"
              >
                {label}
              </Button>
            </TutorialTooltip>
          ))}
        </div>
      </div>

      {/* Enhanced Basic Calculator */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">เครื่องคิดเลขพื้นฐาน</span>
        </div>
        
        <div className="grid grid-cols-4 gap-3">
          {[
            { row: ['7', '8', '9', '/'], colors: ['number', 'number', 'number', 'operation'] },
            { row: ['4', '5', '6', '*'], colors: ['number', 'number', 'number', 'operation'] },
            { row: ['1', '2', '3', '-'], colors: ['number', 'number', 'number', 'operation'] },
            { row: ['0', '.', '=', '+'], colors: ['number', 'number', 'equals', 'operation'] }
          ].map((rowData, rowIndex) => (
            rowData.row.map((button, colIndex) => {
              const colorType = rowData.colors[colIndex];
              const isEquals = button === '=';
              const isZero = button === '0';
              const isOperation = colorType === 'operation';
              
              return (
                <Button
                  key={`${rowIndex}-${colIndex}`}
                  variant={colorType === 'equals' ? 'default' : colorType === 'operation' ? 'secondary' : 'outline'}
                  size="lg"
                  className={cn(
                    "h-14 xs:h-16 text-lg xs:text-xl font-bold transition-all duration-200 active:scale-95",
                    isZero && "col-span-2",
                    isEquals && "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg",
                    isOperation && "bg-blue-500 hover:bg-blue-600 text-white",
                    colorType === 'number' && "hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                  onClick={() => {
                    if (button === '=') {
                      performCalculation();
                    } else if (isOperation || button === '=') {
                      inputOperation(button);
                    } else {
                      inputNumber(button);
                    }
                  }}
                >
                  {button}
                </Button>
              );
            })
          ))}
        </div>
      </div>

      {/* Enhanced History */}
      {history.length > 0 && (
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-amber-600" />
                ประวัติการคำนวณ ({history.length} รายการ)
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setHistory([])}
                className="text-amber-600 hover:text-amber-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 max-h-40 overflow-y-auto">
            {history.slice(-5).reverse().map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs font-mono p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg text-right border border-amber-200/50 hover:shadow-md transition-all cursor-pointer"
                onClick={() => {
                  const result = item.split(' = ')[1];
                  setDisplay(result);
                  toast({ title: "คัดลอกผลลัพธ์", description: `ใช้ค่า ${result}`, variant: "success" });
                }}
              >
                <div className="flex items-center justify-between">
                  <Clock className="w-3 h-3 text-amber-500" />
                  <span className="text-amber-700 dark:text-amber-300">{item}</span>
                </div>
              </motion.div>
            ))}
            <div className="text-xs text-amber-600 dark:text-amber-400 text-center pt-2 border-t border-amber-200 dark:border-amber-700">
              คลิกที่ผลลัพธ์เพื่อใช้ค่านั้นต่อ
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// --- Enhanced Array Sorter Component ---
const ArraySorter = () => {
  const [numbers, setNumbers] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortedResult, setSortedResult] = useState<number[]>([]);
  const [originalArray, setOriginalArray] = useState<number[]>([]);
  const [showSteps, setShowSteps] = useState(false);

  const sortArray = useCallback(() => {
    try {
      const numArray = numbers.split(',').map(n => parseFloat(n.trim())).filter(n => !isNaN(n));
      if (numArray.length === 0) {
        toast({ title: "❌ ข้อผิดพลาด", description: "กรุณาใส่ตัวเลขที่ถูกต้อง เช่น: 5, 2, 8, 1", variant: "destructive" });
        return;
      }
      
      setOriginalArray([...numArray]);
      const sorted = [...numArray].sort((a, b) => sortOrder === 'asc' ? a - b : b - a);
      setSortedResult(sorted);
      setShowSteps(true);
      
      toast({ 
        title: "✅ เรียงลำดับสำเร็จ!", 
        description: `เรียงลำดับ ${numArray.length} ตัวเลข${sortOrder === 'asc' ? 'จากน้อยไปมาก' : 'จากมากไปน้อย'}`,
        variant: "success" 
      });
    } catch (error) {
      toast({ title: "❌ ข้อผิดพลาด", description: "รูปแบบข้อมูลไม่ถูกต้อง", variant: "destructive" });
    }
  }, [numbers, sortOrder]);

  const exampleArrays = [
    "5, 2, 8, 1, 9, 3",
    "100, 50, 75, 25, 90",
    "3.5, 1.2, 7.8, 2.1, 9.9"
  ];

  return (
    <div className="space-y-4">
      {/* Tutorial */}
      <Alert className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
        <Lightbulb className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-700 dark:text-green-300">
          <strong>💡 วิธีใช้:</strong> ใส่ตัวเลขคั่นด้วยเครื่องหมายจุลภาค (,) เช่น: 5, 2, 8, 1, 9
        </AlertDescription>
      </Alert>

      <Card className="bg-gradient-to-br from-white to-green-50/50 dark:from-gray-900 dark:to-green-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <SortAsc className="w-5 h-5 text-green-600" />
            🔢 เครื่องเรียงลำดับตัวเลข
          </CardTitle>
          <CardDescription>
            เครื่องมือเรียงลำดับตัวเลขจากน้อยไปมาก หรือ มากไปน้อย
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Input Section */}
          <div className="space-y-3">
            <Label htmlFor="numbers" className="text-base font-medium flex items-center gap-2">
              <Hash className="w-4 h-4" />
              ใส่ตัวเลขที่ต้องการเรียง
            </Label>
            <Textarea
              id="numbers"
              placeholder="ใส่ตัวเลขคั่นด้วยเครื่องหมายจุลภาค เช่น: 5, 2, 8, 1, 9, 3"
              value={numbers}
              onChange={(e) => setNumbers(e.target.value)}
              className="h-16 text-base"
            />
            
            {/* Quick Examples */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">ตัวอย่าง:</span>
              {exampleArrays.map((example, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setNumbers(example)}
                  className="text-xs h-8"
                >
                  {example}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="space-y-2 flex-1">
              <Label htmlFor="sort-order" className="text-sm font-medium">เลือกการเรียงลำดับ</Label>
              <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">
                    <div className="flex items-center gap-2">
                      <ArrowUp className="w-4 h-4" />
                      น้อยไปมาก (1→9)
                    </div>
                  </SelectItem>
                  <SelectItem value="desc">
                    <div className="flex items-center gap-2">
                      <ArrowDown className="w-4 h-4" />
                      มากไปน้อย (9→1)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={sortArray} 
              className="w-full sm:w-auto h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold shadow-lg"
              disabled={!numbers.trim()}
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              เรียงลำดับเลย!
            </Button>
          </div>

          {/* Results */}
          <AnimatePresence>
            {showSteps && originalArray.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {/* Before */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    ก่อนเรียง ({originalArray.length} ตัว)
                  </Label>
                  <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="flex flex-wrap gap-2">
                      {originalArray.map((num, index) => (
                        <motion.div
                          key={index}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Badge variant="destructive" className="text-sm px-3 py-1">
                            {num}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <ArrowDown className="w-6 h-6" />
                    <span className="text-sm font-medium">เรียงลำดับ</span>
                    <ArrowDown className="w-6 h-6" />
                  </div>
                </div>

                {/* After */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    หลังเรียง ({sortedResult.length} ตัว) - {sortOrder === 'asc' ? 'น้อยไปมาก' : 'มากไปน้อย'}
                  </Label>
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {sortedResult.map((num, index) => (
                        <motion.div
                          key={index}
                          initial={{ scale: 0, y: 20 }}
                          animate={{ scale: 1, y: 0 }}
                          transition={{ delay: index * 0.1 + 0.5 }}
                        >
                          <Badge variant="default" className="text-sm px-3 py-1 bg-green-600">
                            {num}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                        <Award className="w-4 h-4" />
                        <strong>ผลลัพธ์:</strong> {sortedResult.join(', ')}
                      </div>
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <Info className="w-4 h-4" />
                        <span>จำนวนตัวเลข: {sortedResult.length} ตัว | การเรียง: {sortOrder === 'asc' ? 'จากน้อยไปมาก' : 'จากมากไปน้อย'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Copy Result */}
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(sortedResult.join(', '));
                    toast({ title: "📋 คัดลอกแล้ว!", description: "คัดลอกผลลัพธ์ไปยังคลิปบอร์ดแล้ว", variant: "success" });
                  }}
                  className="w-full"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  คัดลอกผลลัพธ์
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
};

// --- Enhanced Logic Calculator ---
const LogicCalculator = () => {
  const [inputA, setInputA] = useState(false);
  const [inputB, setInputB] = useState(false);
  const [gateType, setGateType] = useState<'AND' | 'OR' | 'NOT' | 'NAND' | 'NOR' | 'XOR'>('AND');
  const [showTruthTable, setShowTruthTable] = useState(true);

  const gateInfo = {
    AND: { desc: 'ทั้งสองต้องเป็น TRUE', symbol: '∧', example: '1 AND 1 = 1' },
    OR: { desc: 'อย่างน้อยหนึ่งตัวเป็น TRUE', symbol: '∨', example: '0 OR 1 = 1' },
    NOT: { desc: 'กลับค่า TRUE/FALSE', symbol: '¬', example: 'NOT 1 = 0' },
    NAND: { desc: 'ตรงข้าม AND', symbol: '↑', example: '1 NAND 1 = 0' },
    NOR: { desc: 'ตรงข้าม OR', symbol: '↓', example: '0 NOR 0 = 1' },
    XOR: { desc: 'ต่างกันถึงจะ TRUE', symbol: '⊕', example: '1 XOR 0 = 1' }
  };

  const calculateLogic = useCallback((a: boolean, b: boolean, gate: string): boolean => {
    switch (gate) {
      case 'AND': return a && b;
      case 'OR': return a || b;
      case 'NOT': return !a;
      case 'NAND': return !(a && b);
      case 'NOR': return !(a || b);
      case 'XOR': return a !== b;
      default: return false;
    }
  }, []);

  const result = useMemo(() => calculateLogic(inputA, inputB, gateType), [inputA, inputB, gateType, calculateLogic]);

  const LogicGateVisual = () => (
    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
      <CardContent className="p-6">
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-6">
            {/* Inputs */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="text-sm font-medium w-12">Input A:</div>
                <div className={cn(
                  "w-12 h-12 rounded-full border-4 flex items-center justify-center text-lg font-bold transition-all duration-300",
                  inputA 
                    ? "bg-green-500 border-green-600 text-white shadow-lg shadow-green-500/30" 
                    : "bg-red-500 border-red-600 text-white shadow-lg shadow-red-500/30"
                )}>
                  {inputA ? "1" : "0"}
                </div>
              </div>
              
              {gateType !== 'NOT' && (
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium w-12">Input B:</div>
                  <div className={cn(
                    "w-12 h-12 rounded-full border-4 flex items-center justify-center text-lg font-bold transition-all duration-300",
                    inputB 
                      ? "bg-green-500 border-green-600 text-white shadow-lg shadow-green-500/30" 
                      : "bg-red-500 border-red-600 text-white shadow-lg shadow-red-500/30"
                  )}>
                    {inputB ? "1" : "0"}
                  </div>
                </div>
              )}
            </div>
            
            {/* Gate */}
            <div className="mx-8">
              <div className="px-6 py-4 bg-white dark:bg-gray-800 rounded-xl border-4 border-gray-300 dark:border-gray-600 shadow-xl">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{gateType}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{gateInfo[gateType].symbol}</div>
                </div>
              </div>
            </div>
            
            {/* Output */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-center">Output:</div>
              <div className={cn(
                "w-16 h-16 rounded-full border-4 flex items-center justify-center text-xl font-bold transition-all duration-500 transform",
                result 
                  ? "bg-green-500 border-green-600 text-white shadow-lg shadow-green-500/30 scale-110" 
                  : "bg-red-500 border-red-600 text-white shadow-lg shadow-red-500/30"
              )}>
                {result ? "1" : "0"}
              </div>
            </div>
          </div>
        </div>
        
        {/* Description */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Info className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-700 dark:text-blue-300">{gateInfo[gateType].desc}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Tutorial */}
      <Alert className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border-yellow-200 dark:border-yellow-800">
        <Zap className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-700 dark:text-yellow-300">
          <strong>⚡ วิธีใช้:</strong> เลือก Logic Gate → ตั้งค่า Input A และ B → ดูผลลัพธ์ที่ Output
        </AlertDescription>
      </Alert>

      <Card className="bg-gradient-to-br from-white to-yellow-50/50 dark:from-gray-900 dark:to-yellow-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="w-5 h-5 text-yellow-600" />
            ⚡ เครื่องคำนวณวงจรลอจิก
          </CardTitle>
          <CardDescription>
            จำลองการทำงานของ Logic Gates ในวงจรดิจิทัล
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Gate Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium flex items-center gap-2">
              <Target className="w-4 h-4" />
              เลือกประเภท Logic Gate
            </Label>
            <div className="grid grid-cols-2 xs:grid-cols-3 gap-3">
              {(Object.keys(gateInfo) as Array<keyof typeof gateInfo>).map((gate) => (
                <TutorialTooltip 
                  key={gate} 
                  title={`${gate} Gate`} 
                  description={gateInfo[gate].desc}
                >
                  <Button
                    variant={gateType === gate ? 'default' : 'outline'}
                    size="lg"
                    onClick={() => setGateType(gate)}
                    className={cn(
                      "h-16 flex-col gap-1 transition-all duration-200",
                      gateType === gate && "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg"
                    )}
                  >
                    <span className="text-lg font-bold">{gate}</span>
                    <span className="text-xs opacity-75">{gateInfo[gate].symbol}</span>
                  </Button>
                </TutorialTooltip>
              ))}
            </div>
          </div>

          {/* Input Controls */}
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Label className="text-base font-medium">Input A</Label>
              <div className="flex items-center gap-4 p-4 border-2 border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50/50 dark:bg-blue-950/20">
                <Switch
                  checked={inputA}
                  onCheckedChange={setInputA}
                  className="data-[state=checked]:bg-green-500"
                />
                <div className="flex-1">
                  <div className="text-lg font-bold">
                    {inputA ? '🟢 TRUE (1)' : '🔴 FALSE (0)'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    คลิกสวิตช์เพื่อเปลี่ยนค่า
                  </div>
                </div>
              </div>
            </div>

            {gateType !== 'NOT' && (
              <div className="space-y-4">
                <Label className="text-base font-medium">Input B</Label>
                <div className="flex items-center gap-4 p-4 border-2 border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50/50 dark:bg-blue-950/20">
                  <Switch
                    checked={inputB}
                    onCheckedChange={setInputB}
                    className="data-[state=checked]:bg-green-500"
                  />
                  <div className="flex-1">
                    <div className="text-lg font-bold">
                      {inputB ? '🟢 TRUE (1)' : '🔴 FALSE (0)'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      คลิกสวิตช์เพื่อเปลี่ยนค่า
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Logic Gate Visualization */}
          <LogicGateVisual />

          {/* Result Display */}
          <Card className={cn(
            "transition-all duration-500",
            result 
              ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800" 
              : "bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-red-200 dark:border-red-800"
          )}>
            <CardContent className="p-6 text-center">
              <div className="space-y-3">
                <div className="text-2xl font-bold">
                  🎯 ผลลัพธ์: <span className={result ? "text-green-600" : "text-red-600"}>
                    {result ? 'TRUE (1)' : 'FALSE (0)'}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {gateType === 'NOT' 
                    ? `NOT ${inputA ? '1' : '0'} = ${result ? '1' : '0'}`
                    : `${inputA ? '1' : '0'} ${gateType} ${inputB ? '1' : '0'} = ${result ? '1' : '0'}`
                  }
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Truth Table Toggle */}
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">แสดงตารางความจริง (Truth Table)</Label>
            <Switch
              checked={showTruthTable}
              onCheckedChange={setShowTruthTable}
            />
          </div>

          {/* Truth Table */}
          <AnimatePresence>
            {showTruthTable && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-purple-600" />
                      📊 ตารางความจริง - {gateType} Gate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-center border-collapse">
                        <thead>
                          <tr className="border-b-2 border-purple-200 dark:border-purple-700">
                            <th className="p-3 font-bold text-purple-700 dark:text-purple-300">Input A</th>
                            {gateType !== 'NOT' && <th className="p-3 font-bold text-purple-700 dark:text-purple-300">Input B</th>}
                            <th className="p-3 font-bold text-purple-700 dark:text-purple-300">Output</th>
                          </tr>
                        </thead>
                        <tbody>
                          {gateType === 'NOT' ? (
                            [[false], [true]].map(([a], index) => (
                              <tr key={index} className={cn(
                                "border-b border-purple-100 dark:border-purple-800 transition-all duration-300",
                                a === inputA && "bg-purple-200 dark:bg-purple-900/40 font-bold scale-105"
                              )}>
                                <td className="p-3">{a ? '1' : '0'}</td>
                                <td className={cn(
                                  "p-3 text-lg font-bold",
                                  calculateLogic(a, false, gateType) ? "text-green-600" : "text-red-600"
                                )}>
                                  {calculateLogic(a, false, gateType) ? '1' : '0'}
                                </td>
                              </tr>
                            ))
                          ) : (
                            [[false, false], [false, true], [true, false], [true, true]].map(([a, b], index) => (
                              <tr key={index} className={cn(
                                "border-b border-purple-100 dark:border-purple-800 transition-all duration-300",
                                a === inputA && b === inputB && "bg-purple-200 dark:bg-purple-900/40 font-bold scale-105"
                              )}>
                                <td className="p-3">{a ? '1' : '0'}</td>
                                <td className="p-3">{b ? '1' : '0'}</td>
                                <td className={cn(
                                  "p-3 text-lg font-bold",
                                  calculateLogic(a, b, gateType) ? "text-green-600" : "text-red-600"
                                )}>
                                  {calculateLogic(a, b, gateType) ? '1' : '0'}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 text-sm text-purple-600 dark:text-purple-400 text-center">
                      แถวที่เน้นแสดงค่าปัจจุบันของ Input
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
};

// --- Enhanced Math Tools ---
const MathTools = () => {
  const [baseInput, setBaseInput] = useState('');
  const [fromBase, setFromBase] = useState('10');
  const [toBase, setToBase] = useState('2');
  const [convertedResult, setConvertedResult] = useState('');
  const [showSteps, setShowSteps] = useState(false);

  const baseInfo = {
    '2': { name: 'Binary (ไบนารี)', desc: 'ระบบเลขฐาน 2 (0,1)', example: '1010' },
    '8': { name: 'Octal (ออกทัล)', desc: 'ระบบเลขฐาน 8 (0-7)', example: '755' },
    '10': { name: 'Decimal (เดซิมอล)', desc: 'ระบบเลขฐาน 10 (0-9)', example: '123' },
    '16': { name: 'Hexadecimal (เฮกซา)', desc: 'ระบบเลขฐาน 16 (0-9,A-F)', example: 'FF' }
  };

  const convertBase = useCallback(() => {
    try {
      if (!baseInput.trim()) {
        toast({ title: "❌ ข้อผิดพลาด", description: "กรุณาใส่ตัวเลขที่ต้องการแปลง", variant: "destructive" });
        return;
      }

      const decimal = parseInt(baseInput.replace(/\s/g, ''), parseInt(fromBase));
      if (isNaN(decimal)) {
        toast({ title: "❌ ข้อผิดพลาด", description: `รูปแบบตัวเลขไม่ถูกต้องสำหรับฐาน ${fromBase}`, variant: "destructive" });
        return;
      }
      
      const result = decimal.toString(parseInt(toBase));
      setConvertedResult(result.toUpperCase());
      setShowSteps(true);
      
      toast({ 
        title: "✅ แปลงสำเร็จ!", 
        description: `${baseInput} (ฐาน ${fromBase}) = ${result.toUpperCase()} (ฐาน ${toBase})`,
        variant: "success" 
      });
    } catch (error) {
      toast({ title: "❌ ข้อผิดพลาด", description: "ไม่สามารถแปลงได้", variant: "destructive" });
    }
  }, [baseInput, fromBase, toBase]);

  const exampleNumbers = {
    '2': ['1010', '1111', '10101'],
    '8': ['755', '644', '777'],
    '10': ['255', '100', '1024'],
    '16': ['FF', 'A0', 'C4']
  };

  return (
    <div className="space-y-4">
      {/* Tutorial */}
      <Alert className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800">
        <Binary className="h-4 w-4 text-purple-600" />
        <AlertDescription className="text-purple-700 dark:text-purple-300">
          <strong>🔢 วิธีใช้:</strong> เลือกฐานต้นทาง → ใส่ตัวเลข → เลือกฐานปลายทาง → กดแปลง
        </AlertDescription>
      </Alert>

      <Card className="bg-gradient-to-br from-white to-purple-50/50 dark:from-gray-900 dark:to-purple-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Binary className="w-5 h-5 text-purple-600" />
            🔄 เครื่องแปลงระบบเลขฐาน
          </CardTitle>
          <CardDescription>
            แปลงตัวเลขระหว่างระบบเลขฐานต่างๆ (Binary, Octal, Decimal, Hexadecimal)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Base Selection and Input */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* From Base */}
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                <ArrowUp className="w-4 h-4 text-blue-600" />
                จากฐาน
              </Label>
              <Select value={fromBase} onValueChange={setFromBase}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(baseInfo).map(([base, info]) => (
                    <SelectItem key={base} value={base}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">ฐาน {base} - {info.name}</span>
                        <span className="text-xs text-muted-foreground">{info.desc}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Quick Examples */}
              <div className="flex flex-wrap gap-1">
                {exampleNumbers[fromBase as keyof typeof exampleNumbers]?.map((example, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setBaseInput(example)}
                    className="text-xs h-7"
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="space-y-3">
              <Label htmlFor="base-input" className="text-base font-medium flex items-center gap-2">
                <Hash className="w-4 h-4" />
                ตัวเลขที่ต้องการแปลง
              </Label>
              <Input
                id="base-input"
                placeholder={`ใส่ตัวเลขฐาน ${fromBase} เช่น: ${baseInfo[fromBase as keyof typeof baseInfo]?.example}`}
                value={baseInput}
                onChange={(e) => setBaseInput(e.target.value)}
                className="h-12 text-center text-lg font-mono"
              />
              <div className="text-xs text-muted-foreground text-center">
                {baseInfo[fromBase as keyof typeof baseInfo]?.desc}
              </div>
            </div>
            
            {/* To Base */}
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                <ArrowDown className="w-4 h-4 text-red-600" />
                ไปยังฐาน
              </Label>
              <Select value={toBase} onValueChange={setToBase}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(baseInfo).map(([base, info]) => (
                    <SelectItem key={base} value={base}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">ฐาน {base} - {info.name}</span>
                        <span className="text-xs text-muted-foreground">{info.desc}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Convert Button */}
          <Button 
            onClick={convertBase} 
            className="w-full h-14 text-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold shadow-lg"
            disabled={!baseInput.trim()}
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            🔄 แปลงระบบเลขเลย!
          </Button>

          {/* Results */}
          <AnimatePresence>
            {showSteps && convertedResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-6">
                    <div className="text-center space-y-4">
                      <div className="flex items-center justify-center gap-4">
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">ตัวเลขต้นทาง</div>
                          <div className="text-2xl font-mono font-bold text-blue-600">
                            {baseInput}
                            <span className="text-sm align-super text-muted-foreground ml-1">{fromBase}</span>
                          </div>
                        </div>
                        <ArrowRight className="w-6 h-6 text-purple-600" />
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">ผลลัพธ์การแปลง</div>
                          <div className="text-3xl font-mono font-bold text-purple-600">
                            {convertedResult}
                            <span className="text-sm align-super text-muted-foreground ml-1">{toBase}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300 mt-3">
                        <CheckCircle className="w-4 h-4 inline-block mr-2" />
                        แปลงสำเร็จ! {baseInfo[fromBase as keyof typeof baseInfo]?.name} เป็น {baseInfo[toBase as keyof typeof baseInfo]?.name}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Copy Result */}
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(convertedResult);
                    toast({ title: "📋 คัดลอกแล้ว!", description: "คัดลอกผลลัพธ์ไปยังคลิปบอร์ดแล้ว", variant: "success" });
                  }}
                  className="w-full"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  คัดลอกผลลัพธ์
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
};

// --- Main Math Calculator Component ---
const MathCalculator = () => {
  const [activeTab, setActiveTab] = useState('calculator');
  const isMobile = useIsMobile();

  const tabConfig = [
    { id: 'calculator', label: 'เครื่องคิดเลข', icon: Calculator, component: ScientificCalculator },
    { id: 'sorter', label: 'เรียงลำดับ', icon: SortAsc, component: ArraySorter },
    { id: 'logic', label: 'วงจรลอจิก', icon: Zap, component: LogicCalculator },
    { id: 'tools', label: 'เครื่องมือเพิ่มเติม', icon: Settings, component: MathTools },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50/30 to-blue-50/30 dark:from-gray-950 dark:to-blue-950/50">
      <div className="container mx-auto p-2 xs:p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 xs:space-y-6">
        {/* Header */}
        <div className="space-y-3 xs:space-y-4">
          <div className="text-center space-y-2">
            <h1 className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-900 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              🧮 เครื่องคำนวณคณิตศาสตร์
            </h1>
            <p className="text-xs xs:text-sm sm:text-base text-muted-foreground leading-relaxed">
              เครื่องมือคำนวณครบครัน สำหรับการเรียนและทำงานด้านคณิตศาสตร์
            </p>
          </div>
        </div>

        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 xs:gap-3 sm:gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50 border-blue-200/50 dark:border-blue-800/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-3 xs:p-4 text-center">
              <Calculator className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-xs xs:text-sm font-medium text-blue-700 dark:text-blue-300">เครื่องคิดเลข</p>
              <p className="text-lg xs:text-xl font-bold text-blue-900 dark:text-blue-100">Scientific</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/50 dark:to-emerald-950/50 border-green-200/50 dark:border-green-800/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-3 xs:p-4 text-center">
              <SortAsc className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="text-xs xs:text-sm font-medium text-green-700 dark:text-green-300">เรียงลำดับ</p>
              <p className="text-lg xs:text-xl font-bold text-green-900 dark:text-green-100">Array Sort</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-950/50 dark:to-orange-950/50 border-yellow-200/50 dark:border-yellow-800/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-3 xs:p-4 text-center">
              <Zap className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
              <p className="text-xs xs:text-sm font-medium text-yellow-700 dark:text-yellow-300">วงจรลอจิก</p>
              <p className="text-lg xs:text-xl font-bold text-yellow-900 dark:text-yellow-100">Logic Gates</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-950/50 dark:to-pink-950/50 border-purple-200/50 dark:border-purple-800/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-3 xs:p-4 text-center">
              <Settings className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <p className="text-xs xs:text-sm font-medium text-purple-700 dark:text-purple-300">เครื่องมือ</p>
              <p className="text-lg xs:text-xl font-bold text-purple-900 dark:text-purple-100">Math Tools</p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Tab Navigation */}
        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
          <CardContent className="p-3 xs:p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto p-1 bg-muted/50">
                {tabConfig.map(({ id, label, icon: Icon }) => (
                  <TabsTrigger
                    key={id}
                    value={id}
                    className={cn(
                      "flex flex-col xs:flex-row items-center gap-1 xs:gap-2 p-2 xs:p-3 text-xs xs:text-sm transition-all duration-200",
                      "data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800",
                      "data-[state=active]:shadow-md data-[state=active]:scale-105"
                    )}
                  >
                    <Icon className="w-4 h-4 xs:w-5 xs:h-5" />
                    <span className="font-medium leading-tight text-center xs:text-left">{label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Tab Content with Animation */}
              <div className="mt-4 xs:mt-6">
                <AnimatePresence mode="wait">
                  {tabConfig.map(({ id, component: Component }) => (
                    activeTab === id && (
                      <motion.div
                        key={id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <TabsContent value={id} className="mt-0">
                          <Component />
                        </TabsContent>
                      </motion.div>
                    )
                  ))}
                </AnimatePresence>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {/* Quick Access Features */}
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-200/50 dark:border-indigo-800/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg xs:text-xl flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              คุณสมบัติเด่น
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4">
              <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Calculator className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Scientific Calculator</p>
                  <p className="text-xs text-muted-foreground">ฟังก์ชันทางวิทยาศาสตร์</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <SortAsc className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Array Sorting</p>
                  <p className="text-xs text-muted-foreground">เรียงลำดับข้อมูล</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Logic Gates</p>
                  <p className="text-xs text-muted-foreground">วงจรดิจิทัลลอจิก</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <Binary className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Base Converter</p>
                  <p className="text-xs text-muted-foreground">แปลงระบบเลข</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Information */}
        <Card className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/30 border-gray-200/50 dark:border-gray-700/50">
          <CardContent className="p-4 xs:p-6 text-center">
            <div className="space-y-2">
              <p className="text-sm xs:text-base font-medium text-gray-700 dark:text-gray-300">
                🎓 เครื่องคำนวณคณิตศาสตร์ขั้นสูง
              </p>
              <p className="text-xs xs:text-sm text-muted-foreground">
                พัฒนาด้วยเทคโนโลยี React และ TypeScript • รองรับการใช้งานบนทุกอุปกรณ์
              </p>
              <div className="flex justify-center gap-4 mt-3">
                <Badge variant="secondary" className="text-xs">
                  🧮 Scientific Calculator
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  📊 Data Processing
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  ⚡ Logic Circuits
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MathCalculator;