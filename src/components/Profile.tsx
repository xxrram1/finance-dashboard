// src/components/Profile.tsx

import React, { useState, useEffect, useMemo, useCallback } from 'react'; // Added useCallback here
import { useAuth } from '../hooks/useAuth';
import { supabase } from '@/integrations/supabase/client'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogOut, User, ShieldCheck, CalendarDays, History, FileDown, Lock, MailCheck, RefreshCw, Eye, EyeOff } from 'lucide-react'; 
import { toast } from '@/hooks/use-toast';
import PDFExport from './PDFExport'; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'; 
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; 
import { Skeleton } from '@/components/ui/skeleton'; 
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'; 
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer'; 
import { useIsMobile } from '@/hooks/use-mobile'; 
import { cn } from '@/lib/utils'; 

// Skeleton loader component for Profile page
const ProfileSkeleton = () => (
    // ADJUSTED: Using responsive padding (p-4, sm:p-6, md:p-8) for better spacing.
    <div className="space-y-6 p-4 sm:p-6 md:p-8">
        <div><Skeleton className="h-9 w-full max-w-sm" /><Skeleton className="h-4 w-full max-w-md mt-2" /></div>
        {/* ADJUSTED: Grid layout for skeleton matches the final responsive layout. */}
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

// Password Change Form Component (used within Dialog/Drawer)
interface PasswordChangeFormProps {
    onClose: () => void;
}

const PasswordChangeForm: React.FC<PasswordChangeFormProps> = ({ onClose }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!newPassword || newPassword.length < 6) {
            toast({ title: "รหัสผ่านใหม่ไม่ถูกต้อง", description: "รหัสผ่านใหม่อย่างน้อย 6 ตัวอักษร", variant: "destructive" });
            setLoading(false);
            return;
        }

        if (newPassword !== confirmNewPassword) {
            toast({ title: "รหัสผ่านไม่ตรงกัน", description: "รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน", variant: "destructive" });
            setLoading(false);
            return;
        }
        
        try {
            const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

            if (updateError) {
                // Specific check for expired session or invalid refresh token
                if (updateError.message.includes("Invalid Refresh Token") || updateError.message.includes("Session not found")) {
                    toast({ 
                        title: "เซสชันหมดอายุ", 
                        description: "โปรดออกจากระบบและเข้าสู่ระบบใหม่เพื่อยืนยันตัวตน แล้วลองเปลี่ยนรหัสผ่านอีกครั้ง", 
                        variant: "destructive",
                        duration: 5000,
                    });
                } else if (updateError.message.includes("Password should be at least 6 characters")) {
                     toast({ title: "รหัสผ่านสั้นเกินไป", description: "รหัสผ่านใหม่อย่างน้อย 6 ตัวอักษร", variant: "destructive" });
                } else {
                    toast({ title: "เกิดข้อผิดพลาด", description: updateError.message, variant: "destructive" });
                }
            } else {
                toast({ title: "เปลี่ยนรหัสผ่านสำเร็จ", description: "รหัสผ่านของคุณถูกเปลี่ยนเรียบร้อยแล้ว", variant: "success" });
                onClose();
            }
        } catch (error: any) {
            toast({ title: "เกิดข้อผิดพลาด", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handlePasswordChange} className="space-y-6 p-6">
            <div className="space-y-2">
                <Label htmlFor="new-password">รหัสผ่านใหม่</Label>
                <div className="relative">
                    <Input 
                        id="new-password" 
                        type={showNewPassword ? 'text' : 'password'} 
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)} 
                        placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)" 
                        className="pr-10"
                        required 
                    />
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        aria-label={showNewPassword ? "ซ่อนรหัสผ่านใหม่" : "แสดงรหัสผ่านใหม่"}
                    >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </Button>
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="confirm-new-password">ยืนยันรหัสผ่านใหม่</Label>
                <div className="relative">
                    <Input 
                        id="confirm-new-password" 
                        type={showConfirmNewPassword ? 'text' : 'password'} 
                        value={confirmNewPassword} 
                        onChange={(e) => setConfirmNewPassword(e.target.value)} 
                        placeholder="ยืนยันรหัสผ่านใหม่" 
                        className="pr-10"
                        required 
                    />
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:bg-transparent"
                        onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                        aria-label={showConfirmNewPassword ? "ซ่อนยืนยันรหัสผ่านใหม่" : "แสดงยืนยันรหัสผ่านใหม่"}
                    >
                        {showConfirmNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </Button>
                </div>
            </div>
            <Button type="submit" className="w-full h-11 text-lg font-bold" disabled={loading}>
                {loading ? <span className="flex items-center justify-center gap-2"><RefreshCw className="h-5 w-5 animate-spin"/>กำลังดำเนินการ...</span> : 'บันทึกรหัสผ่านใหม่'}
            </Button>
        </form>
    );
};


