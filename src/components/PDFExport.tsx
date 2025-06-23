// src/components/PDFExport.tsx

import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileDown, Calendar, Building2, TrendingUp, TrendingDown, PieChart, BarChart3, Loader2, ChevronDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useSupabaseFinance } from '../context/SupabaseFinanceContext';
import { useAuth } from '../hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { thSarabunFont } from '@/lib/thaifont';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { useIsMobile } from '@/hooks/use-mobile'; // Assuming you have a useIsMobile hook

// For image export (html2canvas must be loaded via CDN in public/index.html or similar)
declare const html2canvas: any;

interface ReportConfig {
  includeCharts: boolean;
  includeSummary: boolean;
  includeDetails: boolean;
  includeBudgets: boolean;
  dateRange: 'all' | 'month' | 'quarter' | 'year';
  reportType: 'executive' | 'detailed' | 'summary';
}

interface PDFExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Helper to format currency
const formatCurrency = (amount: number) => `฿${amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Updated PDFExport component to be a modal
const PDFExport: React.FC<PDFExportModalProps> = ({ isOpen, onClose }) => {
  const { transactions, budgets } = useSupabaseFinance();
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const isMobile = useIsMobile(); // Use the hook for responsive behavior

  // Determine if we should use compact layout for text truncation in descriptions
  const isCompact = typeof window !== 'undefined' && window.innerWidth < 1024;

  // Company Info (can be customized)
  const companyInfo = {
    name: 'บริษัท การเงิน จำกัด',
    address: '123 ถนนสีลม แขวงสีลม เขตบางรัก กรุงเทพฯ 10500',
    phone: '02-234-5678',
    email: 'info@company.com',
    website: 'www.company.com',
    taxId: '0-1234-56789-01-2'
  };

  const generateProfessionalPDF = useCallback(async (config: ReportConfig = {
    includeCharts: true,
    includeSummary: true,
    includeDetails: true,
    includeBudgets: true,
    dateRange: 'all',
    reportType: 'executive'
  }) => {
    setIsGenerating(true);

    try {
      if (thSarabunFont === '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') {
        toast({
          title: "ไม่สามารถสร้างรายงานได้",
          description: "โปรดใส่ Base64 font string ของ Sarabun-Regular.ttf ใน src/lib/thaifont.ts",
          variant: "destructive"
        });
        return;
      }

      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

      // **FIX: Declare margin at the beginning of the function**
      const margin = 20;
      const pageHeight = pdf.internal.pageSize.height;
      const pageWidth = pdf.internal.pageSize.width;
      const contentWidth = pageWidth - (margin * 2);

      // Setup fonts
      pdf.addFileToVFS('Sarabun-Regular.ttf', thSarabunFont);
      pdf.addFont('Sarabun-Regular.ttf', 'Sarabun', 'normal');
      pdf.setFont('Sarabun', 'normal');

      // Page setup
      let y = margin;


      // Colors (Professional palette)
      const colors = {
        primary: [41, 128, 185],      // Professional Blue
        secondary: [52, 73, 94],      // Dark Blue Gray
        success: [39, 174, 96],       // Green
        danger: [231, 76, 60],        // Red
        warning: [243, 156, 18],      // Orange
        light: [236, 240, 241],       // Light Gray
        dark: [44, 62, 80]            // Dark Gray
      };

      // Helper functions
      const addPage = () => {
        pdf.addPage();
        y = margin;
        addWatermark();
      };

      const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - 40) {
          addPage();
        }
      };

      const addWatermark = () => {
        pdf.saveGraphicsState();
        pdf.setGState(new pdf.GState({ opacity: 0.1 }));
        pdf.setFontSize(60);
        pdf.setTextColor(...colors.primary);
        pdf.text('CONFIDENTIAL', pageWidth / 2, pageHeight / 2, {
          align: 'center',
          angle: -45
        });
        pdf.restoreGraphicsState();
      };

      const drawHeader = () => {
        // Company Logo Area (placeholder)
        pdf.setFillColor(...colors.primary);
        pdf.rect(margin, margin, 40, 25, 'F');

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(12);
        pdf.text('LOGO', margin + 20, margin + 15, { align: 'center' });

        // Company Info
        pdf.setTextColor(...colors.dark);
        pdf.setFontSize(14);
        pdf.text(companyInfo.name, margin + 50, margin + 8);

        pdf.setFontSize(8);
        pdf.text(companyInfo.address, margin + 50, margin + 15);
        pdf.text(`โทร: ${companyInfo.phone} | อีเมล: ${companyInfo.email}`, margin + 50, margin + 20);
        pdf.text(`เลขประจำตัวผู้เสียภาษี: ${companyInfo.taxId}`, margin + 50, margin + 25);

        // Header line
        pdf.setLineWidth(0.5);
        pdf.setDrawColor(...colors.primary);
        pdf.line(margin, margin + 30, pageWidth - margin, margin + 30);

        return margin + 35;
      };

      const drawFooter = (currentPageNum: number, totalPagesNum: number) => {
        const footerY = pageHeight - 20;

        // Footer line
        pdf.setLineWidth(0.3);
        pdf.setDrawColor(...colors.light);
        pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

        // Footer content
        pdf.setFontSize(7);
        pdf.setTextColor(...colors.secondary);

        pdf.text(`หน้า ${currentPageNum} จาก ${totalPagesNum}`, margin, footerY);
        pdf.text(`สร้างเมื่อ: ${new Date().toLocaleString('th-TH')}`, pageWidth / 2, footerY, { align: 'center' });
        pdf.text('ข้อมูลเป็นความลับ', pageWidth - margin, footerY, { align: 'right' });
      };

      const drawSection = (title: string) => {
        checkPageBreak(15);

        // Section background
        pdf.setFillColor(...colors.light);
        pdf.rect(margin, y, contentWidth, 10, 'F');

        // Section title
        pdf.setFontSize(12);
        pdf.setTextColor(...colors.primary);
        pdf.text(title, margin + 5, y + 6);

        y += 15;
      };

      const calculateFinancialMetrics = () => {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        // Filter transactions based on date range
        let filteredTransactions = transactions;

        if (config.dateRange === 'month') {
          filteredTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getMonth() === currentMonth &&
                   transactionDate.getFullYear() === currentYear;
          });
        } else if (config.dateRange === 'year') {
          filteredTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getFullYear() === currentYear;
          });
        }

        const totalIncome = filteredTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + (t.amount || 0), 0);

        const totalExpense = filteredTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + (t.amount || 0), 0);

        const netProfit = totalIncome - totalExpense;
        const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

        // Category analysis
        const categoryExpenses = {};
        filteredTransactions
          .filter(t => t.type === 'expense')
          .forEach(t => {
            const category = t.category || 'อื่นๆ';
            categoryExpenses[category] = (categoryExpenses[category] || 0) + t.amount;
          });

        return {
          totalIncome,
          totalExpense,
          netProfit,
          profitMargin,
          categoryExpenses,
          transactionCount: filteredTransactions.length,
          avgTransactionValue: filteredTransactions.length > 0 ?
            (totalIncome + totalExpense) / filteredTransactions.length : 0
        };
      };

      const drawExecutiveSummary = (metrics: any) => {
        drawSection('📊 สรุปสำหรับผู้บริหาร');

        // Key Metrics Cards
        const cardWidth = (contentWidth - 10) / 3;
        const cardHeight = 25;

        // Income Card
        pdf.setFillColor(...colors.success);
        pdf.rect(margin, y, cardWidth, cardHeight, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(8);
        pdf.text('รายได้รวม', margin + 5, y + 8);
        pdf.setFontSize(14);
        pdf.text(`฿${metrics.totalIncome.toLocaleString('th-TH', {minimumFractionDigits: 2})}`,
                 margin + 5, y + 18);

        // Expense Card
        pdf.setFillColor(...colors.danger);
        pdf.rect(margin + cardWidth + 5, y, cardWidth, cardHeight, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(8);
        pdf.text('ค่าใช้จ่ายรวม', margin + cardWidth + 10, y + 8);
        pdf.setFontSize(14);
        pdf.text(`฿${metrics.totalExpense.toLocaleString('th-TH', {minimumFractionDigits: 2})}`,
                 margin + cardWidth + 10, y + 18);

        // Profit Card
        const profitColor = metrics.netProfit >= 0 ? colors.success : colors.danger;
        pdf.setFillColor(...profitColor);
        pdf.rect(margin + (cardWidth + 5) * 2, y, cardWidth, cardHeight, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(8);
        pdf.text('กำไรสุทธิ', margin + (cardWidth + 5) * 2 + 5, y + 8);
        pdf.setFontSize(14);
        pdf.text(`฿${metrics.netProfit.toLocaleString('th-TH', {minimumFractionDigits: 2})}`,
                 margin + (cardWidth + 5) * 2 + 5, y + 18);

        y += cardHeight + 15;

        // Performance Indicators
        checkPageBreak(30);
        pdf.setTextColor(...colors.dark);
        pdf.setFontSize(10);

        pdf.text('📈 ตัวชี้วัดประสิทธิภาพ', margin, y);
        y += 8;

        pdf.setFontSize(9);
        pdf.text(`• อัตรากำไร: ${metrics.profitMargin.toFixed(2)}%`, margin + 10, y);
        y += 5;
        pdf.text(`• จำนวนธุรกรรม: ${metrics.transactionCount.toLocaleString('th-TH')} รายการ`, margin + 10, y);
        y += 5;
        pdf.text(`• มูลค่าเฉลี่ยต่อธุรกรรม: ฿${metrics.avgTransactionValue.toLocaleString('th-TH', {minimumFractionDigits: 2})}`, margin + 10, y);
        y += 10;
      };

      const drawFinancialAnalysis = (metrics: any) => {
        drawSection('📈 การวิเคราะห์ทางการเงิน');

        // Trend Analysis
        pdf.setFontSize(10);
        pdf.setTextColor(...colors.dark);
        pdf.text('แนวโน้มทางการเงิน:', margin, y);
        y += 8;

        pdf.setFontSize(9);
        if (metrics.netProfit > 0) {
          pdf.setTextColor(...colors.success);
          pdf.text('✓ บริษัทมีกำไรในช่วงเวลาที่รายงาน', margin + 10, y);
          y += 5;
          pdf.text(`✓ อัตรากำไร ${metrics.profitMargin.toFixed(2)}% อยู่ในเกณฑ์ที่ดี`, margin + 10, y);
        } else {
          pdf.setTextColor(...colors.danger);
          pdf.text('⚠ บริษัทมีผลขาดทุนในช่วงเวลาที่รายงาน', margin + 10, y);
          y += 5;
          pdf.text('⚠ ควรทบทวนกลยุทธ์การดำเนินธุรกิจ', margin + 10, y);
        }
        y += 10;

        // Category Analysis
        pdf.setTextColor(...colors.dark);
        pdf.text('การวิเคราะห์ตามหมวดหมู่:', margin, y);
        y += 8;

        const topCategories = Object.entries(metrics.categoryExpenses)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5);

        topCategories.forEach(([category, amount], index) => {
          const percentage = (amount / metrics.totalExpense) * 100;
          pdf.setFontSize(9);
          pdf.text(`${index + 1}. ${category}: ฿${amount.toLocaleString('th-TH', {minimumFractionDigits: 2})} (${percentage.toFixed(1)}%)`,
                   margin + 10, y);
          y += 5;
        });

        y += 10;
      };

      const drawRecommendations = (metrics: any) => {
        drawSection('💡 ข้อเสนอแนะเชิงกลยุทธ์');

        pdf.setFontSize(9);
        pdf.setTextColor(...colors.dark);

        const recommendations = [];

        if (metrics.profitMargin < 10) {
          recommendations.push('• พิจารณาปรับปรุงอัตรากำไรโดยการเพิ่มประสิทธิภาพในการดำเนินงาน');
        }

        if (metrics.netProfit < 0) {
          recommendations.push('• จำเป็นต้องลดค่าใช้จ่ายหรือเพิ่มรายได้อย่างเร่งด่วน');
        }

        const topExpenseCategory = Object.entries(metrics.categoryExpenses)
          .sort(([,a], [,b]) => b - a)[0];

        if (topExpenseCategory) {
          const [category, amount] = topExpenseCategory;
          const percentage = (amount / metrics.totalExpense) * 100;
          if (percentage > 40) {
            recommendations.push(`• หมวดหมู่ "${category}" มีสัดส่วนค่าใช้จ่ายสูง (${percentage.toFixed(1)}%) ควรพิจารณาการควบคุมต้นทุน`);
          }
        }

        if (recommendations.length === 0) {
          recommendations.push('• ผลการดำเนินงานอยู่ในเกณฑ์ดี ควรรักษาประสิทธิภาพให้คงที่');
          recommendations.push('• พิจารณาการลงทุนเพิ่มเติมเพื่อขยายธุรกิจ');
        }

        recommendations.forEach(rec => {
          checkPageBreak(6);
          pdf.text(rec, margin, y);
          y += 6;
        });

        y += 10;
      };

      const drawDetailedTransactions = () => {
        drawSection('📋 รายละเอียดธุรกรรม');

        // Table header
        const colWidths = [25, 20, 60, 35, 30];
        const tableHeaders = ['วันที่', 'ประเภท', 'หมวดหมู่/รายละเอียด', 'จำนวนเงิน', 'สถานะ'];

        pdf.setFillColor(...colors.secondary);
        pdf.rect(margin, y, contentWidth, 8, 'F');

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(8);

        let xPos = margin + 2;
        tableHeaders.forEach((header, index) => {
          pdf.text(header, xPos, y + 5);
          xPos += colWidths[index];
        });

        y += 10;

        // Table rows
        transactions.slice(0, 50).forEach((transaction, index) => {
          checkPageBreak(8);

          // Alternating row colors
          if (index % 2 === 0) {
            pdf.setFillColor(250, 250, 250);
            pdf.rect(margin, y, contentWidth, 6, 'F');
          }

          pdf.setTextColor(...colors.dark);
          pdf.setFontSize(7);

          xPos = margin + 2;

          // Date
          const date = new Date(transaction.date).toLocaleDateString('th-TH');
          pdf.text(date, xPos, y + 4);
          xPos += colWidths[0];

          // Type with color coding
          const typeText = transaction.type === 'income' ? 'รายรับ' : 'รายจ่าย';
          const typeColor = transaction.type === 'income' ? colors.success : colors.danger;
          pdf.setTextColor(...typeColor);
          pdf.text(typeText, xPos, y + 4);
          pdf.setTextColor(...colors.dark);
          xPos += colWidths[1];

          // Category and note
          const categoryNote = `${transaction.category}${transaction.note ? ` (${transaction.note})` : ''}`;
          try {
            const wrappedText = pdf.splitTextToSize(categoryNote, colWidths[2] - 4);
            const displayText = Array.isArray(wrappedText) ? wrappedText[0] : categoryNote;
            pdf.text(displayText + (wrappedText.length > 1 ? '...' : ''), xPos, y + 4);
          } catch (error) {
            // Fallback if splitTextToSize fails
            const maxLength = 20;
            const displayText = categoryNote.length > maxLength ?
              categoryNote.substring(0, maxLength) + '...' : categoryNote;
            pdf.text(displayText, xPos, y + 4);
          }
          xPos += colWidths[2];

          // Amount
          const amount = `฿${transaction.amount.toLocaleString('th-TH', {minimumFractionDigits: 2})}`;
          pdf.text(amount, xPos + colWidths[3] - 2, y + 4, { align: 'right' });
          xPos += colWidths[3];

          // Status
          pdf.setTextColor(...colors.success);
          pdf.text('สมบูรณ์', xPos, y + 4);

          y += 6;
        });

        if (transactions.length > 50) {
          y += 5;
          pdf.setTextColor(...colors.secondary);
          pdf.setFontSize(8);
          pdf.text(`* แสดงเพียง 50 รายการแรกจากทั้งหมด ${transactions.length} รายการ`, margin, y);
          y += 10;
        }
      };

      const drawBudgetAnalysis = () => {
        if (!budgets || budgets.length === 0) return;

        drawSection('💰 การวิเคราะห์งบประมาณ');

        // This is a simplified representation as actual `used` and `limit` are not in the `Budget` interface
        // For a real report, you'd need to calculate 'used' from transactions
        budgets.forEach(budget => {
          checkPageBreak(12);

          // Simulate `used` and `remaining` for demonstration
          const simulatedUsed = transactions.filter(t => t.category === budget.category && t.date.startsWith(budget.month))
                                            .reduce((sum, t) => sum + t.amount, 0);
          const simulatedLimit = budget.amount;
          const simulatedRemaining = simulatedLimit - simulatedUsed;
          const usagePercentage = simulatedLimit > 0 ? (simulatedUsed / simulatedLimit) * 100 : 0;

          // Budget item header
          pdf.setFontSize(9);
          pdf.setTextColor(...colors.dark);
          pdf.text(`📊 ${budget.category} (${budget.month})`, margin, y);
          y += 6;

          // Progress bar
          const barWidth = contentWidth - 40;
          const barHeight = 4;

          // Background bar
          pdf.setFillColor(...colors.light);
          pdf.rect(margin + 20, y, barWidth, barHeight, 'F');

          // Usage bar
          const usageWidth = (usagePercentage / 100) * barWidth;
          const barColor = usagePercentage > 90 ? colors.danger :
                          usagePercentage > 70 ? colors.warning : colors.success;
          pdf.setFillColor(...barColor);
          pdf.rect(margin + 20, y, usageWidth, barHeight, 'F');

          y += 8;

          // Budget details
          pdf.setFontSize(8);
          pdf.text(`ใช้ไป: ฿${simulatedUsed.toLocaleString('th-TH', {minimumFractionDigits: 2})} (${usagePercentage.toFixed(1)}%)`, margin + 20, y);
          pdf.text(`งบประมาณ: ฿${simulatedLimit.toLocaleString('th-TH', {minimumFractionDigits: 2})}`, pageWidth - margin, y, { align: 'right' });
          y += 4;
          pdf.text(`คงเหลือ: ฿${simulatedRemaining.toLocaleString('th-TH', {minimumFractionDigits: 2})}`, margin + 20, y);

          // Warning for over budget
          if (usagePercentage > 100) {
            pdf.setTextColor(...colors.danger);
            pdf.text('⚠ เกินงบประมาณ', pageWidth - margin, y, { align: 'right' });
          }

          y += 8;
        });
      };

      // Start PDF generation
      let initialY = drawHeader();
      y = initialY;

      // Title Page
      checkPageBreak(40);
      pdf.setFontSize(20);
      pdf.setTextColor(...colors.primary);
      pdf.text('รายงานการเงินฉบับผู้บริหาร', pageWidth / 2, y + 20, { align: 'center' });

      pdf.setFontSize(12);
      pdf.setTextColor(...colors.secondary);
      pdf.text(`ประจำ${config.dateRange === 'month' ? 'เดือน' :
                config.dateRange === 'year' ? 'ปี' : 'ช่วงเวลา'}`,
               pageWidth / 2, y + 30, { align: 'center' });

      pdf.setFontSize(10);
      pdf.text(`จัดทำโดย: ${user?.email || 'ระบบ'}`, pageWidth / 2, y + 40, { align: 'center' });
      pdf.text(`วันที่: ${new Date().toLocaleDateString('th-TH', { dateStyle: 'long' })}`,
               pageWidth / 2, y + 48, { align: 'center' });

      y += 60;

      // Calculate metrics
      const metrics = calculateFinancialMetrics();

      // Report sections
      if (config.includeSummary) {
        drawExecutiveSummary(metrics);
      }

      if (config.reportType === 'executive' || config.reportType === 'detailed') {
        drawFinancialAnalysis(metrics);
        drawRecommendations(metrics);
      }

      if (config.includeBudgets) {
        drawBudgetAnalysis();
      }

      if (config.includeDetails && config.reportType === 'detailed') {
        drawDetailedTransactions();
      }

      // Add footers to all pages
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        drawFooter(i, totalPages);
      }

      // Generate filename
      const dateStr = new Date().toISOString().split('T')[0];
      const reportTypeStr = config.reportType === 'executive' ? 'Executive' :
                           config.reportType === 'detailed' ? 'Detailed' : 'Summary';
      const filename = `Financial_Report_${reportTypeStr}_${dateStr}.pdf`;

      // Save PDF
      pdf.save(filename);

      toast({
        title: "🎉 สร้างรายงานสำเร็จ",
        description: `รายงาน ${reportTypeStr} ถูกสร้างและดาวน์โหลดเรียบร้อยแล้ว`,
      });

    } catch (error) {
      console.error("Failed to generate professional PDF:", error);
      toast({
        title: "❌ เกิดข้อผิดพลาด",
        description: `ไม่สามารถสร้างรายงานได้: ${error instanceof Error ? error.message : 'ข้อผิดพลาดไม่ทราบสาเหตุ'}`,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      onClose(); // Close the modal after generation (or error)
    }
  }, [transactions, budgets, user, onClose]);

  const content = (
    <div className="flex flex-col h-full">
      <CardHeader className={cn(
        "bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700",
        isMobile ? "pb-2 px-3 py-3" : "pb-3 px-4 py-4"
      )}>
        <div className={cn(
          "flex items-center gap-2",
          isMobile && "gap-1.5"
        )}>
          <div className={cn(
            "rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center",
            isMobile ? "w-6 h-6" : "w-8 h-8"
          )}>
            <FileDown className={cn("text-white", isMobile ? "w-3 h-3" : "w-4 h-4")} />
          </div>
          <div>
            <CardTitle className={cn(
              "font-semibold text-slate-800 dark:text-slate-100",
              isMobile ? "text-sm" : "text-base"
            )}>
              ส่งออกรายงาน PDF
            </CardTitle>
            <CardDescription className={cn(
              "text-slate-600 dark:text-slate-400",
              isMobile ? "text-xs" : "text-xs"
            )}>
              เลือกรูปแบบรายงานที่ต้องการ
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn(
        "space-y-3 flex-grow overflow-y-auto",
        isMobile ? "p-3" : "p-4"
      )}>
        {/* Executive Report */}
        <Button
          onClick={() => generateProfessionalPDF({
            includeCharts: true,
            includeSummary: true,
            includeDetails: false,
            includeBudgets: true,
            dateRange: 'all',
            reportType: 'executive'
          })}
          disabled={isGenerating}
          variant="ghost"
          className={cn(
            "w-full justify-start text-left transition-all duration-200",
            "hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-transparent hover:border-blue-200 dark:hover:border-blue-800",
            "rounded-lg group",
            isMobile ? "h-auto p-3" : "h-auto p-4"
          )}
        >
          <div className={cn(
            "flex items-start w-full",
            isMobile ? "gap-2" : "gap-3"
          )}>
            <div className={cn(
              "rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200",
              isMobile ? "w-8 h-8" : "w-10 h-10"
            )}>
              {isGenerating ? (
                <Loader2 className={cn("animate-spin text-white", isMobile ? "w-4 h-4" : "w-5 h-5")} />
              ) : (
                <TrendingUp className={cn("text-white", isMobile ? "w-4 h-4" : "w-5 h-5")} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className={cn(
                "font-semibold text-slate-900 dark:text-slate-100 leading-tight mb-1",
                isMobile ? "text-sm" : "text-sm"
              )}>
                รายงานผู้บริหาร
              </div>
              <div className={cn(
                "text-slate-600 dark:text-slate-400 leading-relaxed",
                // Responsive text truncation
                isMobile ? "text-xs line-clamp-2" : isCompact ? "text-xs line-clamp-1" : "text-xs"
              )}>
                {isMobile
                  ? "สรุปข้อมูลสำหรับผู้บริหาร"
                  : isCompact
                    ? "สรุปข้อมูลสำคัญสำหรับผู้บริหาร"
                    : "สรุปข้อมูลสำคัญและแนวโน้มทางการเงินสำหรับผู้บริหาร"
                }
              </div>
              <div className={cn(
                "flex items-center gap-1 mt-2 flex-wrap",
                isMobile && "gap-1"
              )}>
                <Badge variant="secondary" className={cn(
                  "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
                  isMobile ? "text-xs px-1.5 py-0.5" : "text-xs px-2 py-0.5"
                )}>
                  Executive
                </Badge>
                <Badge variant="outline" className={cn(
                  isMobile ? "text-xs px-1.5 py-0.5" : "text-xs px-2 py-0.5"
                )}>
                  4-6 หน้า
                </Badge>
              </div>
            </div>
          </div>
        </Button>

        {/* Detailed Report */}
        <Button
          onClick={() => generateProfessionalPDF({
            includeCharts: true,
            includeSummary: true,
            includeDetails: true,
            includeBudgets: true,
            dateRange: 'all',
            reportType: 'detailed'
          })}
          disabled={isGenerating}
          variant="ghost"
          className={cn(
            "w-full justify-start text-left transition-all duration-200",
            "hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800",
            "rounded-lg group",
            isMobile ? "h-auto p-3" : "h-auto p-4"
          )}
        >
          <div className={cn(
            "flex items-start w-full",
            isMobile ? "gap-2" : "gap-3"
          )}>
            <div className={cn(
              "rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200",
              isMobile ? "w-8 h-8" : "w-10 h-10"
            )}>
              {isGenerating ? (
                <Loader2 className={cn("animate-spin text-white", isMobile ? "w-4 h-4" : "w-5 h-5")} />
              ) : (
                <BarChart3 className={cn("text-white", isMobile ? "w-4 h-4" : "w-5 h-5")} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className={cn(
                "font-semibold text-slate-900 dark:text-slate-100 leading-tight mb-1",
                isMobile ? "text-sm" : "text-sm"
              )}>
                รายงานวิเคราะห์ละเอียด
              </div>
              <div className={cn(
                "text-slate-600 dark:text-slate-400 leading-relaxed",
                // Responsive text truncation
                isMobile ? "text-xs line-clamp-2" : isCompact ? "text-xs line-clamp-1" : "text-xs"
              )}>
                {isMobile
                  ? "รายงานครบถ้วนพร้อมวิเคราะห์"
                  : isCompact
                    ? "รายงานครบถ้วนพร้อมการวิเคราะห์เชิงลึก"
                    : "รายงานครบถ้วนพร้อมรายละเอียดธุรกรรมและการวิเคราะห์เชิงลึก"
                }
              </div>
              <div className={cn(
                "flex items-center gap-1 mt-2 flex-wrap",
                isMobile && "gap-1"
              )}>
                <Badge variant="secondary" className={cn(
                  "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
                  isMobile ? "text-xs px-1.5 py-0.5" : "text-xs px-2 py-0.5"
                )}>
                  Detailed
                </Badge>
                <Badge variant="outline" className={cn(
                  isMobile ? "text-xs px-1.5 py-0.5" : "text-xs px-2 py-0.5"
                )}>
                  8-12 หน้า
                </Badge>
              </div>
            </div>
          </div>
        </Button>

        {/* Monthly Report */}
        <Button
          onClick={() => generateProfessionalPDF({
            includeCharts: false,
            includeSummary: true,
            includeDetails: true,
            includeBudgets: false,
            dateRange: 'month',
            reportType: 'summary'
          })}
          disabled={isGenerating}
          variant="ghost"
          className={cn(
            "w-full justify-start text-left transition-all duration-200",
            "hover:bg-violet-50 dark:hover:bg-violet-950/30 border border-transparent hover:border-violet-200 dark:hover:border-violet-800",
            "rounded-lg group",
            isMobile ? "h-auto p-3" : "h-auto p-4"
          )}
        >
          <div className={cn(
            "flex items-start w-full",
            isMobile ? "gap-2" : "gap-3"
          )}>
            <div className={cn(
              "rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200",
              isMobile ? "w-8 h-8" : "w-10 h-10"
            )}>
              {isGenerating ? (
                <Loader2 className={cn("animate-spin text-white", isMobile ? "w-4 h-4" : "w-5 h-5")} />
              ) : (
                <Calendar className={cn("text-white", isMobile ? "w-4 h-4" : "w-5 h-5")} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className={cn(
                "font-semibold text-slate-900 dark:text-slate-100 leading-tight mb-1",
                isMobile ? "text-sm" : "text-sm"
              )}>
                รายงานประจำเดือน
              </div>
              <div className={cn(
                "text-slate-600 dark:text-slate-400 leading-relaxed",
                isMobile ? "text-xs line-clamp-2" : "text-xs"
              )}>
                {isMobile
                  ? "สรุปผลประจำเดือนปัจจุบัน"
                  : "สรุปผลการดำเนินงานทางการเงินประจำเดือนปัจจุบัน"
                }
              </div>
              <div className={cn(
                "flex items-center gap-1 mt-2 flex-wrap",
                isMobile && "gap-1"
              )}>
                <Badge variant="secondary" className={cn(
                  "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300",
                  isMobile ? "text-xs px-1.5 py-0.5" : "text-xs px-2 py-0.5"
                )}>
                  Monthly
                </Badge>
                <Badge variant="outline" className={cn(
                  isMobile ? "text-xs px-1.5 py-0.5" : "text-xs px-2 py-0.5"
                )}>
                  2-4 หน้า
                </Badge>
              </div>
            </div>
          </div>
        </Button>
      </CardContent>

      {/* Loading Overlay */}
      {isGenerating && (
        <div
          className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm flex items-center justify-center"
          style={{ zIndex: 10000 }}
        >
          <div className="text-center space-y-3">
            <div className={cn(
              "rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto",
              isMobile ? "w-10 h-10" : "w-12 h-12"
            )}>
              <Loader2 className={cn("animate-spin text-white", isMobile ? "w-5 h-5" : "w-6 h-6")} />
            </div>
            <div>
              <p className={cn(
                "font-semibold text-slate-800 dark:text-slate-200",
                isMobile ? "text-sm" : "text-sm"
              )}>
                กำลังสร้างรายงาน PDF
              </p>
              <p className={cn(
                "text-slate-600 dark:text-slate-400",
                isMobile ? "text-xs" : "text-xs"
              )}>
                กรุณารอสักครู่...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onClose={onClose}>
        <DrawerContent className="h-[95vh] flex flex-col">
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl p-0 h-[80vh] flex flex-col">
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default PDFExport;