'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, File, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface FileUploaderProps {
  onFileLoaded: (text: string, fileName: string) => void;
  acceptedTypes?: string;
}

export default function FileUploader({ onFileLoaded, acceptedTypes = ".txt" }: FileUploaderProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) return;
    
    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        onFileLoaded(text, file.name);
      } catch (error) {
        console.error('Erro ao ler o arquivo:', error);
        toast({
          variant: 'destructive',
          title: 'Erro ao ler o arquivo',
          description: 'Não foi possível processar o arquivo selecionado.'
        });
      }
    };
    
    reader.onerror = () => {
      toast({
        variant: 'destructive',
        title: 'Erro ao ler o arquivo',
        description: 'Ocorreu um erro durante a leitura do arquivo.'
      });
    };
    
    reader.readAsText(file);
  };

  const clearFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setFileName(null);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <Input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes}
          onChange={handleFileChange}
          className="hidden"
        />
        <Button 
          variant="outline" 
          onClick={triggerFileInput}
          className="w-full flex items-center justify-center gap-2"
        >
          <Upload className="h-4 w-4" />
          {fileName ? 'Trocar arquivo' : 'Selecionar arquivo'}
        </Button>
        
        {fileName && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearFile}
            className="hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-500"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {fileName && (
        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
          <File className="h-4 w-4" />
          <span className="truncate max-w-[250px]">{fileName}</span>
        </div>
      )}
    </div>
  );
} 