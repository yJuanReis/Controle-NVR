import { useEffect } from 'react';

const DbInitializer = () => {
  useEffect(() => {
    console.log('Inicialização do aplicativo concluída.');
  }, []);

  // Este componente não renderiza nada visível
  return null;
};

export default DbInitializer; 