'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { parseReport as parseReportBasic } from '@/lib/report-parser';
import { parseReport as parseReportAdvanced, identifyReportType } from '@/lib/report-parser-advanced';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

interface TestCase {
  name: string;
  input: string;
  expectedType?: string;
  expectedSections?: number;
  expectedTables?: number;
  assertions?: Array<{
    property: string;
    expected: any;
  }>;
}

interface TestResult {
  name: string;
  status: 'pass' | 'fail';
  error?: string;
  details?: string;
  executionTime?: number;
  parser: 'basic' | 'advanced';
}

export default function UnitTests() {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [newTestName, setNewTestName] = useState('');
  const [testInput, setTestInput] = useState('');
  const [expectedType, setExpectedType] = useState('');
  const [assertions, setAssertions] = useState<Array<{property: string; expected: string}>>([
    { property: '', expected: '' }
  ]);
  const { toast } = useToast();
  
  // Carregar testes salvos do localStorage ao montar
  useEffect(() => {
    const savedTests = localStorage.getItem('parserTestCases');
    if (savedTests) {
      try {
        setTestCases(JSON.parse(savedTests));
      } catch (e) {
        console.error('Erro ao carregar testes salvos:', e);
      }
    }
  }, []);
  
  const addAssertion = () => {
    setAssertions([...assertions, { property: '', expected: '' }]);
  };
  
  const updateAssertion = (index: number, field: 'property' | 'expected', value: string) => {
    const newAssertions = [...assertions];
    newAssertions[index][field] = value;
    setAssertions(newAssertions);
  };
  
  const removeAssertion = (index: number) => {
    const newAssertions = [...assertions];
    newAssertions.splice(index, 1);
    setAssertions(newAssertions);
  };

  const saveTestCase = () => {
    if (!newTestName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, forneça um nome para o teste",
        variant: "destructive"
      });
      return;
    }

    if (!testInput.trim()) {
      toast({
        title: "Entrada vazia",
        description: "O teste precisa ter uma entrada de texto",
        variant: "destructive"
      });
      return;
    }

    // Filtrar assertions vazias
    const validAssertions = assertions.filter(a => a.property.trim() && a.expected.trim());
    
    const newTestCase: TestCase = {
      name: newTestName,
      input: testInput,
      expectedType: expectedType || undefined,
      assertions: validAssertions.map(a => ({
        property: a.property,
        expected: tryParseJSON(a.expected)
      }))
    };

    const updatedTestCases = [...testCases, newTestCase];
    setTestCases(updatedTestCases);
    
    // Salvar no localStorage
    localStorage.setItem('parserTestCases', JSON.stringify(updatedTestCases));
    
    // Limpar formulário
    setNewTestName('');
    setTestInput('');
    setExpectedType('');
    setAssertions([{ property: '', expected: '' }]);
    
    toast({
      title: "Teste salvo",
      description: `O teste "${newTestName}" foi salvo com sucesso`
    });
  };

  const tryParseJSON = (value: string): any => {
    try {
      // Tenta converter para número primeiro
      if (!isNaN(Number(value))) {
        return Number(value);
      }
      
      // Tenta converter de JSON para objeto/array
      return JSON.parse(value);
    } catch (e) {
      // Se falhar, retorna a string original
      return value;
    }
  };

  const runTests = () => {
    if (testCases.length === 0) {
      toast({
        title: "Sem testes",
        description: "Não há testes para executar",
        variant: "destructive"
      });
      return;
    }

    const results: TestResult[] = [];

    // Executar testes no parser básico
    for (const test of testCases) {
      try {
        const startTime = performance.now();
        const parsed = parseReportBasic(test.input);
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        
        let success = true;
        let details = '';

        // Verificar assertions
        if (test.assertions && test.assertions.length > 0) {
          for (const assertion of test.assertions) {
            const path = assertion.property.split('.');
            let actual = parsed;
            
            // Navegar pela path para encontrar o valor
            for (const part of path) {
              if (actual === undefined || actual === null) {
                success = false;
                details += `Falha ao encontrar propriedade: ${assertion.property}\n`;
                break;
              }
              actual = actual[part];
            }
            
            // Verificar valor
            if (JSON.stringify(actual) !== JSON.stringify(assertion.expected)) {
              success = false;
              details += `Falha na asserção: ${assertion.property}\n`;
              details += `  Esperado: ${JSON.stringify(assertion.expected)}\n`;
              details += `  Recebido: ${JSON.stringify(actual)}\n`;
            }
          }
        }

        results.push({
          name: test.name,
          status: success ? 'pass' : 'fail',
          details: details || undefined,
          executionTime,
          parser: 'basic'
        });
      } catch (error) {
        results.push({
          name: test.name,
          status: 'fail',
          error: error instanceof Error ? error.message : String(error),
          parser: 'basic'
        });
      }
    }

    // Executar testes no parser avançado
    for (const test of testCases) {
      try {
        const startTime = performance.now();
        const parsed = parseReportAdvanced(test.input);
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        
        let success = true;
        let details = '';

        // Verificar tipo esperado
        if (test.expectedType) {
          const detectedType = identifyReportType(test.input);
          if (detectedType !== test.expectedType) {
            success = false;
            details += `Tipo de relatório incorreto. Esperado: ${test.expectedType}, Detectado: ${detectedType}\n`;
          }
        }

        // Verificar assertions
        if (test.assertions && test.assertions.length > 0) {
          for (const assertion of test.assertions) {
            const path = assertion.property.split('.');
            let actual = parsed;
            
            // Navegar pela path para encontrar o valor
            for (const part of path) {
              if (actual === undefined || actual === null) {
                success = false;
                details += `Falha ao encontrar propriedade: ${assertion.property}\n`;
                break;
              }
              actual = actual[part];
            }
            
            // Verificar valor
            if (JSON.stringify(actual) !== JSON.stringify(assertion.expected)) {
              success = false;
              details += `Falha na asserção: ${assertion.property}\n`;
              details += `  Esperado: ${JSON.stringify(assertion.expected)}\n`;
              details += `  Recebido: ${JSON.stringify(actual)}\n`;
            }
          }
        }

        results.push({
          name: test.name,
          status: success ? 'pass' : 'fail',
          details: details || undefined,
          executionTime,
          parser: 'advanced'
        });
      } catch (error) {
        results.push({
          name: test.name,
          status: 'fail',
          error: error instanceof Error ? error.message : String(error),
          parser: 'advanced'
        });
      }
    }

    setTestResults(results);
    
    const passCount = results.filter(r => r.status === 'pass').length;
    toast({
      title: "Testes executados",
      description: `${passCount} de ${results.length} testes passaram`,
      variant: passCount === results.length ? "default" : "destructive"
    });
  };

  const deleteTestCase = (index: number) => {
    const updatedTestCases = [...testCases];
    updatedTestCases.splice(index, 1);
    setTestCases(updatedTestCases);
    localStorage.setItem('parserTestCases', JSON.stringify(updatedTestCases));
    
    toast({
      title: "Teste removido",
      description: "O teste foi removido com sucesso"
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Testes Unitários para Parsers</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Crie testes para verificar o funcionamento correto dos parsers de relatório. 
            Os testes serão executados em ambas as implementações.
          </p>
          
          <div className="mb-4">
            <Button onClick={runTests} disabled={testCases.length === 0}>
              Executar Todos os Testes
            </Button>
          </div>
          
          <Tabs defaultValue="create">
            <TabsList>
              <TabsTrigger value="create">Criar Teste</TabsTrigger>
              <TabsTrigger value="manage">Gerenciar Testes ({testCases.length})</TabsTrigger>
              <TabsTrigger value="results">Resultados ({testResults.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="create" className="pt-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="test-name">Nome do Teste</Label>
                  <Input 
                    id="test-name" 
                    placeholder="Ex: Relatório NVR Básico"
                    value={newTestName}
                    onChange={(e) => setNewTestName(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="expected-type">Tipo Esperado</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={expectedType === 'nvr' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setExpectedType('nvr')}
                    >
                      NVR
                    </Button>
                    <Button
                      variant={expectedType === 'hd-evolution' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setExpectedType('hd-evolution')}
                    >
                      Evolução de HD
                    </Button>
                    <Button
                      variant={expectedType === 'unknown' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setExpectedType('unknown')}
                    >
                      Desconhecido
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="test-input">Entrada do Teste</Label>
                  <Textarea 
                    id="test-input" 
                    placeholder="Cole o conteúdo do relatório para teste aqui..." 
                    className="min-h-[150px]"
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>Asserções</Label>
                    <Button size="sm" variant="outline" onClick={addAssertion}>
                      Adicionar Asserção
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {assertions.map((assertion, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <div className="flex-1">
                          <Input 
                            placeholder="Propriedade (ex: title, metadata.date)"
                            value={assertion.property}
                            onChange={(e) => updateAssertion(index, 'property', e.target.value)}
                          />
                        </div>
                        <div className="flex-1">
                          <Input 
                            placeholder="Valor esperado"
                            value={assertion.expected}
                            onChange={(e) => updateAssertion(index, 'expected', e.target.value)}
                          />
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeAssertion(index)}
                          disabled={assertions.length <= 1}
                        >
                          <span className="text-lg">×</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Button onClick={saveTestCase}>Salvar Teste</Button>
              </div>
            </TabsContent>
            
            <TabsContent value="manage" className="pt-4">
              {testCases.length === 0 ? (
                <div className="text-center p-6 text-muted-foreground">
                  Nenhum teste foi criado ainda.
                </div>
              ) : (
                <div className="space-y-4">
                  {testCases.map((test, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle>{test.name}</CardTitle>
                          {test.expectedType && (
                            <Badge>Tipo: {test.expectedType}</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <h4 className="text-sm font-medium mb-1">Entrada:</h4>
                        <div className="bg-muted p-3 rounded-md mb-4 max-h-24 overflow-auto">
                          <pre className="text-xs">{test.input.substring(0, 300)}{test.input.length > 300 ? '...' : ''}</pre>
                        </div>
                        
                        {test.assertions && test.assertions.length > 0 && (
                          <>
                            <h4 className="text-sm font-medium mb-1">Asserções:</h4>
                            <div className="space-y-1">
                              {test.assertions.map((assertion, i) => (
                                <div key={i} className="text-sm">
                                  <code className="bg-muted px-1 py-0.5 rounded">{assertion.property}</code>: 
                                  <span className="ml-2 text-muted-foreground">
                                    {typeof assertion.expected === 'object' 
                                      ? JSON.stringify(assertion.expected) 
                                      : String(assertion.expected)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </CardContent>
                      <CardFooter className="flex justify-end">
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => deleteTestCase(index)}
                        >
                          Remover
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="results" className="pt-4">
              {testResults.length === 0 ? (
                <div className="text-center p-6 text-muted-foreground">
                  Nenhum teste foi executado ainda.
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Parser Básico</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {testResults
                            .filter(result => result.parser === 'basic')
                            .map((result, index) => (
                              <div 
                                key={index} 
                                className={`p-3 rounded-md border ${
                                  result.status === 'pass' 
                                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                                    : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                                }`}
                              >
                                <div className="flex justify-between items-center mb-1">
                                  <h4 className="font-medium">{result.name}</h4>
                                  <Badge variant={result.status === 'pass' ? 'outline' : 'destructive'}>
                                    {result.status === 'pass' ? 'PASSOU' : 'FALHOU'}
                                  </Badge>
                                </div>
                                
                                {result.executionTime && (
                                  <p className="text-xs text-muted-foreground mb-2">
                                    Tempo: {result.executionTime.toFixed(2)} ms
                                  </p>
                                )}
                                
                                {result.error && (
                                  <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                                    <p className="font-medium">Erro:</p>
                                    <p>{result.error}</p>
                                  </div>
                                )}
                                
                                {result.details && (
                                  <div className="mt-2 text-xs">
                                    <pre className="whitespace-pre-wrap overflow-auto max-h-24 p-2 bg-white dark:bg-black/20 rounded">
                                      {result.details}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Parser Avançado</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {testResults
                            .filter(result => result.parser === 'advanced')
                            .map((result, index) => (
                              <div 
                                key={index} 
                                className={`p-3 rounded-md border ${
                                  result.status === 'pass' 
                                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                                    : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                                }`}
                              >
                                <div className="flex justify-between items-center mb-1">
                                  <h4 className="font-medium">{result.name}</h4>
                                  <Badge variant={result.status === 'pass' ? 'outline' : 'destructive'}>
                                    {result.status === 'pass' ? 'PASSOU' : 'FALHOU'}
                                  </Badge>
                                </div>
                                
                                {result.executionTime && (
                                  <p className="text-xs text-muted-foreground mb-2">
                                    Tempo: {result.executionTime.toFixed(2)} ms
                                  </p>
                                )}
                                
                                {result.error && (
                                  <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                                    <p className="font-medium">Erro:</p>
                                    <p>{result.error}</p>
                                  </div>
                                )}
                                
                                {result.details && (
                                  <div className="mt-2 text-xs">
                                    <pre className="whitespace-pre-wrap overflow-auto max-h-24 p-2 bg-white dark:bg-black/20 rounded">
                                      {result.details}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 