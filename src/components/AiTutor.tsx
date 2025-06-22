// src/components/AiTutor.tsx

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Sparkles, BrainCircuit, Lightbulb, Loader2, ServerCrash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AiTutor = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setResponse('');
    setError('');

    try {
      const res = await fetch('/api/askGemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์');
      }

      setResponse(data.answer);

    } catch (err: any) {
      console.error("Error fetching AI response:", err);
      setError(err.message || 'ไม่สามารถเชื่อมต่อกับ AI ได้ในขณะนี้');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-gray-950">
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4 mb-10"
        >
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
            AI Tutor
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            ใส่โจทย์คณิตศาสตร์หรือวิทยาศาสตร์ แล้วให้ Gemini AI ช่วยหาคำตอบพร้อมเหตุผล
          </p>
        </motion.div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="w-6 h-6 text-indigo-500" />
              ใส่โจทย์ของคุณที่นี่
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="เช่น: จงหาพื้นที่ของวงกลมที่มีรัศมี 7 เซนติเมตร หรือ อธิบายกระบวนการสังเคราะห์ด้วยแสง"
              className="h-32 text-base"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <Button onClick={handleSubmit} disabled={isLoading} className="w-full text-lg h-12">
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-5 w-5" />
              )}
              ถาม Gemini AI
            </Button>
          </CardContent>
        </Card>
        
        <AnimatePresence>
          {(response || error) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8"
            >
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {error ? <ServerCrash className="w-6 h-6 text-red-500" /> : <Lightbulb className="w-6 h-6 text-yellow-500" />}
                    {error ? 'เกิดข้อผิดพลาด' : 'คำตอบและเหตุผล'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none">
                  {error ? (
                     <pre className="whitespace-pre-wrap font-sans text-base p-4 bg-red-50 dark:bg-red-900/20 rounded-md text-red-700 dark:text-red-300">{error}</pre>
                  ) : (
                     <pre className="whitespace-pre-wrap font-sans text-base p-4 bg-slate-100 dark:bg-slate-800 rounded-md">{response}</pre>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AiTutor;