import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, doc, setDoc, getDoc, collection, query, getDocs, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from "firebase/storage";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from "firebase/auth";

// Usuários locais para fallback quando o Firestore falhar
const LOCAL_USERS = {
  admin: {
    username: "admin",
    isAdmin: true,
    password: "M8n8s53489,",
    createdAt: Date.now(),
    displayName: "Administrador"
  },
  Juan: {
    username: "Juan",
    isAdmin: false,
    password: "j@9738gt",
    createdAt: Date.now(),
    displayName: "Juan"
  }
};

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

// Variável para controlar se devemos usar fallback local
let useLocalFallback = false;

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

// Inicializar e exportar o Firestore
export const db = getFirestore(app);

// Inicializar o Storage
export const storage = getStorage(app);

// Habilitar persistência offline para o Firestore (para melhor experiência offline)
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db)
    .then(() => {
      console.log("Persistência offline habilitada com sucesso");
    })
    .catch((err) => {
      console.warn("Erro ao habilitar persistência:", err);
    });
}

// Inicializar e exportar o Auth
export const auth = getAuth(app);

// Configurar o provedor do Google
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Interface de usuário
export interface UserData {
  username: string;
  isAdmin: boolean;
  createdAt: number;
  lastLogin?: number;
  displayName?: string;
  photoURL?: string;
  email?: string;
}

// Função para salvar um usuário no Firestore
export const saveUserToFirestore = async (userData: UserData): Promise<boolean> => {
  try {
    // Cria/atualiza um documento no Firestore com o username como ID
    await setDoc(doc(db, "users", userData.username), {
      ...userData,
      lastUpdated: Date.now()
    });
    console.log(`Usuário ${userData.username} salvo no Firestore com sucesso.`);
    return true;
  } catch (error) {
    console.error(`Erro ao salvar usuário ${userData.username} no Firestore:`, error);
    return false;
  }
};

// Função para verificar se um usuário existe no Firestore
export const getUserFromFirestore = async (username: string): Promise<UserData | null> => {
  try {
    const userDoc = await getDoc(doc(db, "users", username));
    
    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    }
    
    return null;
  } catch (error) {
    console.error(`Erro ao buscar usuário ${username} do Firestore:`, error);
    return null;
  }
};

// Função para verificar credenciais de um usuário no Firestore
export const verifyUserCredentials = async (username: string, password: string): Promise<UserData | null> => {
  try {
    // Para admin
    if (username === "admin" && password === "M8n8s53489,") {
      // Verificar se o admin já existe no Firestore
      const existingUser = await getUserFromFirestore("admin");
      
      if (!existingUser) {
        // Criar o admin no Firestore se não existir
        const adminData: UserData = {
          username: "admin",
          isAdmin: true,
          displayName: "Administrador",
          createdAt: Date.now(),
          lastLogin: Date.now()
        };
        
        await saveUserToFirestore(adminData);
        return adminData;
      }
      
      // Atualizar o último login
      const updatedAdmin = {
        ...existingUser,
        lastLogin: Date.now()
      };
      
      await saveUserToFirestore(updatedAdmin);
      return updatedAdmin;
    }
    
    // Para Juan
    if (username === "Juan" && password === "j@9738gt") {
      // Verificar se Juan já existe no Firestore
      const existingUser = await getUserFromFirestore("Juan");
      
      if (!existingUser) {
        // Criar Juan no Firestore se não existir
        const juanData: UserData = {
          username: "Juan",
          isAdmin: false,
          displayName: "Juan",
          createdAt: Date.now(),
          lastLogin: Date.now()
        };
        
        await saveUserToFirestore(juanData);
        return juanData;
      }
      
      // Atualizar o último login
      const updatedJuan = {
        ...existingUser,
        lastLogin: Date.now()
      };
      
      await saveUserToFirestore(updatedJuan);
      return updatedJuan;
    }
    
    // Se não for admin nem Juan com a senha correta
    return null;
  } catch (error) {
    console.error("Erro ao verificar credenciais:", error);
    return null;
  }
};

