import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  User,
  Mail,
  Phone,
  Globe,
  UsersRound,
  Shield,
  Pencil,
  CreditCard,
  Target,
  UserPlus,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
  DialogDescription,
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
import { useUserDetail } from '@/hooks/useUserDetail';
import { useAuth } from '@/hooks/useAuth';
import { useRoles } from '@/hooks/useRoles';
import { useGroupsList } from '@/hooks/useGroupsList';
import { toast } from '@/lib/toast';
import { GROUP_ROLES, type GroupRole } from '@/types/group';
import type { User as UserType } from '@/types/user';

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

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrateur',
  contributor: 'Contributeur',
  observer: 'Observateur',
};

export function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    user,
    groupsWithRole,
    subscriptionsForUser,
    goalsCount,
    isLoading,
    error,
    updateUser,
    addUserToGroup,
    removeUserFromGroup,
    updateUserGroupRole,
    deleteUser,
  } = useUserDetail(id);
  const { user: currentUser } = useAuth();
  const { roles } = useRoles();
  const { groups } = useGroupsList();
  const isCurrentUser = id != null && currentUser?.id === id;

  const [editOpen, setEditOpen] = useState(false);
  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Pick<UserType, 'name' | 'username' | 'email' | 'phone' | 'website' | 'role_id'>>>({});
  const [addGroupForm, setAddGroupForm] = useState({ group_id: '', role: 'contributor' as GroupRole });
  const [saving, setSaving] = useState(false);
  const [groupToRemove, setGroupToRemove] = useState<string | null>(null);
  const [updatingRoleGroupId, setUpdatingRoleGroupId] = useState<string | null>(null);
  const [deleteUserConfirmOpen, setDeleteUserConfirmOpen] = useState(false);

  const roleLabel = user?.role_id
    ? roles.find((r) => r.id === user.role_id)?.label ?? user.role_id
    : '—';

  const groupsNotIn = groups.filter((g) => !groupsWithRole.some((ug) => ug.group_id === g.id));

  const openEdit = () => {
    if (user) {
      setEditForm({
        name: user.name ?? '',
        username: user.username ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
        website: user.website ?? '',
        role_id: user.role_id ?? undefined,
      });
      setEditOpen(true);
    }
  };

  const handleSaveUser = async () => {
    setSaving(true);
    try {
      await updateUser(editForm);
      toast.success('Utilisateur mis à jour.');
      setEditOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de la mise à jour.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddToGroup = async () => {
    if (!addGroupForm.group_id) return;
    setSaving(true);
    try {
      await addUserToGroup(addGroupForm.group_id, addGroupForm.role);
      toast.success('Utilisateur ajouté au groupe.');
      setAddGroupOpen(false);
      setAddGroupForm({ group_id: '', role: 'contributor' });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de l\'ajout au groupe.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFromGroup = async (groupId: string) => {
    setSaving(true);
    try {
      await removeUserFromGroup(groupId);
      toast.success('Utilisateur retiré du groupe.');
      setGroupToRemove(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors du retrait.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    setSaving(true);
    try {
      await deleteUser();
      toast.success('Utilisateur supprimé.');
      setDeleteUserConfirmOpen(false);
      navigate('/users');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de la suppression.');
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (groupId: string, role: GroupRole) => {
    setUpdatingRoleGroupId(groupId);
    try {
      await updateUserGroupRole(groupId, role);
      toast.success('Rôle mis à jour.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de la mise à jour du rôle.');
    } finally {
      setUpdatingRoleGroupId(null);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => navigate('/users')}
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

  if (isLoading || !user) {
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
              <Link to="/users">Utilisateurs</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{user.name || user.email || id}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit gap-2"
          onClick={() => navigate('/users')}
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la liste
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Objectifs (goals)</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{goalsCount}</p>
            <p className="text-xs text-muted-foreground">
              Total dans les groupes de l&apos;utilisateur
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abonnements actifs</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{subscriptionsForUser.length}</p>
            <p className="text-xs text-muted-foreground">
              Via les groupes auxquels il appartient
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Fiche utilisateur
            </CardTitle>
            <CardDescription>Informations du compte</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={openEdit}>
              <Pencil className="h-4 w-4" />
              Modifier
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => setDeleteUserConfirmOpen(true)}
              disabled={isCurrentUser}
              title={isCurrentUser ? 'Vous ne pouvez pas supprimer votre propre compte.' : undefined}
            >
              <Trash2 className="h-4 w-4" />
              Supprimer l&apos;utilisateur
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Nom</p>
                <p className="font-medium">{user.name ?? '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Username</p>
                <p className="font-medium">{user.username ?? '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.email ?? '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Téléphone</p>
                <p className="font-medium">{user.phone ?? '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Site web</p>
                <p className="font-medium">{user.website ?? '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Rôle global</p>
                <p className="font-medium">{roleLabel}</p>
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Date de création</p>
            <p className="font-medium">{formatDate(user.created_at)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Abonnement(s) en cours
          </CardTitle>
          <CardDescription>
            Abonnements des groupes auxquels l&apos;utilisateur appartient
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptionsForUser.length === 0 ? (
            <p className="text-muted-foreground">Aucun abonnement actif.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Groupe</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Début</TableHead>
                  <TableHead>Fin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptionsForUser.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">{sub.groupName ?? sub.group_id}</TableCell>
                    <TableCell>{sub.planName ?? sub.plan_id}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(sub.started_at)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(sub.ends_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UsersRound className="h-5 w-5" />
              Groupes
            </CardTitle>
            <CardDescription>
              Groupes auxquels l&apos;utilisateur appartient — modifier le rôle ou retirer
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setAddGroupOpen(true)}
            disabled={groupsNotIn.length === 0}
          >
            <UserPlus className="h-4 w-4" />
            Ajouter à un groupe
          </Button>
        </CardHeader>
        <CardContent>
          {groupsWithRole.length === 0 ? (
            <p className="text-muted-foreground">
              Cet utilisateur n&apos;appartient à aucun groupe.
              {groups.length > 0 && ' Utilisez « Ajouter à un groupe » pour l\'affecter.'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Groupe</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead className="w-40">Modifier le rôle</TableHead>
                  <TableHead className="w-28">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupsWithRole.map((ug) => (
                  <TableRow key={ug.group_id}>
                    <TableCell className="font-medium">
                      <Link
                        to={`/groups/${ug.group_id}`}
                        className="text-primary hover:underline"
                      >
                        {ug.group?.name ?? ug.group_id}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {ug.group?.description ?? '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {formatDate(ug.group?.created_at ?? null)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {ROLE_LABELS[ug.role] ?? ug.role}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={ug.role}
                        onValueChange={(value) => handleRoleChange(ug.group_id, value as GroupRole)}
                        disabled={updatingRoleGroupId === ug.group_id}
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
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => setGroupToRemove(ug.group_id)}
                        aria-label="Retirer du groupe"
                      >
                        <Trash2 className="h-4 w-4" />
                        Retirer
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l&apos;utilisateur</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nom</Label>
              <Input
                id="edit-name"
                value={editForm.name ?? ''}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                value={editForm.username ?? ''}
                onChange={(e) => setEditForm((f) => ({ ...f, username: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email ?? ''}
                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Téléphone</Label>
              <Input
                id="edit-phone"
                value={editForm.phone ?? ''}
                onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-website">Site web</Label>
              <Input
                id="edit-website"
                value={editForm.website ?? ''}
                onChange={(e) => setEditForm((f) => ({ ...f, website: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Rôle global</Label>
              <Select
                value={editForm.role_id ?? ''}
                onValueChange={(v) => setEditForm((f) => ({ ...f, role_id: v || undefined }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveUser} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement…
                </>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addGroupOpen} onOpenChange={setAddGroupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter à un groupe</DialogTitle>
            <DialogDescription>
              Choisir un groupe et le rôle de l&apos;utilisateur dans ce groupe.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Groupe</Label>
              <Select
                value={addGroupForm.group_id}
                onValueChange={(v) => setAddGroupForm((f) => ({ ...f, group_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un groupe" />
                </SelectTrigger>
                <SelectContent>
                  {groupsNotIn.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Rôle dans le groupe</Label>
              <Select
                value={addGroupForm.role}
                onValueChange={(v) => setAddGroupForm((f) => ({ ...f, role: v as GroupRole }))}
              >
                <SelectTrigger>
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
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddGroupOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleAddToGroup}
              disabled={!addGroupForm.group_id || saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ajout…
                </>
              ) : (
                'Ajouter'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!groupToRemove}
        onOpenChange={(open) => !open && setGroupToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer l&apos;utilisateur du groupe</AlertDialogTitle>
            <AlertDialogDescription>
              L&apos;utilisateur sera retiré de ce groupe. Cette action est réversible en
              l&apos;ajoutant à nouveau au groupe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => groupToRemove && handleRemoveFromGroup(groupToRemove)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={saving}
            >
              {saving ? 'En cours…' : 'Retirer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteUserConfirmOpen} onOpenChange={setDeleteUserConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l&apos;utilisateur</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le profil utilisateur et ses affectations aux
              groupes seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
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
