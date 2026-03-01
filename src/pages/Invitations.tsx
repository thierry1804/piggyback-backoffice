import { useState } from 'react';
import {
  Loader2,
  AlertCircle,
  MailPlus,
  Plus,
  Trash2,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { useInvitations } from '@/hooks/useInvitations';
import { toast } from '@/lib/toast';
import { useGroupsList } from '@/hooks/useGroupsList';
import { useAuth } from '@/hooks/useAuth';
import type { GroupInvitationWithMeta } from '@/types/invitation';
import type { InvitationStatusFilter } from '@/types/invitation';
import { INVITATION_ROLES } from '@/types/invitation';

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

const STATUS_OPTIONS: { value: InvitationStatusFilter; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'valid', label: 'Valides' },
  { value: 'expired', label: 'Expirées' },
];

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrateur',
  contributor: 'Contributeur',
  observer: 'Observateur',
};

export function Invitations() {
  const [statusFilter, setStatusFilter] = useState<InvitationStatusFilter>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [revokeInvitation, setRevokeInvitation] = useState<GroupInvitationWithMeta | null>(null);
  const [createForm, setCreateForm] = useState({
    group_id: '',
    email: '',
    role: 'contributor',
    expires_at: '',
  });
  const [creating, setCreating] = useState(false);

  const { user } = useAuth();
  const { groups } = useGroupsList();
  const {
    invitations,
    isLoading,
    error,
    deleteInvitation,
    createInvitation,
  } = useInvitations(statusFilter);

  const statusLabel = (inv: GroupInvitationWithMeta) => {
    if (!inv.expires_at) return 'Valide';
    return new Date(inv.expires_at) > new Date() ? 'Valide' : 'Expirée';
  };

  const handleCreate = async () => {
    if (!createForm.group_id || !createForm.email.trim()) return;
    setCreating(true);
    try {
      await createInvitation({
        group_id: createForm.group_id,
        email: createForm.email.trim(),
        role: createForm.role,
        expires_at: createForm.expires_at ? new Date(createForm.expires_at).toISOString() : null,
        created_by: user?.id ?? null,
      });
      setCreateForm({ group_id: '', email: '', role: 'contributor', expires_at: '' });
      setCreateOpen(false);
      toast.success('Invitation créée.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de la création.');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeInvitation) return;
    try {
      await deleteInvitation(revokeInvitation.id);
      setRevokeInvitation(null);
      toast.success('Invitation révoquée.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de la révocation.');
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invitations</h1>
          <p className="text-muted-foreground">Gestion des invitations de groupe</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Invitations</h1>
          <p className="text-muted-foreground">Gestion des invitations de groupe</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as InvitationStatusFilter)}>
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
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle invitation
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MailPlus className="h-5 w-5" />
            Invitations
          </CardTitle>
          <CardDescription>
            {invitations.length} invitation{invitations.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton columnCount={8} rowCount={8} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email invité</TableHead>
                  <TableHead>Groupe</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Expire le</TableHead>
                  <TableHead>Créé par</TableHead>
                  <TableHead>Date de création</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      Aucune invitation
                    </TableCell>
                  </TableRow>
                ) : (
                  invitations.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.email ?? '—'}</TableCell>
                      <TableCell>{inv.groupName ?? inv.group_id}</TableCell>
                      <TableCell>{ROLE_LABELS[inv.role] ?? inv.role}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(inv.expires_at)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {inv.createdByName ?? '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(inv.created_at)}
                      </TableCell>
                      <TableCell>
                        {statusLabel(inv) === 'Valide' ? (
                          <span className="text-green-600 dark:text-green-400">Valide</span>
                        ) : (
                          <span className="text-muted-foreground">Expirée</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setRevokeInvitation(inv)}
                        >
                          <Trash2 className="h-4 w-4" />
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une invitation</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Envoyer une invitation à rejoindre un groupe.
            </p>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Groupe</Label>
              <Select
                value={createForm.group_id}
                onValueChange={(v) => setCreateForm((f) => ({ ...f, group_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un groupe" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Email invité</Label>
              <Input
                type="email"
                placeholder="email@exemple.fr"
                value={createForm.email}
                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Rôle</Label>
              <Select
                value={createForm.role}
                onValueChange={(v) => setCreateForm((f) => ({ ...f, role: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVITATION_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Expire le (optionnel)</Label>
              <Input
                type="datetime-local"
                value={createForm.expires_at}
                onChange={(e) => setCreateForm((f) => ({ ...f, expires_at: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !createForm.group_id || !createForm.email.trim()}
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!revokeInvitation} onOpenChange={(open) => !open && setRevokeInvitation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Révoquer l&apos;invitation</AlertDialogTitle>
            <AlertDialogDescription>
              L&apos;invitation pour {revokeInvitation?.email ?? 'cet email'} sera supprimée définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevoke} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Révoquer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
