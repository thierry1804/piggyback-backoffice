import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Receipt,
  History,
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
import { Progress } from '@/components/ui/progress';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useGoalDetail } from '@/hooks/useGoalDetail';

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

function progressPercent(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

export function GoalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { goal, group, transactions, events, isLoading, error } = useGoalDetail(id);

  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate('/goals')}>
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

  if (isLoading || !goal) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pct = progressPercent(goal.currentAmount, goal.targetAmount);

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
              <Link to="/goals">Objectifs</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{goal.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Button variant="ghost" size="sm" className="w-fit gap-2" onClick={() => navigate('/goals')}>
        <ArrowLeft className="h-4 w-4" />
        Retour à la liste
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl" title={goal.icon}>
              {goal.icon || '🐷'}
            </span>
            {goal.name}
          </CardTitle>
          <CardDescription>{goal.description ?? 'Aucune description'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {group && (
              <span>
                <span className="font-medium text-foreground">Groupe :</span> {group.name}
              </span>
            )}
            <span>
              <span className="font-medium text-foreground">Devise :</span>{' '}
              {goal.currencySymbol ?? goal.currencyCode}
            </span>
            <span>
              <span className="font-medium text-foreground">Créé le :</span>{' '}
              {formatDate(goal.createdAt)}
            </span>
            {goal.deadline && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Deadline : {formatDate(goal.deadline)}
              </span>
            )}
            <span>
              Statut :{' '}
              {goal.closed_at ? (
                <span className="text-muted-foreground">Fermé</span>
              ) : (
                <span className="text-green-600 dark:text-green-400">Ouvert</span>
              )}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                {goal.currentAmount} / {goal.targetAmount} {goal.currencySymbol}
              </span>
              <span>{pct} %</span>
            </div>
            <Progress value={pct} className="h-3" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Transactions
          </CardTitle>
          <CardDescription>Historique des transactions de cet objectif</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground">Aucune transaction.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-muted-foreground">
                      {formatDate(tx.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {tx.amount} {goal.currencySymbol}
                    </TableCell>
                    <TableCell>{tx.note ?? '—'}</TableCell>
                    <TableCell>{tx.source ?? '—'}</TableCell>
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
            <History className="h-5 w-5" />
            Journal d&apos;événements
          </CardTitle>
          <CardDescription>Événements liés à cet objectif</CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-muted-foreground">Aucun événement.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Détails</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((ev) => (
                  <TableRow key={ev.id}>
                    <TableCell className="text-muted-foreground">
                      {formatDate(ev.created_at)}
                    </TableCell>
                    <TableCell className="font-medium">{ev.event_type}</TableCell>
                    <TableCell className="max-w-[300px] truncate text-muted-foreground">
                      {typeof ev.payload === 'object' && ev.payload !== null
                        ? JSON.stringify(ev.payload)
                        : '—'}
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
