import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart2, 
  HardDrive, 
  Sun,
  Moon,
  Home,
} from 'lucide-react';
import { useNVR } from '@/context/NVRContext';
import { Badge } from '@/components/ui/badge';
import { database } from '../firebase';
import { ref, onValue } from 'firebase/database';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { nvrs, getTotalStats, getSlotStats } = useNVR();
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [appName, setAppName] = useState<string>('BR Marinas');
  
  // Estatísticas rápidas
  const stats = getTotalStats();
  const slotStats = getSlotStats();
  
  // NVRs em estado crítico
  const criticalNVRs = nvrs.filter(nvr => {
    const hasActiveHDs = nvr.slots.some(slot => slot.status === 'active');
    const smallHDs = nvr.slots.filter(slot => 
      slot.status === 'active' && 
      slot.hdSize !== undefined && 
      slot.hdSize < 12
    ).length;
    
    const isExceptionModel = nvr.model === "MHDX 3116";
    
    if (isExceptionModel) {
      return !hasActiveHDs;
    } else {
      return smallHDs > 0 || !hasActiveHDs;
    }
  });
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  // Aplicar tema escuro
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  
  // Carregar preferência do usuário
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark');
    } else {
      // Verificar preferência do sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
    }
  }, []);
  
  // Carregar configurações do app (apenas nome da aplicação)
  useEffect(() => {
    try {
      // Carregar nome da aplicação do localStorage
      const localAppName = window.localStorage.getItem('app_name');
      const localTitle = window.localStorage.getItem('app_title');
      
      if (localAppName) setAppName(localAppName);
      if (localTitle && localTitle.length > 0) document.title = localTitle;
      
      // Buscar configurações do Firebase (exceto logo)
      const configRef = ref(database, 'config/app');
      const unsubscribe = onValue(configRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          
          // Atualizar nome da aplicação
          if (data.appName) {
            setAppName(data.appName);
            window.localStorage.setItem('app_name', data.appName);
          }
          
          // Atualizar título da página se definido
          if (data.title && data.title.length > 0) {
            document.title = data.title;
            window.localStorage.setItem('app_title', data.title);
          }
        }
      }, (error) => {
        console.error("Erro ao monitorar configurações:", error);
      });
      
      // Cleanup 
      return () => unsubscribe();
    } catch (error) {
      console.error("Erro ao inicializar configurações:", error);
    }
  }, []);
  
  const toggleTheme = () => {
    const newState = !darkMode;
    setDarkMode(newState);
    localStorage.setItem('theme', newState ? 'dark' : 'light');
  };

  return (
    <div className={`flex h-screen w-full ${darkMode ? 'dark' : ''}`}>
      {/* Barra lateral moderna e elegante */}
      <aside 
        className={`
          transition-all duration-300 ease-in-out 
          w-72
          bg-gradient-to-b from-sidebar-primary/20 to-sidebar
          border-r border-sidebar-border/50
          flex flex-col shadow-xl relative
          md:static fixed z-50 h-full
        `}
      >
        {/* Cabeçalho da sidebar */}
        <div className="py-8 border-b border-sidebar-border/50 bg-sidebar-primary/10 relative">
          <div className="flex items-center justify-center">
            <div className="flex flex-col items-center text-center">
              <div className="bg-sidebar-primary/70 text-sidebar-primary-foreground p-3 rounded-full w-16 h-16 flex items-center justify-center mb-3 shadow-md">
                <span className="text-3xl" role="img" aria-label="Navegação">🧭</span>
              </div>
              <h1 className="text-2xl font-bold text-sidebar-foreground drop-shadow-sm">{appName}</h1>
            </div>
          </div>
        </div>
        
        {/* Menu de navegação */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 mt-4">
          <span className="px-3 text-xs font-bold text-sidebar-foreground/60 uppercase mb-4 block tracking-wider">
            Principal
          </span>
          <ul className="space-y-4">
            <li>
              <Link
                to="/"
                className={`
                  flex items-center justify-between
                  px-5 py-3.5 rounded-xl
                  ${isActive('/') 
                    ? 'bg-primary/15 text-primary font-medium shadow-sm' 
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/15 hover:text-sidebar-primary'}
                  transition-all duration-200 ease-out
                  hover:translate-x-1
                `}
              >
                <div className="flex items-center">
                  <Home className={`w-5 h-5 mr-3 ${isActive('/') ? 'text-primary' : ''}`} />
                  <span>NVRs</span>
                </div>
                <Badge variant="outline" className="bg-primary/10 text-primary dark:bg-primary/15 shadow-sm">
                  {nvrs.length}
                </Badge>
              </Link>
            </li>
            <li>
              <Link
                to="/relatorios"
                className={`
                  flex items-center justify-between 
                  px-5 py-3.5 rounded-xl
                  ${isActive('/relatorios') 
                    ? 'bg-primary/15 text-primary font-medium shadow-sm' 
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/15 hover:text-sidebar-primary'}
                  transition-all duration-200 ease-out
                  hover:translate-x-1
                `}
              >
                <div className="flex items-center">
                  <BarChart2 className={`w-5 h-5 mr-3 ${isActive('/relatorios') ? 'text-primary' : ''}`} />
                  <span>Relatórios</span>
                </div>
              </Link>
            </li>
            <li>
              <Link
                to="/evolucao-hds"
                className={`
                  flex items-center justify-between 
                  px-5 py-3.5 rounded-xl
                  ${isActive('/evolucao-hds') 
                    ? 'bg-primary/15 text-primary font-medium shadow-sm' 
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/15 hover:text-sidebar-primary'}
                  transition-all duration-200 ease-out
                  hover:translate-x-1
                `}
              >
                <div className="flex items-center">
                  <HardDrive className={`w-5 h-5 mr-3 ${isActive('/evolucao-hds') ? 'text-primary' : ''}`} />
                  <span>Evolução HDs</span>
                </div>
                {criticalNVRs.length > 0 && (
                  <Badge className="bg-destructive/15 text-destructive font-medium dark:bg-destructive/20 shadow-sm">
                    {criticalNVRs.length}
                  </Badge>
                )}
              </Link>
            </li>
          </ul>
        </nav>
        
        {/* Botão de alternância de tema */}
        <div className="p-5 border-t border-sidebar-border/50 bg-sidebar-primary/5">
          <button 
            onClick={toggleTheme}
            className="flex items-center justify-center w-full p-3.5 rounded-xl hover:bg-sidebar-accent/15 text-sidebar-foreground transition-all duration-200 ease-out hover:shadow-sm"
            title={darkMode ? "Mudar para tema claro" : "Mudar para tema escuro"}
          >
            {darkMode ? (
              <div className="flex items-center">
                <Sun className="w-5 h-5 mr-3 text-amber-400" />
                <span>Tema Claro</span>
              </div>
            ) : (
              <div className="flex items-center">
                <Moon className="w-5 h-5 mr-3 text-indigo-400" />
                <span>Tema Escuro</span>
              </div>
            )}
          </button>
        </div>
      </aside>
      
      <main className="flex-1 overflow-y-auto w-full">
        {children}
      </main>
    </div>
  );
};

export default Layout;
