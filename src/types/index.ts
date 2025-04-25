export interface NVR {
  id: string;
  name: string;
  model: string;
  owner: string;
  marina: string;
  slots: Slot[];
  cameras: number;
  notes?: string; // Campo de observações (opcional)
}

export interface Slot {
  id: string;
  nvrId: string;
  hdSize?: number; // em TB, undefined significa slot vazio
  status: "active" | "inactive" | "empty";
}

export interface HDUpgradeStatus {
  nvrId: string;
  progress: number;
  emptySlots: number;
  currentStatus: string;
  goal: string;
  estimatedCost: number;
}
