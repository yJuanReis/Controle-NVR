import { ReactNode } from 'react';

// Este é um componente temporário para resolver o erro do Tailwind CSS
// Será removido posteriormente

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  return <>{children}</>;
};

export default ProtectedRoute; 