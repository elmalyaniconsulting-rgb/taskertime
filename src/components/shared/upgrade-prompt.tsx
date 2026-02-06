'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Crown, ArrowRight, Lock } from 'lucide-react';

interface UpgradePromptProps {
  title?: string;
  message: string;
  feature?: string;
  inline?: boolean; // true = petit bandeau, false = modal-like
}

export function UpgradePrompt({
  title = 'Fonctionnalité Pro',
  message,
  feature,
  inline = false,
}: UpgradePromptProps) {
  if (inline) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-3">
        <Lock className="h-4 w-4 text-amber-600 shrink-0" />
        <p className="text-sm text-amber-800 dark:text-amber-200 flex-1">{message}</p>
        <Link href={`/pricing${feature ? `?highlight=${feature}` : ''}`}>
          <Button size="sm" variant="outline" className="shrink-0 text-xs border-amber-300">
            Upgrader
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center max-w-md mx-auto">
      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Crown className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6">{message}</p>
      <Link href={`/pricing${feature ? `?highlight=${feature}` : ''}`}>
        <Button size="lg">
          Voir les plans
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}

interface UsageBadgeProps {
  current: number;
  limit: number;
  label: string;
}

export function UsageBadge({ current, limit, label }: UsageBadgeProps) {
  if (limit === -1) return null; // Illimité, pas besoin d'afficher

  const percentage = (current / limit) * 100;
  const isWarning = percentage >= 80;
  const isLimit = current >= limit;

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`${isLimit ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-muted-foreground'}`}>
        {current}/{limit} {label}
      </span>
      {isLimit && (
        <Link href="/pricing">
          <span className="text-primary font-medium hover:underline cursor-pointer">
            Upgrader
          </span>
        </Link>
      )}
    </div>
  );
}
