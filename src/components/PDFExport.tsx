
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useSupabaseFinance } from '../context/SupabaseFinanceContext';
import { useAuth } from '../hooks/useAuth';

const PDFExport = () => {
  const { transactions, budgets } = useSupabaseFinance();
  const { user } = useAuth();

  const generatePDF = async () => {
    const pdf = new jsPDF();
    
    // Add Thai font support (you might need to add font file)
    pdf.setFont('helvetica');
    
    // Header
    pdf.setFontSize(20);
    pdf.text('รายงานการเงินส่วนบุคคล', 20, 30);
    
    if (user?.email) {
      pdf.setFontSize(12);
      pdf.text(`ผู้ใช้: ${user.email}`, 20, 45);
    }
    
    pdf.text(`วันที่สร้างรายงาน: ${new Date().toLocaleDateString('th-TH')}`, 20, 55);
    
    let yPosition = 80;
    
    // Summary
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const netBalance = totalIncome - totalExpense;
    
    pdf.setFontSize(16);
    pdf.text('สรุปยอดเงิน', 20, yPosition);
    yPosition += 15;
    
    pdf.setFontSize(12);
    pdf.text(`รายรับทั้งหมด: ${totalIncome.toLocaleString()} บาท`, 30, yPosition);
    yPosition += 10;
    pdf.text(`รายจ่ายทั้งหมด: ${totalExpense.toLocaleString()} บาท`, 30, yPosition);
    yPosition += 10;
    pdf.text(`ยอดคงเหลือ: ${netBalance.toLocaleString()} บาท`, 30, yPosition);
    yPosition += 20;
    
    // Recent Transactions
    pdf.setFontSize(16);
    pdf.text('รายการล่าสุด (10 รายการ)', 20, yPosition);
    yPosition += 15;
    
    const recentTransactions = transactions.slice(0, 10);
    
    pdf.setFontSize(10);
    recentTransactions.forEach((transaction) => {
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 30;
      }
      
      const typeText = transaction.type === 'income' ? 'รายรับ' : 'รายจ่าย';
      const text = `${transaction.date} | ${typeText} | ${transaction.category} | ${transaction.amount.toLocaleString()} บาท`;
      pdf.text(text, 30, yPosition);
      
      if (transaction.note) {
        yPosition += 8;
        pdf.text(`  หมายเหตุ: ${transaction.note}`, 35, yPosition);
      }
      
      yPosition += 12;
    });
    
    // Budgets
    if (budgets.length > 0) {
      if (yPosition > 200) {
        pdf.addPage();
        yPosition = 30;
      }
      
      yPosition += 20;
      pdf.setFontSize(16);
      pdf.text('งบประมาณ', 20, yPosition);
      yPosition += 15;
      
      pdf.setFontSize(10);
      budgets.forEach((budget) => {
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 30;
        }
        
        pdf.text(`${budget.month} | ${budget.category} | ${budget.amount.toLocaleString()} บาท`, 30, yPosition);
        yPosition += 10;
      });
    }
    
    // Save PDF
    pdf.save(`รายงานการเงิน_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <Button onClick={generatePDF} className="flex items-center gap-2">
      <FileDown size={16} />
      ส่งออก PDF
    </Button>
  );
};

export default PDFExport;
