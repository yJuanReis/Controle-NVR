import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Database, 
  BarChart2, 
  HardDrive, 
  TrendingUp, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle, 
  Sun,
  Moon,
  Search,
  Home,
  Server,
  Settings
} from 'lucide-react';
import { useNVR } from '@/context/NVRContext';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { database } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { Button } from '@/components/ui/button';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { nvrs, getTotalStats, getSlotStats } = useNVR();
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
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
    const savedCollapsed = localStorage.getItem('sidebarCollapsed');
    const savedTheme = localStorage.getItem('theme');
    
    if (savedCollapsed) {
      setCollapsed(savedCollapsed === 'true');
    }
    
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
  
  // Salvar preferências
  const toggleCollapse = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', newState.toString());
  };
  
  const toggleTheme = () => {
    const newState = !darkMode;
    setDarkMode(newState);
    localStorage.setItem('theme', newState ? 'dark' : 'light');
  };

  return (
    <div className={`flex h-screen ${darkMode ? 'dark' : ''}`}>
      {/* Barra lateral moderna */}
      <aside 
        className={`
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-20' : 'w-72'} 
          bg-sidebar border-r border-sidebar-border
          flex flex-col shadow-md relative
          md:translate-x-0 transform
          ${collapsed ? '-translate-x-20' : '-translate-x-72'}
          md:static fixed z-50 h-full
        `}
      >
        {/* Botão de recolher */}
        <button 
          onClick={toggleCollapse}
          className={`
            absolute top-1/2 -right-3 z-10
            flex items-center justify-center
            w-6 h-16 rounded-r-md
            bg-sidebar-primary text-sidebar-primary-foreground
            shadow-md hover:bg-sidebar-primary/80
            transition-all duration-300
            md:flex hidden
          `}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? 
            <ChevronRight className="w-4 h-4" /> : 
            <ChevronLeft className="w-4 h-4" />
          }
        </button>
        
        {/* Cabeçalho da sidebar */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center">
            {collapsed ? (
              <div className="flex justify-center items-center bg-sidebar-primary text-sidebar-primary-foreground p-2 rounded-md">
                <span className="text-3xl" role="img" aria-label="Navegação">🧭</span>
              </div>
            ) : (
              <div className="flex items-center">
                <span className="text-4xl mr-3" role="img" aria-label="Navegação">🧭</span>
                <h1 className="text-2xl font-bold text-sidebar-foreground">{appName}</h1>
              </div>
            )}
          </div>
        </div>
        
        {/* Pesquisa */}
        {!collapsed && (
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 py-2 bg-sidebar-accent border-sidebar-border focus:ring-sidebar-primary focus:border-sidebar-primary text-sidebar-foreground"
              />
            </div>
          </div>
        )}
        
        {/* Menu de navegação */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <span className={`px-3 text-xs font-semibold text-muted-foreground uppercase mb-2 ${collapsed ? 'hidden' : 'block'}`}>
            Principal
          </span>
          <ul className="space-y-2">
            <li>
              <Link
                to="/"
                className={`
                  flex items-center ${collapsed ? 'justify-center' : 'justify-between'} 
                  px-4 py-3 rounded-md
                  ${isActive('/') 
                    ? 'border-l-4 border-primary text-primary font-medium' 
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/10 hover:text-sidebar-primary'}
                `}
              >
                <div className="flex items-center">
                  <Home className={`${collapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'} ${collapsed && isActive('/') ? 'text-primary' : ''}`} />
                  {!collapsed && <span>NVRs</span>}
                </div>
                {!collapsed && (
                  <Badge variant="outline" className="bg-sidebar-accent text-sidebar-foreground dark:bg-transparent dark:text-white">
                    {nvrs.length}
                  </Badge>
                )}
              </Link>
            </li>
            <li>
              <Link
                to="/relatorios"
                className={`
                  flex items-center ${collapsed ? 'justify-center' : 'justify-between'} 
                  px-4 py-3 rounded-md
                  ${isActive('/relatorios') 
                    ? 'border-l-4 border-primary text-primary font-medium' 
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/10 hover:text-sidebar-primary'}
                `}
              >
                <div className="flex items-center">
                  <BarChart2 className={`${collapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'} ${collapsed && isActive('/relatorios') ? 'text-primary' : ''}`} />
                  {!collapsed && <span>Relatórios</span>}
                </div>
              </Link>
            </li>
            <li>
              <Link
                to="/evolucao-hds"
                className={`
                  flex items-center ${collapsed ? 'justify-center' : 'justify-between'} 
                  px-4 py-3 rounded-md
                  ${isActive('/evolucao-hds') 
                    ? 'border-l-4 border-primary text-primary font-medium' 
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/10 hover:text-sidebar-primary'}
                `}
              >
                <div className="flex items-center">
                  <HardDrive className={`${collapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'} ${collapsed && isActive('/evolucao-hds') ? 'text-primary' : ''}`} />
                  {!collapsed && <span>Evolução HDs</span>}
                </div>
                {!collapsed && criticalNVRs.length > 0 && (
                  <Badge className="bg-destructive/20 text-destructive font-bold dark:bg-transparent dark:border dark:border-destructive dark:text-white">
                    {criticalNVRs.length}
                  </Badge>
                )}
              </Link>
            </li>
            <li>
              <Link
                to="/configuracoes"
                className={`
                  flex items-center ${collapsed ? 'justify-center' : 'justify-between'} 
                  px-4 py-3 rounded-md
                  ${isActive('/configuracoes') 
                    ? 'border-l-4 border-primary text-primary font-medium' 
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/10 hover:text-sidebar-primary'}
                `}
              >
                <div className="flex items-center">
                  <Settings className={`${collapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'} ${collapsed && isActive('/configuracoes') ? 'text-primary' : ''}`} />
                  {!collapsed && <span>Configurações</span>}
                </div>
              </Link>
            </li>
          </ul>
        </nav>
        
        {/* Botão de alternância de tema */}
        <div className="p-4 border-t border-sidebar-border">
          <button 
            onClick={toggleTheme}
            className="flex items-center justify-center w-full p-2 rounded-md hover:bg-sidebar-accent text-sidebar-foreground"
            title={darkMode ? "Mudar para tema claro" : "Mudar para tema escuro"}
          >
            {darkMode ? (
              <div className="flex items-center">
                <Sun className="w-5 h-5 mr-2" />
                {!collapsed && <span>Tema Claro</span>}
              </div>
            ) : (
              <div className="flex items-center">
                <Moon className="w-5 h-5 mr-2" />
                {!collapsed && <span>Tema Escuro</span>}
              </div>
            )}
          </button>
        </div>
      </aside>
      
      <main className="flex-1 overflow-y-auto w-full md:w-auto">
        {/* Botão de menu móvel */}
        <button
          onClick={toggleCollapse}
          className={`
            md:hidden fixed top-4 left-4 z-40
            flex items-center justify-center
            w-10 h-10 rounded-md
            bg-sidebar-primary text-sidebar-primary-foreground
            shadow-md hover:bg-sidebar-primary/80
          `}
        >
          {collapsed ? 
            <ChevronRight className="w-6 h-6" /> : 
            <ChevronLeft className="w-6 h-6" />
          }
        </button>
        
        {children}
      </main>
    </div>
  );
};

export default Layout;