// Função para inicializar usuários padrão (admin e Juan) no Firestore
export const initializeDefaultUsers = async (): Promise<{ success: boolean, error?: string }> => {
  try {
    // Admin
    const adminExists = await getUserFromFirestore("admin");
    if (!adminExists) {
      const adminData: UserData = {
        username: "admin",
        isAdmin: true,
        displayName: "Administrador",
        createdAt: Date.now()
      };
      
      await saveUserToFirestore(adminData);
      console.log("Usuário admin criado no Firestore");
    }
    
    // Juan
    const juanExists = await getUserFromFirestore("Juan");
    if (!juanExists) {
      const juanData: UserData = {
        username: "Juan",
        isAdmin: false,
        displayName: "Juan",
        createdAt: Date.now()
      };
      
      await saveUserToFirestore(juanData);
      console.log("Usuário Juan criado no Firestore");
    }
    
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao inicializar usuários padrão:", error);
    return { success: false, error: error.message };
  }
};

// Função para listar todos os usuários cadastrados no Firestore
export const getAllUsers = async (): Promise<UserData[]> => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef);
    const querySnapshot = await getDocs(q);
    
    const users: UserData[] = [];
    querySnapshot.forEach((doc) => {
      users.push(doc.data() as UserData);
    });
    
    return users;
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return [];
  }
};

// Função para fazer login com Google
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    
    // Obter informações do usuário
    const user = result.user;
    const { displayName, email, photoURL, uid } = user;

    // Username será baseado no email ou UID se email não disponível
    const username = email ? email.split('@')[0] : uid.substring(0, 8);
    
    try {
      // Verificar se o usuário já existe no Firestore
      const userDoc = await getDoc(doc(db, "users", username));
      
      let isAdmin = false;
      
      // Se o usuário não existir, crie-o
      if (!userDoc.exists()) {
        // Verificar se é o primeiro usuário (tornar admin)
        const usersSnapshot = await getDoc(doc(db, "system", "userCount"));
        const isFirstUser = !usersSnapshot.exists() || usersSnapshot.data()?.count === 0;
        
        isAdmin = isFirstUser;
        
        // Salvar dados do usuário
        const userData: UserData = {
          username,
          isAdmin,
          createdAt: Date.now(),
          lastLogin: Date.now(),
          displayName: displayName || username,
          photoURL: photoURL || '',
          email: email || ''
        };
        
        await setDoc(doc(db, "users", username), userData);
        
        // Atualizar contador de usuários
        await setDoc(doc(db, "system", "userCount"), {
          count: isFirstUser ? 1 : usersSnapshot.data()?.count + 1
        });
      } else {
        // Usuário existe, atualizar último login
        const userData = userDoc.data() as UserData;
        isAdmin = userData.isAdmin;
        
        await setDoc(doc(db, "users", username), {
          ...userData,
          lastLogin: Date.now(),
          // Atualizar foto e nome caso tenham mudado
          displayName: displayName || userData.displayName,
          photoURL: photoURL || userData.photoURL
        }, { merge: true });
      }
      
      return { 
        user, 
        userData: {
          username,
          isAdmin,
          displayName: displayName || username,
          photoURL: photoURL || '',
          email: email || '',
          createdAt: userDoc.exists() ? (userDoc.data() as UserData).createdAt : Date.now(),
          lastLogin: Date.now()
        }, 
        error: null 
      };
    } catch (firestoreError) {
      console.error('Erro no Firestore durante login com Google:', firestoreError);
      // Informar que estamos usando fallback
      useLocalFallback = true;
      
      return {
        user,
        userData: {
          username,
          isAdmin: false, // Por padrão não é admin
          displayName: displayName || username,
          photoURL: photoURL || '',
          email: email || '',
          createdAt: Date.now(),
          lastLogin: Date.now()
        },
        error: null
      };
    }
  } catch (error: any) {
    console.error('Erro no login com Google:', error);
    return { user: null, userData: null, error: error.message };
  }
};

