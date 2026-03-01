/**
 * Utilitaires partagés du backoffice.
 * Exemple : formatage des montants, dates, etc.
 */

export function formatCurrency(value: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(value);
}
