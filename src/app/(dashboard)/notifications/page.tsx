'use client';

import { PageHeader, EmptyState } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';

export default function NotificationsPage() {
  // À connecter à l'API notifications
  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" />
      <EmptyState
        icon={<Bell className="h-6 w-6 text-muted-foreground" />}
        title="Aucune notification"
        description="Vos notifications apparaîtront ici."
      />
    </div>
  );
}
