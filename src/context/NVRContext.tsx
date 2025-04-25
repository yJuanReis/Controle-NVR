import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { NVR, Slot, HDUpgradeStatus } from '../types';
import { toast } from '@/components/ui/use-toast';
import { NVR_MODELS } from '../constants/nvrModels';
import FirebaseService from '../services/firebase-service';

interface NVRContextType {
  nvrs: NVR[];
  addNVR: (nvr: Omit<NVR, "id">) => void;
  updateNVR: (id: string, data: Partial<NVR>) => void;
  deleteNVR: (id: string) => void;
  updateSlot: (nvrId: string, slotId: string, hdSize?: number, status?: "active" | "inactive" | "empty") => void;
  updateCameras: (nvrId: string, camerasCount: number) => void;
  getUpgradeStatus: () => HDUpgradeStatus[];
  getTotalStats: () => {
    totalCameras: number;
    totalStorage: number;
    totalHDs: number;
    averageTBPerNVR: number;
  };
  getSlotStats: () => {
    totalSlots: number;
    emptySlots: number;
    activeSlots: number;
    inactiveSlots: number;
  };
  getHDSizeDistribution: () => Record<string, number>;
  resetToInitialData: () => void;
  getCamerasTrend: () => {
    months: string[];
    data: Array<{
      date: string;
      cameras: number;
      capacity: number;
    }>;
  };
  getOwnerStats: () => Array<{
    owner: string;
    nvrCount: number;
    cameraCount: number;
    totalSlots: number;
    emptySlots: number;
    usedStorage: number;
  }>;
  getProjectedNeeds: (monthsAhead: number) => {
    projectedCameras: number;
    requiredStorage: number;
    additionalHDs: number;
    estimatedCost: number;
  };
}

const NVRContext = createContext<NVRContextType | undefined>(undefined);

// Chave para armazenar os dados no localStorage
const STORAGE_KEY = 'nvr-insight-data';