// Função para verificar resultado do redirecionamento do Google (usar em useEffect)
export const checkRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (!result) return { user: null, userData: null, error: null };
    
    // Resto do processo igual ao loginWithGoogle
    const user = result.user;
    const { displayName, email, photoURL, uid } = user;
    const username = email ? email.split('@')[0] : uid.substring(0, 8);
    
    try {
      const userDoc = await getDoc(doc(db, "users", username));
      let isAdmin = false;
      
      if (!userDoc.exists()) {
        const usersSnapshot = await getDoc(doc(db, "system", "userCount"));
        const isFirstUser = !usersSnapshot.exists() || usersSnapshot.data()?.count === 0;
        
        isAdmin = isFirstUser;
        
        const userData: UserData = {
          username,
          isAdmin,
          createdAt: Date.now(),
          lastLogin: Date.now(),
          displayName: displayName || username,
          photoURL: photoURL || '',
          email: email || ''
        };
        
        await setDoc(doc(db, "users", username), userData);
        
        await setDoc(doc(db, "system", "userCount"), {
          count: isFirstUser ? 1 : usersSnapshot.data()?.count + 1
        });
      } else {
        const userData = userDoc.data() as UserData;
        isAdmin = userData.isAdmin;
        
        await setDoc(doc(db, "users", username), {
          ...userData,
          lastLogin: Date.now(),
          displayName: displayName || userData.displayName,
          photoURL: photoURL || userData.photoURL
        }, { merge: true });
      }
      
      return { 
        user, 
        userData: {
          username,
          isAdmin,
          displayName: displayName || username,
          photoURL: photoURL || '',
          email: email || '',
          createdAt: userDoc.exists() ? (userDoc.data() as UserData).createdAt : Date.now(),
          lastLogin: Date.now()
        }, 
        error: null 
      };
    } catch (firestoreError) {
      console.error('Erro no Firestore durante redirecionamento:', firestoreError);
      // Informar que estamos usando fallback
      useLocalFallback = true;
      
      return {
        user,
        userData: {
          username,
          isAdmin: false, // Por padrão não é admin
          displayName: displayName || username,
          photoURL: photoURL || '',
          email: email || '',
          createdAt: Date.now(),
          lastLogin: Date.now()
        },
        error: null
      };
    }
  } catch (error: any) {
    console.error('Erro durante redirecionamento:', error);
    return { user: null, userData: null, error: error.message };
  }
};

// Função para criar um usuário diretamente no Firestore (sem Auth)
export const createFirestoreUser = async (username: string, isAdmin: boolean, displayName?: string) => {
  try {
    if (useLocalFallback) {
      console.log(`Usando fallback local para ${username} (createFirestoreUser)`);
      if (username === 'admin' || username === 'Juan') {
        return { success: true, error: null };
      }
      return { success: false, error: "Apenas admin e Juan são suportados no modo fallback" };
    }
    
    try {
      // Verificar se o usuário já existe
      const userDoc = await getDoc(doc(db, "users", username));
      
      if (!userDoc.exists()) {
        // Criar o usuário no Firestore
        const userData: UserData = {
          username,
          isAdmin,
          createdAt: Date.now(),
          lastLogin: Date.now(),
          displayName: displayName || username
        };
        
        await setDoc(doc(db, "users", username), userData);
        console.log(`Usuário ${username} criado com sucesso no Firestore.`);
        return { success: true, error: null };
      } else {
        console.log(`Usuário ${username} já existe no Firestore.`);
        return { success: true, error: null }; // Não é um erro, apenas já existe
      }
    } catch (firestoreError) {
      console.error(`Erro ao acessar Firestore para ${username}:`, firestoreError);
      
      // Ativar modo fallback
      useLocalFallback = true;
      
      // Se for um dos usuários locais, considera como sucesso
      if (username === 'admin' || username === 'Juan') {
        return { success: true, error: null };
      }
      
      return { success: false, error: "Erro ao acessar Firestore e usuário não é suportado no fallback" };
    }
  } catch (error: any) {
    console.error(`Erro ao criar usuário ${username}:`, error);
    return { success: false, error: error.message };
  }
};

