const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen">
      {/* ... existing sidebar code ... */}

      {/* Conteúdo principal */}
      <main className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900">
        {children}
      </main>
    </div>
  );
}; 