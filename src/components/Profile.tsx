// src/components/Profile.tsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogOut, User, ShieldCheck, CalendarDays, History, FileDown, MailCheck, RefreshCw, Upload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PDFExport from './PDFExport'; // Import the new modal component
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const ProfileSkeleton = () => (
    <div className="space-y-6 p-4 sm:p-6 md:p-8">
        <div><Skeleton className="h-9 w-full max-w-sm" /><Skeleton className="h-4 w-full max-w-md mt-2" /></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <Card className="md:col-span-2">
                <CardHeader><div className="flex items-center gap-4"><Skeleton className="h-24 w-24 rounded-full" /><div className="space-y-2 flex-1"><Skeleton className="h-7 w-4/5" /><Skeleton className="h-4 w-full max-w-xs" /></div></div></CardHeader>
                <CardContent className="space-y-4"><div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div><div className="space-y-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-10 w-full" /></div><Skeleton className="h-11 w-40" /></CardContent> 
            </Card>
            <div className="space-y-6">
                <Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent className="space-y-3"><Skeleton className="h-11 w-full" /><Skeleton className="h-11 w-full" /></CardContent></Card> 
                <Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-5 w-full" /><Skeleton className="h-5 w-full" /><Skeleton className="h-5 w-full" /></CardContent></Card>
            </div>
        </div>
    </div>
);

