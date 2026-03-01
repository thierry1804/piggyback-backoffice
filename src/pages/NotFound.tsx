import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
      <FileQuestion className="h-24 w-24 text-muted-foreground" />
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">404</h1>
        <p className="text-muted-foreground">
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>
      </div>
      <Button asChild>
        <Link to="/dashboard">Retour au tableau de bord</Link>
      </Button>
    </div>
  );
}
