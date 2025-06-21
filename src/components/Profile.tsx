
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogOut, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PDFExport from './PDFExport';

const Profile = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      setProfile(data);
      setFullName(data.full_name || '');
    }
  };

  const updateProfile = async () => {
    if (!user) return;

    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .upsert([{
        id: user.id,
        full_name: fullName,
        updated_at: new Date().toISOString()
      }]);

    if (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัพเดทโปรไฟล์ได้",
        variant: "destructive"
      });
    } else {
      toast({
        title: "สำเร็จ",
        description: "อัพเดทโปรไฟล์เรียบร้อยแล้ว",
      });
      loadProfile();
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "ออกจากระบบ",
      description: "ออกจากระบบเรียบร้อยแล้ว",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">โปรไฟล์</h1>
        <p className="text-gray-600 mt-1">จัดการข้อมูลส่วนตัวและการตั้งค่า</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 p-3 rounded-full">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">ข้อมูลส่วนตัว</h3>
              <p className="text-sm text-gray-600">แก้ไขข้อมูลโปรไฟล์ของคุณ</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                อีเมล
              </label>
              <Input
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">ไม่สามารถเปลี่ยนอีเมลได้</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อ-นามสกุล
              </label>
              <Input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="กรอกชื่อ-นามสกุล"
              />
            </div>

            <Button 
              onClick={updateProfile}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">การจัดการ</h3>
          
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">ส่งออกรายงาน</h4>
              <p className="text-sm text-gray-600 mb-4">
                ดาวน์โหลดรายงานการเงินทั้งหมดเป็นไฟล์ PDF
              </p>
              <PDFExport />
            </div>

            <div className="border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">ออกจากระบบ</h4>
              <p className="text-sm text-red-600 mb-4">
                ออกจากบัญชีผู้ใช้ปัจจุบัน
              </p>
              <Button 
                onClick={handleSignOut}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <LogOut size={16} />
                ออกจากระบบ
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Account Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">สถิติบัญชี</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">
              {profile?.created_at ? 
                Math.floor((new Date().getTime() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)) 
                : 0}
            </p>
            <p className="text-sm text-gray-600">วันที่ใช้งาน</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              {user?.email_confirmed_at ? 'ยืนยันแล้ว' : 'ยังไม่ยืนยัน'}
            </p>
            <p className="text-sm text-gray-600">สถานะอีเมล</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">
              {user?.last_sign_in_at ? 
                new Date(user.last_sign_in_at).toLocaleDateString('th-TH') 
                : 'ไม่ระบุ'}
            </p>
            <p className="text-sm text-gray-600">เข้าใช้ครั้งล่าสุด</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
