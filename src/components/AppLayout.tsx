import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, ArrowLeftRight, FileText, Package, Wallet, Users,
  ChevronLeft, ChevronRight, LogOut, MessageSquare, Settings, HelpCircle,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/fluxo-caixa", label: "Fluxo de Caixa", icon: ArrowLeftRight },
  { to: "/notas", label: "Notas Fiscais", icon: FileText },
  { to: "/estoque", label: "Estoque", icon: Package },
  { to: "/caixa-diario", label: "Caixa Diário", icon: Wallet },
  { to: "/clientes", label: "Clientes", icon: Users },
];

const secondaryItems = [
  { to: "/assistente", label: "Assistente IA", icon: MessageSquare },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
  { to: "/ajuda", label: "Ajuda", icon: HelpCircle },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  const renderNavItem = (item: { to: string; label: string; icon: any }) => {
    const isActive = location.pathname === item.to;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? "bg-sidebar-accent text-sidebar-primary"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        }`}
      >
        <item.icon size={20} />
        {!collapsed && <span>{item.label}</span>}
      </NavLink>
    );
  };

  return (
    <div className="flex min-h-screen">
      <aside className={`${collapsed ? "w-16" : "w-60"} bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 shrink-0`}>
        <div className="flex items-center justify-between px-4 py-5 border-b border-sidebar-border">
          {!collapsed && (
            <h1 className="font-heading text-lg font-bold text-sidebar-primary-foreground tracking-tight">
              Fin<span className="text-sidebar-primary">Control</span>
            </h1>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="text-sidebar-foreground hover:text-sidebar-primary-foreground transition-colors p-1">
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2">
          {!collapsed && <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40 px-3 mb-2">Principal</p>}
          {navItems.map(renderNavItem)}

          <div className="my-3 border-t border-sidebar-border" />

          {!collapsed && <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40 px-3 mb-2">Ferramentas</p>}
          {secondaryItems.map(renderNavItem)}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          {!collapsed && user && (
            <p className="text-xs text-sidebar-foreground/60 mb-2 truncate">{user.email}</p>
          )}
          <button
            onClick={signOut}
            className="flex items-center gap-2 text-sm text-sidebar-foreground hover:text-sidebar-primary-foreground transition-colors w-full px-2 py-1.5 rounded-lg hover:bg-sidebar-accent"
          >
            <LogOut size={16} />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
