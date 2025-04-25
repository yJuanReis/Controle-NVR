'use client';

import { useState, useEffect } from 'react';
import { parseReportToJson, parseReportToCsv } from '@/lib/report-parser';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Download as DownloadIcon, FileText as FileTextIcon, Table as TableIcon, File as JsonIcon, FileSpreadsheet as CsvIcon } from 'lucide-react';
import TableReportView from '@/components/TableReportView';

interface ReportViewerProps {
  reportText?: string;
  fileName?: string;
}

export default function ReportViewer({ reportText, fileName = 'relatório' }: ReportViewerProps) {
  const [report, setReport] = useState<Record<string, any> | null>(null);
  const [activeTab, setActiveTab] = useState<string>('formatado');
  const { toast } = useToast();

  useEffect(() => {
    if (reportText) {
      try {
        const parsedReport = parseReportToJson(reportText);
        setReport(parsedReport);
      } catch (error) {
        console.error('Erro ao processar relatório:', error);
        toast({
          variant: 'destructive',
          title: 'Erro ao processar relatório',
          description: 'Não foi possível converter o relatório para o formato estruturado.'
        });
      }
    }
  }, [reportText, toast]);

  const downloadJson = () => {
    if (!report) return;
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${fileName}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const downloadText = () => {
    if (!reportText) return;
    
    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(reportText);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${fileName}.txt`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const downloadCsv = () => {
    if (!reportText) return;
    
    try {
      const csvData = parseReportToCsv(reportText);
      const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csvData);
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `${fileName}.csv`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao exportar CSV',
        description: 'Não foi possível gerar o arquivo CSV.'
      });
    }
  };

  if (!reportText) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Visualizador de Relatório</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500">Nenhum relatório para exibir</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle>Visualizador de Relatório</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadText}>
            <FileTextIcon className="h-4 w-4 mr-2" />
            TXT
          </Button>
          <Button variant="outline" size="sm" onClick={downloadJson}>
            <JsonIcon className="h-4 w-4 mr-2" />
            JSON
          </Button>
          <Button variant="outline" size="sm" onClick={downloadCsv}>
            <CsvIcon className="h-4 w-4 mr-2" />
            CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="formatado" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="formatado">Formatado</TabsTrigger>
            <TabsTrigger value="tabular">Tabular</TabsTrigger>
            <TabsTrigger value="original">Original</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
          </TabsList>
          
          <TabsContent value="formatado" className="space-y-4">
            {report && (
              <>
                {/* Informações globais */}
                {Object.entries(report)
                  .filter(([key]) => key !== 'sections')
                  .map(([key, value]) => (
                    <div key={key} className="mb-2">
                      <span className="font-semibold">{key}:</span> {value}
                    </div>
                  ))
                }
                
                {/* Seções */}
                {report.sections && report.sections.map((section: any, index: number) => (
                  <Card key={index} className="mb-4">
                    <CardHeader>
                      <CardTitle>{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(section.data).map(([key, value], i) => (
                          <div key={i} className="flex flex-col">
                            <span className="text-sm text-gray-500">{key}</span>
                            <span>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </TabsContent>
          
          <TabsContent value="tabular">
            {report && <TableReportView data={report} />}
          </TabsContent>
          
          <TabsContent value="original">
            <pre className="whitespace-pre-wrap bg-gray-50 dark:bg-zinc-900 p-4 rounded-md overflow-auto max-h-[70vh]">
              {reportText}
            </pre>
          </TabsContent>
          
          <TabsContent value="json">
            <pre className="whitespace-pre-wrap bg-gray-50 dark:bg-zinc-900 p-4 rounded-md overflow-auto max-h-[70vh]">
              {report ? JSON.stringify(report, null, 2) : 'Carregando...'}
            </pre>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 