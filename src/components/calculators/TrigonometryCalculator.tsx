import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calculator, RotateCcw, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

interface TriangleResults {
  sides: { a: number; b: number; c: number };
  angles: { A: number; B: number; C: number };
  area: number;
  perimeter: number;
}

const TrigonometryCalculator = () => {
  // Pythagorean Calculator State
  const [pythagorean, setPythagorean] = useState({ a: '', b: '', c: '' });
  
  // Right Triangle Calculator State
  const [rightTriangle, setRightTriangle] = useState({
    side1: '', side2: '', side3: '',
    angle1: '', angle2: '', angle3: '',
    hypotenuse: ''
  });
  
  // General Triangle Calculator State
  const [generalTriangle, setGeneralTriangle] = useState({
    sideA: '', sideB: '', sideC: '',
    angleA: '', angleB: '', angleC: ''
  });

  // Calculate Pythagorean Theorem
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

  // Calculate Right Triangle using SOH-CAH-TOA
  const rightTriangleResult = useMemo(() => {
    const { side1, side2, angle1 } = rightTriangle;
    const s1 = parseFloat(side1);
    const s2 = parseFloat(side2);
    const a1 = parseFloat(angle1);

    if (s1 && a1 && !s2) {
      // Given one side and one angle
      const angleRad = (a1 * Math.PI) / 180;
      const otherAngle = 90 - a1;
      
      let opposite, adjacent, hypotenuse;
      
      if (a1 < 90) {
        // Assume s1 is adjacent to angle a1
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

  // Calculate General Triangle using Sine and Cosine Rules
  const generalTriangleResult = useMemo(() => {
    const a = parseFloat(generalTriangle.sideA);
    const b = parseFloat(generalTriangle.sideB);
    const c = parseFloat(generalTriangle.sideC);
    const A = parseFloat(generalTriangle.angleA);
    const B = parseFloat(generalTriangle.angleB);
    const C = parseFloat(generalTriangle.angleC);

    // Case: Two sides and included angle (SAS)
    if (a && b && C) {
      const angleC = (C * Math.PI) / 180;
      const sideC = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(angleC));
      
      // Find other angles using sine rule
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

    // Case: Two angles and one side (AAS or ASA)
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
              เครื่องคำนวณตรีโกณมิติ
            </CardTitle>
            <CardDescription className="text-base">
              คำนวณพีทาโกรัส, สามเหลี่ยมมุมฉาก (SOH-CAH-TOA), และกฎของไซน์/โคไซน์
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6">
            <Tabs defaultValue="pythagorean" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="pythagorean" className="text-xs sm:text-sm">
                  ทฤษฎีพีทาโกรัส
                </TabsTrigger>
                <TabsTrigger value="right-triangle" className="text-xs sm:text-sm">
                  สามเหลี่ยมมุมฉาก
                </TabsTrigger>
                <TabsTrigger value="general-triangle" className="text-xs sm:text-sm">
                  สามเหลี่ยมทั่วไป
                </TabsTrigger>
              </TabsList>

              {/* Pythagorean Theorem Calculator */}
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

              {/* Right Triangle Calculator */}
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

              {/* General Triangle Calculator */}
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
                          <Label htmlFor="gt-angleB">มุม B (องศา)</Label>
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
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Quick Reference Guide */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="text-primary" />
              คู่มืออ้างอิงด่วน
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold">ทฤษฎีพีทาโกรัส</h4>
                <p>ใช้กับสามเหลี่ยมมุมฉากเท่านั้น</p>
                <p className="font-mono bg-white p-2 rounded">a² + b² = c²</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">SOH-CAH-TOA</h4>
                <p>สำหรับสามเหลี่ยมมุมฉาก</p>
                <div className="space-y-1">
                  <p className="font-mono bg-white p-1 rounded text-xs">sin = ตรงข้าม/ด้านตรง</p>
                  <p className="font-mono bg-white p-1 rounded text-xs">cos = ประชิด/ด้านตรง</p>
                  <p className="font-mono bg-white p-1 rounded text-xs">tan = ตรงข้าม/ประชิด</p>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">กฎไซน์/โคไซน์</h4>
                <p>สำหรับสามเหลี่ยมทุกแบบ</p>
                <div className="space-y-1">
                  <p className="font-mono bg-white p-1 rounded text-xs">a/sin(A) = b/sin(B)</p>
                  <p className="font-mono bg-white p-1 rounded text-xs">c² = a² + b² - 2ab cos(C)</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default TrigonometryCalculator;