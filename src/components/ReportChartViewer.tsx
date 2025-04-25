'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, BarChart as BarChartIcon, PieChart as PieChartIcon } from 'lucide-react';
import { parseCustomReport, extractChartData, ParsedReportData } from '@/lib/custom-report-parser';
import BarChart from '@/components/charts/BarChart';
import PieChart from '@/components/charts/PieChart';
import { useToast } from '@/components/ui/use-toast';

interface ReportChartViewerProps {
  reportText?: string;
  fileName?: string;
}

export default function ReportChartViewer({ reportText, fileName = 'relatório' }: ReportChartViewerProps) {
  const [parsedData, setParsedData] = useState<ParsedReportData | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('tabela');
  const { toast } = useToast();

  useEffect(() => {
    if (reportText) {
      try {
        // Parseia o conteúdo do arquivo
        const data = parseCustomReport(reportText);
        setParsedData(data);
        
        // Extrai dados para visualização em gráficos
        const dataForCharts = extractChartData(data);
        setChartData(dataForCharts);
      } catch (error) {
        console.error('Erro ao processar arquivo:', error);
        toast({
          variant: 'destructive',
          title: 'Erro ao processar arquivo',
          description: 'Não foi possível extrair os dados do arquivo fornecido.'
        });
      }
    }
  }, [reportText, toast]);

  if (!reportText) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Visualizador de Dados</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500">Nenhum arquivo para visualizar</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle>{parsedData?.title || 'Visualizador de Dados'}</CardTitle>
        <div className="text-sm text-gray-500">{parsedData?.date || ''}</div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="tabela" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="tabela">Dados</TabsTrigger>
            <TabsTrigger value="grafico-barras">Gráfico de Barras</TabsTrigger>
            <TabsTrigger value="grafico-pizza">Gráfico de Pizza</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tabela" className="space-y-4">
            {parsedData?.sections.map((section, index) => (
              <Card key={index} className="mb-4">
                <CardHeader>
                  <CardTitle>{section.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {section.metrics.map((metric, i) => (
                      <div key={i} className="flex flex-col">
                        <span className="text-sm text-gray-500">{metric.key}</span>
                        <span className="font-medium">{metric.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          
          <TabsContent value="grafico-barras">
            <div className="w-full h-[500px]">
              {chartData.length > 0 ? (
                <BarChart 
                  data={chartData}
                  title="Estatísticas"
                  chartTitle={parsedData?.title}
                  color="#3B82F6"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Sem dados para visualização em gráfico
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="grafico-pizza">
            <div className="w-full h-[500px]">
              {chartData.length > 0 ? (
                <PieChart 
                  data={chartData}
                  title={parsedData?.title || 'Distribuição'}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Sem dados para visualização em gráfico
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 