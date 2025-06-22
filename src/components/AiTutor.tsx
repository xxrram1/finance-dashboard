// src/components/AiTutor.tsx

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Sparkles, BrainCircuit, Lightbulb, Loader2, ServerCrash, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AttachmentUploader } from './ui/AttachmentUploader'; // ADDED: Import the uploader

// Custom hook for a simulated typing effect
const useTypingEffect = (text: string, speed = 15) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (!text) {
      setDisplayedText('');
      return;
    };
    setDisplayedText(''); 
    let i = 0;
    const intervalId = setInterval(() => {
      if(i < text.length) {
        setDisplayedText(prev => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(intervalId);
      }
    }, speed);

    return () => clearInterval(intervalId);
  }, [text, speed]);

  return displayedText;
};


const AiTutor = () => {
  const [prompt, setPrompt] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null); // ADDED: State for the file
  const [apiResponse, setApiResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const displayedResponse = useTypingEffect(apiResponse, 10);

  const handleSubmit = async () => {
    // A prompt or a file is required to submit
    if (!prompt.trim() && !attachmentFile) return;
    setIsLoading(true);
    setApiResponse('');
    setError('');

    try {
      // Use FormData to send both text and file
      const formData = new FormData();
      formData.append('prompt', prompt);
      if (attachmentFile) {
        formData.append('file', attachmentFile);
      }

      const res = await fetch('/api/askGemini', {
        method: 'POST',
        body: formData, // Send FormData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์');
      }
      setApiResponse(data.answer);

    } catch (err: any) {
      console.error("Error fetching AI response:", err);
      setError(err.message || 'ไม่สามารถเชื่อมต่อกับ AI ได้ในขณะนี้');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-950 dark:to-gray-900 overflow-x-hidden">
      <div className="container mx-auto max-w-4xl px-4 py-8 sm:py-12">
        
        {/* --- Header --- */}
        <motion.header 
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center space-y-4 mb-12"
        >
          <div className="inline-block p-4 bg-white/50 dark:bg-slate-800/50 rounded-full shadow-lg backdrop-blur-sm">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-inner">
              <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            AI Tutor
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            คู่หูอัจฉริยะสำหรับทุกคำถามด้านคณิตศาสตร์และวิทยาศาสตร์ของคุณ
          </p>
        </motion.header>

        {/* --- Input Card --- */}
        <Card className="shadow-2xl rounded-2xl bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 mb-10">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl text-slate-800 dark:text-slate-100">
              <BrainCircuit className="w-7 h-7 text-indigo-500" />
              <span>สร้างสรรค์คำถามของคุณ</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Textarea
              placeholder="ใส่คำถามหรืออธิบายเกี่ยวกับรูปภาพที่แนบมา..."
              className="h-32 text-base sm:text-lg resize-none p-4 rounded-lg focus-visible:ring-indigo-500 bg-white/50 dark:bg-slate-900/50"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            
            {/* ADDED: Attachment Uploader Component is now here */}
            <AttachmentUploader onFileChange={setAttachmentFile} />

            <Button onClick={handleSubmit} disabled={isLoading} size="lg" className="w-full text-lg h-14 font-bold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg transition-transform hover:scale-105 active:scale-100">
              {isLoading ? (
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-6 w-6" />
              )}
              ส่งคำถาม
            </Button>
          </CardContent>
        </Card>
        
        {/* --- Output Section --- */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 space-y-4 py-8"
            >
                <Loader2 className="w-10 h-10 animate-spin" />
                <p className="text-lg font-medium">Gemini กำลังคิด...</p>
            </motion.div>
          )}

          {!isLoading && (error || apiResponse) && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <Card className="shadow-2xl rounded-2xl bg-white/80 dark:bg-slate-800/70 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl text-slate-800 dark:text-slate-100">
                    {error ? <ServerCrash className="w-7 h-7 text-red-500" /> : <Lightbulb className="w-7 h-7 text-yellow-400" />}
                    <span>{error ? 'เกิดข้อผิดพลาด' : 'คำตอบจาก AI'}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose prose-lg dark:prose-invert max-w-none text-slate-800 dark:text-slate-200">
                  {error ? (
                     <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-300">
                        {error}
                     </div>
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {displayedResponse}
                    </ReactMarkdown>
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