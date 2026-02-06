'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/shared/logo';
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Receipt,
  Briefcase,
  BarChart3,
  Settings,
  Link2,
  FileSignature,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useState } from 'react';

const navGroups = [
  {
    label: 'Principal',
    items: [
      { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Calendrier', href: '/calendar', icon: Calendar },
    ],
  },
  {
    label: 'Commercial',
    items: [
      { name: 'Clients', href: '/clients', icon: Users },
      { name: 'Prestations', href: '/prestations', icon: Briefcase },
      { name: 'Devis', href: '/quotes', icon: FileText },
      { name: 'Factures', href: '/invoices', icon: Receipt },
      { name: 'Contrats', href: '/contracts', icon: FileSignature },
    ],
  },
  {
    label: 'Outils',
    items: [
      { name: 'Réservation', href: '/bookings', icon: Link2 },
      { name: 'Statistiques', href: '/stats', icon: BarChart3 },
      { name: 'IA Assistant', href: '/ai-assistant', icon: Sparkles, badge: 'Pro' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'hidden md:flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out border-r border-border/50',
          'bg-card/80 backdrop-blur-xl',
          collapsed ? 'w-[68px]' : 'w-[260px]'
        )}
      >
        {/* Logo */}
        <div className={cn('flex items-center h-16 px-4 border-b border-border/50', collapsed && 'justify-center px-2')}>
          {collapsed ? (
            <Logo size="sm" withText={false} />
          ) : (
            <Logo size="sm" />
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-4">
              {!collapsed && (
                <p className="px-4 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5 px-2">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  const link = (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                        collapsed && 'justify-center px-2'
                      )}
                    >
                      <item.icon className={cn(
                        'h-[18px] w-[18px] shrink-0 transition-colors',
                        isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                      )} />
                      {!collapsed && (
                        <>
                          <span className="flex-1">{item.name}</span>
                          {'badge' in item && item.badge && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full gradient-primary text-white">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full gradient-primary" />
                      )}
                    </Link>
                  );

                  if (collapsed) {
                    return (
                      <Tooltip key={item.name}>
                        <TooltipTrigger asChild>
                          <div className="relative">{link}</div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="font-medium">
                          {item.name}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return <div key={item.name} className="relative">{link}</div>;
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Settings + Collapse */}
        <div className="border-t border-border/50 p-2 space-y-1">
          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
              pathname === '/settings'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
              collapsed && 'justify-center px-2'
            )}
          >
            <Settings className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span>Paramètres</span>}
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className={cn('w-full text-muted-foreground', collapsed && 'px-2')}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : (
              <><ChevronLeft className="h-4 w-4 mr-2" /><span>Réduire</span></>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
