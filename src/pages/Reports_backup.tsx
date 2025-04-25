import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNVR } from '@/context/NVRContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import BarChart from '@/components/charts/BarChart';
import PieChart from '@/components/charts/PieChart';
import { Camera, HardDrive, Plus, Calendar, AlertCircle, Zap, Download, Server, Database } from 'lucide-react';
import { getOwnerColor } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

const Reports = () => {
  const navigate = useNavigate();
  const { nvrs, getTotalStats, getSlotStats, getHDSizeDistribution } = useNVR();
  const [selectedNVR, setSelectedNVR] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("geral");

  const stats = getTotalStats();
  const slotStats = getSlotStats();
  const hdSizeDistribution = getHDSizeDistribution();
  
  // Cores diferentes para cada NVR baseadas no número de câmeras
  const getNVRColor = (cameras: number) => {
    if (cameras >= 30) return '#22C55E'; // Verde para NVRs com muitas câmeras
    if (cameras >= 20) return '#3B82F6'; // Azul para NVRs com número médio-alto de câmeras
    if (cameras >= 15) return '#F59E0B'; // Âmbar para NVRs com número médio de câmeras
    return '#EF4444'; // Vermelho para NVRs com poucas câmeras
  };

  // Dados de câmeras por NVR com cores personalizadas
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

  // Função para obter cor baseada no tamanho do HD
  const getHDSizeColor = (size: string): string => {
    // Se não tiver tamanho ou for 0, retorna cinza
    if (size === '0') return '#E0E0E0';
    
    const hdSize = parseInt(size, 10);
    
    // Verificar se existe um NVR com o modelo de exceção
    // que contenha HDs com este tamanho
    const isSizeInExceptionModel = nvrs.some(nvr => 
      nvr.model === 'MHDX 3116' && 
      nvr.slots.some(slot => 
        slot.hdSize === hdSize && 
        slot.status !== 'empty'
      )
    );

    // Se for tamanho encontrado no modelo de exceção, usar esquema de cores original
    if (isSizeInExceptionModel) {
      switch(hdSize) {
        case 1:
          return '#EF4444'; // red-500
        case 2:
          return '#F97316'; // orange-500
        case 3:
          return '#F59E0B'; // amber-500
        case 4:
          return '#EAB308'; // yellow-500
        case 6:
          return '#84CC16'; // lime-500
        case 8:
          return '#22C55E'; // green-500
        case 10:
          return '#10B981'; // emerald-500
        default:
          return '#3B82F6'; // blue-500
      }
    }
    
    // Para todos os outros modelos, HDs com menos de 12TB ficam em vermelho
    if (hdSize < 12) {
      return '#EF4444'; // Vermelho
    }
    
    // Cores por tamanho de HD para 12TB ou mais
    switch(hdSize) {
      case 12:
        return '#14B8A6'; // teal-500
      case 14:
        return '#06B6D4'; // cyan-500
      case 16:
        return '#3B82F6'; // blue-500
      case 18:
        return '#6366F1'; // indigo-500
      case 20:
        return '#8B5CF6'; // violet-500
      default:
        return '#22C55E'; // green-500, para tamanhos maiores que 20
    }
  };

  // Distribuição de tamanho dos HDs com as cores corretas
  const hdSizeData = Object.entries(hdSizeDistribution).map(([size, count]) => ({
    name: size === '0' ? 'Não especificado' : `${size} TB`,
    value: count,
    color: getHDSizeColor(size)
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

  const handleNVRClick = (nvrName: string) => {
    const nvr = nvrs.find(n => n.name === nvrName);
    if (nvr) {
      // Guardamos o ID do NVR a ser destacado no localStorage para que a página principal possa lê-lo
      localStorage.setItem('highlightNVRId', nvr.id);
      navigate('/');
    }
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
    report += `Total de Câmeras: ${stats.totalCameras}\n`;
    report += `Total de HDs: ${stats.totalHDs}\n`;
    report += `Slots Vazios: ${slotStats.emptySlots}\n`;
    report += `NVRs em estado crítico: ${criticalNVRs.length}\n\n`;
    
    // Distribuição por responsável
    report += `DISTRIBUIÇÃO POR RESPONSÁVEL\n`;
    report += `===========================\n`;
    
    responsibleGroups.forEach(responsible => {
      const nvrCount = nvrs.filter(nvr => nvr.owner === responsible).length;
      const cameraCount = nvrs
        .filter(nvr => nvr.owner === responsible)
        .reduce((sum, nvr) => sum + nvr.cameras, 0);
      
      report += `${responsible}: ${nvrCount} NVRs, ${cameraCount} Câmeras\n`;
    });
    
    report += `\n`;
    
    // Lista de NVRs críticos
    if (criticalNVRs.length > 0) {
      report += `NVRs EM ESTADO CRÍTICO\n`;
      report += `====================\n`;
      
      criticalNVRs.forEach(nvr => {
        const isExceptionModel = nvr.model === "MHDX 3116";
        const hasActiveHDs = nvr.slots.some(slot => slot.status === 'active');
        
        if (!hasActiveHDs) {
          report += `${nvr.name} (${nvr.model}): Nenhum HD ativo\n`;
        } else if (!isExceptionModel) {
          const smallHDs = nvr.slots.filter(slot => 
            slot.status === 'active' && 
            slot.hdSize !== undefined && 
            slot.hdSize < 12
          );
          
          if (smallHDs.length > 0) {
            report += `${nvr.name} (${nvr.model}): ${smallHDs.length} HD(s) inadequado(s)\n`;
            
            // Listar os HDs inadequados
            smallHDs.forEach(slot => {
              report += `  - Slot ${slot.id}: ${slot.hdSize}TB\n`;
            });
          }
        }
      });
      
      report += `\n`;
    }
    
    // Status dos HDs
    report += `STATUS DOS SLOTS DE HD\n`;
    report += `====================\n`;
    report += `Ativos: ${slotStats.activeSlots}\n`;
    report += `Inativos: ${slotStats.inactiveSlots}\n`;
    report += `Vazios: ${slotStats.emptySlots}\n\n`;
    
    // Modelos de NVR
    report += `MODELOS DE NVR\n`;
    report += `=============\n`;
    
    [...new Set(nvrs.map(nvr => nvr.model))].forEach(model => {
      const count = nvrs.filter(nvr => nvr.model === model).length;
      report += `${model}: ${count}\n`;
    });
    
    return report;
  };

  // Função para baixar o relatório como arquivo de texto
  const downloadReport = () => {
    const report = generateReportText();
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const date = new Date().toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric'
    }).replace(/\//g, '-');
    
    link.href = url;
    link.download = `relatorio-nvr-${date}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Relatório gerado com sucesso",
      description: "O relatório foi baixado para o seu computador.",
    });
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Relatórios e Análises</h1>
            <p className="text-gray-500 mt-1">Visão geral dos NVRs e status do sistema</p>
          </div>
          <div className="flex gap-4">
            <Button 
              variant="outline"
              className="border-gray-300 hover:bg-gray-100 flex items-center gap-2"
              onClick={downloadReport}
            >
              <Download className="h-4 w-4" />
              Baixar Relatório
            </Button>
            <button
              onClick={() => navigate('/projecoes')}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center transition-colors duration-300"
            >
              Ver projeções <span className="ml-2">↗</span>
            </button>
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
          <Card className="border-l-4 border-l-blue-500 overflow-hidden transition-all hover:shadow-md">
            <CardContent className="p-6 flex items-center">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <Camera className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Total de Câmeras</p>
                <h3 className="text-3xl font-bold text-gray-800">{stats.totalCameras}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500 overflow-hidden transition-all hover:shadow-md">
            <CardContent className="p-6 flex items-center">
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <HardDrive className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Total de HDs</p>
                <h3 className="text-3xl font-bold text-gray-800">{stats.totalHDs}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-amber-500 overflow-hidden transition-all hover:shadow-md">
            <CardContent className="p-6 flex items-center">
              <div className="bg-amber-100 p-3 rounded-full mr-4">
                <Plus className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Slots Vazios</p>
                <h3 className="text-3xl font-bold text-gray-800">
                  {slotStats.emptySlots}
                </h3>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500 overflow-hidden transition-all hover:shadow-md cursor-pointer" 
                onClick={() => {
                  setActiveTab("geral");
                  // Adiciona um pequeno atraso para garantir que a aba seja alterada antes de rolar
                  setTimeout(() => {
                    const criticalNVRsElement = document.getElementById('critical-nvrs-section');
                    if (criticalNVRsElement) {
                      criticalNVRsElement.scrollIntoView({ behavior: 'smooth' });
                    }
                  }, 100);
                }}>
            <CardContent className="p-6 flex items-center">
              <div className="bg-red-100 p-3 rounded-full mr-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">NVRs em Estado Crítico</p>
                <h3 className="text-3xl font-bold text-gray-800">
                  {criticalNVRs.length}
                </h3>
                {criticalNVRs.length > 0 && (
                  <p className="text-xs text-red-600 mt-1">Necessitam atenção</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Seção de abas */}
        <Tabs defaultValue="geral" value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="mb-4 bg-white border">
            <TabsTrigger value="geral">Visão Geral</TabsTrigger>
            <TabsTrigger value="responsaveis">Por Responsável</TabsTrigger>
            <TabsTrigger value="hardware">Hardware</TabsTrigger>
          </TabsList>

          <TabsContent value="geral">
            {/* Gráfico Câmeras por NVR */}
            <Card className="w-full hover:shadow-md transition-shadow mb-8">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle>Câmeras por NVR</CardTitle>
                <CardDescription>Clique em uma barra para visualizar detalhes do NVR</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex justify-end mb-4 space-x-4 text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                    <span>Crítico (&lt;15)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                    <span>Médio (15-19)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                    <span>Bom (20-29)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <span>Excelente (30+)</span>
                  </div>
                </div>
                <BarChart 
                  data={camerasByNVR} 
                  title="" 
                  onClick={handleNVRClick} 
                  className="h-[500px]"
                  showLabels={true}
                  showGrid={true}
                  sorted={true}
                />
              </CardContent>
            </Card>

            {/* NVRs em estado crítico de espaço */}
            <Card id="critical-nvrs-section" className="w-full hover:shadow-md transition-shadow mb-8">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle>NVRs em Estado Crítico</CardTitle>
                <CardDescription>NVRs com problemas de armazenamento que precisam de atenção</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {criticalNVRs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      let bgColorClass = "bg-red-50";
                      let textColorClass = "text-red-900";
                      
                      if (!hasActiveHDs) {
                        problemType = "Sem HDs ativos";
                        bgColorClass = "bg-amber-50";
                        textColorClass = "text-amber-900";
                      } else if (smallHDs.length > 0 && !isExceptionModel) {
                        problemType = `${smallHDs.length} HD${smallHDs.length > 1 ? 's' : ''} inadequado${smallHDs.length > 1 ? 's' : ''}`;
                      }
                      
                      return (
                        <div 
                          key={nvr.id} 
                          className={`border p-4 rounded-md ${bgColorClass} hover:opacity-90 hover:shadow-md transition-shadow cursor-pointer`}
                          onClick={() => handleNVRClick(nvr.name)}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <h3 className={`font-semibold text-lg ${textColorClass}`}>{nvr.name}</h3>
                            <span className={`text-xs ${
                              !hasActiveHDs ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                            } px-2 py-1 rounded-full`}>
                              {problemType}
                            </span>
                          </div>
                          <div className="text-sm text-gray-700 space-y-1">
                            <p className="flex items-center">
                              <Server className={`h-4 w-4 mr-2 ${!hasActiveHDs ? "text-amber-700" : "text-red-700"}`} />
                              Modelo: <span className="font-medium ml-1">{nvr.model}</span>
                              {isExceptionModel && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">Exceção</span>}
                            </p>
                            <p className="flex items-center">
                              <Database className={`h-4 w-4 mr-2 ${!hasActiveHDs ? "text-amber-700" : "text-red-700"}`} />
                              Responsável: <span className="font-medium ml-1">{nvr.owner}</span>
                            </p>
                            {hasActiveHDs && !isExceptionModel && smallHDs.length > 0 && (
                              <p className="flex items-center">
                                <HardDrive className="h-4 w-4 mr-2 text-red-700" />
                                HDs: {smallHDs.map((slot, idx) => (
                                  <span key={slot.id} className="ml-1 font-medium bg-red-100 text-red-800 px-1.5 py-0.5 rounded text-xs">
                                    {slot.hdSize}TB
                                    {idx < smallHDs.length - 1 ? ',' : ''}
                                  </span>
                                ))}
                              </p>
                            )}
                            {!hasActiveHDs && (
                              <p className="flex items-center">
                                <HardDrive className="h-4 w-4 mr-2 text-amber-700" />
                                <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-xs">
                                  Nenhum HD ativo
                                </span>
                              </p>
                            )}
                            <p className="flex items-center">
                              <Camera className={`h-4 w-4 mr-2 ${!hasActiveHDs ? "text-amber-700" : "text-red-700"}`} />
                              <span className="font-medium">{nvr.cameras}</span> câmeras
                            </p>
                          </div>
                          <div className="mt-3 text-center">
                            <span className={`text-xs ${
                              !hasActiveHDs ? "bg-amber-200 text-amber-800" : "bg-red-200 text-red-800"
                            } px-3 py-2 rounded-full inline-block`}>
                              Clique para visualizar este NVR
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                    <Zap className="h-12 w-12 mb-2 text-green-500" />
                    <p>Ótimo! Não há NVRs em estado crítico.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="responsaveis">
            {/* Visão por responsável */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="bg-gray-50 border-b">
                  <CardTitle>Câmeras por Responsável</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <PieChart data={camerasByOwner} title="" />
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="bg-gray-50 border-b">
                  <CardTitle>Slots por Responsável</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <PieChart data={slotsByOwner} title="" />
                </CardContent>
              </Card>
            </div>

            {/* Cards de responsáveis */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Detalhes por Responsável</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {responsibleGroups.map(responsible => {
                  const filteredNVRs = nvrs.filter(nvr => nvr.owner === responsible);
                  const nvrCount = filteredNVRs.length;
                  const cameraCount = filteredNVRs.reduce((sum, nvr) => sum + nvr.cameras, 0);
                  const totalSlots = filteredNVRs.reduce((sum, nvr) => sum + nvr.slots.length, 0);
                  const emptySlots = filteredNVRs.reduce((sum, nvr) => 
                    sum + nvr.slots.filter(slot => slot.status === 'empty').length, 0);
                  
                  return (
                    <Card 
                      key={responsible} 
                      className="hover:shadow-md transition-shadow"
                      style={{ borderTop: `3px solid ${getOwnerColor(responsible)}` }}
                    >
                      <CardHeader className="bg-gray-50 border-b">
                        <CardTitle style={{ color: getOwnerColor(responsible) }}>{responsible}</CardTitle>
                        <CardDescription>{nvrCount} NVRs gerenciados</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-gray-500 mb-1">Total de Câmeras</div>
                            <div className="text-2xl font-bold">{cameraCount}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500 mb-1">Média por NVR</div>
                            <div className="text-2xl font-bold">
                              {nvrCount > 0 ? Math.round(cameraCount / nvrCount) : 0}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500 mb-1">Total de Slots</div>
                            <div className="text-2xl font-bold">{totalSlots}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500 mb-1">Slots Vazios</div>
                            <div className="text-2xl font-bold">{emptySlots}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="hardware">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Status dos HDs */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="bg-gray-50 border-b">
                  <CardTitle>Status dos Slots de HD</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <PieChart data={hdStatusData} title="" />
                </CardContent>
              </Card>

              {/* Distribuição de tamanho dos HDs */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="bg-gray-50 border-b">
                  <CardTitle>Tamanho dos HDs</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <PieChart data={hdSizeData} title="" />
                </CardContent>
              </Card>
            </div>

            {/* Modelos mais utilizados */}
            <Card className="hover:shadow-md transition-shadow mb-8">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle>Modelos de NVR</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <BarChart 
                    data={modelDistribution} 
                    title="" 
                    className="h-[300px]"
                    color="#3B82F6"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[300px] overflow-y-auto p-2">
                    {[...new Set(nvrs.map(nvr => nvr.model))].map(model => {
                      const count = nvrs.filter(nvr => nvr.model === model).length;
                      const percentage = Math.round((count / nvrs.length) * 100);
                      return (
                        <div key={model} className="bg-gray-50 p-4 rounded-md border flex flex-col">
                          <div className="font-medium mb-2">{model}</div>
                          <div className="flex justify-between items-center mt-auto">
                            <div className="text-sm text-gray-500">{percentage}%</div>
                            <div className="bg-blue-500 text-white text-sm px-2 py-1 rounded-full">{count}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Reports;