const Profile = () => {
  const { user, signOut, refreshUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isPDFExportModalOpen, setIsPDFExportModalOpen] = useState(false); // New state for PDF Export modal

  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  const profileCreatedAt = useMemo(() => {
    if (!profile?.created_at) return '-';
    const date = new Date(profile.created_at);
    return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('th-TH', { dateStyle: 'long' });
  }, [profile]);

  const lastSignInAt = useMemo(() => {
    if (!user?.last_sign_in_at) return '-';
    const date = new Date(user.last_sign_in_at);
    return isNaN(date.getTime()) ? '-' : date.toLocaleString('th-TH', { dateStyle: 'long', timeStyle: 'short' });
  }, [user]);

  const emailConfirmedStatus = useMemo(() => user?.email_confirmed_at ? 'ยืนยันแล้ว' : 'ยังไม่ยืนยัน', [user]);
  const emailConfirmedColor = useMemo(() => user?.email_confirmed_at ? 'text-green-500' : 'text-orange-500', [user]);
  const emailConfirmedIcon = useMemo(() => user?.email_confirmed_at ? <MailCheck size={16}/> : <ShieldCheck size={16}/>, [user]);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error, status } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setProfile(data);
        setFullName(data.full_name || '');
      } else if (error && status !== 406) {
        throw error;
      } else {
        const newProfileData = { id: user.id, full_name: user.user_metadata?.full_name || '', avatar_url: user.user_metadata?.avatar_url || null, created_at: user.created_at };
        setProfile(newProfileData);
        setFullName(user.user_metadata?.full_name || '');
      }
    } catch (error: any) {
       toast({ title: "เกิดข้อผิดพลาด", description: `ไม่สามารถโหลดข้อมูลโปรไฟล์ได้: ${error.message}`, variant: "destructive" });
    } finally {
        setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadProfile(); else setLoading(false);
  }, [user, loadProfile]);
  
  const handleAvatarUpload = useCallback(async (file: File) => {
    if (!user) return;
    setFormLoading(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${Math.random()}.${fileExt}`;
    
    try {
        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        const publicUrl = urlData.publicUrl;

        await supabase.from('profiles').upsert({ id: user.id, avatar_url: publicUrl, updated_at: new Date().toISOString() }, { onConflict: 'id' });
        await supabase.auth.updateUser({ data: { avatar_url: publicUrl }});

        toast({ title: "สำเร็จ", description: "อัปเดตรูปโปรไฟล์เรียบร้อยแล้ว", variant: "success" });
        await refreshUser();
        await loadProfile();
    } catch (error: any) {
        toast({ title: "เกิดข้อผิดพลาด", description: `ไม่สามารถอัปโหลดรูปได้: ${error.message}`, variant: "destructive" });
    } finally {
        setFormLoading(false);
        setAvatarFile(null);
    }
  }, [user, refreshUser, loadProfile]);

  useEffect(() => {
    if (avatarFile) {
        handleAvatarUpload(avatarFile);
    }
  }, [avatarFile, handleAvatarUpload]);

  const updateProfile = async () => {
    if (!user || !fullName.trim()) return;
    setFormLoading(true);
    try {
        await supabase.from('profiles').upsert({ id: user.id, full_name: fullName, updated_at: new Date().toISOString() }, { onConflict: 'id' });
        if (user.user_metadata.full_name !== fullName) {
            await supabase.auth.updateUser({ data: { full_name: fullName } });
        }
        toast({ title: "สำเร็จ", description: "อัพเดทชื่อเรียบร้อยแล้ว", variant: "success" });
        await refreshUser();
        await loadProfile();
    } catch (error: any) {
       toast({ title: "เกิดข้อผิดพลาด", description: `ไม่สามารถอัพเดทโปรไฟล์ได้: ${error.message}`, variant: "destructive" });
    } finally {
        setFormLoading(false);
    }
  };

  const getInitials = (name: string | null | undefined): string => {
    if (!name || typeof name !== 'string' || name.trim() === '') return 'U';
    const initials = name.split(' ').map(n => n[0]).filter(Boolean).join('');
    return (initials.length > 2 ? `${initials[0]}${initials[initials.length - 1]}` : initials).toUpperCase();
  };
  
  if (loading) return <ProfileSkeleton />;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-950">
        <div className="container mx-auto max-w-7xl px-4 py-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">โปรไฟล์และการตั้งค่า</h1>
            <p className="text-muted-foreground mt-1 text-base">จัดการข้อมูลส่วนตัวและการตั้งค่าบัญชีของคุณ</p>
        </motion.div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 space-y-8">
            <Card className="shadow-xl rounded-2xl bg-white/70 dark:bg-slate-800/50 backdrop-blur-lg border-slate-200/50 dark:border-slate-700/50">
                <CardHeader className="p-6">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="relative group flex-shrink-0">
                            <Avatar className="h-28 w-28 text-5xl border-4 border-white dark:border-slate-700 shadow-lg"> 
                                <AvatarImage src={profile?.avatar_url} key={profile?.avatar_url} alt={fullName} />
                                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">{getInitials(fullName)}</AvatarFallback> 
                            </Avatar>
                             <input type="file" ref={avatarInputRef} onChange={(e) => e.target.files && setAvatarFile(e.target.files[0])} accept="image/*" className="hidden"/>
                            <Button size="icon" variant="outline" onClick={() => avatarInputRef.current?.click()} className="absolute bottom-1 right-1 h-8 w-8 rounded-full bg-white dark:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload size={16} />
                            </Button>
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                            <CardTitle className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mb-1">{fullName || 'ผู้ใช้งาน'}</CardTitle>
                            <CardDescription className="text-base text-muted-foreground break-all">{user?.email}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-6">
                    <div>
                        <Label htmlFor="fullName" className="font-semibold text-slate-700 dark:text-slate-300">ชื่อ-นามสกุล</Label>
                        <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="กรอกชื่อ-นามสกุล" className="h-12 text-base mt-2"/>
                    </div>
                    <Button onClick={updateProfile} disabled={formLoading} size="lg" className="w-full sm:w-auto h-12 text-base font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-white transition-transform hover:scale-105">
                        {formLoading ? <span className="flex items-center gap-2"><RefreshCw className="h-5 w-5 animate-spin"/>กำลังบันทึก</span> : 'บันทึกการเปลี่ยนแปลง'}
                    </Button>
                </CardContent>
            </Card>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="space-y-8">
                <Card className="shadow-xl rounded-2xl bg-white/70 dark:bg-slate-800/50 backdrop-blur-lg border-slate-200/50 dark:border-slate-700/50">
                    <CardHeader><CardTitle className="text-xl">การดำเนินการบัญชี</CardTitle></CardHeader>
                    <CardContent className="flex flex-col space-y-3">
                        {/* Modified: Use a button to open the PDFExport modal */}
                        <Button 
                          onClick={() => setIsPDFExportModalOpen(true)} 
                          variant="outline" 
                          className="w-full justify-start gap-3 h-12 text-base text-blue-600 hover:text-blue-700 border-blue-200 hover:bg-blue-50 dark:border-blue-500/30 dark:hover:bg-blue-500/10 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                            <FileDown size={18} /> ส่งออกรายงาน PDF
                        </Button>
                        <Button onClick={signOut} variant="outline" className="w-full justify-start gap-3 h-12 text-base text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10 dark:text-red-400 dark:hover:text-red-300"><LogOut size={18} /> ออกจากระบบ</Button>
                    </CardContent>
                </Card>
                <Card className="shadow-xl rounded-2xl bg-white/70 dark:bg-slate-800/50 backdrop-blur-lg border-slate-200/50 dark:border-slate-700/50">
                    <CardHeader><CardTitle className="text-xl">ข้อมูลบัญชี</CardTitle></CardHeader>
                    <CardContent className="space-y-4 text-base"> 
                        <div className="flex items-center justify-between gap-2 flex-wrap"><span className="text-muted-foreground flex items-center gap-2"><CalendarDays size={16}/>เป็นสมาชิกตั้งแต่</span> <span className="font-semibold text-foreground">{profileCreatedAt}</span></div>
                        <div className="flex items-center justify-between gap-2 flex-wrap"><span className="text-muted-foreground flex items-center gap-2"><History size={16}/>เข้าใช้ล่าสุด</span> <span className="font-semibold text-foreground">{lastSignInAt}</span></div>
                        <div className="flex items-center justify-between gap-2 flex-wrap"><span className={cn("flex items-center gap-2", emailConfirmedColor)}>{emailConfirmedIcon}สถานะอีเมล</span> <span className={cn("font-semibold", emailConfirmedColor)}>{emailConfirmedStatus}</span></div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
        </div>

        {/* Render PDFExport as a modal */}
        <PDFExport 
          isOpen={isPDFExportModalOpen} 
          onClose={() => setIsPDFExportModalOpen(false)} 
        />
    </div>
  );
};

export default Profile;