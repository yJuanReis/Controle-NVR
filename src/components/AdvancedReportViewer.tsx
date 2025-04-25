'use client';

import { useState, useEffect } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Download, FileJson, FileText, Table } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { parseReport } from '@/lib/report-parser';
import { formatReportData } from '@/lib/report-formatter';
import { ReportData } from '@/types/report';
import DataTable from './DataTable';
import { downloadCSV, downloadJSON } from '@/lib/download-utils';

interface AdvancedReportViewerProps {
  reportText: string | undefined;
  fileName: string;
}

export default function AdvancedReportViewer({ reportText, fileName }: AdvancedReportViewerProps) {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [formattedReport, setFormattedReport] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (reportText) {
      try {
        // Parse o relatório original
        const parsedData = parseReport(reportText);
        setReportData(parsedData);
        
        // Formate os dados do relatório
        const formatted = formatReportData(parsedData);
        setFormattedReport(formatted);
      } catch (error) {
        console.error('Erro ao processar o relatório:', error);
        toast({
          variant: "destructive",
          title: "Erro ao processar o relatório",
          description: "O formato do relatório não pôde ser reconhecido."
        });
      }
    } else {
      setReportData(null);
      setFormattedReport('');
    }
  }, [reportText, toast]);

  const handleDownloadJSON = () => {
    if (reportData) {
      downloadJSON(reportData, `${fileName}.json`);
      toast({
        title: "JSON baixado com sucesso",
        description: `O arquivo ${fileName}.json foi salvo.`
      });
    }
  };

  const handleDownloadCSV = () => {
    if (reportData) {
      downloadCSV(reportData, `${fileName}.csv`);
      toast({
        title: "CSV baixado com sucesso",
        description: `O arquivo ${fileName}.csv foi salvo.`
      });
    }
  };

  const handleDownloadTXT = () => {
    if (formattedReport) {
      const blob = new Blob([formattedReport], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}-formatado.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Relatório formatado baixado",
        description: `O arquivo ${fileName}-formatado.txt foi salvo.`
      });
    }
  };

  if (!reportText) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center p-6">
            <p className="text-muted-foreground">
              Faça o upload de um relatório para visualizar
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button 
          variant="outline"
          size="sm"
          onClick={handleDownloadTXT}
          disabled={!formattedReport}
        >
          <FileText className="mr-2 h-4 w-4" /> Baixar TXT
        </Button>
        <Button 
          variant="outline"
          size="sm"
          onClick={handleDownloadJSON}
          disabled={!reportData}
        >
          <FileJson className="mr-2 h-4 w-4" /> Baixar JSON
        </Button>
        <Button 
          variant="outline"
          size="sm"
          onClick={handleDownloadCSV}
          disabled={!reportData}
        >
          <Download className="mr-2 h-4 w-4" /> Baixar CSV
        </Button>
      </div>

      <Tabs defaultValue="formatted">
        <TabsList>
          <TabsTrigger value="formatted">Formatado</TabsTrigger>
          <TabsTrigger value="table">Tabela</TabsTrigger>
          <TabsTrigger value="original">Original</TabsTrigger>
          <TabsTrigger value="json">JSON</TabsTrigger>
        </TabsList>
        
        <TabsContent value="formatted">
          <Card>
            <CardContent className="pt-6">
              <pre className="whitespace-pre-wrap overflow-auto font-mono text-sm bg-muted p-4 rounded-md">
                {formattedReport || 'Nenhum dado formatado disponível.'}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="table">
          <Card>
            <CardContent className="pt-6">
              {reportData ? (
                <DataTable data={reportData} />
              ) : (
                <div className="text-center p-6">
                  <p className="text-muted-foreground">
                    Nenhum dado tabular disponível.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="original">
          <Card>
            <CardContent className="pt-6">
              <pre className="whitespace-pre-wrap overflow-auto font-mono text-sm bg-muted p-4 rounded-md">
                {reportText}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="json">
          <Card>
            <CardContent className="pt-6">
              <pre className="whitespace-pre-wrap overflow-auto font-mono text-sm bg-muted p-4 rounded-md">
                {reportData ? JSON.stringify(reportData, null, 2) : 'Nenhum dado JSON disponível.'}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 