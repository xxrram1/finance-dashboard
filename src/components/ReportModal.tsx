// src/components/ReportModal.tsx

import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Bug, MessageSquare, Loader2 } from 'lucide-react';
import { toast } from './ui/use-toast';

interface ReportModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    activePage: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onOpenChange, activePage }) => {
    const [step, setStep] = useState<'selection' | 'feedback' | 'issue'>('selection');
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
            
            toast({ title: "ส่งรายงานสำเร็จ", description: "ขอบคุณสำหรับข้อมูลครับ/ค่ะ" });
            onOpenChange(false); // Close modal on success

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
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>แจ้งข้อเสนอแนะหรือปัญหา</DialogTitle>
                    <DialogDescription>
                        {step === 'selection' && "กรุณาเลือกประเภทของเรื่องที่ต้องการแจ้ง"}
                        {step === 'feedback' && "เรายินดีรับฟังทุกข้อเสนอแนะเพื่อการพัฒนา"}
                        {step === 'issue' && "กรุณาอธิบายปัญหาที่พบเพื่อที่เราจะนำไปแก้ไข"}
                    </DialogDescription>
                </DialogHeader>

                {step === 'selection' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                        <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => setStep('feedback')}>
                            <MessageSquare className="w-8 h-8 text-blue-500"/>
                            <span className="text-base">ข้อเสนอแนะ</span>
                        </Button>
                        <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => setStep('issue')}>
                            <Bug className="w-8 h-8 text-red-500"/>
                            <span className="text-base">ปัญหาที่พบ</span>
                        </Button>
                    </div>
                )}

                {(step === 'feedback' || step === 'issue') && (
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">หัวข้อ</Label>
                            <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder={step === 'feedback' ? 'เช่น อยากให้มีฟีเจอร์...' : 'เช่น ปุ่มกดไม่ได้ที่หน้า...'} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">รายละเอียด</Label>
                            <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="กรุณาอธิบายเพิ่มเติม..." />
                        </div>
                    </div>
                )}

                {(step !== 'selection') && (
                    <DialogFooter>
                         <Button variant="ghost" onClick={resetForm}>ย้อนกลับ</Button>
                         <Button onClick={handleSubmit} disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            ส่งข้อมูล
                         </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
};