const Profile = () => {
  const { user, signOut, refreshUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [isPasswordChangeModalOpen, setIsPasswordChangeModalOpen] = useState(false); 

  const isMobile = useIsMobile(); 

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
  const emailConfirmedColor = useMemo(() => user?.email_confirmed_at ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400', [user]);
  const emailConfirmedIcon = useMemo(() => user?.email_confirmed_at ? <MailCheck size={16}/> : <ShieldCheck size={16}/>, [user]); 

  const loadProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error, status } = await supabase.from('profiles').select('*').eq('id', user.id).single();

      if (data) {
        setProfile(data);
        setFullName(data.full_name || '');
      } else if (error && status !== 406) { // 406 means no rows found, which is not a critical error here
        throw error;
      } else {
        // Fallback or create profile if it doesn't exist
        const newProfileData = { id: user.id, full_name: user.user_metadata?.full_name || '', created_at: user.created_at, updated_at: user.updated_at };
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
    if (user) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, [user, loadProfile]);

  const updateProfile = async () => {
    if (!user) return;
    setFormLoading(true);
    try {
        const { error } = await supabase.from('profiles').upsert(
            { 
                id: user.id, 
                full_name: fullName, 
                updated_at: new Date().toISOString() 
            }, 
            { onConflict: 'id' } 
        );
        if (error) {
            throw error;
        }
        if (user.user_metadata.full_name !== fullName) {
            const { error: updateAuthError } = await supabase.auth.updateUser({
                data: { full_name: fullName }
            });
            if (updateAuthError) throw updateAuthError;
        }

        toast({ title: "สำเร็จ", description: "อัพเดทโปรไฟล์เรียบร้อยแล้ว", variant: "success" });
        await refreshUser(); // Refresh user data in auth context
        await loadProfile(); // Reload profile from db
    } catch (error: any) {
       toast({ title: "เกิดข้อผิดพลาด", description: `ไม่สามารถอัพเดทโปรไฟล์ได้: ${error.message}`, variant: "destructive" });
    } finally {
        setFormLoading(false);
    }
  };

  const getInitials = (name: string | null | undefined): string => {
    if (!name || typeof name !== 'string') return 'U';
    const initials = name
      .split(' ')
      .map(n => n[0])
      .filter(Boolean)
      .join('');
    if (initials.length > 2) {
      return `${initials[0]}${initials[initials.length - 1]}`.toUpperCase();
    }
    return initials.toUpperCase() || 'U'; 
  };
  
  if (loading) {
      return <ProfileSkeleton />;
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">โปรไฟล์และการตั้งค่า</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">จัดการข้อมูลส่วนตัวและการตั้งค่าบัญชีของคุณ</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <Card className="md:col-span-2">
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <Avatar className="h-24 w-24 text-4xl border-2 border-primary/50 flex-shrink-0"> 
                        <AvatarImage src={profile?.avatar_url || ''} alt={fullName} />
                        <AvatarFallback>{getInitials(fullName) || <User size={48} className="text-muted-foreground/50"/>}</AvatarFallback> 
                    </Avatar>
                    <div className="flex-1 text-center sm:text-left">
                        <CardTitle className="text-xl lg:text-2xl font-bold text-foreground mb-1">{fullName || user?.email}</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">จัดการข้อมูลส่วนตัวและอีเมลของคุณ</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fullName" className="font-medium text-sm">ชื่อ-นามสกุล</Label>
                <Input 
                  id="fullName" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  placeholder="กรอกชื่อ-นามสกุล"
                  className="h-10 text-base"
                />
              </div>
              <div>
                <Label htmlFor="email" className="font-medium text-sm">อีเมล</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={user?.email || ''} 
                  disabled 
                  className="bg-muted cursor-not-allowed h-10 text-base"
                />
              </div>
              <Button onClick={updateProfile} disabled={formLoading} className="h-11 text-base sm:text-lg font-bold">
                  {formLoading ? <span className="flex items-center gap-2"><RefreshCw className="h-5 w-5 animate-spin"/>กำลังบันทึก...</span> : 'บันทึกการเปลี่ยนแปลง'}
              </Button>
            </CardContent>
        </Card>
        <div className="space-y-6">
            <Card>
                <CardHeader><CardTitle className="text-lg">การดำเนินการ</CardTitle></CardHeader>
                <CardContent className="flex flex-col space-y-3">
                    <Button onClick={() => setIsPasswordChangeModalOpen(true)} variant="outline" className="w-full justify-start gap-2 h-11 text-base">
                        <Lock size={16} /> เปลี่ยนรหัสผ่าน
                    </Button>
                    <PDFExport /> 
                    <Button onClick={signOut} variant="outline" className="w-full justify-start gap-2 text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive h-11 text-base">
                        <LogOut size={16} /> ออกจากระบบ
                    </Button>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle className="text-lg">สถิติบัญชี</CardTitle></CardHeader>
                <CardContent className="space-y-4 text-sm"> 
                    <div className="flex items-center justify-between gap-4 flex-wrap"><span className="text-muted-foreground flex items-center gap-2"><CalendarDays size={16}/>เป็นสมาชิกตั้งแต่</span> <span className="font-medium text-foreground">{profileCreatedAt}</span></div>
                    <div className="flex items-center justify-between gap-4 flex-wrap"><span className="text-muted-foreground flex items-center gap-2"><History size={16}/>เข้าใช้ล่าสุด</span> <span className="font-medium text-foreground">{lastSignInAt}</span></div>
                    <div className="flex items-center justify-between gap-4 flex-wrap"><span className={cn("flex items-center gap-2", emailConfirmedColor)}>{emailConfirmedIcon}สถานะอีเมล</span> <span className={cn("font-medium", emailConfirmedColor)}>{emailConfirmedStatus}</span></div>
                </CardContent>
            </Card>
        </div>
      </div>
      
      <Dialog open={isPasswordChangeModalOpen && !isMobile} onOpenChange={setIsPasswordChangeModalOpen}>
          <DialogContent className="max-w-md p-0">
              <DialogHeader className="p-6 pb-0">
                  <DialogTitle>เปลี่ยนรหัสผ่าน</DialogTitle>
                  <DialogDescription>ตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณ</DialogDescription>
              </DialogHeader>
              <PasswordChangeForm onClose={() => setIsPasswordChangeModalOpen(false)} />
          </DialogContent>
      </Dialog>
      <Drawer open={isPasswordChangeModalOpen && isMobile} onClose={() => setIsPasswordChangeModalOpen(false)}>
          <DrawerContent>
              <DrawerHeader className="text-left p-6 pb-0">
                  <DialogTitle>เปลี่ยนรหัสผ่าน</DialogTitle>
                  <DialogDescription>ตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณ</DialogDescription>
              </DrawerHeader>
              <PasswordChangeForm onClose={() => setIsPasswordChangeModalOpen(false)} />
          </DrawerContent>
      </Drawer>
    </div>
  );
};

export default Profile;