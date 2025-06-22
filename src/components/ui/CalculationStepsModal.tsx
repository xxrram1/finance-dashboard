// src/components/ui/CalculationStepsModal.tsx

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './dialog';
import { BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';

interface CalculationStepsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  steps: string; // Accepts a single Markdown string with LaTeX
}

export const CalculationStepsModal: React.FC<CalculationStepsModalProps> = ({ isOpen, onClose, title, description, steps }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-slate-100">
            <BookOpen className="h-6 w-6 text-primary" />
            ขั้นตอนการคำนวณ: {title}
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="prose prose-base dark:prose-invert max-w-none space-y-2 py-4 text-base bg-slate-50 dark:bg-slate-800 p-4 rounded-md border border-slate-200 dark:border-slate-700">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeKatex]}>
            {steps}
          </ReactMarkdown>
        </div>
      </DialogContent>
    </Dialog>
  );
};