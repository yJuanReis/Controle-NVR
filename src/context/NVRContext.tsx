
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { NVR, Slot, HDUpgradeStatus } from '../types';
import { toast } from '@/components/ui/use-toast';

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
}

const NVRContext = createContext<NVRContextType | undefined>(undefined);

// Exemplo de dados iniciais
const initialNVRs: NVR[] = [
  {
    id: "1",
    name: "NVR Principal",
    model: "Hikvision DS-7616NI-K2",
    owner: "João Silva",
    slots: [
      { id: "1-1", nvrId: "1", hdSize: 14, status: "active" },
      { id: "1-2", nvrId: "1", status: "empty" },
      { id: "1-3", nvrId: "1", status: "empty" },
      { id: "1-4", nvrId: "1", status: "empty" },
      { id: "1-5", nvrId: "1", status: "empty" },
      { id: "1-6", nvrId: "1", status: "empty" },
      { id: "1-7", nvrId: "1", status: "empty" },
      { id: "1-8", nvrId: "1", status: "empty" }
    ],
    cameras: 12
  },
  {
    id: "2",
    name: "NVR Secundário",
    model: "Intelbras NVD 1304",
    owner: "Maria Santos",
    slots: [
      { id: "2-1", nvrId: "2", status: "empty" },
      { id: "2-2", nvrId: "2", status: "empty" },
      { id: "2-3", nvrId: "2", status: "empty" },
      { id: "2-4", nvrId: "2", status: "empty" }
    ],
    cameras: 6
  },
  {
    id: "3",
    name: "NVR Estacionamento",
    model: "Dahua NVR5216-16P-4KS2",
    owner: "Carlos Oliveira",
    slots: [
      { id: "3-1", nvrId: "3", status: "empty" },
      { id: "3-2", nvrId: "3", status: "empty" },
      { id: "3-3", nvrId: "3", status: "empty" },
      { id: "3-4", nvrId: "3", status: "empty" },
      { id: "3-5", nvrId: "3", status: "empty" },
      { id: "3-6", nvrId: "3", status: "empty" }
    ],
    cameras: 8
  },
  {
    id: "4",
    name: "NVR-001",
    model: "Hikvision DS-7608NI-K2",
    owner: "João Silva",
    slots: [
      { id: "4-1", nvrId: "4", status: "empty" },
      { id: "4-2", nvrId: "4", status: "empty" },
      { id: "4-3", nvrId: "4", status: "empty" },
      { id: "4-4", nvrId: "4", status: "empty" },
      { id: "4-5", nvrId: "4", status: "empty" },
      { id: "4-6", nvrId: "4", status: "empty" },
      { id: "4-7", nvrId: "4", status: "empty" },
      { id: "4-8", nvrId: "4", status: "empty" }
    ],
    cameras: 12
  },
  {
    id: "5",
    name: "NVR-002",
    model: "Intelbras NVD 1304",
    owner: "Maria Santos",
    slots: [
      { id: "5-1", nvrId: "5", status: "empty" },
      { id: "5-2", nvrId: "5", status: "empty" },
      { id: "5-3", nvrId: "5", status: "empty" },
      { id: "5-4", nvrId: "5", status: "empty" }
    ],
    cameras: 6
  },
  {
    id: "6",
    name: "NVR-003",
    model: "Dahua NVR5216-16P-4KS2",
    owner: "Carlos Oliveira",
    slots: [
      { id: "6-1", nvrId: "6", status: "empty" },
      { id: "6-2", nvrId: "6", status: "empty" },
      { id: "6-3", nvrId: "6", status: "empty" },
      { id: "6-4", nvrId: "6", status: "empty" },
      { id: "6-5", nvrId: "6", status: "empty" },
      { id: "6-6", nvrId: "6", status: "empty" }
    ],
    cameras: 8
  }
];

export const NVRProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [nvrs, setNVRs] = useState<NVR[]>(initialNVRs);

  const addNVR = (nvr: Omit<NVR, "id">) => {
    const newId = (nvrs.length + 1).toString();
    const newNVR: NVR = { ...nvr, id: newId };
    setNVRs([...nvrs, newNVR]);
    toast({
      title: "NVR Adicionado",
      description: `${nvr.name} foi adicionado com sucesso.`,
    });
  };

  const updateNVR = (id: string, data: Partial<NVR>) => {
    setNVRs(nvrs.map(nvr => 
      nvr.id === id ? { ...nvr, ...data } : nvr
    ));
    toast({
      title: "NVR Atualizado",
      description: `As informações foram atualizadas com sucesso.`,
    });
  };

  const deleteNVR = (id: string) => {
    const nvrToDelete = nvrs.find(nvr => nvr.id === id);
    setNVRs(nvrs.filter(nvr => nvr.id !== id));
    
    if (nvrToDelete) {
      toast({
        title: "NVR Removido",
        description: `${nvrToDelete.name} foi removido com sucesso.`,
        variant: "destructive"
      });
    }
  };

  const updateSlot = (nvrId: string, slotId: string, hdSize?: number, status?: "active" | "inactive" | "empty") => {
    setNVRs(nvrs.map(nvr => {
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
    }));
    toast({
      title: "Slot Atualizado",
      description: `Informações do slot foram atualizadas com sucesso.`,
    });
  };

  const updateCameras = (nvrId: string, camerasCount: number) => {
    setNVRs(nvrs.map(nvr => 
      nvr.id === nvrId ? { ...nvr, cameras: camerasCount } : nvr
    ));
    toast({
      title: "Câmeras Atualizadas",
      description: `O número de câmeras foi atualizado com sucesso.`,
    });
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

  return (
    <NVRContext.Provider value={{
      nvrs,
      addNVR,
      updateNVR,
      deleteNVR,
      updateSlot,
      updateCameras,
      getUpgradeStatus,
      getTotalStats,
      getSlotStats,
      getHDSizeDistribution
    }}>
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
