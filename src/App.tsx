import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import { NVRProvider } from "./context/NVRContext";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import NVRList from "./pages/NVRList";
import Reports from "./pages/Reports";
import HDEvolution from "./pages/HDEvolution";
import ReportAnalyzer from "./pages/ReportAnalyzer";
import Configuracoes from "./pages/Configuracoes";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import VerificarFirestore from './VerificarFirestore';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <NVRProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Router>
            <Routes>
              <Route path="/verificar-firestore" element={<VerificarFirestore />} />
              <Route path="/login" element={<Login />} />
              
              {/* Rotas protegidas */}
              <Route path="/" element={<ProtectedRoute><Layout><NVRList /></Layout></ProtectedRoute>} />
              <Route path="/relatorios" element={<ProtectedRoute><Layout><Reports /></Layout></ProtectedRoute>} />
              <Route path="/evolucao-hds" element={<ProtectedRoute><Layout><HDEvolution /></Layout></ProtectedRoute>} />
              <Route path="/analisador-relatorios" element={<ProtectedRoute><Layout><ReportAnalyzer /></Layout></ProtectedRoute>} />
              <Route path="/configuracoes" element={<ProtectedRoute><Layout><Configuracoes /></Layout></ProtectedRoute>} />
              
              {/* Rota 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </TooltipProvider>
      </NVRProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
