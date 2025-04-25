import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

// Configuração do Firebase para o projeto Controle-NVR
const firebaseConfig = {
  apiKey: "AIzaSyCaniViOjYqBEueqcHMXzP1wl4J4wkXYek",
  authDomain: "controle-nvr.firebaseapp.com",
  databaseURL: "https://controle-nvr-default-rtdb.firebaseio.com",
  projectId: "controle-nvr",
  storageBucket: "controle-nvr.firebasestorage.app",
  messagingSenderId: "345256548210",
  appId: "1:345256548210:web:0b4e23020286f2e8c96feb",
  measurementId: "G-N3WN2VD0Z1"
};

// Inicializar o Firebase
const app = initializeApp(firebaseConfig);

// Inicializar o Analytics (opcional)
let analytics;
if (typeof window !== 'undefined') {
  // Analytics só funciona no navegador, não durante o build
  analytics = getAnalytics(app);
}

// Inicializar e exportar o Realtime Database
export const database = getDatabase(app);

export default app;