import { useState } from 'react';
import { Loader2, AlertCircle, ListTodo, Pencil, Check, X } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { usePlans } from '@/hooks/usePlans';
import { toast } from '@/lib/toast';
import type { Plan } from '@/types/plan';

function PlanRow({
  plan,
  onSave,
  onCancel,
}: {
  plan: Plan;
  onSave: (payload: Partial<Plan>) => Promise<void>;
  onCancel: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: plan.name,
    max_goals: plan.max_goals ?? '',
    is_one_shot: plan.is_one_shot ?? false,
    price_amount: plan.price_amount ?? '',
    price_currency: plan.price_currency ?? '',
    price_amount_after_early: plan.price_amount_after_early ?? '',
    early_bird_cap: plan.early_bird_cap ?? '',
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        name: form.name,
        max_goals: form.max_goals === '' ? null : Number(form.max_goals),
        is_one_shot: form.is_one_shot,
        price_amount: form.price_amount === '' ? null : Number(form.price_amount),
        price_currency: form.price_currency || null,
        price_amount_after_early:
          form.price_amount_after_early === '' ? null : Number(form.price_amount_after_early),
        early_bird_cap: form.early_bird_cap === '' ? null : Number(form.early_bird_cap),
      });
      setEditing(false);
      toast.success('Plan enregistré.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      name: plan.name,
      max_goals: plan.max_goals ?? '',
      is_one_shot: plan.is_one_shot ?? false,
      price_amount: plan.price_amount ?? '',
      price_currency: plan.price_currency ?? '',
      price_amount_after_early: plan.price_amount_after_early ?? '',
      early_bird_cap: plan.early_bird_cap ?? '',
    });
    setEditing(false);
    onCancel();
  };

  if (editing) {
    return (
      <TableRow className="bg-muted/30">
        <TableCell className="font-mono text-muted-foreground">{plan.id}</TableCell>
        <TableCell>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="h-8"
          />
        </TableCell>
        <TableCell>
          <Input
            type="number"
            value={form.max_goals}
            onChange={(e) => setForm((f) => ({ ...f, max_goals: e.target.value }))}
            className="h-8 w-20"
          />
        </TableCell>
        <TableCell>
          <Checkbox
            checked={form.is_one_shot}
            onCheckedChange={(c) => setForm((f) => ({ ...f, is_one_shot: !!c }))}
          />
        </TableCell>
        <TableCell>
          <Input
            type="number"
            value={form.price_amount}
            onChange={(e) => setForm((f) => ({ ...f, price_amount: e.target.value }))}
            className="h-8 w-24"
          />
        </TableCell>
        <TableCell>
          <Input
            value={form.price_currency}
            onChange={(e) => setForm((f) => ({ ...f, price_currency: e.target.value }))}
            className="h-8 w-20"
          />
        </TableCell>
        <TableCell>
          <Input
            type="number"
            value={form.early_bird_cap}
            onChange={(e) => setForm((f) => ({ ...f, early_bird_cap: e.target.value }))}
            className="h-8 w-20"
          />
        </TableCell>
        <TableCell>
          <div className="flex gap-1">
            <Button size="sm" variant="default" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel} disabled={saving}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell className="font-mono text-muted-foreground">{plan.id}</TableCell>
      <TableCell className="font-medium">{plan.name}</TableCell>
      <TableCell>{plan.max_goals ?? '—'}</TableCell>
      <TableCell>{plan.is_one_shot ? 'Oui' : 'Non'}</TableCell>
      <TableCell>{plan.price_amount ?? '—'}</TableCell>
      <TableCell>{plan.price_currency ?? '—'}</TableCell>
      <TableCell>{plan.early_bird_cap ?? '—'}</TableCell>
      <TableCell>
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
          <Pencil className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function Plans() {
  const { plans, isLoading, error, updatePlan } = usePlans();

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plans</h1>
          <p className="text-muted-foreground">Configuration des plans</p>
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
        <h1 className="text-3xl font-bold tracking-tight">Plans</h1>
        <p className="text-muted-foreground">Plans disponibles et configuration</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="h-5 w-5" />
            Plans
          </CardTitle>
          <CardDescription>
            Modifiez les champs en cliquant sur Modifier puis Enregistrer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton columnCount={8} rowCount={8} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Max objectifs</TableHead>
                  <TableHead>One shot</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Devise</TableHead>
                  <TableHead>Early bird cap</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      Aucun plan
                    </TableCell>
                  </TableRow>
                ) : (
                  plans.map((plan) => (
                    <PlanRow
                      key={plan.id}
                      plan={plan}
                      onSave={async (payload) => updatePlan(plan.id, payload)}
                      onCancel={() => {}}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
