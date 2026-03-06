import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import CashFlowPage from "@/pages/CashFlowPage";
import InvoicesPage from "@/pages/InvoicesPage";
import InventoryPage from "@/pages/InventoryPage";
import DailyCashPage from "@/pages/DailyCashPage";
import ClientsPage from "@/pages/ClientsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/fluxo-caixa" element={<CashFlowPage />} />
            <Route path="/notas" element={<InvoicesPage />} />
            <Route path="/estoque" element={<InventoryPage />} />
            <Route path="/caixa-diario" element={<DailyCashPage />} />
            <Route path="/clientes" element={<ClientsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