// Exemplo de dados iniciais
const initialNVRs: NVR[] = [
  {
    id: "1",
    name: "BOA VISTA",
    model: "INVD 1016", 
    owner: "BR Marinas",
    marina: "Marina A",
    slots: [
      { id: "1-1", nvrId: "1", status: "empty" }
    ],
    cameras: 15
  },
  {
    id: "2",
    name: "BOA VISTA 02",
    model: "INVD 5232",
    owner: "BR Marinas",
    marina: "Marina A",
    slots: [
      { id: "2-1", nvrId: "2", status: "empty" },
      { id: "2-2", nvrId: "2", status: "empty" },
      { id: "2-3", nvrId: "2", status: "empty" },
      { id: "2-4", nvrId: "2", status: "empty" },
      { id: "2-5", nvrId: "2", status: "empty" },
      { id: "2-6", nvrId: "2", status: "empty" },
      { id: "2-7", nvrId: "2", status: "empty" },
      { id: "2-8", nvrId: "2", status: "empty" }
    ],
    cameras: 16
  },
  {
    id: "3",
    name: "BUZIOS 01",
    model: "NVD 3332",
    owner: "Tele Litoranea",
    marina: "Marina A",
    slots: [
      { id: "3-1", nvrId: "3", status: "empty" },
      { id: "3-2", nvrId: "3", status: "empty" },
      { id: "3-3", nvrId: "3", status: "empty" },
      { id: "3-4", nvrId: "3", status: "empty" }
    ],
    cameras: 12
  },
  {
    id: "4",
    name: "GLORIA 01",
    model: "INVD 5132",
    owner: "Tele Litoranea",
    marina: "Marina A",
    slots: [
      { id: "4-1", nvrId: "4", status: "empty" },
      { id: "4-2", nvrId: "4", status: "empty" },
      { id: "4-3", nvrId: "4", status: "empty" },
      { id: "4-4", nvrId: "4", status: "empty" }
    ],
    cameras: 32
  },
  {
    id: "5",
    name: "GLORIA 02",
    model: "INVD 5132",
    owner: "Tele Litoranea",
    marina: "Marina A",
    slots: [
      { id: "5-1", nvrId: "5", status: "empty" },
      { id: "5-2", nvrId: "5", status: "empty" },
      { id: "5-3", nvrId: "5", status: "empty" },
      { id: "5-4", nvrId: "5", status: "empty" }
    ],
    cameras: 32
  },
  {
    id: "6",
    name: "GLORIA 03",
    model: "INVD 5132",
    owner: "Tele Litoranea",
    marina: "Marina A",
    slots: [
      { id: "6-1", nvrId: "6", status: "empty" },
      { id: "6-2", nvrId: "6", status: "empty" },
      { id: "6-3", nvrId: "6", status: "empty" },
      { id: "6-4", nvrId: "6", status: "empty" }
    ],
    cameras: 32
  },
  {
    id: "7",
    name: "GLORIA 04",
    model: "INVD 5132",
    owner: "Tele Litoranea",
    marina: "Marina A",
    slots: [
      { id: "7-1", nvrId: "7", status: "empty" },
      { id: "7-2", nvrId: "7", status: "empty" },
      { id: "7-3", nvrId: "7", status: "empty" },
      { id: "7-4", nvrId: "7", status: "empty" }
    ],
    cameras: 32
  },
  {
    id: "8",
    name: "ITACURUÇA 01",
    model: "INVD 5132",
    owner: "Tele Litoranea",
    marina: "Marina A",
    slots: [
      { id: "8-1", nvrId: "8", status: "empty" },
      { id: "8-2", nvrId: "8", status: "empty" },
      { id: "8-3", nvrId: "8", status: "empty" },
      { id: "8-4", nvrId: "8", status: "empty" }
    ],
    cameras: 25
  },
  {
    id: "9",
    name: "JL BRACHY 01",
    model: "INVD 5132",
    owner: "Tele Litoranea",
    marina: "Marina A",
    slots: [
      { id: "9-1", nvrId: "9", status: "empty" },
      { id: "9-2", nvrId: "9", status: "empty" },
      { id: "9-3", nvrId: "9", status: "empty" },
      { id: "9-4", nvrId: "9", status: "empty" }
    ],
    cameras: 24
  },
  {
    id: "10",
    name: "JL BRACHY 02",
    model: "INVD 5132",
    owner: "Tele Litoranea",
    marina: "Marina A",
    slots: [
      { id: "10-1", nvrId: "10", status: "empty" },
      { id: "10-2", nvrId: "10", status: "empty" },
      { id: "10-3", nvrId: "10", status: "empty" },
      { id: "10-4", nvrId: "10", status: "empty" }
    ],
    cameras: 32
  },
  {
    id: "11",
    name: "PARATY",
    model: "NVD 1432",
    owner: "BR Marinas",
    marina: "Marina A",
    slots: [
      { id: "11-1", nvrId: "11", status: "empty" },
      { id: "11-2", nvrId: "11", status: "empty" }
    ],
    cameras: 29
  },
  {
    id: "12",
    name: "PARATY 01",
    model: "INVD 5132",
    owner: "Tele Litoranea",
    marina: "Marina A",
    slots: [
      { id: "12-1", nvrId: "12", status: "empty" },
      { id: "12-2", nvrId: "12", status: "empty" },
      { id: "12-3", nvrId: "12", status: "empty" },
      { id: "12-4", nvrId: "12", status: "empty" }
    ],
    cameras: 25
  },
  {
    id: "13",
    name: "PICCOLA",
    model: "INVD 1016",
    owner: "BR Marinas",
    marina: "Marina A",
    slots: [
      { id: "13-1", nvrId: "13", status: "empty" }
    ],
    cameras: 13
  },
  {
    id: "14",
    name: "PIRATAS 01",
    model: "NVD 5132",
    owner: "Tele Litoranea",
    marina: "Marina A",
    slots: [
      { id: "14-1", nvrId: "14", status: "empty" },
      { id: "14-2", nvrId: "14", status: "empty" },
      { id: "14-3", nvrId: "14", status: "empty" },
      { id: "14-4", nvrId: "14", status: "empty" }
    ],
    cameras: 30
  },
  {
    id: "15",
    name: "PIRATAS",
    model: "NVD 1232",
    owner: "BR Marinas",
    marina: "Marina A",
    slots: [
      { id: "15-1", nvrId: "15", status: "empty" },
      { id: "15-2", nvrId: "15", status: "empty" }
    ],
    cameras: 0
  },
  {
    id: "16",
    name: "RIBEIRA 01",
    model: "INVD 5132",
    owner: "Tele Litoranea",
    marina: "Marina A",
    slots: [
      { id: "16-1", nvrId: "16", status: "empty" },
      { id: "16-2", nvrId: "16", status: "empty" },
      { id: "16-3", nvrId: "16", status: "empty" },
      { id: "16-4", nvrId: "16", status: "empty" }
    ],
    cameras: 22
  },
  {
    id: "17",
    name: "VEROLME 01",
    model: "INVD 5132",
    owner: "Tele Litoranea",
    marina: "Marina B",
    slots: [
      { id: "17-1", nvrId: "17", status: "empty" },
      { id: "17-2", nvrId: "17", status: "empty" },
      { id: "17-3", nvrId: "17", status: "empty" },
      { id: "17-4", nvrId: "17", status: "empty" }
    ],
    cameras: 29
  },
  {
    id: "18",
    name: "VEROLME 02",
    model: "INVD 5132",
    owner: "Tele Litoranea",
    marina: "Marina B",
    slots: [
      { id: "18-1", nvrId: "18", status: "empty" },
      { id: "18-2", nvrId: "18", status: "empty" },
      { id: "18-3", nvrId: "18", status: "empty" },
      { id: "18-4", nvrId: "18", status: "empty" }
    ],
    cameras: 32
  },
  {
    id: "19",
    name: "VEROLME 03",
    model: "NVD 1232",
    owner: "Tele Litoranea",
    marina: "Marina B",
    slots: [
      { id: "19-1", nvrId: "19", status: "empty" },
      { id: "19-2", nvrId: "19", status: "empty" }
    ],
    cameras: 14
  },
  {
    id: "20",
    name: "VEROLME",
    model: "MHDX 3116",
    owner: "BR Marinas",
    marina: "Marina B",
    slots: [
      { id: "20-1", nvrId: "20", status: "empty" }
    ],
    cameras: 10
  }
];

