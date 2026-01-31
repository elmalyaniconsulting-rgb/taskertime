'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
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
  Clock,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Calendrier', href: '/calendar', icon: Calendar },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Prestations', href: '/prestations', icon: Briefcase },
  { name: 'Devis', href: '/quotes', icon: FileText },
  { name: 'Factures', href: '/invoices', icon: Receipt },
  { name: 'Contrats', href: '/contracts', icon: FileSignature },
  { name: 'Réservation', href: '/booking-links', icon: Link2 },
  { name: 'Statistiques', href: '/stats', icon: BarChart3 },
  { name: 'Paramètres', href: '/settings', icon: Settings },
];

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const pathname = usePathname();

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/50 md:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-72 bg-card border-r shadow-lg md:hidden animate-in slide-in-from-left">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Clock className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold">TaskerTime</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-2 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
