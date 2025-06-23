// src/App.tsx
import React, { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
// FIX: Changed import paths to use the '@/' alias, which typically resolves to the 'src/' directory.
// This provides a more robust and scalable import structure.
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { SupabaseFinanceProvider, useSupabaseFinance } from "@/context/SupabaseFinanceContext";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import { Button } from '@/components/ui/button';
import { Calculator } from 'lucide-react';
import { FloatingCalculator } from '@/components/ui/FloatingCalculator';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const queryClient = new QueryClient();

// Centralized Loading Component to avoid repetition
const FullPageLoader = ({ message }: { message: string }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-100 dark:from-slate-900 dark:to-blue-950 p-4">
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: 'spring', damping: 10, stiffness: 100 }}
      className="flex flex-col items-center space-y-4 p-8 bg-white/80 dark:bg-slate-800/80 rounded-xl shadow-2xl backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50"
    >
      <Loader2 className="h-16 w-16 text-primary animate-spin" /> {/* Larger spinner with custom animation */}
      <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{message}</h2>
      <p className="text-sm text-slate-600 dark:text-slate-400">กรุณารอสักครู่...</p>
      {/* Added instruction to refresh the page */}
      <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">โปรดรีเฟรชหน้าเว็บหากการโหลดใช้เวลานาน</p>
      {/* Optional: Add a simple progress bar or skeleton elements */}
      <div className="w-48 h-2 bg-muted rounded-full mt-4">
        <Skeleton className="h-full w-3/4 rounded-full" />
      </div>
    </motion.div>
  </div>
);

const AppContent = () => {
  const { user, loading: authLoading } = useAuth();

  // Show a full-page loader while authentication is in progress
  if (authLoading) {
    return <FullPageLoader message="กำลังตรวจสอบสิทธิ์ผู้ใช้งาน" />;
  }

  // If no user is authenticated, render the Auth page
  if (!user) {
    return <Auth />;
  }

  // If authenticated, provide the finance context and load finance data
  return (
    <SupabaseFinanceProvider>
      <FinanceContentLoader />
    </SupabaseFinanceProvider>
  );
};

const FinanceContentLoader = () => {
  const { loading: financeLoading } = useSupabaseFinance();

  // Show a full-page loader while finance data is loading
  if (financeLoading) {
    return <FullPageLoader message="กำลังโหลดข้อมูลการเงินของคุณ" />;
  }

  // Once finance data is loaded, render the main Index page
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  // State to control the floating calculator visibility
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster /> {/* Toast notifications */}
        <Sonner /> {/* Sonner notifications */}
        <AuthProvider>
          <BrowserRouter>
            <div className="relative">
              <AppContent />
              
              {/* Floating calculator and trigger button */}
              <AnimatePresence>
                {isCalculatorOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 50 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  >
                    <FloatingCalculator onClose={() => setIsCalculatorOpen(false)} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Button to toggle the floating calculator */}
              <Button
                size="icon"
                // Adjusted 'bottom' CSS property from 'bottom-5' to 'bottom-24'
                // This moves the calculator button up, preventing overlap with
                // other components' action buttons at the bottom of the screen.
                className="fixed bottom-24 right-5 h-14 w-14 rounded-full shadow-2xl z-40 bg-primary hover:bg-primary/90 transition-transform hover:scale-110"
                onClick={() => setIsCalculatorOpen(prev => !prev)}
                aria-label="เปิด/ปิด เครื่องคิดเลขลอย"
              >
                <Calculator className="h-7 w-7" />
              </Button>
            </div>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;