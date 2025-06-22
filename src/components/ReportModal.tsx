// src/components/ReportModal.tsx

import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Bug, MessageSquare, Loader2, CheckCircle, Lightbulb, Frown } from 'lucide-react'; // Added CheckCircle, Lightbulb, Frown
import { toast } from './ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion'; // Import AnimatePresence and motion
import { Card, CardContent } from './ui/card'; // Import Card components for selection step
import { cn } from '@/lib/utils'; // Import cn utility

interface ReportModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    activePage: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onOpenChange, activePage }) => {
    const [step, setStep] = useState<'selection' | 'feedback' | 'issue' | 'success'>('selection'); // Added 'success' step
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { session } = useAuth();

    const resetForm = () => {
        setStep('selection');
        setTitle('');
        setDescription('');
        setIsLoading(false);
    };

    const handleSubmit = async () => {
        if (!title.trim()) {
            toast({ title: "กรุณาใส่หัวข้อ", variant: "destructive" });
            return;
        }
        setIsLoading(true);
        
        try {
            const report_type = step === 'feedback' ? 'ข้อเสนอแนะ' : 'ปัญหาที่พบ';
            const res = await fetch('/api/submitReport', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({
                    report_type,
                    title,
                    description,
                    page_context: activePage,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาดในการส่งรายงาน');
            
            setStep('success'); // Transition to success step
            // toast({ title: "ส่งรายงานสำเร็จ", description: "ขอบคุณสำหรับข้อมูลครับ/ค่ะ" }); // Toast handled by success step
            // onOpenChange(false); // Close modal on success

        } catch (error: any) {
            toast({ title: "เกิดข้อผิดพลาด", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    
    // Reset form when modal is closed
    React.useEffect(() => {
        if (!isOpen) {
            setTimeout(resetForm, 200); // Delay reset to allow for closing animation
        }
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md p-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-slate-200/50 dark:border-slate-700/50">
                <DialogHeader className="p-6 pb-4 border-b border-slate-200/50 dark:border-slate-700/50">
                    <DialogTitle className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                        {step === 'selection' && "แจ้งข้อเสนอแนะหรือปัญหา"}
                        {step === 'feedback' && "ข้อเสนอแนะของคุณ"}
                        {step === 'issue' && "รายงานปัญหาที่พบ"}
                        {step === 'success' && "ส่งรายงานสำเร็จ!"}
                    </DialogTitle>
                    <DialogDescription className="text-base text-slate-600 dark:text-slate-400">
                        {step === 'selection' && "กรุณาเลือกประเภทของเรื่องที่ต้องการแจ้ง"}
                        {step === 'feedback' && "เรายินดีรับฟังทุกข้อเสนอแนะเพื่อการพัฒนา"}
                        {step === 'issue' && "กรุณาอธิบายปัญหาที่พบเพื่อที่เราจะนำไปแก้ไข"}
                        {step === 'success' && "ขอบคุณสำหรับข้อมูลครับ/ค่ะ เราได้รับรายงานของคุณแล้ว"}
                    </DialogDescription>
                </DialogHeader>

                <AnimatePresence mode="wait">
                    {step === 'selection' && (
                        <motion.div
                            key="selection"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                            className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
                        >
                            <Card
                                className="cursor-pointer h-36 flex flex-col items-center justify-center p-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800"
                                onClick={() => setStep('feedback')}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <CardContent className="flex flex-col items-center justify-center gap-2 p-0">
                                    <Lightbulb className="w-9 h-9 text-blue-600 dark:text-blue-400"/>
                                    <span className="text-base font-semibold text-slate-800 dark:text-slate-100">ข้อเสนอแนะ</span>
                                </CardContent>
                            </Card>
                            <Card
                                className="cursor-pointer h-36 flex flex-col items-center justify-center p-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border-red-200 dark:border-red-800"
                                onClick={() => setStep('issue')}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <CardContent className="flex flex-col items-center justify-center gap-2 p-0">
                                    <Frown className="w-9 h-9 text-red-600 dark:text-red-400"/>
                                    <span className="text-base font-semibold text-slate-800 dark:text-slate-100">ปัญหาที่พบ</span>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {(step === 'feedback' || step === 'issue') && (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                            className="p-6 space-y-4"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="title" className="font-semibold text-slate-800 dark:text-slate-200">หัวข้อ</Label>
                                <Input 
                                    id="title" 
                                    value={title} 
                                    onChange={e => setTitle(e.target.value)} 
                                    placeholder={step === 'feedback' ? 'เช่น อยากให้มีฟีเจอร์...' : 'เช่น ปุ่มกดไม่ได้ที่หน้า...'} 
                                    className="h-11 text-base border-slate-300 dark:border-slate-600 focus:border-primary focus:ring-primary"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description" className="font-semibold text-slate-800 dark:text-slate-200">รายละเอียด</Label>
                                <Textarea 
                                    id="description" 
                                    value={description} 
                                    onChange={e => setDescription(e.target.value)} 
                                    placeholder="กรุณาอธิบายเพิ่มเติม..." 
                                    className="min-h-[100px] text-base border-slate-300 dark:border-slate-600 focus:border-primary focus:ring-primary"
                                />
                            </div>
                        </motion.div>
                    )}
                    
                    {step === 'success' && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            className="p-6 text-center space-y-4"
                        >
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                                className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg"
                            >
                                <CheckCircle className="w-12 h-12 text-white" />
                            </motion.div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">ส่งรายงานเรียบร้อย!</h3>
                            <p className="text-base text-slate-600 dark:text-slate-300">
                                ขอบคุณที่ช่วยเราพัฒนาให้ดียิ่งขึ้นครับ/ค่ะ
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <DialogFooter className={cn(
                    "p-6 pt-0 flex-row-reverse sm:justify-end gap-3",
                    step === 'selection' || step === 'success' ? "hidden" : "flex" // Hide footer for selection and success steps
                )}>
                    <Button 
                        onClick={handleSubmit} 
                        disabled={isLoading}
                        className="w-full sm:w-auto h-11 text-base font-semibold bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 text-white"
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        ส่งข้อมูล
                    </Button>
                    <Button 
                        variant="outline" 
                        onClick={resetForm}
                        className="w-full sm:w-auto h-11 text-base font-semibold border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                        ย้อนกลับ
                    </Button>
                </DialogFooter>
                {step === 'success' && (
                    <DialogFooter className="p-6 pt-0 flex-row-reverse sm:justify-center">
                        <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto h-11 text-base font-semibold">
                            ปิด
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
};