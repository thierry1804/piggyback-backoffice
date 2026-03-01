# Edge Function : delete-user

Supprime un utilisateur **complètement** : compte Auth (Supabase Auth), profil `public.users` et liaisons `user_groups`. Réservée aux utilisateurs avec `role_id = 'superadmin'`.

## Déploiement

1. **CLI Supabase** (si pas déjà fait) :
   ```bash
   npx supabase login
   npx supabase link --project-ref <TON_PROJECT_REF>
   ```

2. **Secret requis** : la clé **service role** doit être disponible dans la fonction.
   - Dashboard Supabase → Project Settings → API → copier la clé **service_role** (secret).
   - Puis : Project Settings → Edge Functions → `delete-user` → Secrets (ou via CLI) :
   ```bash
   npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=ta_cle_service_role
   ```

3. **Déployer la fonction** :
   ```bash
   npx supabase functions deploy delete-user
   ```

Sans déploiement, le bouton « Supprimer l'utilisateur » dans le backoffice renverra une erreur (fonction introuvable).
