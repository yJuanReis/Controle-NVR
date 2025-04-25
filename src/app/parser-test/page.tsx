'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { parseReport as parseReportBasic } from '@/lib/report-parser';
import { parseReport as parseReportAdvanced, identifyReportType } from '@/lib/report-parser-advanced';
import { formatReportData } from '@/lib/report-formatter';
import { downloadJSON, downloadCSV } from '@/lib/download-utils';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';
import DataTable from '@/components/DataTable';
import TestBuilder from './test-builder';
import UnitTests from './unit-tests';
import { Link } from 'react-router-dom';
import { Home, FileText } from 'lucide-react';

export default function ParserTestPage() {
  const [activeTab, setActiveTab] = useState<string>('processor');
  const [reportText, setReportText] = useState<string>('');
  const [reportType, setReportType] = useState<string>('desconhecido');
  const [basicResult, setBasicResult] = useState<any>(null);
  const [advancedResult, setAdvancedResult] = useState<any>(null);
  const [basicFormatted, setBasicFormatted] = useState<string>('');
  const [advancedFormatted, setAdvancedFormatted] = useState<string>('');
  const [executionTime, setExecutionTime] = useState<{basic: number, advanced: number}>({ basic: 0, advanced: 0 });
  const { toast } = useToast();

  const processReport = () => {
    if (!reportText.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira o texto do relatório",
        variant: "destructive"
      });
      return;
    }

    try {
      // Identificar tipo de relatório
      const type = identifyReportType(reportText);
      setReportType(type);

      // Processar com parser básico
      const startBasic = performance.now();
      const basicParsed = parseReportBasic(reportText);
      const endBasic = performance.now();
      setBasicResult(basicParsed);
      setBasicFormatted(formatReportData(basicParsed));

      // Processar com parser avançado
      const startAdvanced = performance.now();
      const advancedParsed = parseReportAdvanced(reportText);
      const endAdvanced = performance.now();
      setAdvancedResult(advancedParsed);
      setAdvancedFormatted(formatReportData(basicParsed));

      // Registrar tempos de execução
      setExecutionTime({
        basic: endBasic - startBasic,
        advanced: endAdvanced - startAdvanced
      });

      toast({
        title: "Relatório processado",
        description: `Tipo identificado: ${type}`,
      });
    } catch (error) {
      console.error('Erro ao processar relatório:', error);
      toast({
        title: "Erro ao processar relatório",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive"
      });
    }
  };

  const downloadResults = (type: 'json' | 'csv', parser: 'basic' | 'advanced') => {
    const data = parser === 'basic' ? basicResult : advancedResult;
    if (!data) return;

    const filename = `relatorio-${reportType}-${parser}`;
    if (type === 'json') {
      downloadJSON(data, `${filename}.json`);
    } else {
      downloadCSV(data, `${filename}.csv`);
    }

    toast({
      title: "Download realizado",
      description: `Arquivo ${filename}.${type} baixado com sucesso`,
    });
  };

  const clearAll = () => {
    setReportText('');
    setReportType('desconhecido');
    setBasicResult(null);
    setAdvancedResult(null);
    setBasicFormatted('');
    setAdvancedFormatted('');
    setExecutionTime({ basic: 0, advanced: 0 });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Laboratório de Parsers de Relatório</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/report-viewer">
              <FileText className="mr-2 h-4 w-4" />
              Visualizador de Relatórios
            </Link>
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="processor">Processador</TabsTrigger>
          <TabsTrigger value="examples">Exemplos</TabsTrigger>
          <TabsTrigger value="tests">Testes Unitários</TabsTrigger>
          <TabsTrigger value="documentation">Documentação</TabsTrigger>
        </TabsList>
        
        <TabsContent value="processor">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Entrada do Relatório</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea 
                placeholder="Cole o conteúdo do relatório aqui..."
                className="min-h-[200px] mb-4"
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
              />
              <div className="flex gap-2">
                <Button onClick={processReport}>Processar Relatório</Button>
                <Button variant="outline" onClick={clearAll}>Limpar</Button>
              </div>
            </CardContent>
          </Card>
          
          {(basicResult || advancedResult) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-lg">Parser Básico</h3>
                    <Badge variant="outline">{executionTime.basic.toFixed(2)} ms</Badge>
                  </div>
                  <p className="text-muted-foreground text-sm mb-4">
                    Implementação simples com detecção de seções e tabelas básicas
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => downloadResults('json', 'basic')}>
                      Baixar JSON
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => downloadResults('csv', 'basic')}>
                      Baixar CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-lg">Parser Avançado</h3>
                    <Badge variant="outline">{executionTime.advanced.toFixed(2)} ms</Badge>
                  </div>
                  <p className="text-muted-foreground text-sm mb-4">
                    Implementação avançada com detecção de tipo de relatório e formatação inteligente
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => downloadResults('json', 'advanced')}>
                      Baixar JSON
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => downloadResults('csv', 'advanced')}>
                      Baixar CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {(basicResult || advancedResult) && (
            <Tabs defaultValue="comparison">
              <TabsList className="mb-4">
                <TabsTrigger value="comparison">Comparação</TabsTrigger>
                <TabsTrigger value="basic">Parser Básico</TabsTrigger>
                <TabsTrigger value="advanced">Parser Avançado</TabsTrigger>
                <TabsTrigger value="formatted">Texto Formatado</TabsTrigger>
              </TabsList>
              
              <TabsContent value="comparison">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Output do Parser Básico</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="whitespace-pre-wrap bg-muted p-4 rounded-md text-sm overflow-auto max-h-[500px]">
                        {JSON.stringify(basicResult, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Output do Parser Avançado</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="whitespace-pre-wrap bg-muted p-4 rounded-md text-sm overflow-auto max-h-[500px]">
                        {JSON.stringify(advancedResult, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="basic">
                {basicResult && <DataTable data={basicResult} />}
              </TabsContent>
              
              <TabsContent value="advanced">
                {advancedResult && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold">Relatório Processado com Parser Avançado</h2>
                    <h3 className="text-lg font-semibold">Tipo detectado: {reportType}</h3>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Resumo</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="whitespace-pre-wrap bg-muted p-4 rounded-md text-sm">
                          {JSON.stringify(advancedResult.summary, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Relatório Completo</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <DataTable data={basicResult} />
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="formatted">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Texto Original</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="whitespace-pre-wrap bg-muted p-4 rounded-md text-sm overflow-auto max-h-[500px]">
                        {reportText}
                      </pre>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Texto Formatado</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="whitespace-pre-wrap bg-muted p-4 rounded-md text-sm overflow-auto max-h-[500px]">
                        {basicFormatted}
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </TabsContent>
        
        <TabsContent value="examples">
          <TestBuilder />
        </TabsContent>
        
        <TabsContent value="tests">
          <UnitTests />
        </TabsContent>
        
        <TabsContent value="documentation">
          <Card>
            <CardHeader>
              <CardTitle>Documentação dos Parsers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Parser Básico</h3>
                  <p className="mb-2">
                    O parser básico é uma implementação simples que processa relatórios em texto para estruturas de dados. 
                    Ele identifica seções e tabelas em um formato padronizado.
                  </p>
                  <h4 className="font-medium mt-4 mb-1">Características:</h4>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Processamento básico de seções de texto</li>
                    <li>Identificação de pares chave-valor</li>
                    <li>Detecção simples de tabelas</li>
                    <li>Não faz conversão de tipos</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Parser Avançado</h3>
                  <p className="mb-2">
                    O parser avançado é uma implementação mais sofisticada que inclui detecção automática de tipos de relatório 
                    e processamento específico para diferentes formatos.
                  </p>
                  <h4 className="font-medium mt-4 mb-1">Características:</h4>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Detecção automática do tipo de relatório</li>
                    <li>Formatação inteligente de valores (números, monetários, etc.)</li>
                    <li>Processamento especializado por tipo de relatório</li>
                    <li>Extração de metadados e resumo</li>
                    <li>Suporte a formatação de títulos em maiúsculas com sublinhado</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Formatos Suportados</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-muted">
                          <th className="border p-2 text-left">Tipo</th>
                          <th className="border p-2 text-left">Identificação</th>
                          <th className="border p-2 text-left">Processamento Especial</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border p-2">NVR</td>
                          <td className="border p-2">Contém "RELATÓRIO DE STATUS DO SISTEMA NVR"</td>
                          <td className="border p-2">Extração de NVRs em estado crítico</td>
                        </tr>
                        <tr>
                          <td className="border p-2">Evolução de HDs</td>
                          <td className="border p-2">Contém "RELATÓRIO DE EVOLUÇÃO DE HDs"</td>
                          <td className="border p-2">Processamento de slots e custos</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Toaster />
    </div>
  );
} 