import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogOut, User, ShieldCheck, CalendarDays, History } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PDFExport from './PDFExport';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

const ProfileSkeleton = () => (
    <div className="space-y-6">
        <div><Skeleton className="h-9 w-72" /><Skeleton className="h-4 w-96 mt-2" /></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <Card className="lg:col-span-2">
                <CardHeader><div className="flex items-center gap-4"><Skeleton className="h-20 w-20 rounded-full" /><div className="space-y-2"><Skeleton className="h-7 w-48" /><Skeleton className="h-4 w-64" /></div></div></CardHeader>
                <CardContent className="space-y-4"><div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div><div className="space-y-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-10 w-full" /></div><Skeleton className="h-10 w-40" /></CardContent>
            </Card>
            <div className="space-y-6">
                <Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-5 w-full" /><Skeleton className="h-5 w-full" /><Skeleton className="h-5 w-full" /></CardContent></Card>
            </div>
        </div>
    </div>
);

const Profile = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (error && error.code !== 'PGRST116') { // 'no rows found' is okay
        throw error;
      }
      if (data) {
        setProfile(data);
        setFullName(data.full_name || '');
      }
    } catch (error) {
       toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถโหลดข้อมูลโปรไฟล์ได้", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!user) return;
    setFormLoading(true);
    const { error } = await supabase.from('profiles').upsert({ id: user.id, full_name: fullName, updated_at: new Date().toISOString() }, { onConflict: 'id'});
    if (error) {
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถอัพเดทโปรไฟล์ได้", variant: "destructive" });
    } else {
      toast({ title: "สำเร็จ", description: "อัพเดทโปรไฟล์เรียบร้อยแล้ว" });
      await loadProfile();
    }
    setFormLoading(false);
  };

  const getInitials = (name: string | null): string => {
    if (!name || typeof name !== 'string') return '';
    const initials = name
      .split(' ')
      .map(n => n[0])
      .filter(Boolean)
      .join('');
    if (initials.length > 2) {
      return `${initials[0]}${initials[initials.length - 1]}`.toUpperCase();
    }
    return initials.toUpperCase();
  };
  
  if (loading) {
      return <ProfileSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">โปรไฟล์และการตั้งค่า</h1>
        <p className="text-muted-foreground mt-1">จัดการข้อมูลส่วนตัวและการตั้งค่าบัญชีของคุณ</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Card className="lg:col-span-2">
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <Avatar className="h-20 w-20 text-3xl">
                        <AvatarImage src={profile?.avatar_url || ''} alt={fullName} />
                        <AvatarFallback>{getInitials(fullName) || <User />}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <CardTitle className="text-2xl">{fullName || user?.email}</CardTitle>
                        <CardDescription>จัดการข้อมูลส่วนตัวและอีเมลของคุณ</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fullName">ชื่อ-นามสกุล</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="กรอกชื่อ-นามสกุล"/>
              </div>
              <div>
                <Label htmlFor="email">อีเมล</Label>
                <Input id="email" type="email" value={user?.email || ''} disabled className="bg-muted cursor-not-allowed"/>
              </div>
              <Button onClick={updateProfile} disabled={formLoading}>{formLoading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}</Button>
            </CardContent>
        </Card>
        <div className="space-y-6">
            <Card>
                <CardHeader><CardTitle>การดำเนินการ</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    <PDFExport />
                    <Button onClick={signOut} variant="outline" className="w-full justify-start gap-2"><LogOut size={16} /> ออกจากระบบ</Button>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>สถิติบัญชี</CardTitle></CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="flex items-center justify-between"><span className="text-muted-foreground flex items-center gap-2"><CalendarDays size={16}/>เป็นสมาชิกตั้งแต่</span> <span>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString('th-TH') : '-'}</span></div>
                    <div className="flex items-center justify-between"><span className="text-muted-foreground flex items-center gap-2"><History size={16}/>เข้าใช้ล่าสุด</span> <span>{user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('th-TH') : '-'}</span></div>
                    <div className="flex items-center justify-between"><span className="text-muted-foreground flex items-center gap-2"><ShieldCheck size={16}/>สถานะอีเมล</span> <span className="text-green-600 font-medium">{user?.email_confirmed_at ? 'ยืนยันแล้ว' : 'ยังไม่ยืนยัน'}</span></div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;