import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileX, Plus } from 'lucide-react';

// ─── Status Badge ───
const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline' }> = {
  BROUILLON: { label: 'Brouillon', variant: 'secondary' },
  ENVOYEE: { label: 'Envoyée', variant: 'default' },
  ENVOYE: { label: 'Envoyé', variant: 'default' },
  VUE: { label: 'Vu(e)', variant: 'outline' },
  VU: { label: 'Vu', variant: 'outline' },
  PAYEE: { label: 'Payée', variant: 'success' },
  ACCEPTE: { label: 'Accepté', variant: 'success' },
  REFUSE: { label: 'Refusé', variant: 'destructive' },
  EN_RETARD: { label: 'En retard', variant: 'destructive' },
  PARTIELLEMENT_PAYEE: { label: 'Paiement partiel', variant: 'warning' },
  ANNULEE: { label: 'Annulée', variant: 'secondary' },
  EXPIRE: { label: 'Expiré', variant: 'secondary' },
  CONVERTI: { label: 'Converti', variant: 'success' },
  AVOIR: { label: 'Avoir', variant: 'warning' },
  SIGNE: { label: 'Signé', variant: 'success' },
  PLANIFIE: { label: 'Planifié', variant: 'default' },
  CONFIRME: { label: 'Confirmé', variant: 'success' },
  EN_COURS: { label: 'En cours', variant: 'warning' },
  REALISE: { label: 'Réalisé', variant: 'success' },
  REPORTE: { label: 'Reporté', variant: 'warning' },
  ANNULE: { label: 'Annulé', variant: 'destructive' },
  EN_ATTENTE: { label: 'En attente', variant: 'warning' },
  NO_SHOW: { label: 'Absent', variant: 'destructive' },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] || { label: status, variant: 'secondary' as const };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

// ─── Empty State ───
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-3 mb-4">
          {icon || <FileX className="h-6 w-6 text-muted-foreground" />}
        </div>
        <h3 className="font-semibold text-lg mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
        )}
        {actionLabel && onAction && (
          <Button onClick={onAction}>
            <Plus className="h-4 w-4 mr-2" />
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Table Loading ───
export function TableLoading({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Page Header ───
interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─── Currency display ───
export function Currency({ amount, className }: { amount: number | string; className?: string }) {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return (
    <span className={className}>
      {num.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
    </span>
  );
}
