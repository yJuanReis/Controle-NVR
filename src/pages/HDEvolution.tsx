import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNVR } from '@/context/NVRContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, FileJson, FileSpreadsheet } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { database } from '../firebase';
import { ref, onValue, set } from 'firebase/database';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";

const HDEvolution = () => {
  const navigate = useNavigate();
  const { nvrs, getUpgradeStatus, getSlotStats } = useNVR();
  
  // Preços por capacidade de HD
  const [hd12TBPrice, setHd12TBPrice] = useState(2800);
  const [hd14TBPrice, setHd14TBPrice] = useState(3500);
  // Estados de backup para os preços originais
  const [originalHd12TBPrice, setOriginalHd12TBPrice] = useState(2800);
  const [originalHd14TBPrice, setOriginalHd14TBPrice] = useState(3500);
  const [pricesChanged, setPricesChanged] = useState(false);
  const [purchasedSlots, setPurchasedSlots] = useState<Record<string, boolean[]>>({});
  const [isSavingPrices, setIsSavingPrices] = useState(false);
  const [isSavingSlots, setIsSavingSlots] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Computar estado de salvamento geral para feedback visual
  const isSaving = isSavingPrices || isSavingSlots;

  // Array de modelos que suportam apenas até 12TB
  const modelos12TB = ["MHDX 3116", "NVD 1232"];

  // Efeito para carregar dados iniciais com escuta em tempo real
  useEffect(() => {
    setIsLoading(true);
    
    // Carregar e escutar mudanças nos preços usando Realtime Database
    const pricesRef = ref(database, 'hdSlots/prices');
    onValue(pricesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setHd12TBPrice(data.hd12TBPrice);
        setHd14TBPrice(data.hd14TBPrice);
        // Guardar os valores originais
        setOriginalHd12TBPrice(data.hd12TBPrice);
        setOriginalHd14TBPrice(data.hd14TBPrice);
        // Resetar o flag de alteração
        setPricesChanged(false);
      } else {
        // Se não existir, criar o documento com valores padrão
        createDefaultPrices();
      }
    }, (error) => {
      console.error("Erro ao escutar preços:", error);
      toast({
        title: "Erro ao carregar preços",
        description: "Não foi possível sincronizar os preços dos HDs.",
        variant: "destructive"
      });
    });

    // Carregar e escutar mudanças nos slots marcados como comprados usando Realtime Database
    const purchasedSlotsRef = ref(database, 'hdSlots/purchasedSlots');
    onValue(purchasedSlotsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.slots) {
          setPurchasedSlots(data.slots);
        } else {
          createDefaultSlots();
        }
      } else {
        createDefaultSlots();
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Erro ao escutar slots:", error);
      toast({
        title: "Erro ao carregar slots",
        description: "Não foi possível sincronizar os slots marcados como comprados.",
        variant: "destructive"
      });
      setIsLoading(false);
    });

    // Cleanup: cancelar os listeners quando o componente for desmontado
    return () => {
      // Para o Realtime Database, onValue não retorna uma função de cancelamento direta
      // mas podemos desconectar manualmente se necessário
    };
  }, [nvrs]);

  // Função para criar valores padrão de preços
  const createDefaultPrices = async () => {
    try {
      // Salvar usando Realtime Database para melhor sincronização em tempo real
      await set(ref(database, 'hdSlots/prices'), {
        hd12TBPrice: 2800,
        hd14TBPrice: 3500,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao criar preços padrão:', error);
    }
  };

  // Função para criar slots padrão
  const createDefaultSlots = async () => {
    try {
      const initialState = {};
      nvrs.forEach(nvr => {
        initialState[nvr.id] = Array(16).fill(false);
      });
      
      // Salvar usando Realtime Database para melhor sincronização em tempo real
      await set(ref(database, 'hdSlots/purchasedSlots'), {
        slots: initialState,
        lastUpdated: new Date().toISOString()
      });
      
      setPurchasedSlots(initialState);
    } catch (error) {
      console.error('Erro ao criar slots padrão:', error);
    }
  };

  // Função para atualizar o estado local dos preços sem salvar
  const handlePriceChange = (type: '12TB' | '14TB', value: number) => {
    // Atualizar o estado local imediatamente para feedback ao usuário
    if (type === '12TB') {
      setHd12TBPrice(value);
    } else {
      setHd14TBPrice(value);
    }
    
    // Marcar que os preços foram alterados
    setPricesChanged(true);
  };

  // Função para salvar os preços no banco de dados
  const savePrices = async () => {
    if (isSavingPrices) return;
    
    try {
      setIsSavingPrices(true);
      
      // Salvar no Realtime Database para sincronização em tempo real
      await set(ref(database, 'hdSlots/prices'), {
        hd12TBPrice: hd12TBPrice,
        hd14TBPrice: hd14TBPrice,
        lastUpdated: new Date().toISOString()
      });
      
      // Atualizar os valores originais e resetar o flag de alteração
      setOriginalHd12TBPrice(hd12TBPrice);
      setOriginalHd14TBPrice(hd14TBPrice);
      setPricesChanged(false);
      
      toast({
        title: "Preços atualizados",
        description: "Os preços dos HDs foram atualizados com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao salvar preços:', error);
      toast({
        title: "Erro ao salvar preços",
        description: "Não foi possível atualizar os preços dos HDs.",
        variant: "destructive"
      });
      
      // Reverter mudanças locais em caso de erro
      setHd12TBPrice(originalHd12TBPrice);
      setHd14TBPrice(originalHd14TBPrice);
      setPricesChanged(false);
    } finally {
      setIsSavingPrices(false);
    }
  };

  // Função para cancelar alterações nos preços
  const cancelPriceChanges = () => {
    setHd12TBPrice(originalHd12TBPrice);
    setHd14TBPrice(originalHd14TBPrice);
    setPricesChanged(false);
  };

  // Função otimizada para alternar o status de compra de um slot
  const toggleSlotPurchaseStatus = async (nvrId: string, slotIndex: number) => {
    if (isSavingSlots) return;
    
    try {
      setIsSavingSlots(true);
      
      // Criar uma cópia do estado atual
      const currentSlots = JSON.parse(JSON.stringify(purchasedSlots));
      
      // Garantir que o objeto para este NVR existe
      if (!currentSlots[nvrId]) {
        currentSlots[nvrId] = Array(16).fill(false);
      }
      
      // Garantir que o array é grande o suficiente
      if (currentSlots[nvrId].length <= slotIndex) {
        currentSlots[nvrId] = [
          ...currentSlots[nvrId],
          ...Array(slotIndex + 1 - currentSlots[nvrId].length).fill(false)
        ];
      }
      
      // Inverter o estado do slot
      currentSlots[nvrId][slotIndex] = !currentSlots[nvrId][slotIndex];

      // Atualizar o estado local imediatamente para feedback rápido
      setPurchasedSlots(currentSlots);
      
      // Salvar no Realtime Database para sincronização em tempo real entre usuários
      await set(ref(database, 'hdSlots/purchasedSlots'), {
        slots: currentSlots,
        lastUpdated: new Date().toISOString()
      });
      
      toast({
        title: "Status atualizado",
        description: `Slot ${slotIndex + 1} ${currentSlots[nvrId][slotIndex] ? 'marcado' : 'desmarcado'} como comprado.`,
      });
    } catch (error) {
      console.error('Erro ao atualizar slot:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o status do slot.",
        variant: "destructive"
      });
      
      // Reverter mudanças locais em caso de erro, recarregando dados do Firebase
      const purchasedSlotsRef = ref(database, 'hdSlots/purchasedSlots');
      onValue(purchasedSlotsRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          if (data.slots) {
            setPurchasedSlots(data.slots);
          }
        }
      }, { onlyOnce: true });
    } finally {
      setIsSavingSlots(false);
    }
  };

  // Definição do tipo para props do SlotItem
  interface SlotItemProps {
    slot: any;
    index: number;
    nvrId: string;
    maxHDSize: number;
    isPurchased: boolean;
    isSaving: boolean;
    toggleSlotPurchaseStatus: (nvrId: string, slotIndex: number) => Promise<void>;
  }

  // Componente para um único slot
  const SlotItem = ({ 
    slot, 
    index, 
    nvrId, 
    maxHDSize, 
    isPurchased, 
    isSaving,
    toggleSlotPurchaseStatus
  }: SlotItemProps) => {
    // Verificar se o slot já tem um HD adequado
    const hasAdequateHD = slot.status !== "empty" && slot.hdSize && slot.hdSize >= maxHDSize;
    
    // Determinar a classe de cor baseado no status
    let statusClass = "";
    let statusText = "";
    
    if (hasAdequateHD) {
      statusClass = "bg-green-100 border-green-500 text-green-800 dark:bg-green-900 dark:border-green-500 dark:text-green-300";
      statusText = `${slot.hdSize}TB`;
    } else if (isPurchased) {
      statusClass = "bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-900 dark:border-blue-500 dark:text-blue-300";
      statusText = "Comprado";
    } else if (slot.status !== "empty" && slot.hdSize) {
      statusClass = "bg-amber-100 border-amber-500 text-amber-800 dark:bg-amber-900 dark:border-amber-500 dark:text-amber-300";
      statusText = `${slot.hdSize}TB`;
    } else {
      statusClass = "bg-gray-100 border-gray-300 text-gray-800 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300";
      statusText = "Vazio";
    }
    
    return (
      <div 
        key={index} 
        className={`relative flex items-center border rounded-md px-3 py-2 ${statusClass} cursor-pointer ${
          isSaving ? 'opacity-60 cursor-wait pointer-events-none' : ''
        }`}
        onClick={() => {
          if (!hasAdequateHD && !isSaving) {
            toggleSlotPurchaseStatus(nvrId, index);
          }
        }}
        title={
          hasAdequateHD 
            ? "Este slot já possui um HD adequado" 
            : isSaving 
              ? "Salvando dados..."
              : isPurchased 
                ? "Clique para desmarcar como comprado" 
                : "Clique para marcar como comprado"
        }
      >
        <div className="flex flex-col">
          <span className="font-semibold text-sm">Slot {index + 1}</span>
          <span className="text-xs">{statusText}</span>
        </div>
        
        {!hasAdequateHD && (
          <div className="ml-2 flex items-center">
            <div className={`w-5 h-5 rounded flex items-center justify-center border ${
              isPurchased 
                ? 'bg-blue-500 border-blue-600 dark:bg-blue-600 dark:border-blue-700' 
                : 'bg-white border-gray-400 dark:bg-gray-700 dark:border-gray-500'
            }`}>
              {isPurchased && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>
        )}
        
        {hasAdequateHD && (
          <div className="ml-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    );
  };

  // Estatísticas e cálculos
  const nvrHDStats = useMemo(() => {
    console.log('Recalculando estatísticas de NVR...');
    return nvrs.map(nvr => {
      // Verificar se o NVR é de um modelo que não suporta HD maior que 12TB
      const isExceptionModel = modelos12TB.includes(nvr.model);
      // Tamanho máximo suportado pelo modelo
      const maxHDSize = isExceptionModel ? 12 : 14;
      
      // Preço do HD adequado para este modelo
      const hdPrice = isExceptionModel ? hd12TBPrice : hd14TBPrice;
      
      const currentHDs = nvr.slots.filter(
        slot => slot.status !== "empty" && slot.hdSize && slot.hdSize >= maxHDSize
      ).length;

      // Slots para upgrade são slots vazios ou com HD menor que o tamanho máximo suportado
      const slotsToUpgrade = nvr.slots.filter((slot, index) => {
        // Verificar se o slot já está marcado como comprado
        const isPurchased = purchasedSlots[nvr.id]?.[index] || false;
        const hasAdequateHD = slot.status !== "empty" && slot.hdSize && slot.hdSize >= maxHDSize;
        
        // Retorna true apenas se o slot precisa de upgrade E não foi marcado como comprado
        return !hasAdequateHD && !isPurchased;
      }).length;
      
      const totalCost = slotsToUpgrade * hdPrice;

      return { nvr, currentHDs, slotsToUpgrade, totalCost, isExceptionModel, maxHDSize, hdPrice };
    });
  }, [nvrs, purchasedSlots, hd12TBPrice, hd14TBPrice, modelos12TB]);

  const slotStats = getSlotStats();
  const totalEmptySlots = slotStats.emptySlots;
  
  // Calcular progresso e métricas gerais
  const totalSlotsNeedingUpgrade = nvrs.reduce((count, nvr) => {
    const isExceptionModel = modelos12TB.includes(nvr.model);
    const maxHDSize = isExceptionModel ? 12 : 14;
    
    return count + nvr.slots.filter(slot => {
      return slot.status === "empty" || (!slot.hdSize || (slot.hdSize && slot.hdSize < maxHDSize));
    }).length;
  }, 0);

  // Slots já resolvidos (HD adequado + comprados)
  const resolvedSlots = nvrs.reduce((count, nvr) => {
    const isExceptionModel = modelos12TB.includes(nvr.model);
    const maxHDSize = isExceptionModel ? 12 : 14;
    
    return count + nvr.slots.reduce((slotCount, slot, index) => {
      const hasAdequateHD = slot.status !== "empty" && slot.hdSize && slot.hdSize >= maxHDSize;
      const isPurchased = purchasedSlots[nvr.id]?.[index] || false;
      return slotCount + (hasAdequateHD || isPurchased ? 1 : 0);
    }, 0);
  }, 0);

  const totalProgress = totalSlotsNeedingUpgrade > 0 
    ? Math.round((resolvedSlots / totalSlotsNeedingUpgrade) * 100) 
    : 100;
  
  // Calcular HDs que precisam ser substituídos
  const upgradeNeeded = nvrs.reduce((count, nvr) => {
    const isExceptionModel = modelos12TB.includes(nvr.model);
    const maxHDSize = isExceptionModel ? 12 : 14;
    
    const filledSlots = nvr.slots.filter((slot, index) => {
      const isPurchased = purchasedSlots[nvr.id]?.[index] || false;
      return slot.status !== "empty" && (!slot.hdSize || slot.hdSize < maxHDSize) && !isPurchased;
    }).length;
    
    return count + filledSlots;
  }, 0);
  
  // Calcular custo total estimado
  const totalCost = nvrHDStats.reduce((sum, stat) => sum + stat.totalCost, 0);

  // Função para contar o número total de HDs adequados atuais
  const currentHDsCount = () => {
    return nvrs.reduce((count, nvr) => {
      const isExceptionModel = modelos12TB.includes(nvr.model);
      const maxHDSize = isExceptionModel ? 12 : 14;
      
      const adequateHDsCount = nvr.slots.filter(
        slot => slot.status !== "empty" && slot.hdSize && slot.hdSize >= maxHDSize
      ).length;
      
      return count + adequateHDsCount;
    }, 0);
  };

  // Função para gerar o relatório de evolução de HDs
  const generateHDEvolutionReport = () => {
    const date = new Date().toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    let report = `RELATÓRIO DE EVOLUÇÃO DE HDs - ${date}\n\n`;
    
    // Resumo geral
    report += `RESUMO GERAL\n`;
    report += `============\n`;
    report += `Progresso Geral: ${totalProgress}%\n`;
    report += `Slots para Upgrade: ${upgradeNeeded + totalEmptySlots - (resolvedSlots - currentHDsCount())}\n`;
    report += `Slots Vazios: ${totalEmptySlots}\n`;
    report += `Custo Estimado: R$ ${totalCost.toLocaleString('pt-BR')}\n\n`;
    
    // Compra dos NVRs
    report += `Compra dos NVRs\n`;
    report += `=============\n`;
    report += `NUMERAÇÃO\t\tTAMANHO MAX\t\tSLOTS PARA UPGRADE\t\tCUSTO ESTIMADO\t\tSTATUS DOS SLOTS\n`;
    
    nvrHDStats.forEach(({ nvr, currentHDs, slotsToUpgrade, totalCost, maxHDSize }) => {
      const formattedInfo = nvr.marina ? `${nvr.name} - ${nvr.marina}` : nvr.name;
      
      // Formatação do status dos slots
      let slotStatusStr = '';
      nvr.slots.forEach((slot, idx) => {
        const isPurchased = purchasedSlots[nvr.id]?.[idx] || false;
        const hasAdequateHD = slot.status !== "empty" && slot.hdSize && slot.hdSize >= maxHDSize;
        
        if (hasAdequateHD) {
          slotStatusStr += `Slot ${idx+1}: OK(${slot.hdSize}TB) | `;
        } else if (isPurchased) {
          slotStatusStr += `Slot ${idx+1}: Comprado | `;
        } else {
          slotStatusStr += `Slot ${idx+1}: Pendente | `;
        }
      });
      
      report += `${formattedInfo}\t\t${maxHDSize}TB\t\t${slotsToUpgrade}\t\tR$ ${totalCost.toLocaleString('pt-BR')}\t\t${slotStatusStr}\n`;
    });
    
    report += `\n`;
    
    // Informações importantes
    report += `INFORMAÇÕES IMPORTANTES\n`;
    report += `======================\n`;
    report += `Meta de Capacidade: Todos os slots devem ter HDs com capacidade adequada ao modelo do NVR\n`;
    report += `- Modelos MHDX 3116 e NVD 1232: Capacidade máxima de 12TB\n`;
    report += `- Demais modelos: Capacidade mínima de 14TB\n\n`;
    
    report += `Custos Estimados:\n`;
    report += `- Preço médio por HD de 12TB: R$ ${hd12TBPrice.toLocaleString('pt-BR')}\n`;
    report += `- Preço médio por HD de 14TB: R$ ${hd14TBPrice.toLocaleString('pt-BR')}\n`;
    report += `- Os custos são aproximados e podem variar conforme o mercado\n\n`;
    
    return report;
  };

  // Função para gerar o relatório em formato JSON
  const generateHDEvolutionJson = () => {
    const date = new Date().toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const reportData = {
      title: `RELATÓRIO DE EVOLUÇÃO DE HDs - ${date}`,
      date: new Date().toISOString(),
      resumoGeral: {
        progressoGeral: `${totalProgress}%`,
        slotsParaUpgrade: upgradeNeeded + totalEmptySlots - (resolvedSlots - currentHDsCount()),
        slotsVazios: totalEmptySlots,
        custoEstimado: totalCost
      },
      precos: {
        hd12TB: hd12TBPrice,
        hd14TB: hd14TBPrice
      },
      nvrs: nvrHDStats.map(({ nvr, currentHDs, slotsToUpgrade, totalCost, maxHDSize }) => {
        const slotsInfo = nvr.slots.map((slot, idx) => {
          const isPurchased = purchasedSlots[nvr.id]?.[idx] || false;
          const hasAdequateHD = slot.status !== "empty" && slot.hdSize && slot.hdSize >= maxHDSize;
          
          return {
            id: slot.id,
            status: hasAdequateHD ? 'OK' : (isPurchased ? 'Comprado' : 'Pendente'),
            hdSize: slot.hdSize || 0,
            needsUpgrade: !hasAdequateHD && !isPurchased
          };
        });

        return {
          id: nvr.id,
          numeracao: nvr.name,
          marina: nvr.marina || '',
          modeloNVR: nvr.model,
          tamanhoMaxHD: `${maxHDSize}TB`,
          slotsAtuais: currentHDs,
          slotsParaUpgrade: slotsToUpgrade,
          custoEstimado: totalCost,
          slots: slotsInfo
        };
      })
    };

    return reportData;
  };

  // Função para gerar o relatório em formato CSV
  const generateHDEvolutionCsv = () => {
    let csv = "Tipo,Dado\n";
    csv += `Data,${new Date().toLocaleDateString('pt-BR')}\n`;
    csv += `Progresso Geral,${totalProgress}%\n`;
    csv += `Slots para Upgrade,${upgradeNeeded + totalEmptySlots - (resolvedSlots - currentHDsCount())}\n`;
    csv += `Slots Vazios,${totalEmptySlots}\n`;
    csv += `Custo Estimado,R$ ${totalCost.toLocaleString('pt-BR')}\n\n`;
    
    csv += "Marina,Numeração,Modelo,Tamanho Máximo,Slots para Upgrade,Custo Estimado,Slots Comprados,Slots Adequados\n";
    
    nvrHDStats.forEach(({ nvr, currentHDs, slotsToUpgrade, totalCost, maxHDSize }) => {
      // Calcular quantos slots foram marcados como comprados
      const slotsPurchased = nvr.slots.reduce((count, slot, index) => {
        const isPurchased = purchasedSlots[nvr.id]?.[index] || false;
        const hasAdequateHD = slot.status !== "empty" && slot.hdSize && slot.hdSize >= maxHDSize;
        return count + (!hasAdequateHD && isPurchased ? 1 : 0);
      }, 0);
      
      csv += `${nvr.marina || ''},${nvr.name},${nvr.model},${maxHDSize}TB,${slotsToUpgrade},R$ ${totalCost.toLocaleString('pt-BR')},${slotsPurchased},${currentHDs}\n`;
    });
    
    return csv;
  };

  // Função para baixar o relatório como arquivo
  const downloadHDEvolutionReport = (format = 'txt') => {
    let data, mimeType, fileName;
    const date = new Date().toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric'
    }).replace(/\//g, '-');
    
    switch (format) {
      case 'json':
        data = JSON.stringify(generateHDEvolutionJson(), null, 2);
        mimeType = 'application/json;charset=utf-8';
        fileName = `evolucao-hds-${date}.json`;
        break;
      case 'csv':
        data = generateHDEvolutionCsv();
        mimeType = 'text/csv;charset=utf-8';
        fileName = `evolucao-hds-${date}.csv`;
        break;
      case 'txt':
      default:
        data = generateHDEvolutionReport();
        mimeType = 'text/plain;charset=utf-8';
        fileName = `evolucao-hds-${date}.txt`;
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
      title: "Relatório de evolução de HDs gerado",
      description: `O relatório foi baixado em formato ${format.toUpperCase()}.`,
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Planejamento de Evolução dos HDs</h1>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <label htmlFor="hd12TBPrice" className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
              Valor HD 12TB:
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">R$</span>
              <input
                id="hd12TBPrice"
                type="number"
                className="border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md pl-8 pr-3 py-2 w-28"
                value={hd12TBPrice}
                onChange={(e) => handlePriceChange('12TB', Number(e.target.value))}
                disabled={isSavingPrices}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="hd14TBPrice" className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
              Valor HD 14TB:
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">R$</span>
              <input
                id="hd14TBPrice"
                type="number"
                className="border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md pl-8 pr-3 py-2 w-28"
                value={hd14TBPrice}
                onChange={(e) => handlePriceChange('14TB', Number(e.target.value))}
                disabled={isSavingPrices}
              />
            </div>
          </div>
          {pricesChanged && (
            <>
              <Button 
                variant="default"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={savePrices}
                disabled={isSavingPrices}
              >
                {isSavingPrices ? 'Salvando...' : 'Confirmar'}
              </Button>
              <Button 
                variant="outline"
                className="border-gray-300 text-gray-700"
                onClick={cancelPriceChanges}
                disabled={isSavingPrices}
              >
                Cancelar
              </Button>
            </>
          )}
          <Button 
            variant="outline" 
            className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300"
            onClick={async () => {
              // Confirmar antes de limpar todas as marcações
              if (window.confirm('Tem certeza que deseja limpar todas as marcações de HDs comprados?')) {
                try {
                  setIsSavingSlots(true);
                  
                  // Criar estado inicial vazio
                  const initialState = {};
                  nvrs.forEach(nvr => {
                    initialState[nvr.id] = Array(16).fill(false);
                  });

                  // Atualizar estado local imediatamente para feedback rápido
                  setPurchasedSlots(initialState);

                  // Salvar no Realtime Database para sincronização em tempo real
                  await set(ref(database, 'hdSlots/purchasedSlots'), {
                    slots: initialState,
                    lastUpdated: new Date().toISOString()
                  });

                  toast({
                    title: "Marcações limpas",
                    description: "Todas as marcações de HDs comprados foram removidas",
                  });
                } catch (error) {
                  console.error('Erro ao limpar marcações:', error);
                  toast({
                    title: "Erro ao limpar",
                    description: "Não foi possível limpar as marcações.",
                    variant: "destructive"
                  });
                  
                  // Recarregar dados originais em caso de erro
                  const purchasedSlotsRef = ref(database, 'hdSlots/purchasedSlots');
                  onValue(purchasedSlotsRef, (snapshot) => {
                    if (snapshot.exists()) {
                      const data = snapshot.val();
                      if (data.slots) {
                        setPurchasedSlots(data.slots);
                      }
                    }
                  }, { onlyOnce: true });
                } finally {
                  setIsSavingSlots(false);
                }
              }
            }}
            disabled={isSavingSlots || isLoading}
          >
            Limpar Marcações
          </Button>
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
              <DropdownMenuItem onClick={() => downloadHDEvolutionReport('txt')} className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Texto (.txt)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadHDEvolutionReport('csv')} className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                <span>Planilha (.csv)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadHDEvolutionReport('json')} className="flex items-center gap-2">
                <FileJson className="h-4 w-4" />
                <span>JSON (.json)</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Cards de resumo - agora usando as variáveis memoizadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Progresso Geral</p>
            <h3 className="text-3xl font-bold dark:text-white">{totalProgress}%</h3>
            <div className="mt-2 progress-bar bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="progress-bar-fill bg-blue-500 rounded-full h-2" 
                style={{ width: `${totalProgress}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">HDs para Upgrade</p>
            <h3 className="text-3xl font-bold text-amber-600 dark:text-amber-500">{upgradeNeeded}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">HDs que precisam ser substituídos</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Slots Vazios</p>
            <h3 className="text-3xl font-bold text-red-600 dark:text-red-500">{totalEmptySlots}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Slots que precisam ser preenchidos</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Custo Estimado</p>
            <h3 className="text-3xl font-bold text-green-600 dark:text-green-500">R$ {totalCost.toLocaleString('pt-BR')}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Baseado apenas em HDs pendentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Indicador de salvamento */}
      {isSaving && (
        <div className="flex items-center justify-center mb-4">
          <div className="w-5 h-5 border-t-2 border-blue-500 border-solid rounded-full animate-spin mr-2"></div>
          <p className="text-sm text-gray-600 dark:text-gray-300">Salvando...</p>
        </div>
      )}
      
      {/* Indicador de carregamento inicial */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-10">
          <div className="w-10 h-10 border-t-4 border-blue-500 border-solid rounded-full animate-spin mb-4"></div>
          <p className="text-lg text-gray-700 dark:text-gray-300">Carregando dados...</p>
        </div>
      ) : (
        <>
          {/* Tabela de Compra dos NVRs */}
          <Card className="mb-8">
            <CardHeader className="bg-gray-50 border-b dark:bg-gray-800 dark:border-gray-700">
              <CardTitle>Compra dos NVRs</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">NVR</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tamanho Max</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Slots para Upgrade</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Custo Estimado</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status dos Slots</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                    {nvrHDStats.map((nvrStat) => (
                      <tr key={nvrStat.nvr.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{nvrStat.nvr.marina}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {nvrStat.nvr.name} ({nvrStat.nvr.model})
                            {nvrStat.isExceptionModel && (
                              <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-1 py-0.5 rounded">
                                12TB Max
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">{nvrStat.maxHDSize}TB</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            R$ {nvrStat.hdPrice.toLocaleString('pt-BR')} por HD
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {nvrStat.slotsToUpgrade}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">R$ {nvrStat.totalCost.toLocaleString('pt-BR')}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-3">
                            {nvrStat.nvr.slots.map((slot, index) => (
                              <SlotItem
                                key={`${nvrStat.nvr.id}-slot-${index}`}
                                slot={slot}
                                index={index}
                                nvrId={nvrStat.nvr.id}
                                maxHDSize={nvrStat.maxHDSize}
                                isPurchased={purchasedSlots[nvrStat.nvr.id]?.[index] || false}
                                isSaving={isSavingSlots}
                                toggleSlotPurchaseStatus={toggleSlotPurchaseStatus}
                              />
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default HDEvolution;
