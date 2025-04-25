'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

interface TestExample {
  name: string;
  content: string;
}

export default function TestBuilder() {
  const [exampleName, setExampleName] = useState('');
  const [exampleContent, setExampleContent] = useState('');
  const [savedExamples, setSavedExamples] = useState<TestExample[]>([]);
  const { toast } = useToast();

  const saveExample = () => {
    if (!exampleName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, dê um nome para este exemplo de teste",
        variant: "destructive"
      });
      return;
    }

    if (!exampleContent.trim()) {
      toast({
        title: "Conteúdo vazio",
        description: "O exemplo de teste não pode estar vazio",
        variant: "destructive"
      });
      return;
    }

    const newExample: TestExample = {
      name: exampleName,
      content: exampleContent
    };

    // Salvar no localStorage
    const existingExamples = JSON.parse(localStorage.getItem('testExamples') || '[]');
    const updatedExamples = [...existingExamples, newExample];
    localStorage.setItem('testExamples', JSON.stringify(updatedExamples));
    
    // Atualizar o estado
    setSavedExamples(updatedExamples);
    
    toast({
      title: "Exemplo salvo",
      description: `O exemplo "${exampleName}" foi salvo com sucesso.`
    });
    
    // Limpar campos
    setExampleName('');
    setExampleContent('');
  };

  // Carregar exemplos salvos quando o componente montar
  useState(() => {
    const existingExamples = JSON.parse(localStorage.getItem('testExamples') || '[]');
    setSavedExamples(existingExamples);
  });

  const loadExample = (example: TestExample) => {
    setExampleName(example.name);
    setExampleContent(example.content);
    
    toast({
      title: "Exemplo carregado",
      description: `O exemplo "${example.name}" foi carregado.`
    });
  };

  const deleteExample = (index: number) => {
    const updatedExamples = [...savedExamples];
    updatedExamples.splice(index, 1);
    
    // Atualizar localStorage
    localStorage.setItem('testExamples', JSON.stringify(updatedExamples));
    
    // Atualizar estado
    setSavedExamples(updatedExamples);
    
    toast({
      title: "Exemplo excluído",
      description: "O exemplo foi removido com sucesso."
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Construtor de Exemplos de Teste</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="example-name">Nome do Exemplo</Label>
              <Input 
                id="example-name"
                placeholder="Ex: Relatório NVR Básico" 
                value={exampleName}
                onChange={(e) => setExampleName(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="example-content">Conteúdo do Relatório</Label>
              <Textarea 
                id="example-content"
                placeholder="Cole ou escreva o conteúdo do relatório aqui..." 
                className="min-h-[200px]"
                value={exampleContent}
                onChange={(e) => setExampleContent(e.target.value)}
              />
            </div>
            
            <Button onClick={saveExample}>Salvar Exemplo</Button>
          </div>
        </CardContent>
      </Card>
      
      {savedExamples.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Exemplos Salvos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {savedExamples.map((example, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <p className="font-medium">{example.name}</p>
                    <p className="text-sm text-muted-foreground truncate max-w-lg">
                      {example.content.substring(0, 100)}{example.content.length > 100 ? '...' : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => loadExample(example)}>
                      Carregar
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => deleteExample(index)}>
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 