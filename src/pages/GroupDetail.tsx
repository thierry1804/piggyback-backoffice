import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  UsersRound,
  Target,
  CreditCard,
  Calendar,
  Pencil,
  Trash2,
  Plus,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useGroupDetail } from '@/hooks/useGroupDetail';
import { usePlans } from '@/hooks/usePlans';
import { toast } from '@/lib/toast';
import {
  GROUP_ROLES,
  type GroupRole,
} from '@/types/group';
import { formatCurrency } from '@/utils';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrateur',
  contributor: 'Contributeur',
  observer: 'Observateur',
};

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

export function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    group,
    abonnement,
    plan,
    members,
    goals,
    isLoading,
    error,
    updateMemberRole,
    updateGroup,
    deleteGroup,
    removeAbonnement,
    createAbonnement,
    updateAbonnement,
    deleteGoal,
  } = useGroupDetail(id);
  const { plans } = usePlans();
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [removeAbonnementConfirmOpen, setRemoveAbonnementConfirmOpen] = useState(false);
  const [abonnementDialogOpen, setAbonnementDialogOpen] = useState(false);
  const [abonnementForm, setAbonnementForm] = useState({
    plan_id: '',
    started_at: '',
    ends_at: '',
  });
  const [isAbonnementEdit, setIsAbonnementEdit] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<number | null>(null);
  const canDelete =
    members.length === 0 && goals.length === 0 && !abonnement;
  const deleteBlockedReason = !canDelete
    ? members.length > 0
      ? 'Impossible de supprimer : le groupe a des membres.'
      : goals.length > 0
        ? 'Impossible de supprimer : le groupe contient des objectifs.'
        : abonnement
          ? 'Impossible de supprimer : le groupe a un abonnement actif.'
          : null
    : null;

  const handleRoleChange = async (userId: string, role: GroupRole) => {
    setUpdatingUserId(userId);
    try {
      await updateMemberRole(userId, role);
      toast.success('Rôle mis à jour.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de la mise à jour du rôle.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const openEdit = () => {
    if (group) {
      setEditForm({
        name: group.name,
        description: group.description ?? '',
      });
      setEditOpen(true);
    }
  };

  const handleSaveGroup = async () => {
    setSaving(true);
    try {
      await updateGroup({
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
      });
      toast.success('Groupe mis à jour.');
      setEditOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de la mise à jour.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroup = async () => {
    setSaving(true);
    try {
      await deleteGroup();
      toast.success('Groupe supprimé.');
      setDeleteConfirmOpen(false);
      navigate('/groups');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de la suppression.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAbonnement = async () => {
    if (!abonnement) return;
    setSaving(true);
    try {
      await removeAbonnement(abonnement.id);
      toast.success('Abonnement retiré.');
      setRemoveAbonnementConfirmOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors du retrait de l\'abonnement.');
    } finally {
      setSaving(false);
    }
  };

  const openAbonnementDialog = (edit: boolean) => {
    setIsAbonnementEdit(edit);
    if (edit && abonnement) {
      setAbonnementForm({
        plan_id: abonnement.plan_id,
        started_at: toInputDateTime(abonnement.started_at),
        ends_at: toInputDateTime(abonnement.ends_at),
      });
    } else {
      const now = new Date().toISOString().slice(0, 16);
      setAbonnementForm({ plan_id: plans[0]?.id ?? '', started_at: now, ends_at: '' });
    }
    setAbonnementDialogOpen(true);
  };

  const handleDeleteGoal = async () => {
    if (goalToDelete == null) return;
    setSaving(true);
    try {
      await deleteGoal(goalToDelete);
      toast.success('Objectif supprimé.');
      setGoalToDelete(null);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : 'Impossible de supprimer (transactions ou événements liés ?).'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAbonnement = async () => {
    if (!abonnementForm.plan_id.trim() || !abonnementForm.started_at) return;
    setSaving(true);
    try {
      if (isAbonnementEdit && abonnement) {
        await updateAbonnement(abonnement.id, {
          plan_id: abonnementForm.plan_id.trim(),
          started_at: new Date(abonnementForm.started_at).toISOString(),
          ends_at: abonnementForm.ends_at
            ? new Date(abonnementForm.ends_at).toISOString()
            : null,
        });
        toast.success('Abonnement modifié.');
      } else {
        await createAbonnement({
          plan_id: abonnementForm.plan_id.trim(),
          started_at: new Date(abonnementForm.started_at).toISOString(),
          ends_at: abonnementForm.ends_at
            ? new Date(abonnementForm.ends_at).toISOString()
            : null,
        });
        toast.success('Abonnement affecté.');
      }
      setAbonnementDialogOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => navigate('/groups')}
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
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

  if (isLoading || !group) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/dashboard">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/groups">Groupes</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{group.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Button
        variant="ghost"
        size="sm"
        className="w-fit gap-2"
        onClick={() => navigate('/groups')}
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à la liste
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UsersRound className="h-5 w-5" />
              {group.name}
            </CardTitle>
            <CardDescription>{group.description ?? 'Aucune description'}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={openEdit}>
              <Pencil className="h-4 w-4" />
              Modifier
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => setDeleteConfirmOpen(true)}
              disabled={!canDelete}
              title={deleteBlockedReason ?? undefined}
            >
              <Trash2 className="h-4 w-4" />
              Supprimer le groupe
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Créé le {formatDate(group.created_at)}</span>
          </div>
          {!canDelete && deleteBlockedReason && (
            <p className="text-sm text-muted-foreground">{deleteBlockedReason}</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le groupe</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nom</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nom du groupe"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Description (optionnel)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSaveGroup}
              disabled={!editForm.name.trim() || saving}
            >
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le groupe</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le groupe &laquo;{group.name}&raquo; sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={saving}
            >
              {saving ? 'Suppression…' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Plan & abonnement
            </CardTitle>
            <CardDescription>Plan actif et dates d&apos;abonnement</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {members.length >= 1 && !abonnement && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => openAbonnementDialog(false)}
              >
                <Plus className="h-4 w-4" />
                Affecter un abonnement
              </Button>
            )}
            {members.length >= 1 && abonnement && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => openAbonnementDialog(true)}
              >
                <Pencil className="h-4 w-4" />
                Modifier l&apos;abonnement
              </Button>
            )}
            {abonnement && members.length === 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => setRemoveAbonnementConfirmOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Retirer l&apos;abonnement
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!abonnement ? (
            <p className="text-muted-foreground">Aucun abonnement actif.</p>
          ) : (
            <div className="space-y-2">
              <p>
                <span className="font-medium">Plan :</span>{' '}
                {plan?.name ?? abonnement.plan_id}
              </p>
              <p className="text-sm text-muted-foreground">
                Début : {formatDate(abonnement.started_at)}
                {abonnement.ends_at && (
                  <> · Fin : {formatDate(abonnement.ends_at)}</>
                )}
              </p>
              {plan?.price_amount != null && (
                <p className="text-sm">
                  Prix : {formatCurrency(plan.price_amount, plan.price_currency ?? 'EUR')}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={removeAbonnementConfirmOpen}
        onOpenChange={setRemoveAbonnementConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer l&apos;abonnement</AlertDialogTitle>
            <AlertDialogDescription>
              L&apos;abonnement actif de ce groupe sera supprimé. Le groupe n&apos;a aucun membre.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveAbonnement}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={saving}
            >
              {saving ? 'En cours…' : 'Retirer l\'abonnement'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={abonnementDialogOpen} onOpenChange={setAbonnementDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isAbonnementEdit ? "Modifier l'abonnement" : 'Affecter un abonnement'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="abo-plan">Plan</Label>
              <Select
                value={abonnementForm.plan_id}
                onValueChange={(v) => setAbonnementForm((f) => ({ ...f, plan_id: v }))}
              >
                <SelectTrigger id="abo-plan">
                  <SelectValue placeholder="Sélectionner un plan" />
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
              <Label htmlFor="abo-started">Début</Label>
              <Input
                id="abo-started"
                type="datetime-local"
                value={abonnementForm.started_at}
                onChange={(e) => setAbonnementForm((f) => ({ ...f, started_at: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="abo-ends">Fin (optionnel)</Label>
              <Input
                id="abo-ends"
                type="datetime-local"
                value={abonnementForm.ends_at}
                onChange={(e) => setAbonnementForm((f) => ({ ...f, ends_at: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAbonnementDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSaveAbonnement}
              disabled={!abonnementForm.plan_id || !abonnementForm.started_at || saving}
            >
              {saving ? 'Enregistrement…' : isAbonnementEdit ? 'Enregistrer' : 'Affecter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersRound className="h-5 w-5" />
            Membres
          </CardTitle>
          <CardDescription>Membres du groupe et leur rôle</CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-muted-foreground">Aucun membre.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead className="w-40">Modifier le rôle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.user_id}>
                    <TableCell className="font-medium">
                      {m.user?.name ?? m.user_id}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.user?.email ?? '—'}
                    </TableCell>
                    <TableCell>{ROLE_LABELS[m.role] ?? m.role}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={m.role}
                        onValueChange={(value) => handleRoleChange(m.user_id, value as GroupRole)}
                        disabled={updatingUserId === m.user_id}
                      >
                        <SelectTrigger className="h-8 w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {GROUP_ROLES.map((role) => (
                            <SelectItem key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Objectifs
          </CardTitle>
          <CardDescription>Objectifs du groupe</CardDescription>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <p className="text-muted-foreground">Aucun objectif.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Montant cible</TableHead>
                  <TableHead>Actuel</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead className="w-28">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {goals.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.name}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {g.description ?? '—'}
                    </TableCell>
                    <TableCell>{g.targetAmount}</TableCell>
                    <TableCell>{g.currentAmount}</TableCell>
                    <TableCell>
                      {g.closed_at ? 'Clôturé' : 'Actif'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(g.createdAt)}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => setGoalToDelete(g.id)}
                        aria-label="Supprimer l'objectif"
                      >
                        <Trash2 className="h-4 w-4" />
                        Supprimer
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={goalToDelete != null}
        onOpenChange={(open) => !open && setGoalToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l&apos;objectif</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L&apos;objectif sera définitivement supprimé.
              Si des transactions ou événements y sont liés, la suppression échouera.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGoal}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={saving}
            >
              {saving ? 'Suppression…' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
