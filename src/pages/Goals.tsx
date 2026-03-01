import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, AlertCircle, Target } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { Progress } from '@/components/ui/progress';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { useGoals } from '@/hooks/useGoals';
import { useGroupsList } from '@/hooks/useGroupsList';
import type { GoalWithGroup } from '@/types/goal';
import type { GoalStatusFilter } from '@/types/goal';

function formatDate(value: string | null): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function progressPercent(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

const STATUS_OPTIONS: { value: GoalStatusFilter; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'active', label: 'Actifs' },
  { value: 'closed', label: 'Fermés' },
];

export function Goals() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<GoalStatusFilter>('all');
  const [groupIdFilter, setGroupIdFilter] = useState<string | null>(null);

  const { groups } = useGroupsList();
  const {
    goals,
    totalCount,
    totalPages,
    page,
    goToPage,
    isLoading,
    error,
  } = useGoals({
    statusFilter,
    groupIdFilter,
    searchQuery: appliedSearch,
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(searchInput);
    goToPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value as GoalStatusFilter);
    goToPage(1);
  };

  const handleGroupChange = (value: string) => {
    setGroupIdFilter(value === 'all' ? null : value);
    goToPage(1);
  };

  const handleRowClick = (goal: GoalWithGroup) => {
    navigate(`/goals/${goal.id}`);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Objectifs</h1>
          <p className="text-muted-foreground">Objectifs d&apos;épargne</p>
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Objectifs</h1>
        <p className="text-muted-foreground">Objectifs d&apos;épargne</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Tous les objectifs
            </CardTitle>
            <CardDescription>{totalCount} objectif{totalCount !== 1 ? 's' : ''}</CardDescription>
          </div>
          <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-52 pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
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
            <Select value={groupIdFilter ?? 'all'} onValueChange={handleGroupChange}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Groupe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les groupes</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" variant="secondary" size="sm">
              Rechercher
            </Button>
          </form>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton columnCount={8} rowCount={10} />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Objectif</TableHead>
                    <TableHead>Groupe</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead className="w-32">Progression</TableHead>
                    <TableHead>Devise</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {goals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        Aucun objectif trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    goals.map((goal) => {
                      const pct = progressPercent(goal.currentAmount, goal.targetAmount);
                      return (
                        <TableRow
                          key={goal.id}
                          className="cursor-pointer"
                          onClick={() => handleRowClick(goal)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-lg" title={goal.icon}>
                                {goal.icon || '🐷'}
                              </span>
                              <span className="font-medium">{goal.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {goal.groupName ?? '—'}
                          </TableCell>
                          <TableCell>
                            {goal.currentAmount} / {goal.targetAmount}
                          </TableCell>
                          <TableCell>
                            <Progress value={pct} className="h-2" />
                            <span className="text-xs text-muted-foreground">{pct} %</span>
                          </TableCell>
                          <TableCell>{goal.currencySymbol ?? goal.currencyCode ?? '—'}</TableCell>
                          <TableCell>{formatDate(goal.deadline)}</TableCell>
                          <TableCell>
                            {goal.closed_at ? (
                              <span className="text-muted-foreground">Fermé</span>
                            ) : (
                              <span className="text-green-600 dark:text-green-400">Ouvert</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => { e.preventDefault(); goToPage(page - 1); }}
                        className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <PaginationItem key={p}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => { e.preventDefault(); goToPage(p); }}
                          isActive={p === page}
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => { e.preventDefault(); goToPage(page + 1); }}
                        className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
