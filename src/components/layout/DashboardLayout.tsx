import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UsersRound,
  CreditCard,
  ListTodo,
  MailPlus,
  PiggyBank,
  LogOut,
  Menu,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/users', label: 'Utilisateurs', icon: Users },
  { to: '/groups', label: 'Groupes', icon: UsersRound },
  { to: '/subscriptions', label: 'Abonnements', icon: CreditCard },
  { to: '/plans', label: 'Plans', icon: ListTodo },
  { to: '/invitations', label: 'Invitations', icon: MailPlus },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-indigo-500/90 text-white'
                : 'text-indigo-200/90 hover:bg-indigo-500/40 hover:text-white'
            )
          }
        >
          <Icon className="h-5 w-5 shrink-0" />
          {label}
        </NavLink>
      ))}
    </>
  );
}

export function DashboardLayout() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar fixe - visible à partir de md */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-indigo-900/30 md:flex'
        )}
        style={{ backgroundColor: '#1e1b4b' }}
      >
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-indigo-900/30 px-4">
          <PiggyBank className="h-8 w-8 text-indigo-300" />
          <span className="font-semibold text-white">Piggyback</span>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          <NavLinks />
        </nav>
      </aside>

      {/* Zone droite : header + contenu */}
      <div className="flex flex-1 flex-col md:pl-64">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
          <div className="flex items-center gap-2">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Ouvrir le menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-64 border-r border-indigo-900/30 bg-[#1e1b4b] p-0"
              >
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigation</SheetTitle>
                </SheetHeader>
                <div className="flex h-16 shrink-0 items-center gap-2 border-b border-indigo-900/30 px-4">
                  <PiggyBank className="h-8 w-8 text-indigo-300" />
                  <span className="font-semibold text-white">Piggyback</span>
                </div>
                <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
                  <NavLinks onNavigate={() => setSheetOpen(false)} />
                </nav>
              </SheetContent>
            </Sheet>
            <span className="text-sm text-slate-600">
              Connecté :{' '}
              <span className="font-medium text-slate-900 truncate max-w-[120px] sm:max-w-none inline-block">
                {user?.email ?? 'Administrateur'}
              </span>
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Déconnexion</span>
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
