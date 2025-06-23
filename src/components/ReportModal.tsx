// src/components/ReportModal.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Bug, MessageSquare, Loader2, CheckCircle, Lightbulb, ArrowLeft, Send, FileText, AlertCircle, ChevronRight, Users, Target, X } from 'lucide-react';
import { toast } from './ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from './ui/card';
import { cn } from '@/lib/utils';

interface ReportModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    activePage: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onOpenChange, activePage }) => {
    const [step, setStep] = useState<'selection' | 'feedback' | 'issue' | 'success'>('selection');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [screenSize, setScreenSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 1024,
        height: typeof window !== 'undefined' ? window.innerHeight : 768,
        isMobile: false,
        isTablet: false,
        isSmallMobile: false
    });
    const { session } = useAuth();

    // Enhanced responsive detection
    useEffect(() => {
        const updateScreenSize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            
            setScreenSize({
                width,
                height,
                isMobile: width < 768,
                isTablet: width >= 768 && width < 1024,
                isSmallMobile: width < 480
            });
        };

        updateScreenSize();
        window.addEventListener('resize', updateScreenSize);
        window.addEventListener('orientationchange', updateScreenSize);
        
        return () => {
            window.removeEventListener('resize', updateScreenSize);
            window.removeEventListener('orientationchange', updateScreenSize);
        };
    }, []);

    const { isMobile, isTablet, isSmallMobile } = screenSize;

    const resetForm = () => {
        setStep('selection');
        setTitle('');
        setDescription('');
        setIsLoading(false);
    };

    const handleSubmit = async () => {
        if (!title.trim()) {
            toast({ title: "กรุณาระบุหัวข้อ", variant: "destructive" });
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
            
            setStep('success');

        } catch (error: any) {
            toast({ title: "เกิดข้อผิดพลาด", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    
    // Reset form when modal is closed
    useEffect(() => {
        if (!isOpen) {
            setTimeout(resetForm, 200);
        }
    }, [isOpen]);

    // Enhanced body scroll prevention สำหรับ mobile
    useEffect(() => {
        if (isOpen) {
            const originalStyle = window.getComputedStyle(document.body).overflow;
            const scrollY = window.scrollY;
            
            // ป้องกันการ scroll บน mobile
            if (isMobile) {
                document.body.style.position = 'fixed';
                document.body.style.top = `-${scrollY}px`;
                document.body.style.left = '0';
                document.body.style.right = '0';
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = 'hidden';
            }
            
            return () => {
                if (isMobile) {
                    document.body.style.position = '';
                    document.body.style.top = '';
                    document.body.style.left = '';
                    document.body.style.right = '';
                    document.body.style.overflow = '';
                    window.scrollTo(0, scrollY);
                } else {
                    document.body.style.overflow = originalStyle;
                }
            };
        }
    }, [isOpen, isMobile]);

    const fadeInUp = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 }
    };

    const scaleIn = {
        hidden: { opacity: 0, scale: 0.9 },
        visible: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.9 }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const staggerItem = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const modalSizeClasses = cn(
        // Desktop - ไม่ให้ล้นออกจากหน้าจอ
        !isMobile && !isTablet && "w-full max-w-2xl mx-auto",
        // Tablet - ปรับให้พอดีหน้าจอ
        isTablet && "w-full max-w-lg mx-auto",
        // Mobile - เต็มหน้าจอแต่มี margin
        isMobile && [
            "w-full h-full max-w-none mx-0",
            isSmallMobile ? "p-1" : "p-2"
        ]
    );

    const modalBackground = isMobile 
        ? 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)'
        : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 50%, rgba(241,245,249,0.95) 100%)';

    const modalRadius = isSmallMobile ? '20px' : isMobile ? '24px' : '20px';

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent 
                className={cn(
                    "overflow-hidden flex flex-col bg-white dark:bg-slate-900 border-0 backdrop-blur-3xl",
                    // Desktop/Tablet positioning - กึ่งกลางหน้าจอ
                    !isMobile && [
                        "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
                        "w-full max-w-2xl max-h-[90vh]",
                        "rounded-2xl shadow-2xl"
                    ],
                    // Mobile positioning - เต็มหน้าจอสมบูรณ์
                    isMobile && [
                        "!fixed !top-0 !left-0 !right-0 !bottom-0",
                        "!w-screen !h-screen !max-w-none !max-h-none",
                        "!m-0 !p-0 !transform-none !translate-x-0 !translate-y-0",
                        "!rounded-none !shadow-none !border-0"
                    ]
                )} 
                style={{
                    background: isMobile ? 
                        'rgb(255, 255, 255)' :
                        'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 50%, rgba(241,245,249,0.95) 100%)',
                    boxShadow: isMobile ? 'none' : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    ...(isMobile && {
                        position: 'fixed !important',
                        top: '0 !important',
                        left: '0 !important',
                        right: '0 !important',
                        bottom: '0 !important',
                        width: '100vw !important',
                        height: '100vh !important',
                        maxWidth: 'none !important',
                        maxHeight: 'none !important',
                        margin: '0 !important',
                        padding: '0 !important',
                        transform: 'none !important',
                        borderRadius: '0 !important'
                    })
                }}
                onPointerDownOutside={(e) => isMobile && e.preventDefault()}
                onInteractOutside={(e) => isMobile && e.preventDefault()}
            >
                {/* Custom close button - responsive sizing */}
                <button
                    onClick={() => onOpenChange(false)}
                    className={cn(
                        "absolute z-50 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95",
                        isSmallMobile ? "w-7 h-7 top-2 right-2" : isMobile ? "w-8 h-8 top-3 right-3" : "w-8 h-8 top-4 right-4"
                    )}
                >
                    <X className={cn(
                        "text-slate-600 dark:text-slate-400",
                        isSmallMobile ? "w-3.5 h-3.5" : "w-4 h-4"
                    )} />
                </button>

                {/* Decorative background elements - ปิดสำหรับ mobile */}
                {!isMobile && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-100/30 to-indigo-100/30 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-100/20 to-pink-100/20 rounded-full blur-3xl"></div>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-radial from-slate-100/10 to-transparent rounded-full blur-2xl"></div>
                    </div>
                )}

                {/* Mobile status bar สำหรับมือถือ */}
                {isMobile && (
                    <div className="w-full h-safe-top bg-slate-50 dark:bg-slate-800"></div>
                )}

                {/* Mobile drag indicator */}
                {isMobile && (
                    <div className="flex justify-center py-2 bg-slate-50 dark:bg-slate-800">
                        <div className={cn(
                            "bg-slate-400 dark:bg-slate-500 rounded-full",
                            isSmallMobile ? "w-8 h-1" : "w-10 h-1.5"
                        )}></div>
                    </div>
                )}

                {/* Header with responsive styling */}
                <DialogHeader className={cn(
                    "relative z-10 border-b border-slate-200 dark:border-slate-700 flex-shrink-0",
                    // Desktop/Tablet
                    !isMobile && "px-8 py-6",
                    // Mobile
                    isMobile && "px-4 py-4 bg-white dark:bg-slate-900",
                    // Small mobile
                    isSmallMobile && "px-3 py-3"
                )}>
                    <div className="flex items-start justify-between">
                        <div className={cn(
                            "flex-1 space-y-3",
                            isSmallMobile && "space-y-2"
                        )}>
                            <div className={cn(
                                "flex items-center space-x-3",
                                isSmallMobile && "space-x-2"
                            )}>
                                <div className={cn(
                                    "rounded-2xl flex items-center justify-center",
                                    step === 'feedback' && "bg-gradient-to-br from-blue-500 to-indigo-600",
                                    step === 'issue' && "bg-gradient-to-br from-red-500 to-rose-600",
                                    step === 'success' && "bg-gradient-to-br from-green-500 to-emerald-600",
                                    step === 'selection' && "bg-gradient-to-br from-slate-500 to-slate-600",
                                    isSmallMobile ? "w-8 h-8 rounded-lg" : isMobile ? "w-10 h-10 rounded-xl" : "w-12 h-12"
                                )}>
                                    {step === 'selection' && <MessageSquare className={cn("text-white", isSmallMobile ? "w-4 h-4" : isMobile ? "w-5 h-5" : "w-6 h-6")} />}
                                    {step === 'feedback' && <Lightbulb className={cn("text-white", isSmallMobile ? "w-4 h-4" : isMobile ? "w-5 h-5" : "w-6 h-6")} />}
                                    {step === 'issue' && <AlertCircle className={cn("text-white", isSmallMobile ? "w-4 h-4" : isMobile ? "w-5 h-5" : "w-6 h-6")} />}
                                    {step === 'success' && <CheckCircle className={cn("text-white", isSmallMobile ? "w-4 h-4" : isMobile ? "w-5 h-5" : "w-6 h-6")} />}
                                </div>
                                <div>
                                    <DialogTitle className={cn(
                                        "font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 bg-clip-text text-transparent leading-tight",
                                        isSmallMobile ? "text-lg" : isMobile ? "text-xl" : "text-3xl"
                                    )}>
                                        {step === 'selection' && (isSmallMobile ? "ข้อเสนอแนะ & รายงาน" : "ศูนย์ข้อเสนอแนะและรายงานปัญหา")}
                                        {step === 'feedback' && "ข้อเสนอแนะเพื่อการพัฒนา"}
                                        {step === 'issue' && "รายงานปัญหาที่พบ"}
                                        {step === 'success' && "ส่งรายงานเรียบร้อยแล้ว"}
                                    </DialogTitle>
                                </div>
                            </div>
                            <DialogDescription className={cn(
                                "text-slate-600 dark:text-slate-400 leading-relaxed",
                                isSmallMobile ? "text-xs" : isMobile ? "text-sm" : "text-base"
                            )}>
                                {step === 'selection' && (isSmallMobile 
                                    ? "เลือกประเภทที่ต้องการแจ้ง" 
                                    : "เลือกประเภทของเรื่องที่ต้องการแจ้งให้เราทราบ เพื่อให้เราสามารถดำเนินการได้อย่างเหมาะสม")}
                                {step === 'feedback' && (isSmallMobile
                                    ? "แบ่งปันความคิดเห็นของคุณ"
                                    : "แบ่งปันความคิดเห็นและข้อเสนอแนะของคุณ เพื่อช่วยให้เราปรับปรุงและพัฒนาบริการให้ดีขึ้น")}
                                {step === 'issue' && (isSmallMobile
                                    ? "อธิบายปัญหาที่พบให้ละเอียด"
                                    : "อธิบายรายละเอียดของปัญหาที่พบ เพื่อให้ทีมงานสามารถดำเนินการแก้ไขได้อย่างรวดเร็วและถูกต้อง")}
                                {step === 'success' && (isSmallMobile
                                    ? "ขอบคุณสำหรับข้อมูลที่ส่งมา"
                                    : "ขอบคุณสำหรับข้อมูลที่ส่งมา ทีมงานจะนำไปพิจารณาและดำเนินการปรับปรุงในส่วนที่เกี่ยวข้องต่อไป")}
                            </DialogDescription>
                        </div>
                        
                        {/* Back button for form steps - responsive */}
                        {(step === 'feedback' || step === 'issue') && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={resetForm}
                                className={cn(
                                    "rounded-full bg-white/60 hover:bg-white/80 shadow-lg border border-slate-200/50 transition-all duration-200",
                                    isSmallMobile ? "ml-2 h-7 w-7 p-0" : "ml-6 h-10 w-10 p-0"
                                )}
                            >
                                <ArrowLeft className={cn(
                                    "text-slate-600",
                                    isSmallMobile ? "h-3 w-3" : "h-4 w-4"
                                )} />
                            </Button>
                        )}
                    </div>

                    {/* Progress indicator - responsive */}
                    <div className={cn(
                        "flex items-center space-x-2",
                        isSmallMobile ? "mt-3" : "mt-6"
                    )}>
                        <div className={cn(
                            "rounded-full transition-all duration-300",
                            step === 'selection' ? "bg-slate-600 scale-125" : "bg-slate-300",
                            isSmallMobile ? "w-1.5 h-1.5" : "w-2 h-2"
                        )}></div>
                        <div className={cn(
                            "rounded-full transition-all duration-300",
                            (step === 'feedback' || step === 'issue') ? "bg-slate-600 scale-125" : "bg-slate-300",
                            isSmallMobile ? "w-1.5 h-1.5" : "w-2 h-2"
                        )}></div>
                        <div className={cn(
                            "rounded-full transition-all duration-300",
                            step === 'success' ? "bg-green-600 scale-125" : "bg-slate-300",
                            isSmallMobile ? "w-1.5 h-1.5" : "w-2 h-2"
                        )}></div>
                    </div>
                </DialogHeader>

                {/* Content with responsive styling */}
                <div className={cn(
                    "relative z-10 flex-1 overflow-y-auto bg-white dark:bg-slate-900",
                    "scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent",
                    // เพิ่ม padding bottom สำหรับ mobile เพื่อไม่ให้ซ้อนกับ navigation bar
                    isMobile && "pb-safe-bottom"
                )}>
                    <AnimatePresence mode="wait">
                        {/* Selection Step with responsive design */}
                        {step === 'selection' && (
                            <motion.div
                                key="selection"
                                variants={staggerContainer}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className={cn(
                                    "space-y-8",
                                    // Desktop/Tablet
                                    !isMobile && "p-8",
                                    // Mobile
                                    isMobile && "p-4 space-y-4",
                                    // Small mobile
                                    isSmallMobile && "p-3 space-y-3"
                                )}
                            >
                                <motion.div 
                                    variants={staggerItem}
                                    className={cn(
                                        "text-center space-y-2",
                                        isSmallMobile && "space-y-1"
                                    )}
                                >
                                    <h3 className={cn(
                                        "font-semibold text-slate-800 dark:text-slate-200",
                                        isSmallMobile ? "text-base" : isMobile ? "text-lg" : "text-xl"
                                    )}>
                                        เลือกประเภทที่ต้องการแจ้ง
                                    </h3>
                                    {!isSmallMobile && (
                                        <p className={cn(
                                            "text-slate-600 dark:text-slate-400",
                                            isMobile ? "text-sm" : "text-base"
                                        )}>
                                            กรุณาเลือกหมวดหมู่ที่เหมาะสมเพื่อให้เราสามารถดำเนินการได้อย่างมีประสิทธิภาพ
                                        </p>
                                    )}
                                </motion.div>

                                <motion.div
                                    variants={staggerItem}
                                    className="grid grid-cols-1 gap-4"
                                >
                                    {/* Enhanced Feedback Card - responsive */}
                                    <motion.div
                                        whileHover={{ scale: isMobile ? 1.01 : 1.02, y: isMobile ? -2 : -4 }}
                                        whileTap={{ scale: 0.98 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    >
                                        <Card
                                            className={cn(
                                                "cursor-pointer border-2 border-slate-200/60 hover:border-blue-300/80 transition-all duration-300",
                                                "hover:shadow-2xl shadow-lg group overflow-hidden relative",
                                                "bg-white/80 backdrop-blur-sm",
                                                isSmallMobile ? "h-20" : isMobile ? "h-24" : "h-32"
                                            )}
                                            onClick={() => setStep('feedback')}
                                            style={{
                                                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(99, 102, 241, 0.05) 100%)',
                                            }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-indigo-50/0 group-hover:from-blue-50/60 group-hover:to-indigo-50/40 transition-all duration-500"></div>
                                            
                                            <CardContent className={cn(
                                                "relative z-10 flex items-center h-full space-x-4",
                                                isSmallMobile ? "p-3 space-x-3" : isMobile ? "p-4" : "p-6"
                                            )}>
                                                <div className={cn(
                                                    "bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0",
                                                    isSmallMobile ? "w-8 h-8 rounded-lg" : isMobile ? "w-10 h-10 rounded-xl" : "w-14 h-14"
                                                )}>
                                                    <Lightbulb className={cn(
                                                        "text-white",
                                                        isSmallMobile ? "w-4 h-4" : isMobile ? "w-5 h-5" : "w-7 h-7"
                                                    )} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className={cn(
                                                        "font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-700 transition-colors",
                                                        isSmallMobile ? "text-sm" : isMobile ? "text-base" : "text-xl"
                                                    )}>
                                                        ข้อเสนอแนะ
                                                    </h3>
                                                    {!isSmallMobile && (
                                                        <p className={cn(
                                                            "text-slate-600 dark:text-slate-400 leading-relaxed",
                                                            isMobile ? "text-xs" : "text-sm"
                                                        )}>
                                                            แบ่งปันไอเดียและความคิดเห็นเพื่อการพัฒนา
                                                        </p>
                                                    )}
                                                </div>
                                                <ChevronRight className={cn(
                                                    "text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0",
                                                    isSmallMobile ? "w-4 h-4" : "w-5 h-5"
                                                )} />
                                            </CardContent>
                                        </Card>
                                    </motion.div>

                                    {/* Enhanced Issue Card - responsive */}
                                    <motion.div
                                        whileHover={{ scale: isMobile ? 1.01 : 1.02, y: isMobile ? -2 : -4 }}
                                        whileTap={{ scale: 0.98 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    >
                                        <Card
                                            className={cn(
                                                "cursor-pointer border-2 border-slate-200/60 hover:border-red-300/80 transition-all duration-300",
                                                "hover:shadow-2xl shadow-lg group overflow-hidden relative",
                                                "bg-white/80 backdrop-blur-sm",
                                                isSmallMobile ? "h-20" : isMobile ? "h-24" : "h-32"
                                            )}
                                            onClick={() => setStep('issue')}
                                            style={{
                                                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.03) 0%, rgba(244, 63, 94, 0.05) 100%)',
                                            }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-red-50/0 to-rose-50/0 group-hover:from-red-50/60 group-hover:to-rose-50/40 transition-all duration-500"></div>
                                            
                                            <CardContent className={cn(
                                                "relative z-10 flex items-center h-full space-x-4",
                                                isSmallMobile ? "p-3 space-x-3" : isMobile ? "p-4" : "p-6"
                                            )}>
                                                <div className={cn(
                                                    "bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0",
                                                    isSmallMobile ? "w-8 h-8 rounded-lg" : isMobile ? "w-10 h-10 rounded-xl" : "w-14 h-14"
                                                )}>
                                                    <AlertCircle className={cn(
                                                        "text-white",
                                                        isSmallMobile ? "w-4 h-4" : isMobile ? "w-5 h-5" : "w-7 h-7"
                                                    )} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className={cn(
                                                        "font-bold text-slate-900 dark:text-slate-100 group-hover:text-red-700 transition-colors",
                                                        isSmallMobile ? "text-sm" : isMobile ? "text-base" : "text-xl"
                                                    )}>
                                                        รายงานปัญหา
                                                    </h3>
                                                    {!isSmallMobile && (
                                                        <p className={cn(
                                                            "text-slate-600 dark:text-slate-400 leading-relaxed",
                                                            isMobile ? "text-xs" : "text-sm"
                                                        )}>
                                                            แจ้งบั๊กและข้อผิดพลาดที่พบ
                                                        </p>
                                                    )}
                                                </div>
                                                <ChevronRight className={cn(
                                                    "text-slate-400 group-hover:text-red-500 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0",
                                                    isSmallMobile ? "w-4 h-4" : "w-5 h-5"
                                                )} />
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                </motion.div>

                                {/* Enhanced Current Page Info - responsive */}
                                <motion.div 
                                    variants={staggerItem}
                                    className={cn(
                                        "rounded-2xl border border-slate-200/60 shadow-sm",
                                        isSmallMobile ? "p-3 rounded-xl" : "p-6"
                                    )}
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(241,245,249,0.8) 0%, rgba(248,250,252,0.6) 100%)'
                                    }}
                                >
                                    <div className={cn(
                                        "flex items-center space-x-4",
                                        isSmallMobile && "space-x-3"
                                    )}>
                                        <div className={cn(
                                            "bg-slate-100 rounded-xl flex items-center justify-center",
                                            isSmallMobile ? "w-8 h-8 rounded-lg" : "w-10 h-10"
                                        )}>
                                            <FileText className={cn(
                                                "text-slate-600",
                                                isSmallMobile ? "w-4 h-4" : "w-5 h-5"
                                            )} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={cn(
                                                "font-medium text-slate-700",
                                                isSmallMobile ? "text-xs" : "text-sm"
                                            )}>หน้าปัจจุบัน</p>
                                            <p className={cn(
                                                "font-semibold text-slate-900 truncate",
                                                isSmallMobile ? "text-sm" : "text-base"
                                            )}>{activePage}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}

                        {/* Enhanced Form Steps - responsive */}
                        {(step === 'feedback' || step === 'issue') && (
                            <motion.div
                                key="form"
                                variants={fadeInUp}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                transition={{ duration: 0.4 }}
                                className={cn(
                                    "space-y-8",
                                    // Desktop/Tablet
                                    !isMobile && "p-8",
                                    // Mobile
                                    isMobile && "p-4 space-y-4",
                                    // Small mobile
                                    isSmallMobile && "p-3 space-y-3"
                                )}
                            >
                                {/* Enhanced Title Field - responsive */}
                                <div className={cn(
                                    "space-y-4",
                                    isSmallMobile && "space-y-3"
                                )}>
                                    <Label htmlFor="title" className={cn(
                                        "font-semibold text-slate-800 dark:text-slate-200 flex items-center space-x-2",
                                        isSmallMobile ? "text-sm" : "text-base"
                                    )}>
                                        <Target className={cn(
                                            "text-slate-600",
                                            isSmallMobile ? "w-3 h-3" : "w-4 h-4"
                                        )} />
                                        <span>หัวข้อ <span className="text-red-500 ml-1">*</span></span>
                                    </Label>
                                    <div className="relative">
                                        <Input 
                                            id="title" 
                                            value={title} 
                                            onChange={e => setTitle(e.target.value)} 
                                            placeholder={step === 'feedback' ? 'ระบุหัวข้อข้อเสนอแนะของคุณ...' : 'ระบุหัวข้อปัญหาที่พบ...'} 
                                            className={cn(
                                                "border-2 border-slate-200/80 focus:border-slate-400 dark:focus:border-slate-500",
                                                "bg-white/60 backdrop-blur-sm shadow-sm rounded-xl transition-all duration-300",
                                                "placeholder:text-slate-400 focus:shadow-lg focus:bg-white/80",
                                                isSmallMobile ? "h-10 text-sm pl-3 pr-12" : isMobile ? "h-12 text-sm pl-3 pr-14" : "h-14 text-base pl-4 pr-16"
                                            )}
                                            maxLength={100}
                                        />
                                        <div className={cn(
                                            "absolute top-1/2 transform -translate-y-1/2",
                                            isSmallMobile ? "right-2" : "right-4"
                                        )}>
                                            <span className={cn(
                                                "font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md",
                                                isSmallMobile ? "text-xs px-1.5 py-0.5" : "text-xs"
                                            )}>
                                                {title.length}/100
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Enhanced Description Field - responsive */}
                                <div className={cn(
                                    "space-y-4",
                                    isSmallMobile && "space-y-3"
                                )}>
                                    <Label htmlFor="description" className={cn(
                                        "font-semibold text-slate-800 dark:text-slate-200 flex items-center space-x-2",
                                        isSmallMobile ? "text-sm" : "text-base"
                                    )}>
                                        <MessageSquare className={cn(
                                            "text-slate-600",
                                            isSmallMobile ? "w-3 h-3" : "w-4 h-4"
                                        )} />
                                        <span>รายละเอียด</span>
                                    </Label>
                                    <div className="relative">
                                        <Textarea 
                                            id="description" 
                                            value={description} 
                                            onChange={e => setDescription(e.target.value)} 
                                            placeholder={
                                                step === 'feedback' 
                                                    ? (isSmallMobile 
                                                        ? 'อธิบายข้อเสนอแนะของคุณ...'
                                                        : 'กรุณาอธิบายข้อเสนอแนะของคุณให้ละเอียด เพื่อให้เราเข้าใจและนำไปพัฒนาได้ตรงตามความต้องการ...')
                                                    : (isSmallMobile
                                                        ? 'อธิบายปัญหาที่พบ...'
                                                        : 'กรุณาอธิบายปัญหาที่พบให้ละเอียด รวมถึงขั้นตอนที่ทำให้เกิดปัญหา...')
                                            }
                                            className={cn(
                                                "border-2 border-slate-200/80 focus:border-slate-400 dark:focus:border-slate-500",
                                                "bg-white/60 backdrop-blur-sm shadow-sm rounded-xl resize-none transition-all duration-300",
                                                "placeholder:text-slate-400 focus:shadow-lg focus:bg-white/80",
                                                isSmallMobile ? "min-h-[80px] text-sm p-3" : isMobile ? "min-h-[120px] text-sm p-3" : "min-h-[160px] text-base p-4"
                                            )}
                                            maxLength={1000}
                                        />
                                        <div className={cn(
                                            "absolute",
                                            isSmallMobile ? "right-2 bottom-2" : "right-4 bottom-4"
                                        )}>
                                            <span className={cn(
                                                "font-medium text-slate-500 bg-white/80 px-2 py-1 rounded-md shadow-sm",
                                                isSmallMobile ? "text-xs px-1.5 py-0.5" : "text-xs"
                                            )}>
                                                {description.length}/1000
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Enhanced Page Context - responsive */}
                                <div className={cn(
                                    "rounded-2xl border border-slate-200/60 shadow-sm",
                                    isSmallMobile ? "p-3 rounded-xl" : "p-6"
                                )}
                                     style={{
                                         background: 'linear-gradient(135deg, rgba(241,245,249,0.8) 0%, rgba(248,250,252,0.6) 100%)'
                                     }}>
                                    <div className={cn(
                                        "flex items-center space-x-4",
                                        isSmallMobile && "space-x-3"
                                    )}>
                                        <div className={cn(
                                            "bg-slate-100 rounded-xl flex items-center justify-center",
                                            isSmallMobile ? "w-8 h-8 rounded-lg" : "w-10 h-10"
                                        )}>
                                            <FileText className={cn(
                                                "text-slate-600",
                                                isSmallMobile ? "w-4 h-4" : "w-5 h-5"
                                            )} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={cn(
                                                "font-medium text-slate-600",
                                                isSmallMobile ? "text-xs" : "text-sm"
                                            )}>บริบทของปัญหา</p>
                                            <p className={cn(
                                                "font-semibold text-slate-900 truncate",
                                                isSmallMobile ? "text-sm" : "text-base"
                                            )}>{activePage}</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        
                        {/* Enhanced Success Step - responsive */}
                        {step === 'success' && (
                            <motion.div
                                key="success"
                                variants={scaleIn}
                                initial="hidden"
                                animate="visible"
                                transition={{ duration: 0.5 }}
                                className={cn(
                                    "text-center space-y-8",
                                    // Desktop/Tablet
                                    !isMobile && "p-8",
                                    // Mobile
                                    isMobile && "p-4 space-y-4",
                                    // Small mobile
                                    isSmallMobile && "p-3 space-y-3"
                                )}
                            >
                                <motion.div
                                    initial={{ scale: 0, rotate: -10 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ 
                                        type: 'spring', 
                                        stiffness: 200, 
                                        damping: 20,
                                        delay: 0.2 
                                    }}
                                    className="relative"
                                >
                                    <div className={cn(
                                        "mx-auto rounded-3xl flex items-center justify-center shadow-2xl",
                                        "bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500",
                                        isSmallMobile ? "w-16 h-16 rounded-2xl" : isMobile ? "w-20 h-20" : "w-28 h-28"
                                    )}>
                                        <CheckCircle className={cn(
                                            "text-white",
                                            isSmallMobile ? "w-8 h-8" : isMobile ? "w-10 h-10" : "w-14 h-14"
                                        )} />
                                    </div>
                                    
                                    {/* Decorative rings - responsive */}
                                    <div className={cn(
                                        "absolute inset-0 border-4 border-green-200/30 animate-pulse",
                                        isSmallMobile ? "rounded-2xl" : "rounded-3xl"
                                    )}></div>
                                    <div className={cn(
                                        "absolute border-2 border-green-100/20 animate-ping",
                                        isSmallMobile ? "-inset-1 rounded-2xl" : "-inset-2 rounded-3xl"
                                    )}></div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className={cn(
                                        "space-y-4",
                                        isSmallMobile && "space-y-2"
                                    )}
                                >
                                    <h3 className={cn(
                                        "font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent",
                                        isSmallMobile ? "text-lg" : isMobile ? "text-2xl" : "text-3xl"
                                    )}>
                                        ส่งรายงานเรียบร้อยแล้ว
                                    </h3>
                                    <p className={cn(
                                        "text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg mx-auto",
                                        isSmallMobile ? "text-xs" : isMobile ? "text-sm" : "text-base"
                                    )}>
                                        {isSmallMobile 
                                            ? "ขอบคุณสำหรับข้อมูลที่ส่งมา ทีมงานจะนำไปพิจารณาและปรับปรุงต่อไป"
                                            : "ขอบคุณสำหรับข้อมูลที่ส่งมา ทีมงานจะนำข้อมูลของคุณไปศึกษาและดำเนินการปรับปรุงในส่วนที่เกี่ยวข้องอย่างรวดเร็วที่สุด"
                                        }
                                    </p>
                                </motion.div>

                                {!isSmallMobile && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.6 }}
                                        className={cn(
                                            "grid gap-4 max-w-md mx-auto",
                                            isMobile ? "grid-cols-1 gap-3" : "grid-cols-2"
                                        )}
                                    >
                                        <div className={cn(
                                            "rounded-2xl border border-slate-200/60 bg-gradient-to-br from-blue-50/60 to-indigo-50/40",
                                            isMobile ? "p-3" : "p-4"
                                        )}>
                                            <div className={cn(
                                                "flex items-center space-x-3",
                                                isMobile && "space-x-2"
                                            )}>
                                                <div className={cn(
                                                    "bg-blue-100 rounded-lg flex items-center justify-center",
                                                    isMobile ? "w-6 h-6" : "w-8 h-8"
                                                )}>
                                                    <Users className={cn(
                                                        "text-blue-600",
                                                        isMobile ? "w-3 h-3" : "w-4 h-4"
                                                    )} />
                                                </div>
                                                <div>
                                                    <p className={cn(
                                                        "font-medium text-slate-600",
                                                        isMobile ? "text-xs" : "text-xs"
                                                    )}>ทีมงาน</p>
                                                    <p className={cn(
                                                        "font-bold text-slate-800",
                                                        isMobile ? "text-sm" : "text-sm"
                                                    )}>รับทราบแล้ว</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "rounded-2xl border border-slate-200/60 bg-gradient-to-br from-green-50/60 to-emerald-50/40",
                                            isMobile ? "p-3" : "p-4"
                                        )}>
                                            <div className={cn(
                                                "flex items-center space-x-3",
                                                isMobile && "space-x-2"
                                            )}>
                                                <div className={cn(
                                                    "bg-green-100 rounded-lg flex items-center justify-center",
                                                    isMobile ? "w-6 h-6" : "w-8 h-8"
                                                )}>
                                                    <Target className={cn(
                                                        "text-green-600",
                                                        isMobile ? "w-3 h-3" : "w-4 h-4"
                                                    )} />
                                                </div>
                                                <div>
                                                    <p className={cn(
                                                        "font-medium text-slate-600",
                                                        isMobile ? "text-xs" : "text-xs"
                                                    )}>สถานะ</p>
                                                    <p className={cn(
                                                        "font-bold text-slate-800",
                                                        isMobile ? "text-sm" : "text-sm"
                                                    )}>ดำเนินการ</p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.8 }}
                                    className={cn(
                                        "rounded-2xl border border-slate-200/60 bg-gradient-to-br from-slate-50/80 to-slate-100/60",
                                        isSmallMobile ? "p-3" : "p-6"
                                    )}
                                >
                                    <p className={cn(
                                        "text-slate-600 leading-relaxed",
                                        isSmallMobile ? "text-xs" : "text-sm"
                                    )}>
                                        💡 <strong>เคล็ดลับ:</strong> {isSmallMobile 
                                            ? "หากมีข้อสงสัยเพิ่มเติม สามารถติดต่อเราได้"
                                            : "หากมีข้อสงสัยเพิ่มเติมหรือต้องการติดตามสถานะ สามารถติดต่อเราได้ผ่านช่องทางอื่นๆ"
                                        }
                                    </p>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Enhanced Footer - responsive */}
                <AnimatePresence>
                    {/* Form Footer */}
                    {(step === 'feedback' || step === 'issue') && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0.3 }}
                            className="flex-shrink-0"
                        >
                            <DialogFooter className={cn(
                                "relative z-10 border-t border-slate-200 dark:border-slate-700 flex-shrink-0",
                                "flex gap-2 bg-white dark:bg-slate-900",
                                // Desktop/Tablet
                                !isMobile && "px-8 py-6 flex-row-reverse gap-4",
                                // Mobile
                                isMobile && "px-4 py-4 flex-col",
                                // Small mobile
                                isSmallMobile && "px-3 py-3"
                            )}>
                                <Button 
                                    onClick={handleSubmit} 
                                    disabled={isLoading || !title.trim()}
                                    className={cn(
                                        "font-semibold text-white shadow-lg transition-all duration-300",
                                        "bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600",
                                        "hover:from-slate-900 hover:via-slate-800 hover:to-slate-700",
                                        "hover:shadow-xl hover:scale-105 active:scale-95",
                                        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                                        "rounded-xl border border-slate-600/20",
                                        // Responsive sizing
                                        isSmallMobile ? "h-11 px-4 text-sm w-full" : isMobile ? "h-12 px-6 text-base w-full" : "h-12 px-8",
                                        isMobile && "order-1"
                                    )}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className={cn(
                                                "animate-spin",
                                                isSmallMobile ? "mr-1 h-3 w-3" : "mr-2 h-4 w-4"
                                            )}/>
                                            <span>{isSmallMobile ? "ส่ง..." : "กำลังส่งข้อมูล..."}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className={cn(
                                                isSmallMobile ? "mr-1 h-3 w-3" : "mr-2 h-4 w-4"
                                            )} />
                                            <span>ส่งข้อมูล</span>
                                        </>
                                    )}
                                </Button>
                                <Button 
                                    variant="outline" 
                                    onClick={resetForm}
                                    className={cn(
                                        "font-semibold border-2 border-slate-300/80 transition-all duration-300",
                                        "text-slate-700 dark:text-slate-300 bg-white/60 backdrop-blur-sm",
                                        "hover:bg-white/80 hover:border-slate-400/80 hover:shadow-lg",
                                        "rounded-xl",
                                        // Responsive sizing
                                        isSmallMobile ? "h-11 px-4 text-sm w-full" : isMobile ? "h-12 px-6 text-base w-full" : "h-12 px-6",
                                        isMobile && "order-2"
                                    )}
                                >
                                    <ArrowLeft className={cn(
                                        isSmallMobile ? "mr-1 h-3 w-3" : "mr-2 h-4 w-4"
                                    )} />
                                    ย้อนกลับ
                                </Button>
                            </DialogFooter>
                        </motion.div>
                    )}

                    {/* Success Footer */}
                    {step === 'success' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="flex-shrink-0"
                        >
                            <DialogFooter className={cn(
                                "relative z-10 border-t border-slate-200 dark:border-slate-700 flex-shrink-0",
                                "flex justify-center bg-white dark:bg-slate-900",
                                // Desktop/Tablet
                                !isMobile && "px-8 py-6",
                                // Mobile
                                isMobile && "px-4 py-4",
                                // Small mobile
                                isSmallMobile && "px-3 py-3"
                            )}>
                                <Button 
                                    onClick={() => onOpenChange(false)} 
                                    className={cn(
                                        "font-semibold text-white shadow-lg transition-all duration-300",
                                        "bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600",
                                        "hover:from-green-700 hover:via-emerald-700 hover:to-teal-700",
                                        "hover:shadow-xl hover:scale-105 active:scale-95",
                                        "rounded-xl border border-green-600/20",
                                        // Responsive sizing
                                        isSmallMobile ? "h-11 px-6 text-sm w-full" : isMobile ? "h-12 px-8 text-base w-full" : "h-12 px-10"
                                    )}
                                >
                                    <CheckCircle className={cn(
                                        isSmallMobile ? "mr-1 h-3 w-3" : "mr-2 h-4 w-4"
                                    )} />
                                    เรียบร้อย
                                </Button>
                            </DialogFooter>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
};