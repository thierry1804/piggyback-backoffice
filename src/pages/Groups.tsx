import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, AlertCircle, UsersRound } from 'lucide-react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { useGroups } from '@/hooks/useGroups';
import type { GroupWithMeta } from '@/types/group';

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

export function Groups() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');

  const {
    groups,
    totalCount,
    totalPages,
    page,
    goToPage,
    isLoading,
    error,
    setSearch,
  } = useGroups();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    goToPage(1);
  };

  const handleRowClick = (group: GroupWithMeta) => {
    navigate(`/groups/${group.id}`);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Groupes</h1>
          <p className="text-muted-foreground">
            Groupes d&apos;épargne collaborative
          </p>
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
        <h1 className="text-3xl font-bold tracking-tight">Groupes</h1>
        <p className="text-muted-foreground">
          Groupes d&apos;épargne collaborative
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UsersRound className="h-5 w-5" />
              Tous les groupes
            </CardTitle>
            <CardDescription>
              {totalCount} groupe{totalCount !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-wrap items-center gap-2"
          >
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-64 pl-8"
              />
            </div>
            <Button type="submit" variant="secondary" size="sm">
              Rechercher
            </Button>
          </form>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton columnCount={5} rowCount={10} />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date de création</TableHead>
                    <TableHead>Membres</TableHead>
                    <TableHead>Plan actif</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-24 text-center text-muted-foreground"
                      >
                        Aucun groupe trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    groups.map((group) => (
                      <TableRow
                        key={group.id}
                        className="cursor-pointer"
                        onClick={() => handleRowClick(group)}
                      >
                        <TableCell className="font-medium">{group.name}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                          {group.description ?? '—'}
                        </TableCell>
                        <TableCell>{formatDate(group.created_at)}</TableCell>
                        <TableCell>{group.memberCount}</TableCell>
                        <TableCell>{group.activePlanName ?? '—'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          goToPage(page - 1);
                        }}
                        className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <PaginationItem key={p}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            goToPage(p);
                          }}
                          isActive={p === page}
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          goToPage(page + 1);
                        }}
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
