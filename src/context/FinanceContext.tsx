import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  note: string;
}

export interface Budget {
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
  startDate: string;
  lastGenerated?: string;
}

interface FinanceContextType {
  transactions: Transaction[];
  budgets: Budget[];
  recurringItems: RecurringItem[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  addBudget: (budget: Budget) => void;
  deleteBudget: (category: string, month: string) => void;
  addRecurringItem: (item: Omit<RecurringItem, 'id'>) => void;
  deleteRecurringItem: (id: string) => void;
  generateRecurringTransactions: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};

export const FinanceProvider = ({ children }: { children: ReactNode }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurringItems, setRecurringItems] = useState<RecurringItem[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const storedTransactions = localStorage.getItem('transactions');
    const storedBudgets = localStorage.getItem('budgets');
    const storedRecurringItems = localStorage.getItem('recurringItems');

    if (storedTransactions) {
      setTransactions(JSON.parse(storedTransactions));
    }
    if (storedBudgets) {
      setBudgets(JSON.parse(storedBudgets));
    }
    if (storedRecurringItems) {
      setRecurringItems(JSON.parse(storedRecurringItems));
    }
  }, []);

  // Save transactions to localStorage
  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Save budgets to localStorage
  useEffect(() => {
    localStorage.setItem('budgets', JSON.stringify(budgets));
  }, [budgets]);

  // Save recurring items to localStorage
  useEffect(() => {
    localStorage.setItem('recurringItems', JSON.stringify(recurringItems));
  }, [recurringItems]);

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction = {
      ...transaction,
      id: Date.now().toString(),
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const addBudget = (budget: Budget) => {
    setBudgets(prev => {
      const existing = prev.filter(b => !(b.category === budget.category && b.month === budget.month));
      return [...existing, budget];
    });
  };

  const deleteBudget = (category: string, month: string) => {
    setBudgets(prev => prev.filter(b => !(b.category === category && b.month === month)));
  };

  const addRecurringItem = (item: Omit<RecurringItem, 'id'>) => {
    const newItem = {
      ...item,
      id: Date.now().toString(),
    };
    setRecurringItems(prev => [...prev, newItem]);
  };

  const deleteRecurringItem = (id: string) => {
    setRecurringItems(prev => prev.filter(item => item.id !== id));
  };

  const generateRecurringTransactions = () => {
    const today = new Date();
    const newTransactions: Transaction[] = [];

    recurringItems.forEach(item => {
      const startDate = new Date(item.startDate);
      const lastGenerated = item.lastGenerated ? new Date(item.lastGenerated) : new Date(startDate.getTime() - 86400000);
      
      let nextDate = new Date(lastGenerated);
      
      while (nextDate < today) {
        switch (item.frequency) {
          case 'daily':
            nextDate.setDate(nextDate.getDate() + 1);
            break;
          case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
          case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
          case 'yearly':
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
        }

        if (nextDate <= today && nextDate >= startDate) {
          newTransactions.push({
            id: `${item.id}-${nextDate.getTime()}`,
            date: nextDate.toISOString().split('T')[0],
            type: item.type,
            category: item.category,
            amount: item.amount,
            note: `รายการเกิดซ้ำ: ${item.name}`,
          });
        }
      }

      // Update last generated date
      setRecurringItems(prev => prev.map(ri => 
        ri.id === item.id ? { ...ri, lastGenerated: today.toISOString().split('T')[0] } : ri
      ));
    });

    if (newTransactions.length > 0) {
      setTransactions(prev => [...newTransactions, ...prev]);
    }
  };

  // Generate recurring transactions on mount
  useEffect(() => {
    generateRecurringTransactions();
  }, []);

  const value = {
    transactions,
    budgets,
    recurringItems,
    addTransaction,
    deleteTransaction,
    addBudget,
    deleteBudget,
    addRecurringItem,
    deleteRecurringItem,
    generateRecurringTransactions,
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
};