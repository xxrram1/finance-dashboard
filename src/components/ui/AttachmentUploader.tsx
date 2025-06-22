// src/components/ui/AttachmentUploader.tsx

import React, { useRef, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from './button';
import { Paperclip, Camera, GalleryVertical, XCircle, File as FileIcon } from 'lucide-react';
import { Label } from './label';
import { cn } from '@/lib/utils';

interface AttachmentUploaderProps {
  onFileChange: (file: File | null) => void;
  className?: string;
}

export const AttachmentUploader: React.FC<AttachmentUploaderProps> = ({ onFileChange, className }) => {
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
      setFileName(file.name);
      onFileChange(file);
    }
    event.target.value = '';
  };

  const handleRemoveFile = () => {
    setPreview(null);
    setFileName(null);
    onFileChange(null);
  };
  
  const renderDesktopView = () => (
    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
      <Paperclip className="mr-2 h-4 w-4" />
      แนบไฟล์ (รูปภาพ, PDF)
    </Button>
  );

  const renderMobileView = () => (
    <div className="grid grid-cols-2 gap-2">
      <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
        <GalleryVertical className="mr-2 h-4 w-4" />
        แกลเลอรี
      </Button>
      <Button type="button" variant="outline" onClick={() => cameraInputRef.current?.click()}>
        <Camera className="mr-2 h-4 w-4" />
        ถ่ายรูป
      </Button>
    </div>
  );

  return (
    <div className={cn("space-y-3", className)}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,application/pdf"
      />
       <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*"
        capture="environment"
      />

      <Label>แนบรูปภาพโจทย์ (ถ้ามี)</Label>
      
      {!fileName ? (
        isMobile ? renderMobileView() : renderDesktopView()
      ) : (
        <div className="relative group w-full sm:w-64 border rounded-lg p-2 flex items-center gap-3 bg-slate-50 dark:bg-slate-800">
            {preview ? (
                <img src={preview} alt="Preview" className="w-12 h-12 rounded-md object-cover"/>
            ) : (
                <div className="w-12 h-12 flex items-center justify-center bg-slate-200 dark:bg-slate-700 rounded-md">
                    <FileIcon className="w-6 h-6 text-slate-500"/>
                </div>
            )}
            <p className="text-sm text-slate-700 dark:text-slate-200 truncate flex-1">{fileName}</p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-100 text-red-600 hover:bg-red-200 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleRemoveFile}
            >
              <XCircle className="w-5 h-5" />
            </Button>
        </div>
      )}
    </div>
  );
};