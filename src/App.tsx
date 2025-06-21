// src/App.tsx

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { SupabaseFinanceProvider, useSupabaseFinance } from "./context/SupabaseFinanceContext"; // Import useSupabaseFinance
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, loading: authLoading } = useAuth(); // เปลี่ยนชื่อ loading ของ useAuth เป็น authLoading

  // ส่วนนี้จะแสดงตัวโหลดเริ่มต้นของแอปพลิเคชัน (ระหว่างที่ตรวจสอบสถานะผู้ใช้)
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // หากโหลด auth เสร็จแล้ว แต่ไม่มีผู้ใช้ ให้แสดงหน้า Auth
  if (!user) {
    return <Auth />;
  }

  // หากมีผู้ใช้ ให้แสดง SupabaseFinanceProvider และ FinanceContentLoader
  return (
    <SupabaseFinanceProvider>
      <FinanceContentLoader /> {/* คอมโพเนนต์ใหม่สำหรับจัดการการโหลดข้อมูลการเงิน */}
    </SupabaseFinanceProvider>
  );
};

// คอมโพเนนต์ใหม่ที่จะจัดการการโหลดข้อมูลเฉพาะส่วนการเงิน
const FinanceContentLoader = () => {
  const { loading: financeLoading } = useSupabaseFinance(); // ดึงสถานะ loading ของข้อมูลการเงิน

  // ถ้าข้อมูลการเงินยังโหลดไม่เสร็จ ให้แสดงตัวโหลดเฉพาะส่วนนี้
  if (financeLoading) {
    return (
      <div className="min-h-screen bg-secondary/50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">กำลังดึงข้อมูลการเงิน...</p> {/* ข้อความเฉพาะเจาะจงมากขึ้น */}
        </div>
      </div>
    );
  }

  // เมื่อข้อมูลการเงินโหลดเสร็จแล้ว ให้แสดงหน้าหลักของแอป
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};


const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;