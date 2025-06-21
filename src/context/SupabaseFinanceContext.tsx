// src/context/SupabaseFinanceContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  note: string | null;
  user_id: string;
  created_at: string;
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  month: string; // YYYY-MM
  user_id: string;
}

export interface RecurringItem {
  id: string;
  name: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  description?: string | null;
  is_active: boolean;
  user_id: string;
}

interface FinanceContextType {
  transactions: Transaction[];
  budgets: Budget[];
  recurringItems: RecurringItem[];
  loading: boolean;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at'>>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addBudget: (budget: Omit<Budget, 'id' | 'user_id'>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  addRecurringItem: (item: Omit<RecurringItem, 'id' | 'user_id'>) => Promise<void>;
  updateRecurringItem: (id: string, updates: Partial<Omit<RecurringItem, 'id' | 'user_id'>>) => Promise<void>;
  toggleRecurringItem: (id: string, isActive: boolean) => Promise<void>;
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

  const refreshData = useCallback(async () => {
    if (!user) {
        setTransactions([]);
        setBudgets([]);
        setRecurringItems([]);
        setLoading(false); // Ensure loading is false if no user
        return;
    }
    
    setLoading(true);
    try {
      const [transactionsRes, budgetsRes, recurringRes] = await Promise.all([
          supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
          supabase.from('budgets').select('*').eq('user_id', user.id).order('month', { ascending: false }),
          supabase.from('recurring_items').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      ]);

      if (transactionsRes.error) {
        console.error("Error fetching transactions:", transactionsRes.error); // Add detailed logging
        throw transactionsRes.error;
      }
      setTransactions(transactionsRes.data || []);
      
      if (budgetsRes.error) {
        console.error("Error fetching budgets:", budgetsRes.error); // Add detailed logging
        throw budgetsRes.error;
      }
      setBudgets(budgetsRes.data || []);
      
      if (recurringRes.error) {
        console.error("Error fetching recurring items:", recurringRes.error); // Add detailed logging
        throw recurringRes.error;
      }
      setRecurringItems(recurringRes.data || []);

    } catch (error: any) {
      console.error("Failed to refresh financial data:", error); // General catch-all for refreshData
      toast({ title: "เกิดข้อผิดพลาดในการโหลดข้อมูล", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false); // Ensure loading is set to false even if there's an error
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshData();
    } else {
      // If user logs out, clear data and ensure loading is false
      setTransactions([]);
      setBudgets([]);
      setRecurringItems([]);
      setLoading(false);
    }
  }, [user, refreshData]);

  const addTransaction = async (data: Omit<Transaction, 'id'|'user_id'|'created_at'>) => {
    if (!user) { console.error("No user logged in to add transaction."); return; }
    const { error } = await supabase.from('transactions').insert([{ ...data, user_id: user.id }]);
    if (error) { console.error("Error adding transaction:", error); throw error; }
    await refreshData();
  };
  
  const updateTransaction = async (id: string, updates: Partial<Omit<Transaction, 'id' | 'user_id'|'created_at'>>) => {
    if (!user) { console.error("No user logged in to update transaction."); return; }
    const { error } = await supabase.from('transactions').update(updates).eq('id', id).eq('user_id', user.id); // Ensure user_id matches
    if (error) { console.error("Error updating transaction:", error); throw error; }
    await refreshData();
  };

  const deleteTransaction = async (id: string) => {
    if (!user) { console.error("No user logged in to delete transaction."); return; }
    const { error } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', user.id); // Ensure user_id matches
    if (error) { console.error("Error deleting transaction:", error); throw error; }
    await refreshData();
  };

  const addBudget = async (budget: Omit<Budget, 'id' | 'user_id'>) => {
    if (!user) { console.error("No user logged in to add budget."); return; }
    const { error } = await supabase.from('budgets').upsert({ ...budget, user_id: user.id }, { onConflict: 'user_id,category,month' });
    if (error) { console.error("Error adding budget:", error); throw error; }
    await refreshData();
  };

  const deleteBudget = async (id: string) => {
    if (!user) { console.error("No user logged in to delete budget."); return; }
    const { error } = await supabase.from('budgets').delete().eq('id', id).eq('user_id', user.id); // Ensure user_id matches
    if (error) { console.error("Error deleting budget:", error); throw error; }
    await refreshData();
  };

  const addRecurringItem = async (data: Omit<RecurringItem, 'id'|'user_id'>) => {
    if (!user) { console.error("No user logged in to add recurring item."); return; }
    const { error } = await supabase.from('recurring_items').insert([{ ...data, user_id: user.id }]);
    if (error) { console.error("Error adding recurring item:", error); throw error; }
    await refreshData();
  };
  
  const updateRecurringItem = async (id: string, updates: Partial<Omit<RecurringItem, 'id'|'user_id'>>) => {
    if (!user) { console.error("No user logged in to update recurring item."); return; }
    const { error } = await supabase.from('recurring_items').update(updates).eq('id', id).eq('user_id', user.id); // Ensure user_id matches
    if (error) { console.error("Error updating recurring item:", error); throw error; }
    await refreshData();
  };

  const toggleRecurringItem = async (id: string, is_active: boolean) => {
    if (!user) { console.error("No user logged in to toggle recurring item."); return; }
    const { error } = await supabase.from('recurring_items').update({ is_active }).eq('id', id).eq('user_id', user.id); // Ensure user_id matches
    if (error) { console.error("Error toggling recurring item:", error); throw error; }
    await refreshData();
  };
  
  const deleteRecurringItem = async (id: string) => {
    if (!user) { console.error("No user logged in to delete recurring item."); return; }
    const { error } = await supabase.from('recurring_items').delete().eq('id', id).eq('user_id', user.id); // Ensure user_id matches
    if (error) { console.error("Error deleting recurring item:", error); throw error; }
    await refreshData();
  };

  const value = {
    transactions, budgets, recurringItems, loading, refreshData,
    addTransaction, updateTransaction, deleteTransaction,
    addBudget, deleteBudget,
    addRecurringItem, updateRecurringItem, toggleRecurringItem, deleteRecurringItem
  };

  return (
    <SupabaseFinanceContext.Provider value={value}>
      {children}
    </SupabaseFinanceContext.Provider>
  );
};