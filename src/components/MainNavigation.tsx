import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  HardDrive, 
  FileText, 
  Code,
  BarChart 
} from 'lucide-react';

interface NavigationItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

export default function MainNavigation() {
  const navItems: NavigationItem[] = [
    {
      name: 'Dashboard',
      path: '/',
      icon: <LayoutDashboard className="w-5 h-5" />
    },
    {
      name: 'Evolução de HDs',
      path: '/evolucao-hds',
      icon: <HardDrive className="w-5 h-5" />
    },
    {
      name: 'Visualizador de Relatórios',
      path: '/relatorios',
      icon: <FileText className="w-5 h-5" />
    },
    {
      name: 'Analisador de Relatórios',
      path: '/analisador-relatorios',
      icon: <BarChart className="w-5 h-5" />
    }
  ];

  return (
    <nav className="mb-6">
      <div className="flex space-x-4 overflow-x-auto pb-2 md:pb-0">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${
                isActive
                  ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400'
              }`
            }
          >
            {item.icon}
            <span className="ml-2">{item.name}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
} 