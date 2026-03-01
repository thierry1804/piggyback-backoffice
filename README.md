# Piggyback Backoffice

Backoffice d'administration pour une application d'épargne collaborative.

## Stack technique

- **Frontend** : React 18, TypeScript, Vite
- **UI** : Tailwind CSS, shadcn/ui
- **Backend** : Supabase (client JS)
- **Routing** : React Router v6 (routes protégées)
- **Graphiques** : Recharts
- **Icônes** : lucide-react

## Prérequis

- Node.js 18+
- Compte [Supabase](https://supabase.com) (projet avec Auth activé)

## Installation

```bash
npm install
```

## Configuration

1. Copiez le fichier d'exemple des variables d'environnement :

   ```bash
   cp .env.example .env
   ```

2. Renseignez dans `.env` les clés de votre projet Supabase :

   - `VITE_SUPABASE_URL` : URL du projet (ex. `https://xxx.supabase.co`)
   - `VITE_SUPABASE_ANON_KEY` : clé anonyme (publique) du projet

Ces valeurs se trouvent dans le tableau de bord Supabase : **Settings → API**.

## Démarrage

```bash
npm run dev
```

L’application est disponible sur `http://localhost:5173` (ou le port indiqué par Vite).

## Scripts

- `npm run dev` — serveur de développement
- `npm run build` — build de production
- `npm run preview` — prévisualisation du build
- `npm run typecheck` — vérification TypeScript
- `npm run lint` — lint ESLint

## Structure du projet

```
src/
├── components/     # Composants réutilisables (UI, layout, auth)
├── pages/          # Pages (Login, Dashboard, etc.)
├── hooks/          # Hooks personnalisés (useAuth, etc.)
├── lib/             # Configuration (Supabase, utils)
├── contexts/        # Contexte React (Auth)
├── types/           # Types TypeScript
└── utils/           # Fonctions utilitaires
```

## Authentification

- La page **Login** (`/login`) utilise Supabase Auth (email / mot de passe).
- Les routes sous `/dashboard` sont protégées par `<PrivateRoute />` : redirection vers `/login` si l’utilisateur n’est pas connecté.
- Une fois connecté, l’utilisateur est redirigé vers `/dashboard` (ou la page demandée).

## Routes

- `/` → redirection vers `/dashboard`
- `/login` → connexion
- `/dashboard` → tableau de bord (protégé)
- `/dashboard/epargne` — Épargne (à compléter)
- `/dashboard/statistiques` — Statistiques (à compléter)
- `/dashboard/utilisateurs` — Utilisateurs (à compléter)
- `/dashboard/parametres` — Paramètres (à compléter)
