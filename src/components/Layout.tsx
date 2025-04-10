
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Database, BarChart2, HardDrive } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Barra lateral */}
      <aside className="w-64 bg-white border-r border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">Sistema NVR</h1>
        </div>
        <nav className="py-4">
          <ul className="space-y-1">
            <li>
              <Link
                to="/"
                className={`flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 ${
                  isActive('/') ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-500' : ''
                }`}
              >
                <Database className="w-5 h-5 mr-3" />
                <span>NVRs</span>
              </Link>
            </li>
            <li>
              <Link
                to="/relatorios"
                className={`flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 ${
                  isActive('/relatorios') ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-500' : ''
                }`}
              >
                <BarChart2 className="w-5 h-5 mr-3" />
                <span>Relatórios</span>
              </Link>
            </li>
            <li>
              <Link
                to="/evolucao-hds"
                className={`flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 ${
                  isActive('/evolucao-hds') ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-500' : ''
                }`}
              >
                <HardDrive className="w-5 h-5 mr-3" />
                <span>Evolução HDs</span>
              </Link>
            </li>
          </ul>
        </nav>
      </aside>
      
      {/* Conteúdo principal */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {children}
      </main>
    </div>
  );
};

export default Layout;
