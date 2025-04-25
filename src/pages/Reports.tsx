import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNVR } from '@/context/NVRContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import BarChart from '@/components/charts/BarChart';
import PieChart from '@/components/charts/PieChart';
import { Camera, HardDrive, Plus, Calendar, AlertCircle, Zap, Download, Server, Database, FileText, FileJson, FileSpreadsheet, Copy } from 'lucide-react';
import { getOwnerColor } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { NVR } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import FirebaseService from '../services/firebase-service';

const Reports = () => {
  const navigate = useNavigate();
  const { nvrs, getTotalStats, getSlotStats, getHDSizeDistribution } = useNVR();
  const [selectedNVR, setSelectedNVR] = useState<string | null>(null);
  const [filterOwner, setFilterOwner] = useState<string | null>(null);
  const [filterMarina, setFilterMarina] = useState<string | null>(null);
  
  // Estado para controle de câmeras contratadas por marina
  const [contractedCameras, setContractedCameras] = useState<Record<string, number>>(() => {
    // Tentar carregar do localStorage, ou inicializar com valores padrão
    const savedData = localStorage.getItem('contractedCamerasPerMarina');
    return savedData ? JSON.parse(savedData) : {};
  });
  const [newContractedCamera, setNewContractedCamera] = useState({
    marina: '',
    cameras: 0
  });
  const [editContractDialogOpen, setEditContractDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<{marina: string, cameras: number} | null>(null);
  
  // Estado para o diálogo do NVR
  const [nvrDialogOpen, setNvrDialogOpen] = useState(false);
  const [selectedNvrData, setSelectedNvrData] = useState<any>(null);

  const stats = getTotalStats();
  const slotStats = getSlotStats();

  
  const hdSizeDistribution = getHDSizeDistribution();
  

// Conta quantos slots NÃO têm HD de 12TB ou 14TB
const getSlotsWithout12or14TB = () => {
  let count = 0;
  nvrs.forEach(nvr => {
    nvr.slots.forEach(slot => {
      // Se o slot estiver vazio OU o tamanho não for 12 nem 14
      if (slot.status === 'empty' || (slot.hdSize !== 12 && slot.hdSize !== 14)) {
        count++;
      }
    });
  });
  return count;
};



  const camerasByNVR = nvrs.map(nvr => ({
    name: nvr.name,
    value: nvr.cameras
  }));
  
  // Distribuição de status dos HDs
  const hdStatusData = [
    { name: 'Ativo', value: slotStats.activeSlots, color: '#4CAF50' },
    { name: 'Inativo', value: slotStats.inactiveSlots, color: '#FFB74D' },
    { name: 'Vazio', value: slotStats.emptySlots, color: '#E0E0E0' },
  ].filter(item => item.value > 0);

  // Distribuição de tamanho dos HDs
  const hdSizeData = Object.entries(hdSizeDistribution).map(([size, count]) => ({
    name: size === '0' ? 'Não especificado' : `${size} TB`,
    value: count,
    color: size === '12' ? '#4CAF50' : size === '0' ? '#E0E0E0' : '#3B82F6'
  }));

  // Filtrar os NVRs por responsável
  const responsibleGroups = [...new Set(nvrs.map(nvr => nvr.owner))];
  
  // Agrupar câmeras por proprietário para visualização em gráficos
  const camerasByOwner = responsibleGroups.map(owner => ({
    name: owner,
    value: nvrs
      .filter(nvr => nvr.owner === owner)
      .reduce((sum, nvr) => sum + nvr.cameras, 0),
    color: getOwnerColor(owner)
  }));

  // Total de slots por responsável
  const slotsByOwner = responsibleGroups.map(owner => ({
    name: owner,
    value: nvrs
      .filter(nvr => nvr.owner === owner)
      .reduce((sum, nvr) => sum + nvr.slots.length, 0),
    color: getOwnerColor(owner)
  }));

  // Distribuição de modelos de NVR
  const modelDistribution = [...new Set(nvrs.map(nvr => nvr.model))].map(model => ({
    name: model,
    value: nvrs.filter(nvr => nvr.model === model).length,
    color: '#3B82F6'
  }));

  // Identificar NVRs críticos com base em múltiplos critérios
  const criticalNVRs = nvrs.filter(nvr => {
    // Verificar se há HDs com menos de 12TB (exceto para o modelo MHDX 3116)
    const smallHDs = nvr.slots.filter(slot => 
      slot.status === 'active' && 
      slot.hdSize !== undefined && 
      slot.hdSize < 12
    ).length;
    
    // Verificar se o NVR não tem nenhum HD ativo
    const hasActiveHDs = nvr.slots.some(slot => slot.status === 'active');
    
    // Regras específicas por modelo
    if (nvr.model === "MHDX 3116") {
      // MHDX 3116 é uma exceção, não é considerado crítico por ter HDs pequenos
      return !hasActiveHDs; // Só é crítico se não tiver HDs ativos
    } else {
      // Para todos os outros modelos, é crítico se:
      // 1. Tiver pelo menos um HD com menos de 12TB ou
      // 2. Não tiver nenhum HD ativo
      return smallHDs > 0 || !hasActiveHDs;
    }
  });

  // Extrair lista de marinas únicas dos NVRs
  const getMarinas = () => {
    // Utiliza diretamente a propriedade marina de cada NVR
    const marinaNames = nvrs
      .map(nvr => nvr.marina)
      .filter(Boolean); // Remove valores vazios
    
    // Retorna lista única de marinas
    return [...new Set(marinaNames)];
  };

  const marinas = getMarinas();

  // Função para dados filtrados
  const getFilteredNVRData = () => {
    let filteredData = [...nvrs];
    
    if (filterMarina) {
      filteredData = filteredData.filter(nvr => nvr.marina === filterMarina);
    }
    
    if (filterOwner) {
      filteredData = filteredData.filter(nvr => nvr.owner === filterOwner);
    }
    
    // Aplicar ordenação - sempre ordenar por mais câmeras, ignorando a seleção
    filteredData.sort((a, b) => b.cameras - a.cameras);
    
    return filteredData.map(nvr => {
      // Formatar nome para exibição com marina primeiro, depois a numeração
      // Garantir espaço adequado entre a marina e o nome do NVR entre parênteses
      const formattedName = `${nvr.marina} (${nvr.name})`;
      
      // Formatar informações sobre os slots
      const slotsInfo = nvr.slots.map(slot => ({
        id: slot.id,
        status: slot.status,
        hdSize: slot.hdSize || 0
      }));
      
      return {
        id: nvr.id,
        nvrName: nvr.name,
        marina: nvr.marina,
        name: formattedName,
        value: nvr.cameras,
        color: getOwnerColor(nvr.owner),
        slots: slotsInfo,
        totalSlots: nvr.slots.length,
        model: nvr.model,
        owner: nvr.owner
      };
    });
  };

  const handleNVRClick = (nvrName: string) => {
    // Encontra os dados do NVR pelo nome formatado
    const nvrData = getFilteredNVRData().find(item => item.name === nvrName);
    
    if (nvrData) {
      // Registra o objeto nvrData que já contém o ID
      setSelectedNvrData(nvrData);
      setNvrDialogOpen(true);
      console.log("NVR selecionado:", nvrData); // Para debug
    }
  };

  // Função para salvar as câmeras contratadas
  const saveContractedCameras = (newData: Record<string, number>) => {
    setContractedCameras(newData);
    localStorage.setItem('contractedCamerasPerMarina', JSON.stringify(newData));
    // Salvar no Firebase para compartilhamento entre usuários
    FirebaseService.saveContractedCameras(newData);
  };

  // Adicionar dados de câmeras contratadas para uma marina
  const addContractedCameras = () => {
    if (!newContractedCamera.marina || newContractedCamera.cameras <= 0) return;
    
    const newData = { ...contractedCameras };
    newData[newContractedCamera.marina] = newContractedCamera.cameras;
    
    saveContractedCameras(newData);
    
    // Notificar o usuário
    toast({
      title: "Contrato adicionado",
      description: `${newContractedCamera.cameras} câmeras contratadas para ${newContractedCamera.marina}.`,
    });
    
    setNewContractedCamera({ marina: '', cameras: 0 });
  };

  // Abrir diálogo de edição para uma marina
  const openEditDialog = (marina: string) => {
    setEditingContract({
      marina,
      cameras: contractedCameras[marina] || 0
    });
    setEditContractDialogOpen(true);
  };

  // Salvar edição de contrato
  const saveContractEdit = () => {
    if (!editingContract) return;
    
    const newData = { ...contractedCameras };
    newData[editingContract.marina] = editingContract.cameras;
    
    saveContractedCameras(newData);
    setEditContractDialogOpen(false);
    setEditingContract(null);
  };

  // Remover uma marina da lista de contratadas
  const removeContractedMarinas = (marina: string) => {
    const newData = { ...contractedCameras };
    delete newData[marina];
    saveContractedCameras(newData);
  };

  // Função para obter o total de câmeras por marina
  const getCamerasPerMarina = () => {
    const camerasPerMarina: Record<string, number> = {};
    
    // Agrupar câmeras por marina - APENAS para NVRs da Tele Litorânea
    nvrs.forEach(nvr => {
      if (nvr.marina && nvr.owner === "Tele Litorânea") {
        camerasPerMarina[nvr.marina] = (camerasPerMarina[nvr.marina] || 0) + nvr.cameras;
      }
    });
    
    return camerasPerMarina;
  };

  // Calcular câmeras disponíveis (contratadas - utilizadas)
  const getAvailableCameras = () => {
    const usedCameras = getCamerasPerMarina();
    const availableCameras: Record<string, { contracted: number, used: number, available: number }> = {};
    
    // Para cada marina contratada
    Object.keys(contractedCameras).forEach(marina => {
      availableCameras[marina] = {
        contracted: contractedCameras[marina],
        used: usedCameras[marina] || 0,
        available: contractedCameras[marina] - (usedCameras[marina] || 0)
      };
    });
    
    // Adicionar marinas que têm câmeras da Tele Litorânea mas não têm contratos registrados
    Object.keys(usedCameras).forEach(marina => {
      if (!availableCameras[marina]) {
        availableCameras[marina] = {
          contracted: 0,
          used: usedCameras[marina],
          available: -usedCameras[marina] // Negativo indica que há mais câmeras do que contratadas
        };
      }
    });
    
    return availableCameras;
  };

  // Função para gerar um relatório em formato de texto simples
  const generateReportText = () => {
    const date = new Date().toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    let report = `RELATÓRIO DE STATUS DO SISTEMA NVR - ${date}\n\n`;
    
    // Resumo geral
    report += `RESUMO GERAL\n`;
    report += `============\n`;
    const camerasTeleLitoranea = nvrs.filter(nvr => nvr.owner === "Tele Litorânea").reduce((sum, nvr) => sum + nvr.cameras, 0);
    const camerasBRMarinas = nvrs.filter(nvr => nvr.owner === "BR Marinas").reduce((sum, nvr) => sum + nvr.cameras, 0);
    report += `Câmeras Tele Litoranea: ${camerasTeleLitoranea}\n`;
    report += `Câmeras BR Marinas: ${camerasBRMarinas}\n`;
    report += `Slots sem HD de 12TB ou 14TB: ${getSlotsWithout12or14TB()}\n`;
    report += `NVRs em estado crítico: ${criticalNVRs.length}\n\n`;
    
    // Distribuição por responsável - simplificada
    report += `DISTRIBUIÇÃO DE CÂMERAS\n`;
    report += `======================\n`;
    report += `Tele Litorânea: ${camerasTeleLitoranea} câmeras\n`;
    report += `BR Marinas: ${camerasBRMarinas} câmeras\n\n`;
    
    // Adicionar seção de controle de contratos Tele Litorânea
    report += `CONTROLE DE CONTRATO - TELE LITORÂNEA\n`;
    report += `==================================\n`;
    report += `Estas estatísticas consideram apenas câmeras dos NVRs da Tele Litorânea.\n\n`;
    const availableCameras = getAvailableCameras();
    
    if (Object.keys(availableCameras).length === 0) {
      report += `Nenhum dado de contrato cadastrado.\n\n`;
    } else {
      report += `Marina | Contratadas | Qnt. | Disponíveis | BR Marinas\n`;
      report += `-----------------------------------------------------------\n`;
      
      Object.entries(availableCameras).forEach(([marina, stats]) => {
        const contractedStr = stats.contracted > 0 ? `${stats.contracted}` : 'Não informado';
        const availableStr = stats.contracted > 0 
          ? (stats.available >= 0 ? `${stats.available}` : `Excedido (${Math.abs(stats.available)})`)
          : 'N/A';
        
        // Calcular câmeras da BR Marinas para esta marina
        const brMarinasNVRs = nvrs.filter(nvr => nvr.marina === marina && nvr.owner === "BR Marinas");
        const brMarinasCameras = brMarinasNVRs.reduce((sum, nvr) => sum + nvr.cameras, 0);
        const brMarinasStr = brMarinasCameras > 0 ? `${brMarinasCameras}` : '-';
        
        report += `${marina.padEnd(20)} | ${contractedStr.padStart(11)} | ${String(stats.used).padStart(12)} | ${availableStr.padStart(11)} | ${brMarinasStr.padStart(9)}\n`;
      });
      
      report += `\n`;
    }
    
    // Lista de NVRs críticos
    if (criticalNVRs.length > 0) {
      report += `NVRs EM ESTADO CRÍTICO\n`;
      report += `====================\n`;
      
      criticalNVRs.forEach(nvr => {
        const isExceptionModel = nvr.model === "MHDX 3116";
        const hasActiveHDs = nvr.slots.some(slot => slot.status === 'active');
        
        if (!hasActiveHDs) {
          report += `NVR ${nvr.name} (${nvr.model}): Nenhum HD ativo\n`;
        } else if (!isExceptionModel) {
          const smallHDs = nvr.slots.filter(slot => 
            slot.status === 'active' && 
            slot.hdSize !== undefined && 
            slot.hdSize < 12
          );
          
          if (smallHDs.length > 0) {
            report += `NVR ${nvr.name} (${nvr.model}): ${smallHDs.length} HD(s) inadequado(s)\n`;
            
            // Listar os HDs inadequados
            smallHDs.forEach(slot => {
              report += `  - Slot ${slot.id}: ${slot.hdSize}TB\n`;
            });
          }
        }
      });
      
      report += `\n`;
    }
    
    // Mantemos apenas as informações de slots vazios que são ainda exibidas na interface
    report += `STATUS DOS SLOTS\n`;
    report += `==============\n`;
    report += `Slots Vazios: ${slotStats.emptySlots}\n\n`;
    
    return report;
  };

  // Função para gerar um relatório em formato JSON
  const generateReportJson = () => {
    const date = new Date().toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Estrutura de dados para o JSON
    const reportData = {
      title: `RELATÓRIO DE STATUS DO SISTEMA NVR - ${date}`,
      data: new Date().toISOString(),
      resumoGeral: {
        camerasTeleLitoranea: nvrs.filter(nvr => nvr.owner === "Tele Litorânea").reduce((sum, nvr) => sum + nvr.cameras, 0),
        camerasBRMarinas: nvrs.filter(nvr => nvr.owner === "BR Marinas").reduce((sum, nvr) => sum + nvr.cameras, 0),
        slotsSemHD12ou14TB: getSlotsWithout12or14TB(),
        nvrsEmEstadoCritico: criticalNVRs.length
      },
      distribuicaoCameras: {
        teleLitoranea: nvrs.filter(nvr => nvr.owner === "Tele Litorânea").reduce((sum, nvr) => sum + nvr.cameras, 0),
        brMarinas: nvrs.filter(nvr => nvr.owner === "BR Marinas").reduce((sum, nvr) => sum + nvr.cameras, 0)
      },
      // Adicionar mais dados conforme necessário
      nvrsDetalhes: nvrs.map(nvr => ({
        numeracao: nvr.name,
        marina: nvr.marina,
        responsavel: nvr.owner,
        modelo: nvr.model,
        cameras: nvr.cameras,
        slots: nvr.slots.map(slot => ({
          id: slot.id,
          status: slot.status,
          hdSize: slot.hdSize
        }))
      }))
    };

    return reportData;
  };

  // Função para gerar um relatório em formato CSV
  const generateReportCsv = () => {
    const camerasTeleLitoranea = nvrs.filter(nvr => nvr.owner === "Tele Litorânea").reduce((sum, nvr) => sum + nvr.cameras, 0);
    const camerasBRMarinas = nvrs.filter(nvr => nvr.owner === "BR Marinas").reduce((sum, nvr) => sum + nvr.cameras, 0);

    // Cabeçalho
    let csv = "Tipo,Valor\n";
    
    // Resumo geral
    csv += `Câmeras Tele Litoranea,${camerasTeleLitoranea}\n`;
    csv += `Câmeras BR Marinas,${camerasBRMarinas}\n`;
    csv += `Slots sem HD de 12TB ou 14TB,${getSlotsWithout12or14TB()}\n`;
    csv += `NVRs em estado crítico,${criticalNVRs.length}\n\n`;
    
    // Lista de NVRs
    csv += "Numeração,Marina,Responsável,Modelo,Câmeras\n";
    nvrs.forEach(nvr => {
      csv += `${nvr.name},${nvr.marina || ''},${nvr.owner},${nvr.model},${nvr.cameras}\n`;
    });
    
    return csv;
  };

  // Função para baixar o relatório como arquivo de texto
  const downloadReport = (format = 'txt') => {
    let data, mimeType, fileName;
    const date = new Date().toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric'
    }).replace(/\//g, '-');
    
    switch (format) {
      case 'json':
        data = JSON.stringify(generateReportJson(), null, 2);
        mimeType = 'application/json;charset=utf-8';
        fileName = `relatorio-nvr-${date}.json`;
        break;
      case 'csv':
        data = generateReportCsv();
        mimeType = 'text/csv;charset=utf-8';
        fileName = `relatorio-nvr-${date}.csv`;
        break;
      case 'txt':
      default:
        data = generateReportText();
        mimeType = 'text/plain;charset=utf-8';
        fileName = `relatorio-nvr-${date}.txt`;
        break;
    }
    
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Relatório gerado com sucesso",
      description: `O relatório foi baixado em formato ${format.toUpperCase()}.`,
    });
  };

  // Calcular a quantidade de HDs de 12TB ou mais por NVR
  const calculateHDs12TB = () => {
    return nvrs.map(nvr => {
      const count12TB = nvr.slots.filter(slot => slot.hdSize && slot.hdSize >= 12).length;
      const needed = Math.max(0, nvr.slots.length - count12TB); // Quantidade que precisamos comprar
      return {
        name: nvr.name,
        count12TB,
        needed,
      };
    });
  };

  // Valor médio por HD
  const averageCostPerHD = 1500;

  // Calcular o custo total
  const calculateTotalCost = () => {
    const hdData = calculateHDs12TB();
    const totalNeeded = hdData.reduce((sum, nvr) => sum + nvr.needed, 0);
    return totalNeeded * averageCostPerHD;
  };

  // Dentro do seu componente, você pode usar essas funções
  const hdData = calculateHDs12TB();
  const totalCost = calculateTotalCost();

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between mb-6">
        <div className="w-full md:w-auto mb-4 md:mb-0 text-center">
          <h1 className="text-2xl font-bold">Relatórios e Análises</h1>
        </div>
        <div className="flex gap-4 items-center ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Baixar Relatório
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Formato</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => downloadReport('txt')} className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Texto (.txt)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadReport('csv')} className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                <span>Planilha (.csv)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadReport('json')} className="flex items-center gap-2">
                <FileJson className="h-4 w-4" />
                <span>JSON (.json)</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center transition-colors duration-300"
          >
            Ver todos os NVRs <span className="ml-2">↗</span>
          </button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 font-bold">Câmeras Tele Litoranea</p>
          <h3 className="text-3xl font-bold text-blue-600 dark:text-blue-500">
                {nvrs.filter(nvr => nvr.owner === "Tele Litorânea").reduce((sum, nvr) => sum + nvr.cameras, 0)}
              </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total de câmeras</p>
          </CardContent>
        </Card>
        
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 font-bold">Câmeras BR Marinas</p>
          <h3 className="text-3xl font-bold text-green-600 dark:text-green-500">
                {nvrs.filter(nvr => nvr.owner === "BR Marinas").reduce((sum, nvr) => sum + nvr.cameras, 0)}
              </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total de câmeras</p>
          </CardContent>
        </Card>
        
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 font-bold">Sem HD de 12TB ou 14TB</p>
          <h3 className="text-3xl font-bold text-amber-600 dark:text-amber-500">
               {getSlotsWithout12or14TB()}
              </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Slots que precisam de upgrade</p>
          </CardContent>
        </Card>

      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 font-bold">NVRs em Estado Crítico</p>
          <h3 className="text-3xl font-bold text-red-600 dark:text-red-500">
                {criticalNVRs.length}
              </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Necessitam de atenção</p>
          </CardContent>
        </Card>
      </div>

    {/* Gráfico Câmeras por NVR - Com altura aumentada */}
        <Card className="w-full hover:shadow-md transition-shadow mb-8">
          <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700 text-center relative">
            <div className="absolute right-3 top-3 text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/50 p-1.5 rounded-full shadow-sm cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-800" 
              onClick={() => {
                // Abrir um diálogo com informações detalhadas sobre os NVRs filtrados
                const totalCameras = getFilteredNVRData().reduce((sum, nvr) => sum + nvr.value, 0);
                  
                // Dados para mostrar no diálogo
                const dialogContent = {
                  totalNVRs: getFilteredNVRData().length,
                  totalCameras,
                  marinaDistribution: Array.from(
                    getFilteredNVRData().reduce((acc, nvr) => {
                      if (nvr.marina) {
                        acc.set(nvr.marina, (acc.get(nvr.marina) || 0) + nvr.value);
                      }
                      return acc;
                    }, new Map())
                  ).map(([marina, count]) => ({ marina, count }))
                    .sort((a, b) => b.count - a.count)
                };
                
                // Mostrar diálogo com informações mais completas
                setSelectedNvrData({
                  name: "Resumo dos NVRs",
                  id: "summary",
                  customData: dialogContent
                });
                setNvrDialogOpen(true);
              }}
            >
              <AlertCircle className="h-4 w-4" />
            </div>
            <CardTitle className="text-xl dark:text-white">Câmeras por NVR</CardTitle>
            <CardDescription className="dark:text-gray-300 flex items-center justify-center">
              {/* Removido o texto de clique nas barras */}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="mb-4 flex flex-wrap items-center text-sm">
              <div className="flex items-center mr-4 mb-1">
                <span className="font-medium mr-2 dark:text-gray-200">Marina:</span>
                <select 
                  id="marina-filter"
                  className="p-2 border rounded text-sm bg-white dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 w-36"
                  value={filterMarina || ""}
                  onChange={(e) => setFilterMarina(e.target.value || null)}
                >
                  <option value="">Todas</option>
                  {marinas.map(marina => (
                    <option key={marina} value={marina}>{marina}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center mr-4 mb-1">
                <span className="font-medium mr-2 dark:text-gray-200">Responsável:</span>
                <select 
                  id="owner-filter"
                  className="p-2 border rounded text-sm bg-white dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 w-40"
                  value={filterOwner || ""}
                  onChange={(e) => setFilterOwner(e.target.value || null)}
                >
                  <option value="">Todos</option>
                  {responsibleGroups.map(owner => (
                    <option key={owner} value={owner}>{owner}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center ml-auto mb-1">
                <span className="mr-3 dark:text-gray-200 font-medium text-base">
                  <b>{getFilteredNVRData().length}</b> NVRs
                </span>
                <button
                  onClick={() => {
                    setFilterMarina(null);
                    setFilterOwner(null);
                  }}
                  className="text-sm bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 px-3 border dark:border-gray-600 rounded flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Limpar filtros
                </button>
              </div>
            </div>
            
            {/* Gráfico com altura adaptativa e ajustes para evitar cortes */}
            <div className="bg-background dark:bg-gray-900 p-4 rounded-md border border-border dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="overflow-x-auto overflow-y-hidden" style={{ 
                minHeight: getFilteredNVRData().length <= 3 ? "600px" : "800px", 
                width: "100%",
                minWidth: getFilteredNVRData().length <= 3 
                  ? "100%" 
                  : `${Math.max(800, getFilteredNVRData().length * 70)}px`
              }}>
                <BarChart 
                  data={getFilteredNVRData()} 
                  title="" 
                  onClick={handleNVRClick} 
                  className={`w-full ${getFilteredNVRData().length <= 3 ? "h-[600px]" : "h-[800px]"}`} 
                  useCustomColors
                  responsive={true}
                  chartTitle=""
                  labelColor="12px"
                  darkMode={true}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seção de controle de contrato - apenas Tele Litorânea */}
        <Card className="w-full hover:shadow-md transition-shadow mb-8">
          <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700 p-4">
            <div className="flex flex-wrap items-center justify-between">
              <div>
                <CardTitle className="dark:text-white text-lg">
                  Controle de Contrato - Tele Litorânea
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Câmeras por Marina</p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-4">
            <div className="text-sm text-gray-700 dark:text-gray-300 mb-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-800">
              <strong>Informação:</strong> Esta tabela mostra a contagem de câmeras para NVRs da <span className="font-medium text-blue-700 dark:text-blue-300">Tele Litorânea</span> por marina.
              Quando existem NVRs da BR Marinas na mesma marina, estes são indicados separadamente.
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Marina
                    </th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Contratadas
                    </th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Qnt.
                    </th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Disponíveis
                    </th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      BR Marinas
                    </th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {Object.entries(getAvailableCameras()).length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        Nenhum dado de contrato cadastrado.
                      </td>
                    </tr>
                  )}
                  
                  {Object.entries(getAvailableCameras()).map(([marina, stats]) => (
                    <tr 
                      key={marina} 
                      className={`${
                        editingContract && editingContract.marina === marina 
                          ? 'bg-blue-50 dark:bg-blue-900/20' 
                          : ''
                      } hover:bg-gray-50 dark:hover:bg-gray-800/60`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {marina}
                        {editingContract && editingContract.marina === marina && (
                          <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full">
                            Editando
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 text-center">
                        {stats.contracted > 0 ? (
                          <span className="font-medium">{stats.contracted}</span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500 italic">Não informado</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 text-center">
                        {stats.used}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          stats.available > 10 
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                            : stats.available > 0 
                              ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' 
                              : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                        }`}>
                          {stats.contracted > 0 
                            ? (stats.available >= 0 ? stats.available : `Excedido (${Math.abs(stats.available)})`) 
                            : 'N/A'}
                        </span>
                      </td>
                      
                      {/* Coluna da BR Marinas */}
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                        {(() => {
                          // Calcular câmeras da BR Marinas para esta marina
                          const brMarinasNVRs = nvrs.filter(nvr => nvr.marina === marina && nvr.owner === "BR Marinas");
                          const brMarinasCameras = brMarinasNVRs.reduce((sum, nvr) => sum + nvr.cameras, 0);
                          
                          if (brMarinasCameras > 0) {
                            return (
                              <div className="text-center">
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                  {brMarinasCameras}
                                </span>
                              </div>
                            );
                          }
                          return <span className="text-gray-400 dark:text-gray-500">-</span>;
                        })()}
                      </td>
                      
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                        {stats.contracted > 0 ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEditDialog(marina)}
                            className="h-7 px-3 bg-blue-50 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:border-blue-800 dark:hover:bg-blue-800/50 text-blue-600 dark:text-blue-300 min-w-[80px]"
                          >
                            Editar
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(marina)}
                            className="h-7 px-3 bg-green-50 border-green-200 hover:bg-green-100 dark:bg-green-900/30 dark:border-green-800 dark:hover:bg-green-800/50 text-green-600 dark:text-green-300 min-w-[80px]"
                          >
                            Adicionar
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

  {/* NVRs em estado crítico */}
      <Card id="critical-nvrs-section" className="w-full hover:shadow-md transition-shadow mb-8">
        <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
          <CardTitle className="dark:text-white">NVRs em Estado Crítico</CardTitle>
          <CardDescription className="dark:text-gray-300">NVRs com problemas de armazenamento que precisam de atenção</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {criticalNVRs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 grid-alternado">
              {criticalNVRs.map(nvr => {
                const smallHDs = nvr.slots.filter(slot => 
                  slot.status === 'active' && 
                  slot.hdSize !== undefined && 
                  slot.hdSize < 12
                );
                const hasActiveHDs = nvr.slots.some(slot => slot.status === 'active');
                const isExceptionModel = nvr.model === "MHDX 3116";
                
            // Determinar o tipo de problema
                let problemType = "";
                let bgColorClass = "bg-red-100 dark:bg-red-900";
                let textColorClass = "text-red-900 dark:text-red-100";
                
                if (!hasActiveHDs) {
                  problemType = "Sem HDs ativos";
                  bgColorClass = "bg-amber-100 dark:bg-amber-900";
                  textColorClass = "text-amber-900 dark:text-amber-100";
                } else if (smallHDs.length > 0 && !isExceptionModel) {
                  problemType = `${smallHDs.length} HD${smallHDs.length > 1 ? 's' : ''} inadequado${smallHDs.length > 1 ? 's' : ''}`;
                }
                
                return (
                  <div 
                    key={nvr.id} 
                    className={`border p-4 rounded-md ${bgColorClass} hover:opacity-90 hover:shadow-md transition-shadow cursor-pointer text-center`}
                    onClick={() => {
                      // Precisamos encontrar os dados formatados para este NVR
                      const nvrData = getFilteredNVRData().find(item => item.id === nvr.id);
                      if (nvrData) {
                        setSelectedNvrData(nvrData);
                        setNvrDialogOpen(true);
                      }
                    }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className={`font-semibold ${textColorClass} text-base sm:text-lg break-words`} style={{ maxWidth: '75%' }}>
                        {nvr.marina ? `${nvr.marina} (${nvr.name})` : nvr.name}
                      </h3>
                      <span className={`text-xs ${
                        !hasActiveHDs 
                          ? "bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200" 
                          : "bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200"
                      } px-2 py-1 rounded-full flex-shrink-0 ml-1`}>
                        {problemType}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-200 space-y-1">
                      <p className="flex items-center justify-center">
                        <Server className={`h-4 w-4 mr-2 ${!hasActiveHDs ? "text-amber-700 dark:text-amber-300" : "text-red-700 dark:text-red-300"}`} />
                        Modelo: <span className="font-medium ml-1">{nvr.model}</span>
                        {isExceptionModel && <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-1 py-0.5 rounded">Exceção</span>}
                      </p>
                      <p className="flex items-center justify-center">
                        <Database className={`h-4 w-4 mr-2 ${!hasActiveHDs ? "text-amber-700 dark:text-amber-300" : "text-red-700 dark:text-red-300"}`} />
                        Responsável: <span className="font-medium ml-1">{nvr.owner}</span>
                      </p>
                      {hasActiveHDs && !isExceptionModel && smallHDs.length > 0 && (
                        <p className="flex items-center justify-center flex-wrap">
                          <HardDrive className="h-4 w-4 mr-2 text-red-700 dark:text-red-300" />
                          HDs: {smallHDs.map((slot, idx) => (
                            <span key={slot.id} className="ml-1 font-medium bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-1.5 py-0.5 rounded text-xs">
                              {slot.hdSize}TB
                              {idx < smallHDs.length - 1 ? ',' : ''}
                            </span>
                          ))}
                        </p>
                      )}
                      {!hasActiveHDs && (
                        <p className="flex items-center justify-center">
                          <HardDrive className="h-4 w-4 mr-2 text-amber-700 dark:text-amber-300" />
                          <span className="bg-amber-100 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded text-xs">
                            Nenhum HD ativo
                          </span>
                        </p>
                      )}
                      <p className="flex items-center justify-center">
                        <Camera className={`h-4 w-4 mr-2 ${!hasActiveHDs ? "text-amber-700 dark:text-amber-300" : "text-red-700 dark:text-red-300"}`} />
                        <span className="font-medium">{nvr.cameras}</span> câmeras
                      </p>
                    </div>
                    <div className="mt-3 text-center">
                      <span className={`text-xs ${
                        !hasActiveHDs 
                          ? "bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200" 
                          : "bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200"
                      } px-3 py-2 rounded-full inline-block`}>
                        Clique para visualizar este NVR
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-gray-500 dark:text-gray-300">
              <Zap className="h-12 w-12 mb-2 text-green-500" />
              <p>Ótimo! Não há NVRs em estado crítico.</p>
            </div>
          )}
        </CardContent>
      </Card>
  {/* Diálogo para exibir detalhes do NVR */}
  <Dialog open={nvrDialogOpen} onOpenChange={setNvrDialogOpen}>
    <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto dark:bg-gray-800">
      <DialogHeader className="text-center">
        <DialogTitle className="text-xl dark:text-white text-center">
          {selectedNvrData?.name}
        </DialogTitle>
        {selectedNvrData?.marina && !selectedNvrData?.customData && (
          <DialogDescription className="dark:text-gray-300 text-center">
            Marina: {selectedNvrData.marina}
          </DialogDescription>
        )}
      </DialogHeader>
      
      {selectedNvrData && (
        <div className="py-4">
          {/* Caso seja um resumo geral */}
          {selectedNvrData.id === "summary" && selectedNvrData.customData && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-md">
                <h3 className="text-lg font-semibold mb-2 text-blue-700 dark:text-blue-300 text-center">Estatísticas Gerais</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white dark:bg-gray-700 p-3 rounded-md shadow-sm text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">Total de NVRs</p>
                    <p className="text-2xl font-bold text-center">{selectedNvrData.customData.totalNVRs}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-700 p-3 rounded-md shadow-sm text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">Total de Câmeras</p>
                    <p className="text-2xl font-bold text-center">{selectedNvrData.customData.totalCameras}</p>
                  </div>
                </div>
              </div>

              {/* Distribuição por Marina */}
              {selectedNvrData.customData.marinaDistribution.length > 0 && (
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2 text-center">Distribuição por Marina</h3>
                  <div className="space-y-2">
                    {selectedNvrData.customData.marinaDistribution.map((item, index) => (
                      <div key={index} className="flex items-center justify-between bg-white dark:bg-gray-700 p-3 rounded-md shadow-sm">
                        <span className="font-medium">{item.marina}</span>
                        <span className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-sm">
                          {item.count} câmeras
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => {
                  // Copiar todos os NVRs filtrados
                  const allNVRs = getFilteredNVRData()
                    .sort((a, b) => b.value - a.value) // Mantém a ordenação por número de câmeras
                    .map(nvr => `${nvr.name}: ${nvr.value} câmeras`);
                  
                  // Adiciona cabeçalho com total
                  const reportHeader = `RELATÓRIO DE NVRs (${allNVRs.length} unidades)\n` +
                                      `Total de câmeras: ${selectedNvrData.customData.totalCameras}\n\n`;
                  
                  // Formata os dados como texto
                  const reportData = reportHeader + allNVRs.join('\n');
                  
                  // Copia para a área de transferência
                  navigator.clipboard.writeText(reportData);
                  
                  toast({
                    title: "Dados copiados",
                    description: `Lista completa com ${allNVRs.length} NVRs copiada para a área de transferência`,
                  });
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar todos os NVRs
              </Button>
            </div>
          )}
          
          {/* Caso seja um NVR específico */}
          {selectedNvrData.id !== "summary" && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-4 justify-center">
                <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                  <Server className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">Modelo</p>
                  <p className="font-medium dark:text-white text-center">{selectedNvrData.model}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mb-4 justify-center">
                <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                  <Camera className="h-5 w-5 text-green-600 dark:text-green-300" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">Câmeras</p>
                  <p className="font-medium dark:text-white text-center">{selectedNvrData.value}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mb-4 justify-center">
                <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                  <Database className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">Responsável</p>
                  <p className="font-medium dark:text-white text-center">{selectedNvrData.owner}</p>
                </div>
              </div>
              
              {selectedNvrData.slots && selectedNvrData.slots.length > 0 && (
                <div className="text-center">
                  <h3 className="font-semibold mb-2 text-center">Status dos HDs</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {selectedNvrData.slots.map((slot, index) => {
                      // Simplificar ID do slot - pegar apenas o número após o último hífen ou usar o índice + 1
                      const simplifiedId = typeof slot.id === 'string' && slot.id.includes('-') 
                        ? slot.id.split('-').pop() 
                        : (index + 1);
                      
                      // Usar cores baseadas no status e tamanho do HD conforme padrão existente
                      let bgColor = "";
                      let textColor = "";
                      
                      if (slot.status === 'active') {
                        // Para HDs ativos, cor varia conforme o tamanho
                        if (slot.hdSize >= 12) {
                          // HDs adequados (12TB ou mais)
                          bgColor = "bg-green-100 dark:bg-green-900";
                          textColor = "text-green-800 dark:text-green-200";
                        } else {
                          // HDs pequenos (menos de 12TB)
                          bgColor = "bg-amber-100 dark:bg-amber-900";
                          textColor = "text-amber-800 dark:text-amber-200";
                        }
                      } else if (slot.status === 'inactive') {
                        // HDs inativos
                        bgColor = "bg-red-100 dark:bg-red-900";
                        textColor = "text-red-800 dark:text-red-200";
                      } else {
                        // Slots vazios
                        bgColor = "bg-gray-100 dark:bg-gray-700";
                        textColor = "text-gray-800 dark:text-gray-200";
                      }
                      
                      return (
                        <div key={index} className={`${bgColor} p-2 rounded-md text-center ${textColor}`}>
                          <p className="text-xs opacity-80">Slot {simplifiedId}</p>
                          <p className="font-semibold">
                            {slot.status === 'empty' ? 'Vazio' : `${slot.hdSize}TB`}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      <DialogFooter className="flex justify-center">
        {selectedNvrData && selectedNvrData.id !== "summary" && (
          <Button 
            onClick={() => {
              if (selectedNvrData && selectedNvrData.id) {
                localStorage.setItem('highlightNVRId', selectedNvrData.id);
                navigate('/');
              }
              setNvrDialogOpen(false);
            }}
            className="w-full"
          >
            Ver detalhes completos
          </Button>
        )}
        
        {selectedNvrData && selectedNvrData.id === "summary" && (
          <Button 
            onClick={() => setNvrDialogOpen(false)}
            className="w-full"
          >
            Fechar
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  </Dialog>

  {/* Diálogo para editar câmeras contratadas */}
  <Dialog open={editContractDialogOpen} onOpenChange={setEditContractDialogOpen}>
    <DialogContent className="sm:max-w-[500px] dark:bg-gray-800">
      <DialogHeader className="text-center">
        <DialogTitle className="text-xl dark:text-white text-center">Editar Câmeras Contratadas</DialogTitle>
        <DialogDescription className="dark:text-gray-300 text-center">
          {editingContract?.marina}
        </DialogDescription>
      </DialogHeader>
      
      {editingContract && (
        <div className="py-4">
          <div className="space-y-4">
            <div className="grid w-full items-center gap-2 text-center">
              <label htmlFor="cameras" className="text-sm font-medium dark:text-gray-200 text-center">
                Número de câmeras contratadas
              </label>
              <input
                type="number"
                id="cameras"
                min="0"
                value={editingContract.cameras}
                onChange={(e) => setEditingContract({
                  ...editingContract,
                  cameras: parseInt(e.target.value) || 0
                })}
                className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white mx-auto text-center"
                style={{ maxWidth: "120px" }}
              />
            </div>
          </div>
          
          <div className="flex gap-3 justify-center mt-6">
            <Button
              variant="destructive"
              onClick={() => {
                removeContractedMarinas(editingContract.marina);
                setEditContractDialogOpen(false);
                toast({
                  title: "Contrato removido",
                  description: `As informações de contrato para ${editingContract.marina} foram removidas.`,
                });
              }}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Excluir
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setEditContractDialogOpen(false)}
              >
                Cancelar
              </Button>
              
              <Button 
                onClick={saveContractEdit}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}
    </DialogContent>
  </Dialog>
</div>
);
};

export default Reports;

