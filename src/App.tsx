import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import { NVRProvider } from "./context/NVRContext";
import DbInitializer from "./components/DbInitializer";
import NVRList from "./pages/NVRList";
import Reports from "./pages/Reports";
import HDEvolution from "./pages/HDEvolution";
import ReportAnalyzer from "./pages/ReportAnalyzer";
import NotFound from "./pages/NotFound";
import VerificarDatabase from './VerificarDatabase';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <NVRProvider>
      <TooltipProvider>
        <DbInitializer />
        <Toaster />
        <Sonner />
        <Router>
          <Routes>
            <Route path="/verificar-firestore" element={<VerificarDatabase />} />
            
            {/* Rotas principais */}
            <Route path="/" element={<Layout><NVRList /></Layout>} />
            <Route path="/relatorios" element={<Layout><Reports /></Layout>} />
            <Route path="/evolucao-hds" element={<Layout><HDEvolution /></Layout>} />
            <Route path="/analisador-relatorios" element={<Layout><ReportAnalyzer /></Layout>} />
            
            {/* Redirecionar /login para a página inicial */}
            <Route path="/login" element={<Navigate to="/" replace />} />
            
            {/* Rota 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </TooltipProvider>
    </NVRProvider>
  </QueryClientProvider>
);

export default App;
