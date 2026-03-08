import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, ArrowLeftRight, FileText, Package, Wallet, Users,
  LogOut, MessageSquare, Settings, CalendarDays, Menu, X, Moon, Sun,
} from "lucide-react";
import { useState, useEffect } from "react";
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
  { to: "/agendamentos", label: "Agendamentos", icon: CalendarDays },
  { to: "/assistente", label: "Assistente IA", icon: MessageSquare },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];

function useTheme() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("fincontrol_theme") === "dark";
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("fincontrol_theme", dark ? "dark" : "light");
  }, [dark]);

  return { dark, toggle: () => setDark(!dark) };
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { dark, toggle } = useTheme();

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

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
        <span>{item.label}</span>
      </NavLink>
    );
  };

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between px-4 py-5 border-b border-sidebar-border">
        <h1 className="font-heading text-lg font-bold text-sidebar-primary-foreground tracking-tight">
          Fin<span className="text-sidebar-primary">Control</span>
        </h1>
        <div className="flex items-center gap-1">
          <button onClick={toggle} className="text-sidebar-foreground hover:text-sidebar-primary-foreground transition-colors p-1.5 rounded-lg hover:bg-sidebar-accent">
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden text-sidebar-foreground hover:text-sidebar-primary-foreground transition-colors p-1.5">
            <X size={18} />
          </button>
        </div>
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40 px-3 mb-2">Principal</p>
        {navItems.map(renderNavItem)}

        <div className="my-3 border-t border-sidebar-border" />

        <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40 px-3 mb-2">Ferramentas</p>
        {secondaryItems.map(renderNavItem)}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        {user && (
          <p className="text-xs text-sidebar-foreground/60 mb-2 truncate">{user.email}</p>
        )}
        <button
          onClick={signOut}
          className="flex items-center gap-2 text-sm text-sidebar-foreground hover:text-sidebar-primary-foreground transition-colors w-full px-2 py-1.5 rounded-lg hover:bg-sidebar-accent"
        >
          <LogOut size={16} />
          <span>Sair</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="font-heading text-lg font-bold text-foreground tracking-tight">
          Fin<span className="text-accent">Control</span>
        </h1>
        <button onClick={() => setMobileOpen(true)} className="p-1.5 text-foreground hover:text-accent transition-colors">
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-sidebar text-sidebar-foreground flex flex-col animate-fade-in">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 bg-sidebar text-sidebar-foreground flex-col shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      <main className="flex-1 overflow-auto lg:pt-0 pt-14">
        <div className="p-4 sm:p-6 max-w-7xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
