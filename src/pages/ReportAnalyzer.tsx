'use client';

import { useState } from 'react';
import FileUploader from '@/components/FileUploader';
import ReportChartViewer from '@/components/ReportChartViewer';

export default function ReportAnalyzer() {
  const [reportText, setReportText] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileLoaded = (text: string, name: string) => {
    setReportText(text);
    setFileName(name);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col">
        <h1 className="text-3xl font-bold mb-4">Analisador de Relatórios</h1>
        <p className="text-gray-500 mb-8">
          Faça upload de um arquivo de texto para visualizar os dados em formatos estruturados e gráficos
        </p>
        
        <div className="w-full max-w-md bg-card rounded-lg border border-card p-6 mb-8">
          <h2 className="text-xl font-medium mb-4">Selecione um arquivo</h2>
          <FileUploader 
            onFileLoaded={handleFileLoaded} 
            acceptedTypes=".txt" 
          />
        </div>
      </div>
      
      {reportText ? (
        <div className="mt-8">
          <ReportChartViewer 
            reportText={reportText} 
            fileName={fileName || undefined} 
          />
        </div>
      ) : (
        <div className="bg-card border border-card rounded-lg p-8 text-center">
          <p className="text-muted-foreground">
            Nenhum arquivo carregado. Selecione um arquivo de texto para visualizar os dados.
          </p>
        </div>
      )}
    </div>
  );
} 