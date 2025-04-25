import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import { NVRProvider } from "./context/NVRContext";
import NVRList from "./pages/NVRList";
import Reports from "./pages/Reports";
import HDEvolution from "./pages/HDEvolution";
import ReportAnalyzer from "./pages/ReportAnalyzer";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <NVRProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename="/Controle-NVR">
          <Layout>
            <Routes>
              <Route path="/" element={<NVRList />} />
              <Route path="/relatorios" element={<Reports />} />
              <Route path="/evolucao-hds" element={<HDEvolution />} />
              <Route path="/analisador-relatorios" element={<ReportAnalyzer />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </NVRProvider>
  </QueryClientProvider>
);

export default App;
