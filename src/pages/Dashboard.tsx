import {
  Users,
  UsersRound,
  Target,
  Receipt,
  CreditCard,
  Loader2,
  AlertCircle,
  RefreshCw,
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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Line, LineChart } from 'recharts';
import { useDashboardData } from '@/hooks/useDashboardData';
import { formatCurrency } from '@/utils';
import type { DashboardKpis } from '@/types/dashboard';
import type { LucideIcon } from 'lucide-react';

type KpiConfigItem = {
  key: keyof DashboardKpis;
  label: string;
  icon: LucideIcon;
  format?: (v: number) => string;
};

const kpiConfig: KpiConfigItem[] = [
  { key: 'totalUsers', label: 'Utilisateurs', icon: Users },
  { key: 'totalGroups', label: 'Groupes', icon: UsersRound },
  { key: 'activeGoals', label: 'Objectifs actifs', icon: Target },
  {
    key: 'totalTransactionsAmount',
    label: 'Somme des transactions',
    icon: Receipt,
    format: (v: number) => formatCurrency(v),
  },
  { key: 'activeSubscriptions', label: 'Abonnements actifs', icon: CreditCard },
];

const goalsChartConfig = {
  count: {
    label: 'Objectifs créés',
    color: 'hsl(243, 75%, 55%)',
  },
};

const transactionsChartConfig = {
  volume: {
    label: 'Volume (€)',
    color: 'hsl(142, 76%, 36%)',
  },
};

export function Dashboard() {
  const {
    kpis,
    goalsByMonth,
    transactionsByMonth,
    isLoading,
    error,
    refetch,
  } = useDashboardData();

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
            <p className="text-muted-foreground">
              Vue d&apos;ensemble des métriques
            </p>
          </div>
        </div>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Erreur
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Vue d&apos;ensemble des métriques
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Actualiser
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {kpiConfig.map(({ key, label, icon: Icon, format }) => {
          const value = kpis[key];
          const display =
            typeof value === 'number' && format ? format(value) : value;
          return (
            <Card key={key}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="text-muted-foreground">—</span>
                  </div>
                ) : (
                  <div className="text-2xl font-bold">{display}</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bar chart: objectifs créés par mois */}
      <Card>
        <CardHeader>
          <CardTitle>Objectifs créés par mois</CardTitle>
          <CardDescription>
            Nombre de goals créés par mois (colonne created_at)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-[300px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : goalsByMonth.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              Aucune donnée
            </div>
          ) : (
            <ChartContainer
              config={goalsChartConfig}
              className="h-[300px] w-full"
            >
              <BarChart data={goalsByMonth} margin={{ left: 0, right: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="count"
                  fill="var(--color-count)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Line chart: volume des transactions par mois */}
      <Card>
        <CardHeader>
          <CardTitle>Volume des transactions par mois</CardTitle>
          <CardDescription>
            Somme des montants par mois (colonne created_at)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-[300px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : transactionsByMonth.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              Aucune donnée
            </div>
          ) : (
            <ChartContainer
              config={transactionsChartConfig}
              className="h-[300px] w-full"
            >
              <LineChart
                data={transactionsByMonth}
                margin={{ left: 0, right: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="volume"
                  stroke="var(--color-volume)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--color-volume)' }}
                />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
