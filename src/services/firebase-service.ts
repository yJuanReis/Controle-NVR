import { database } from '../firebase';
import { ref, set, onValue, push, remove, update } from 'firebase/database';
import { NVR } from '@/types';

// Referência para o nó 'nvrs' no Firebase
const nvrsRef = ref(database, 'nvrs');

// Referência para o nó 'contractedCameras' no Firebase
const contractedCamerasRef = ref(database, 'contractedCamerasPerMarina');

export const FirebaseService = {
  // Inicializar dados ouvindo mudanças do Firebase
  initNVRs: (callback: (nvrs: NVR[]) => void) => {
    onValue(nvrsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const nvrsArray = Object.values(data) as NVR[];
        
        // Chamar o callback com os dados atualizados
        callback(nvrsArray);
      } else {
        callback([]);
      }
    });
  },

  // Adicionar ou atualizar NVRs
  saveNVRs: (nvrs: NVR[]) => {
    return set(nvrsRef, nvrs);
  },

  // Inicializar câmeras contratadas
  initContractedCameras: (callback: (data: Record<string, number>) => void) => {
    onValue(contractedCamerasRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        // Chamar o callback com os dados atualizados
        callback(data);
      } else {
        callback({});
      }
    });
  },

  // Salvar câmeras contratadas
  saveContractedCameras: (data: Record<string, number>) => {
    return set(contractedCamerasRef, data);
  }
};

export default FirebaseService; 