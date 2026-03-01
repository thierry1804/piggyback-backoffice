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
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useGroupDetail } from '@/hooks/useGroupDetail';
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
  } = useGroupDetail(id);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersRound className="h-5 w-5" />
            {group.name}
          </CardTitle>
          <CardDescription>{group.description ?? 'Aucune description'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Créé le {formatDate(group.created_at)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Plan & abonnement
          </CardTitle>
          <CardDescription>Plan actif et dates d&apos;abonnement</CardDescription>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
