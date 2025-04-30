import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { toast } from '@/components/ui/use-toast';

// Definição dos usuários fixos
const USERS = {
  admin: {
    username: "admin",
    password: "M8n8s53489,",
    isAdmin: true,
    displayName: "Administrador"
  },
  juan: {
    username: "Juan",
    password: "j@9738gt",
    isAdmin: false,
    displayName: "Juan"
  }
};

// Interface simplificada para usuário
interface UserData {
  id: string;
  username: string;
  isAdmin: boolean;
  displayName: string;
  lastLogin?: number;
}

interface AuthContextType {
  currentUser: UserData | null;
  loading: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Verificar se há um usuário salvo no localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser) as UserData;
        setCurrentUser(parsedUser);
        setIsAdmin(parsedUser.isAdmin);
        console.log("Usuário restaurado do localStorage:", parsedUser.username);
      } catch (e) {
        console.error("Erro ao restaurar usuário:", e);
        localStorage.removeItem('currentUser');
      }
    }
    setLoading(false);
  }, []);

  // Função de login simplificada
  const login = async (username: string, password: string) => {
    console.log(`Tentando login para ${username}...`);
    
    // Usuário admin
    if (username.toLowerCase() === "admin" && password === USERS.admin.password) {
      const userData: UserData = {
        id: '1',
        username: "admin",
        isAdmin: true,
        displayName: "Administrador",
        lastLogin: Date.now()
      };
      
      setCurrentUser(userData);
      setIsAdmin(true);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      
      toast({
        title: "Login bem-sucedido",
        description: "Você foi autenticado como Administrador.",
      });
      
      return { success: true };
    }
    
    // Usuário Juan
    if (username.toLowerCase() === "juan" && password === USERS.juan.password) {
      const userData: UserData = {
        id: '2',
        username: "Juan",
        isAdmin: false,
        displayName: "Juan",
        lastLogin: Date.now()
      };
      
      setCurrentUser(userData);
      setIsAdmin(false);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      
      toast({
        title: "Login bem-sucedido",
        description: "Você foi autenticado como Usuário.",
      });
      
      return { success: true };
    }
    
    // Se não for nenhum usuário conhecido
    toast({
      title: "Erro ao fazer login",
      description: "Usuário ou senha incorretos.",
      variant: "destructive"
    });
    
    return { success: false, error: "Usuário ou senha incorretos" };
  };

  // Função de logout simplificada
  const logout = () => {
    setCurrentUser(null);
    setIsAdmin(false);
    localStorage.removeItem('currentUser');
    
    toast({
      title: "Logout realizado",
      description: "Você saiu do sistema com sucesso.",
    });
  };

  const value = {
    currentUser,
    loading,
    isAdmin,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 