export const NVRProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Inicializa o estado com dados vazios, serão preenchidos pelo Firebase
  const [nvrs, setNVRs] = useState<NVR[]>([]);

  // Inicializa a conexão com o Firebase e configura os listeners
  useEffect(() => {
    // Registrar listener para mudanças nos NVRs do Firebase
    FirebaseService.initNVRs((updatedNVRs) => {
      setNVRs(updatedNVRs);
    });
  }, []);

  // Não precisamos mais do useEffect para salvar no localStorage
  // uma vez que o FirebaseService já cuida disso

  const addNVR = (nvr: Omit<NVR, "id">) => {
    // Gera um ID único usando timestamp para evitar conflitos
    const newId = `nvr_${Date.now()}`;
    
    // Determinar o número de slots com base no modelo
    let slots: Slot[] = [];
    if (nvr.model && NVR_MODELS[nvr.model]) {
      const slotsCount = NVR_MODELS[nvr.model].slots;
      
      // Criar slots vazios
      for (let i = 0; i < slotsCount; i++) {
        slots.push({
          id: `${newId}-${i + 1}`,
          nvrId: newId,
          status: "empty"
        });
      }
    } else {
      // Caso o modelo não seja encontrado, usa os slots fornecidos ou um array vazio
      slots = nvr.slots || [];
    }
    
    // Garante que marina tenha um valor padrão se não for fornecido
    const marina = nvr.marina || "Marina A";
    
    const newNVR: NVR = { ...nvr, id: newId, slots, marina };
    
    // Atualiza o estado localmente
    const updatedNVRs = [...nvrs, newNVR];
    setNVRs(updatedNVRs);
    
    // Salva no Firebase
    FirebaseService.saveNVRs(updatedNVRs);
    
    toast({
      title: "NVR Adicionado",
      description: `${nvr.name} foi adicionado com sucesso.`,
    });
  };

  const updateNVR = (id: string, data: Partial<NVR>) => {
    const updatedNVRs = nvrs.map((nvr) => {
      // Se não for o NVR que queremos atualizar, retorna sem alterações
      if (nvr.id !== id) return nvr;
      
      // Se estamos atualizando o modelo, precisamos atualizar os slots
      if (data.model && data.model !== nvr.model) {
        const modelConfig = NVR_MODELS[data.model];
        if (modelConfig) {
          const requiredSlots = modelConfig.slots;
          const currentSlots = nvr.slots;
          
          // Criar um novo array de slots baseado no modelo
          let updatedSlots: Slot[] = [];
          
          // Verificar se precisamos adicionar ou remover slots
          if (requiredSlots > currentSlots.length) {
            // Precisamos adicionar mais slots
            // Primeiro, mantemos todos os slots existentes
            updatedSlots = [...currentSlots];
            
            // Depois adicionamos novos slots vazios até atingir o número necessário
            for (let i = currentSlots.length; i < requiredSlots; i++) {
              updatedSlots.push({
                id: `${nvr.id}-${i + 1}`,
                nvrId: nvr.id,
                status: "empty"
              });
            }
          } else {
            // Precisamos manter apenas alguns slots ou o mesmo número
            // Mantemos apenas os primeiros 'requiredSlots' slots
            updatedSlots = currentSlots.slice(0, requiredSlots);
          }
          
          // Retornar NVR atualizado com novos slots e dados
          // Garantir que marina está definida
          const updatedData = {
            ...data,
            marina: data.marina || nvr.marina // Mantém marina original se não for fornecida
          };
          
          return { ...nvr, ...updatedData, slots: updatedSlots };
        }
      }
      
      // Garantir que marina está definida mesmo em atualizações normais
      const updatedData = {
        ...data,
        marina: data.marina || nvr.marina // Mantém marina original se não for fornecida
      };
      
      // Caso não esteja alterando o modelo, apenas atualiza os dados normalmente
      return { ...nvr, ...updatedData };
    });
    
    // Atualiza o estado local
    setNVRs(updatedNVRs);
    
    // Salva no Firebase
    FirebaseService.saveNVRs(updatedNVRs);
  };

  const deleteNVR = (id: string) => {
    const nvrToDelete = nvrs.find(nvr => nvr.id === id);
    const updatedNVRs = nvrs.filter(nvr => nvr.id !== id);
    
    // Atualiza o estado local
    setNVRs(updatedNVRs);
    
    // Salva no Firebase
    FirebaseService.saveNVRs(updatedNVRs);
    
    if (nvrToDelete) {
      toast({ 
        title: "NVR Removido",
        description: `${nvrToDelete.name} foi removido com sucesso.`,
        variant: "destructive"
      });
    }
  };

  // Função para resetar para os dados iniciais
  const resetToInitialData = () => {
    // Atualiza o estado local
    setNVRs(initialNVRs);
    
    // Salva no Firebase
    FirebaseService.saveNVRs(initialNVRs);
    
    toast({
      title: "Dados Resetados",
      description: "Os dados foram restaurados para o estado inicial.",
    });
  };

  const updateSlot = (nvrId: string, slotId: string, hdSize?: number, status?: "active" | "inactive" | "empty") => {
    const updatedNVRs = nvrs.map(nvr => {
      if (nvr.id === nvrId) {
        const updatedSlots = nvr.slots.map(slot => 
          slot.id === slotId 
            ? { 
                ...slot, 
                hdSize: hdSize !== undefined ? hdSize : slot.hdSize, 
                status: status || slot.status 
              } 
            : slot
        );
        return { ...nvr, slots: updatedSlots };
      }
      return nvr;
    });
    
    // Atualiza o estado local
    setNVRs(updatedNVRs);
    
    // Salva no Firebase
    FirebaseService.saveNVRs(updatedNVRs);
  };

  const updateCameras = (nvrId: string, camerasCount: number) => {
    const updatedNVRs = nvrs.map(nvr => 
      nvr.id === nvrId ? { ...nvr, cameras: camerasCount } : nvr
    );
    
    // Atualiza o estado local
    setNVRs(updatedNVRs);
    
    // Salva no Firebase
    FirebaseService.saveNVRs(updatedNVRs);
  };

  const getUpgradeStatus = (): HDUpgradeStatus[] => {
    return nvrs.map(nvr => {
      const filledSlots = nvr.slots.filter(slot => slot.status !== "empty").length;
      const totalSlots = nvr.slots.length;
      const progress = totalSlots > 0 ? Math.floor((filledSlots / totalSlots) * 100) : 0;
      const emptySlots = totalSlots - filledSlots;
      
      // Calcular custo estimado (R$1.500 por HD de 12TB)
      const estimatedCost = emptySlots * 1500;

      return {
        nvrId: nvr.id,
        progress,
        emptySlots,
        currentStatus: filledSlots > 0 ? `${filledSlots}/${totalSlots} slots com HD` : "Sem HDs",
        goal: `${totalSlots}x 12TB`,
        estimatedCost
      };
    });
  };

  const getTotalStats = () => {
    const totalCameras = nvrs.reduce((sum, nvr) => sum + nvr.cameras, 0);
    
    let totalStorage = 0;
    let totalHDs = 0;
    
    nvrs.forEach(nvr => {
      nvr.slots.forEach(slot => {
        if (slot.hdSize && slot.status === "active") {
          totalStorage += slot.hdSize;
          totalHDs++;
        }
      });
    });
    
    const averageTBPerNVR = nvrs.length > 0 ? totalStorage / nvrs.length : 0;
    
    return {
      totalCameras,
      totalStorage,
      totalHDs,
      averageTBPerNVR
    };
  };

  const getSlotStats = () => {
    let totalSlots = 0;
    let emptySlots = 0;
    let activeSlots = 0;
    let inactiveSlots = 0;
    
    nvrs.forEach(nvr => {
      totalSlots += nvr.slots.length;
      nvr.slots.forEach(slot => {
        if (slot.status === "empty") emptySlots++;
        else if (slot.status === "active") activeSlots++;
        else if (slot.status === "inactive") inactiveSlots++;
      });
    });
    
    return {
      totalSlots,
      emptySlots,
      activeSlots,
      inactiveSlots
    };
  };

  const getHDSizeDistribution = () => {
    const distribution: Record<string, number> = {};
    
    nvrs.forEach(nvr => {
      nvr.slots.forEach(slot => {
        if (slot.hdSize && slot.status !== "empty") {
          const size = `${slot.hdSize}TB`;
          distribution[size] = (distribution[size] || 0) + 1;
        }
      });
    });
    
    return distribution;
  };

  const getCamerasTrend = () => {
    // Simulação de dados históricos de crescimento
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Cria 12 meses retroativos a partir do mês atual
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(currentYear, currentMonth - i, 1);
      return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    }).reverse();
    
    // Número atual de câmeras
    const currentCameras = nvrs.reduce((sum, nvr) => sum + nvr.cameras, 0);
    
    // Capacidade atual estimada em TB
    const currentCapacity = nvrs.reduce((sum, nvr) => {
      const hdCapacity = nvr.slots.reduce((hdSum, slot) => {
        if (slot.status === 'active' && slot.hdSize) {
          return hdSum + slot.hdSize;
        }
        return hdSum;
      }, 0);
      return sum + hdCapacity;
    }, 0);
    
    // Simula crescimento histórico com taxa média de 5% ao mês
    const growthRate = 0.05;
    const data = months.map((month, index) => {
      // Crescimento regressivo (menos câmeras e capacidade no passado)
      const pastFactor = 1 / Math.pow(1 + growthRate, 11 - index);
      
      return {
        date: month,
        cameras: Math.round(currentCameras * pastFactor),
        capacity: Math.round(currentCapacity * pastFactor)
      };
    });
    
    return {
      months,
      data
    };
  };

  const getOwnerStats = () => {
    // Agrupa estatísticas por proprietário (owner)
    const owners = [...new Set(nvrs.map(nvr => nvr.owner))];
    
    return owners.map(owner => {
      const ownerNVRs = nvrs.filter(nvr => nvr.owner === owner);
      
      const nvrCount = ownerNVRs.length;
      const cameraCount = ownerNVRs.reduce((sum, nvr) => sum + nvr.cameras, 0);
      const totalSlots = ownerNVRs.reduce((sum, nvr) => sum + nvr.slots.length, 0);
      const emptySlots = ownerNVRs.reduce((sum, nvr) => {
        return sum + nvr.slots.filter(slot => slot.status === 'empty').length;
      }, 0);
      
      // Calcula o armazenamento usado em TB
      const usedStorage = ownerNVRs.reduce((sum, nvr) => {
        return sum + nvr.slots.reduce((slotSum, slot) => {
          if (slot.status === 'active' && slot.hdSize) {
            return slotSum + slot.hdSize;
          }
          return slotSum;
        }, 0);
      }, 0);
      
      return {
        owner,
        nvrCount,
        cameraCount,
        totalSlots,
        emptySlots,
        usedStorage
      };
    });
  };

  const getProjectedNeeds = (monthsAhead: number) => {
    // Taxa de crescimento mensal média de câmeras (6% ao mês)
    const cameraGrowthRate = 0.06;
    
    // Estatísticas atuais
    const totalCameras = nvrs.reduce((sum, nvr) => sum + nvr.cameras, 0);
    const totalStorage = nvrs.reduce((sum, nvr) => {
      return sum + nvr.slots.reduce((slotSum, slot) => {
        if (slot.status === 'active' && slot.hdSize) {
          return slotSum + slot.hdSize;
        }
        return slotSum;
      }, 0);
    }, 0);
    
    // Armazenamento médio por câmera atual (TB por câmera)
    const avgStoragePerCamera = totalCameras > 0 ? totalStorage / totalCameras : 0.5;
    
    // Calcular crescimento projetado
    const projectedCameras = Math.round(totalCameras * Math.pow(1 + cameraGrowthRate, monthsAhead));
    
    // Armazenamento requerido baseado no número projetado de câmeras
    const requiredStorage = Math.round(projectedCameras * avgStoragePerCamera);
    
    // Armazenamento adicional necessário
    const additionalStorageNeeded = requiredStorage - totalStorage;
    
    // Número de HDs de 12TB necessários para cobrir o armazenamento adicional
    const additionalHDs = Math.ceil(Math.max(0, additionalStorageNeeded) / 12);
    
    // Custo estimado (assumindo R$ 1.500 por HD de 12TB)
    const estimatedCost = additionalHDs * 1500;
    
    return {
      projectedCameras,
      requiredStorage,
      additionalHDs,
      estimatedCost
    };
  };

  return (
    <NVRContext.Provider
      value={{
        nvrs,
        addNVR,
        updateNVR,
        deleteNVR,
        updateSlot,
        updateCameras,
        getUpgradeStatus,
        getTotalStats,
        getSlotStats,
        getHDSizeDistribution,
        resetToInitialData,
        getCamerasTrend,
        getOwnerStats,
        getProjectedNeeds
      }}
    >
      {children}
    </NVRContext.Provider>
  );
};

export const useNVR = () => {
  const context = useContext(NVRContext);
  if (context === undefined) {
    throw new Error('useNVR must be used within a NVRProvider');
  }
  return context;
};
