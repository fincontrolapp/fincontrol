import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import CashFlowPage from "@/pages/CashFlowPage";
import InvoicesPage from "@/pages/InvoicesPage";
import InventoryPage from "@/pages/InventoryPage";
import DailyCashPage from "@/pages/DailyCashPage";
import ClientsPage from "@/pages/ClientsPage";
import AuthPage from "@/pages/AuthPage";
import AIChatPanel from "@/components/AIChatPanel";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Fin<span className="text-accent">Control</span>
          </h1>
          <p className="text-muted-foreground mt-2">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
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
      <AIChatPanel />
    </AppLayout>
  );
}

function AuthRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <AuthPage />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<AuthRoute />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
