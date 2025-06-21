
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  note: string;
}

export interface Budget {
  id?: string;
  category: string;
  amount: number;
  month: string;
}

export interface RecurringItem {
  id: string;
  name: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  last_generated?: string;
  is_active: boolean;
}

interface FinanceContextType {
  transactions: Transaction[];
  budgets: Budget[];
  recurringItems: RecurringItem[];
  loading: boolean;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addBudget: (budget: Omit<Budget, 'id'>) => Promise<void>;
  deleteBudget: (category: string, month: string) => Promise<void>;
  addRecurringItem: (item: Omit<RecurringItem, 'id'>) => Promise<void>;
  deleteRecurringItem: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const SupabaseFinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const useSupabaseFinance = () => {
  const context = useContext(SupabaseFinanceContext);
  if (!context) {
    throw new Error('useSupabaseFinance must be used within a SupabaseFinanceProvider');
  }
  return context;
};

export const SupabaseFinanceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurringItems, setRecurringItems] = useState<RecurringItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (transactionsError) throw transactionsError;

      // Load budgets
      const { data: budgetsData, error: budgetsError } = await supabase
        .from('budgets')
        .select('*')
        .order('month', { ascending: false });

      if (budgetsError) throw budgetsError;

      // Load recurring items
      const { data: recurringData, error: recurringError } = await supabase
        .from('recurring_items')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (recurringError) throw recurringError;

      setTransactions(transactionsData || []);
      setBudgets(budgetsData || []);
      setRecurringItems(recurringData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลได้",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshData();
    } else {
      setTransactions([]);
      setBudgets([]);
      setRecurringItems([]);
      setLoading(false);
    }
  }, [user]);

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!user) return;

    const { error } = await supabase
      .from('transactions')
      .insert([{
        ...transaction,
        user_id: user.id
      }]);

    if (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเพิ่มรายการได้",
        variant: "destructive"
      });
      return;
    }

    await refreshData();
    toast({
      title: "สำเร็จ",
      description: "เพิ่มรายการเรียบร้อยแล้ว",
    });
  };

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบรายการได้",
        variant: "destructive"
      });
      return;
    }

    await refreshData();
    toast({
      title: "สำเร็จ",
      description: "ลบรายการเรียบร้อยแล้ว",
    });
  };

  const addBudget = async (budget: Omit<Budget, 'id'>) => {
    if (!user) return;

    const { error } = await supabase
      .from('budgets')
      .upsert([{
        ...budget,
        user_id: user.id
      }]);

    if (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถตั้งงบประมาณได้",
        variant: "destructive"
      });
      return;
    }

    await refreshData();
    toast({
      title: "สำเร็จ",
      description: "ตั้งงบประมาณเรียบร้อยแล้ว",
    });
  };

  const deleteBudget = async (category: string, month: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('category', category)
      .eq('month', month)
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบงบประมาณได้",
        variant: "destructive"
      });
      return;
    }

    await refreshData();
    toast({
      title: "สำเร็จ",
      description: "ลบงบประมาณเรียบร้อยแล้ว",
    });
  };

  const addRecurringItem = async (item: Omit<RecurringItem, 'id'>) => {
    if (!user) return;

    const { error } = await supabase
      .from('recurring_items')
      .insert([{
        ...item,
        user_id: user.id
      }]);

    if (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเพิ่มรายการซ้ำได้",
        variant: "destructive"
      });
      return;
    }

    await refreshData();
    toast({
      title: "สำเร็จ",
      description: "เพิ่มรายการซ้ำเรียบร้อยแล้ว",
    });
  };

  const deleteRecurringItem = async (id: string) => {
    const { error } = await supabase
      .from('recurring_items')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบรายการซ้ำได้",
        variant: "destructive"
      });
      return;
    }

    await refreshData();
    toast({
      title: "สำเร็จ",
      description: "ลบรายการซ้ำเรียบร้อยแล้ว",
    });
  };

  const value = {
    transactions,
    budgets,
    recurringItems,
    loading,
    addTransaction,
    deleteTransaction,
    addBudget,
    deleteBudget,
    addRecurringItem,
    deleteRecurringItem,
    refreshData,
  };

  return (
    <SupabaseFinanceContext.Provider value={value}>
      {children}
    </SupabaseFinanceContext.Provider>
  );
};
