import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// As credenciais do Firebase devem ser substituídas pelas suas próprias
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "seu-projeto.firebaseapp.com",
  databaseURL: "https://seu-projeto-default-rtdb.firebaseio.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "seu-messaging-sender-id",
  appId: "seu-app-id"
};

// Inicializar o Firebase
const app = initializeApp(firebaseConfig);

// Inicializar e exportar o Realtime Database
export const database = getDatabase(app);

export default app;