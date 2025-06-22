// src/components/ui/ChartModal.tsx

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { useIsMobile } from '@/hooks/use-mobile';

interface ChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  children: React.ReactNode;
}

const ChartModal: React.FC<ChartModalProps> = ({ isOpen, onClose, title, description, children }) => {
  const isMobile = useIsMobile();

  const content = (
    <div className="flex-1 p-4 sm:p-6 flex items-center justify-center min-h-0">
      {children}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onClose={onClose}>
        <DrawerContent className="h-[90vh] flex flex-col">
          <DrawerHeader className="text-center flex-shrink-0">
            <DrawerTitle className="text-xl font-bold">{title}</DrawerTitle>
            <DrawerDescription className="text-slate-600 dark:text-gray-400">{description}</DrawerDescription>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
          <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">{description}</DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default ChartModal;