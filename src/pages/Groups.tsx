import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, AlertCircle, UsersRound, Plus } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { toast } from '@/lib/toast';
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
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);

  const {
    groups,
    totalCount,
    totalPages,
    page,
    goToPage,
    isLoading,
    error,
    setSearch,
    createGroup,
    refetch,
  } = useGroups();

  const handleCreate = async () => {
    if (!createForm.name.trim()) return;
    setCreating(true);
    try {
      const id = await createGroup({
        name: createForm.name.trim(),
        description: createForm.description.trim() || null,
      });
      toast.success('Groupe créé.');
      setCreateOpen(false);
      setCreateForm({ name: '', description: '' });
      await refetch();
      navigate(`/groups/${id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de la création.');
    } finally {
      setCreating(false);
    }
  };

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
          <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            className="gap-1.5"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Créer un groupe
          </Button>
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
          </div>
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un groupe</DialogTitle>
            <DialogDescription>Nom et description du nouveau groupe</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="create-name">Nom</Label>
              <Input
                id="create-name"
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nom du groupe"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-description">Description</Label>
              <Input
                id="create-description"
                value={createForm.description}
                onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Description (optionnel)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={!createForm.name.trim() || creating}>
              {creating ? 'Création…' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
