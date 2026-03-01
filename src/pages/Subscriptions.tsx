import { useState } from 'react';
import {
  Loader2,
  AlertCircle,
  CreditCard,
  Pencil,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { toast } from '@/lib/toast';
import { usePlans } from '@/hooks/usePlans';
import type { AbonnementWithMeta } from '@/types/plan';
import type { SubscriptionStatusFilter } from '@/types/plan';

function formatDate(value: string | null): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function toInputDateTime(value: string | null): string {
  if (!value) return '';
  try {
    return new Date(value).toISOString().slice(0, 16);
  } catch {
    return '';
  }
}

const STATUS_OPTIONS: { value: SubscriptionStatusFilter; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'active', label: 'Actifs' },
  { value: 'expired', label: 'Expirés' },
];

export function Subscriptions() {
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatusFilter>('all');
  const [editingAbonnement, setEditingAbonnement] = useState<AbonnementWithMeta | null>(null);
  const [editForm, setEditForm] = useState({
    plan_id: '',
    started_at: '',
    ends_at: '',
  });
  const [saving, setSaving] = useState(false);

  const { plans } = usePlans();
  const {
    subscriptions,
    isLoading,
    error,
    updateAbonnement,
  } = useSubscriptions(statusFilter);

  const openEdit = (abo: AbonnementWithMeta) => {
    setEditingAbonnement(abo);
    setEditForm({
      plan_id: abo.plan_id,
      started_at: toInputDateTime(abo.started_at),
      ends_at: toInputDateTime(abo.ends_at),
    });
  };

  const handleSaveEdit = async () => {
    if (!editingAbonnement) return;
    setSaving(true);
    try {
      await updateAbonnement(editingAbonnement.id, {
        plan_id: editForm.plan_id,
        started_at: editForm.started_at ? new Date(editForm.started_at).toISOString() : undefined,
        ends_at: editForm.ends_at ? new Date(editForm.ends_at).toISOString() : null,
      });
      setEditingAbonnement(null);
      toast.success('Abonnement mis à jour.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de la mise à jour.');
    } finally {
      setSaving(false);
    }
  };

  const statusLabel = (abo: AbonnementWithMeta) => {
    if (!abo.ends_at) return 'Actif';
    return new Date(abo.ends_at) > new Date() ? 'Actif' : 'Expiré';
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Abonnements</h1>
          <p className="text-muted-foreground">Gestion des abonnements</p>
        </div>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Erreur
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Abonnements</h1>
          <p className="text-muted-foreground">Gestion des abonnements</p>
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as SubscriptionStatusFilter)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Abonnements
          </CardTitle>
          <CardDescription>
            {subscriptions.length} abonnement{subscriptions.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton columnCount={6} rowCount={8} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Groupe</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Démarré le</TableHead>
                  <TableHead>Se termine le</TableHead>
                  <TableHead>Réf. paiement</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Aucun abonnement
                    </TableCell>
                  </TableRow>
                ) : (
                  subscriptions.map((abo) => (
                    <TableRow key={abo.id}>
                      <TableCell className="font-medium">{abo.groupName ?? abo.group_id}</TableCell>
                      <TableCell>{abo.planName ?? abo.plan_id}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(abo.started_at)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(abo.ends_at)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {abo.payment_ref ?? '—'}
                      </TableCell>
                      <TableCell>
                        {statusLabel(abo) === 'Actif' ? (
                          <span className="text-green-600 dark:text-green-400">Actif</span>
                        ) : (
                          <span className="text-muted-foreground">Expiré</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(abo)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingAbonnement} onOpenChange={(open) => !open && setEditingAbonnement(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l&apos;abonnement</DialogTitle>
            <CardDescription>
              Groupe : {editingAbonnement?.groupName ?? editingAbonnement?.group_id}
            </CardDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Plan</Label>
              <Select
                value={editForm.plan_id}
                onValueChange={(v) => setEditForm((f) => ({ ...f, plan_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Démarré le</Label>
              <Input
                type="datetime-local"
                value={editForm.started_at}
                onChange={(e) => setEditForm((f) => ({ ...f, started_at: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Se termine le (optionnel)</Label>
              <Input
                type="datetime-local"
                value={editForm.ends_at}
                onChange={(e) => setEditForm((f) => ({ ...f, ends_at: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAbonnement(null)}>
              Annuler
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