// Função modificada para criar usuário com ou sem Auth
export const registerUser = async (username: string, password: string, isAdmin: boolean = false) => {
  try {
    if (useLocalFallback) {
      console.log(`Usando fallback local para ${username} (registerUser)`);
      // No modo fallback, permitir apenas admin e Juan
      if (username === 'admin' || username === 'Juan') {
        const localUser = LOCAL_USERS[username as keyof typeof LOCAL_USERS];
        return { 
          user: null, 
          userData: {
            ...localUser,
            lastLogin: Date.now()
          }, 
          error: null 
        };
      }
      return { user: null, error: "Apenas admin e Juan são suportados no modo fallback" };
    }
    
    try {
      // Verificar se o username já existe no Firestore
      const userDoc = await getDoc(doc(db, "users", username));
      if (userDoc.exists()) {
        return { user: null, error: "Nome de usuário já existe" };
      }

      // Criar email usando o username (necessário para Firebase Auth)
      const email = `${username}@controle-nvr.local`;
      
      // Objeto para armazenar o resultado da autenticação
      let authResult = null;
      
      try {
        // Tentar criar o usuário no Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        authResult = userCredential.user;
      } catch (authError: any) {
        console.warn(`Não foi possível criar o usuário ${username} no Firebase Auth. Erro:`, authError.message);
        // Continuar mesmo se o Auth falhar - só criaremos no Firestore
      }
      
      // Armazenar dados adicionais no Firestore
      const userData: UserData = {
        username,
        isAdmin,
        createdAt: Date.now(),
        displayName: username
      };
      
      await setDoc(doc(db, "users", username), userData);
      console.log(`Usuário ${username} salvo no Firestore com sucesso.`);
      
      return { user: authResult, userData, error: null };
    } catch (firestoreError) {
      console.error(`Erro ao acessar Firestore em registerUser para ${username}:`, firestoreError);
      
      // Ativar modo fallback
      useLocalFallback = true;
      
      // No modo fallback, permitir apenas admin e Juan
      if (username === 'admin' || username === 'Juan') {
        const localUser = LOCAL_USERS[username as keyof typeof LOCAL_USERS];
        return { 
          user: null, 
          userData: {
            ...localUser,
            lastLogin: Date.now()
          }, 
          error: null 
        };
      }
      
      return { user: null, error: "Erro ao acessar Firestore e usuário não é suportado no fallback" };
    }
  } catch (error: any) {
    console.error(`Erro completo ao registrar ${username}:`, error);
    return { user: null, error: error.message };
  }
};

