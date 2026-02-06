'use client';

import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Menu,
  X,
  Moon,
  Sun,
  LogOut,
  User,
  Settings,
  ChevronDown,
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Receipt,
  Briefcase,
  BarChart3,
  Link2,
  FileSignature,
  Sparkles,
} from 'lucide-react';
import { useTheme } from 'next-themes';

const mobileNav = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Calendrier', href: '/calendar', icon: Calendar },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Prestations', href: '/prestations', icon: Briefcase },
  { name: 'Devis', href: '/quotes', icon: FileText },
  { name: 'Factures', href: '/invoices', icon: Receipt },
  { name: 'Contrats', href: '/contracts', icon: FileSignature },
  { name: 'Réservation', href: '/bookings', icon: Link2 },
  { name: 'Stats', href: '/stats', icon: BarChart3 },
  { name: 'IA Assistant', href: '/ai-assistant', icon: Sparkles },
  { name: 'Paramètres', href: '/settings', icon: Settings },
];

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/notifications?unreadOnly=true')
        .then((r) => r.ok ? r.json() : [])
        .then((data: any) => setNotifCount(Array.isArray(data) ? data.length : 0))
        .catch(() => {});
    }
  }, [session?.user?.id, pathname]);

  const user = session?.user;
  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'TT';

  // Page title from pathname
  const pageTitle = (() => {
    const titles: Record<string, string> = {
      '/dashboard': 'Tableau de bord',
      '/calendar': 'Calendrier',
      '/clients': 'Clients',
      '/prestations': 'Prestations',
      '/quotes': 'Devis',
      '/invoices': 'Factures',
      '/contracts': 'Contrats',
      '/bookings': 'Réservation',
      '/stats': 'Statistiques',
      '/settings': 'Paramètres',
      '/notifications': 'Notifications',
      '/ai-assistant': 'IA Assistant',
      '/onboarding': 'Bienvenue',
    };
    return titles[pathname] || '';
  })();

  return (
    <>
      <header className="sticky top-0 z-40 h-16 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between h-full px-4 lg:px-6">
          {/* Left: mobile menu + page title */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            {pageTitle && (
              <h1 className="text-lg font-semibold hidden sm:block">{pageTitle}</h1>
            )}
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {/* Notifications */}
            <Link href="/notifications">
              <Button variant="ghost" size="icon" className="h-9 w-9 relative text-muted-foreground">
                <Bell className="h-[18px] w-[18px]" />
                {notifCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full text-[10px] font-bold gradient-primary text-white">
                    {notifCount > 9 ? '9+' : notifCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 pl-2 pr-3 gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user?.image || undefined} />
                    <AvatarFallback className="text-xs font-semibold gradient-primary text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden lg:block max-w-[120px] truncate">
                    {user?.name || 'Utilisateur'}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden lg:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" /> Mon profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" /> Paramètres
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive cursor-pointer"
                  onClick={() => signOut({ callbackUrl: '/login' })}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-card border-r animate-slide-in-left">
            <div className="flex items-center justify-between h-16 px-4 border-b">
              <Logo size="sm" />
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="p-3 space-y-1">
              {mobileNav.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                    )}
                  >
                    <item.icon className="h-[18px] w-[18px]" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
