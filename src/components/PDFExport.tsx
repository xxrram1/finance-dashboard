import React from 'react';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useSupabaseFinance } from '../context/SupabaseFinanceContext';
import { useAuth } from '../hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { thSarabunFont } from '@/lib/thaifont';

const PDFExport = () => {
  const { transactions, budgets } = useSupabaseFinance();
  const { user } = useAuth();

  const generatePDF = () => {
    try {
      if (thSarabunFont === 'PASTE_YOUR_BASE64_FONT_STRING_HERE' || !thSarabunFont) {
          toast({
              title: "ยังไม่สามารถสร้าง PDF ได้",
              description: "กรุณาตั้งค่าฟอนต์ภาษาไทยในไฟล์ src/lib/thaifont.ts ก่อน",
              variant: "destructive"
          });
          return;
      }
      
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

      pdf.addFileToVFS('Sarabun-Regular.ttf', thSarabunFont);
      pdf.addFont('Sarabun-Regular.ttf', 'Sarabun', 'normal');
      pdf.setFont('Sarabun', 'normal');

      let y = 20;
      const pageHeight = pdf.internal.pageSize.height;
      const margin = 15;
      const cellPadding = 2;
      const pageWidth = pdf.internal.pageSize.width;

      const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - margin) {
          pdf.addPage();
          y = margin;
          pdf.setFontSize(10);
          pdf.text(`รายงานสรุปข้อมูลทางการเงิน (ต่อ)`, margin, y);
          y += 10;
        }
      };

      pdf.setFontSize(18);
      pdf.text('รายงานสรุปข้อมูลทางการเงิน', margin, y);
      y += 8;
      pdf.setFontSize(10);
      pdf.text(`ผู้ใช้งาน: ${user?.email || 'N/A'}`, margin, y);
      pdf.text(`วันที่จัดทำ: ${new Date().toLocaleDateString('th-TH', { dateStyle: 'long' })}`, pageWidth - margin, y, { align: 'right' });
      y += 5;
      pdf.line(margin, y, pageWidth - margin, y);
      y += 10;

      if (transactions.length > 0) {
        checkPageBreak(20);
        pdf.setFontSize(14);
        pdf.text('รายการธุรกรรม', margin, y);
        y += 8;

        const tableHeaderY = y;
        pdf.setFontSize(10);
        pdf.text('วันที่', margin + cellPadding, tableHeaderY);
        pdf.text('ประเภท', margin + 30, tableHeaderY);
        pdf.text('หมวดหมู่/หมายเหตุ', margin + 50, tableHeaderY);
        pdf.text('จำนวนเงิน (บาท)', pageWidth - margin - cellPadding, tableHeaderY, { align: 'right' });
        y += 4;
        pdf.line(margin, y, pageWidth - margin, y);
        y += 6;

        transactions.forEach(t => {
            const noteText = t.note ? ` (${t.note})` : '';
            const categoryAndNote = `${t.category}${noteText}`;
            const textLines = pdf.splitTextToSize(categoryAndNote, 80); // Wrap text
            const requiredHeight = textLines.length * 5 + 4; // Estimate height needed

            checkPageBreak(requiredHeight);
            const startY = y;
            pdf.text(new Date(t.date).toLocaleDateString('th-TH'), margin + cellPadding, startY);
            pdf.text(t.type === 'income' ? 'รายรับ' : 'รายจ่าย', margin + 30, startY);
            pdf.text(textLines, margin + 50, startY);
            pdf.text(t.amount.toLocaleString('th-TH', {minimumFractionDigits: 2}), pageWidth - margin - cellPadding, startY, { align: 'right' });
            y += requiredHeight;
        });
      } else {
        checkPageBreak(10);
        pdf.text('ไม่มีข้อมูลรายการธุรกรรม', margin, y);
        y += 10;
      }

      pdf.save(`Financial_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast({title: "เกิดข้อผิดพลาด", description: "ไม่สามารถสร้างไฟล์ PDF ได้ โปรดตรวจสอบคอนโซล", variant: "destructive"})
    }
  };

  return (
    <Button onClick={generatePDF} className="w-full justify-start gap-2">
      <FileDown size={16} />
      ส่งออกรายงานเป็น PDF
    </Button>
  );
};

export default PDFExport;