// Função para fazer login com username
export const loginUser = async (username: string, password: string) => {
  console.log(`Tentando login para ${username}...`);
  
  try {
    // Verificar se estamos no modo fallback
    if (useLocalFallback) {
      console.log(`Usando fallback local para login de ${username}`);
      // Verificar se é um dos usuários locais
      if (username === 'admin' && password === 'M8n8s53489,') {
        return { 
          user: null, 
          userData: {
            ...LOCAL_USERS.admin,
            lastLogin: Date.now()
          }, 
          error: null 
        };
      } else if (username === 'Juan' && password === 'j@9738gt') {
        return { 
          user: null, 
          userData: {
            ...LOCAL_USERS.Juan,
            lastLogin: Date.now()
          }, 
          error: null 
        };
      }
      return { user: null, userData: null, error: "Credenciais inválidas" };
    }
    
    try {
      // Verificar se o usuário existe
      const userDoc = await getDoc(doc(db, "users", username));
      console.log(`Resultado da consulta para ${username}:`, userDoc.exists() ? "Encontrado" : "Não encontrado");
      
      if (!userDoc.exists()) {
        // Verificar se é um dos usuários padrão
        if (username === 'admin' && password === 'M8n8s53489,') {
          // Criar admin já que não existe
          await createFirestoreUser('admin', true, 'Administrador');
          return { 
            user: null, 
            userData: {
              username: 'admin',
              isAdmin: true,
              createdAt: Date.now(),
              lastLogin: Date.now(),
              displayName: 'Administrador'
            }, 
            error: null 
          };
        } else if (username === 'Juan' && password === 'j@9738gt') {
          // Criar Juan já que não existe
          await createFirestoreUser('Juan', false, 'Juan');
          return { 
            user: null, 
            userData: {
              username: 'Juan',
              isAdmin: false,
              createdAt: Date.now(),
              lastLogin: Date.now(),
              displayName: 'Juan'
            }, 
            error: null 
          };
        }
        
        return { user: null, userData: null, error: "Usuário não encontrado" };
      }
      
      const userData = userDoc.data() as UserData;
      
      // Criar email usando o username
      const email = `${username}@controle-nvr.local`;
      
      try {
        // Fazer login no Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Atualizar último login
        await setDoc(doc(db, "users", username), {
          ...userData,
          lastLogin: Date.now()
        }, { merge: true });
        
        return { user: userCredential.user, userData, error: null };
      } catch (authError: any) {
        console.warn(`Erro no Auth para ${username}:`, authError.message);
        
        // Verificar se a senha está correta (apenas para admin e Juan com senhas predefinidas)
        if (username === 'admin' && password === 'M8n8s53489,') {
          // Autenticar manualmente para admin
          await setDoc(doc(db, "users", username), {
            ...userData,
            lastLogin: Date.now()
          }, { merge: true });
          return { user: null, userData, error: null };
        } else if (username === 'Juan' && password === 'j@9738gt') {
          // Autenticar manualmente para Juan
          await setDoc(doc(db, "users", username), {
            ...userData,
            lastLogin: Date.now()
          }, { merge: true });
          return { user: null, userData, error: null };
        }
        
        return { user: null, userData: null, error: "Senha incorreta" };
      }
    } catch (firestoreError) {
      console.error(`Erro ao acessar Firestore para login de ${username}:`, firestoreError);
      
      // Ativar modo fallback
      useLocalFallback = true;
      
      // Verificar se é um dos usuários locais
      if (username === 'admin' && password === 'M8n8s53489,') {
        return { 
          user: null, 
          userData: {
            ...LOCAL_USERS.admin,
            lastLogin: Date.now()
          }, 
          error: null 
        };
      } else if (username === 'Juan' && password === 'j@9738gt') {
        return { 
          user: null, 
          userData: {
            ...LOCAL_USERS.Juan,
            lastLogin: Date.now()
          }, 
          error: null 
        };
      }
      
      return { user: null, userData: null, error: "Erro ao acessar Firestore e credenciais não correspondem a usuários do fallback" };
    }
  } catch (error: any) {
    console.error(`Erro completo no login de ${username}:`, error);
    return { user: null, userData: null, error: error.message };
  }
};

// Verificar se o Firestore está acessível
export const checkFirestoreAccess = async () => {
  try {
    const testDoc = await getDoc(doc(db, "system", "test"));
    console.log("Firestore está acessível:", testDoc.exists() ? "Documento test existe" : "Documento test não existe");
    return true;
  } catch (error) {
    console.error("Firestore não está acessível:", error);
    useLocalFallback = true;
    return false;
  }
};

// Inicializar verificação de acesso ao Firestore
checkFirestoreAccess();

export default app;