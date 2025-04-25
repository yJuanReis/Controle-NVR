'use client';

import { useState } from 'react';
import ReportViewer from '@/components/ReportViewer';
import AdvancedReportViewer from '@/components/AdvancedReportViewer';
import FileUploader from '@/components/FileUploader';
import { Toaster } from '@/components/ui/toaster';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { Home, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ReportViewerDemo() {
  const [reportText, setReportText] = useState<string | undefined>(undefined);
  const [fileName, setFileName] = useState<string>('relatorio');
  const [viewerType, setViewerType] = useState<'simple' | 'advanced'>('advanced');

  const handleFileLoaded = (text: string, name: string) => {
    setReportText(text);
    setFileName(name.replace(/\.[^/.]+$/, "")); // Remove a extensão do arquivo
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Visualizador de Relatórios</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/parser-test">
              <Code className="mr-2 h-4 w-4" />
              Teste de Parsers
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Upload de Relatório</h2>
        <FileUploader onFileLoaded={handleFileLoaded} acceptedTypes=".txt" />
      </div>
      
      <div className="mb-4">
        <Tabs value={viewerType} onValueChange={(value) => setViewerType(value as 'simple' | 'advanced')}>
          <TabsList>
            <TabsTrigger value="advanced">Visualizador Avançado</TabsTrigger>
            <TabsTrigger value="simple">Visualizador Simples</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {viewerType === 'advanced' ? (
        <AdvancedReportViewer reportText={reportText} fileName={fileName} />
      ) : (
        <ReportViewer reportText={reportText} fileName={fileName} />
      )}
      
      <Toaster />
    </div>
  );
} 