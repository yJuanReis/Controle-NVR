import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  HardDrive, 
  FileText, 
  Settings, 
  Code 
} from 'lucide-react';

interface NavigationItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

export default function Navigation() {
  const location = useLocation();
  
  const navItems: NavigationItem[] = [
    {
      name: 'Dashboard',
      path: '/',
      icon: <LayoutDashboard className="w-5 h-5" />
    },
    {
      name: 'Visualizador de Relatórios',
      path: '/report-viewer',
      icon: <FileText className="w-5 h-5" />
    },
    {
      name: 'Teste de Parsers',
      path: '/parser-test',
      icon: <Code className="w-5 h-5" />
    },
  ];

  return (
    <nav className="mb-6 bg-white dark:bg-gray-950 shadow">
      <div className="container mx-auto">
        <div className="flex space-x-4 overflow-x-auto py-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  isActive
                    ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {item.icon}
                <span className="ml-2">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
} 