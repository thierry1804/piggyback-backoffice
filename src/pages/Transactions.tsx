import { useState } from 'react';
import { Search, Loader2, AlertCircle, Receipt, Download } from 'lucide-react';
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { useTransactions } from '@/hooks/useTransactions';
import { useGoalsList } from '@/hooks/useGoalsList';
import type { TransactionWithMeta } from '@/types/goal';

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

function escapeCsvCell(value: string | number | null): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function buildCsv(rows: TransactionWithMeta[]): string {
  const header = ['ID', 'Objectif', 'Montant', 'Note', 'Source', 'Créé par', 'Date'];
  const lines = [
    header.map(escapeCsvCell).join(','),
    ...rows.map((r) =>
      [
        r.id,
        r.goalName ?? '',
        r.amount,
        r.note ?? '',
        r.source ?? '',
        r.createdByName ?? '',
        formatDate(r.createdAt),
      ].map(escapeCsvCell).join(',')
    ),
  ];
  return lines.join('\r\n');
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const SOURCE_OPTIONS = [
  { value: 'all', label: 'Toutes' },
  { value: 'manual', label: 'Manuel' },
  { value: 'correction', label: 'Correction' },
];

export function Transactions() {
  const [noteSearch, setNoteSearch] = useState('');
  const [appliedNoteSearch, setAppliedNoteSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [goalIdFilter, setGoalIdFilter] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const { goals } = useGoalsList();
  const {
    transactions,
    totalCount,
    totalPages,
    page,
    goToPage,
    isLoading,
    error,
    fetchAllFiltered,
  } = useTransactions({
    sourceFilter,
    goalIdFilter,
    noteSearch: appliedNoteSearch,
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedNoteSearch(noteSearch);
    goToPage(1);
  };

  const handleSourceChange = (value: string) => {
    setSourceFilter(value === 'all' ? null : value);
    goToPage(1);
  };

  const handleGoalChange = (value: string) => {
    setGoalIdFilter(value === 'all' ? null : value);
    goToPage(1);
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const all = await fetchAllFiltered();
      const csv = buildCsv(all);
      const date = new Date().toISOString().slice(0, 10);
      downloadCsv(csv, `transactions_${date}.csv`);
    } catch {
      // TODO: toast erreur
    } finally {
      setExporting(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">Historique des transactions</p>
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
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground">Historique des transactions</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Transactions
            </CardTitle>
            <CardDescription>
              {totalCount} transaction{totalCount !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par note…"
                  value={noteSearch}
                  onChange={(e) => setNoteSearch(e.target.value)}
                  className="w-52 pl-8"
                />
              </div>
              <Button type="submit" variant="secondary" size="sm">
                Rechercher
              </Button>
            </form>
            <Select value={sourceFilter ?? 'all'} onValueChange={handleSourceChange}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={goalIdFilter ?? 'all'} onValueChange={handleGoalChange}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Objectif" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les objectifs</SelectItem>
                {goals.map((g) => (
                  <SelectItem key={g.id} value={String(g.id)}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={exporting || totalCount === 0}
            >
              {exporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton columnCount={7} rowCount={10} />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Objectif</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Créé par</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-24 text-center text-muted-foreground"
                      >
                        Aucune transaction trouvée
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-mono text-muted-foreground">
                          {tx.id}
                        </TableCell>
                        <TableCell className="font-medium">
                          {tx.goalName ?? tx.goalId}
                        </TableCell>
                        <TableCell>{tx.amount}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                          {tx.note ?? '—'}
                        </TableCell>
                        <TableCell>{tx.source ?? '—'}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {tx.createdByName ?? '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(tx.createdAt)}
                        </TableCell>
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
