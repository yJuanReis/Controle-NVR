import { database } from '../firebase';
import { ref, set, onValue, push, remove, update } from 'firebase/database';
import { NVR } from '@/types';

// Chave para armazenar no localStorage para compatibilidade
const STORAGE_KEY = 'nvr-insight-data';

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
        
        // Atualizar o localStorage para compatibilidade
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nvrsArray));
        
        // Chamar o callback com os dados atualizados
        callback(nvrsArray);
      } else {
        // Se não houver dados no Firebase, usar o localStorage existente
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
          const localNVRs = JSON.parse(savedData) as NVR[];
          // Salvar os dados locais no Firebase
          set(nvrsRef, localNVRs);
          callback(localNVRs);
        } else {
          callback([]);
        }
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
        
        // Atualizar o localStorage para compatibilidade
        localStorage.setItem('contractedCamerasPerMarina', JSON.stringify(data));
        
        // Chamar o callback com os dados atualizados
        callback(data);
      } else {
        // Se não houver dados no Firebase, usar o localStorage existente
        const savedData = localStorage.getItem('contractedCamerasPerMarina');
        if (savedData) {
          const localData = JSON.parse(savedData);
          // Salvar os dados locais no Firebase
          set(contractedCamerasRef, localData);
          callback(localData);
        } else {
          callback({});
        }
      }
    });
  },

  // Salvar câmeras contratadas
  saveContractedCameras: (data: Record<string, number>) => {
    return set(contractedCamerasRef, data);
  }
};

export default FirebaseService; 