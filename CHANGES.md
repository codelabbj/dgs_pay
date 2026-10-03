# Refonte DGS Pay — ce qui a changé

## Cause du rendu « bizarre » (corrigée)
- `crimson-*` n'existait pas dans Tailwind (~90 usages ignorés) → remplacé par les tokens du thème.
- `--primary: 220 38 38` était du RGB lu comme HSL (bleu-gris terne) → palette HSL correcte basée sur le logo (marine #0A1F34), clair + sombre.
- ~1 000 couleurs en dur (neutral/slate/gray + `dark:`) → tokens sémantiques (`bg-card`, `text-muted-foreground`, `border-border`…).
- Hack qui transformait le jaune en gris supprimé ; `transition` globale sur `*` supprimée.

## Responsive
- `DashboardLayout` réécrit : sidebar fixe desktop / menu tiroir mobile (Échap, fond, scroll bloqué), header allégé, `h-dvh`, marges `p-4 sm:p-6 lg:p-8`.
- Login réécrit ; register / forgot-password harmonisés.
- Titres de page et en-têtes en colonne sur mobile ; grilles de formulaires `grid-cols-1 sm:grid-cols-2` ; onglets et filtres qui passent à la ligne.
- Doubles marges et `min-h-screen` imbriqués supprimés.

## Nettoyage
- 97 `console.log` supprimés (dont ceux qui affichaient les tokens à la connexion).
- Supprimés : `transactions-content-fixed.tsx` (jamais importé), `styles/globals.css` (doublon), `pnpm-lock.yaml` (vide, cassait `--frozen-lockfile`).
- Toggle Sandbox/Live et cloche de notification retirés (ne faisaient rien).
- « Virement NGN » et « Settings » maintenant traduits.
- `deploy.sh` : n'utilise pnpm que si un vrai `pnpm-lock.yaml` existe.

## Build propre (2026-10-03)
- `recharts` était en `latest` → 3.10.1, incompatible avec `components/ui/chart.tsx` (écrit pour la 2.x) : 8 erreurs TS. Épinglé en `2.15.4`.
- `next-themes` épinglé en `0.4.6` (plus de `latest`).
- `myWallets` absent de `lib/translations.ts` → ajouté en EN/FR, avec `defaultBadge`, `frozenBadge`, `setAsDefault` (chaînes FR en dur dans `dashboard-content.tsx`).
- `window.open(payment.qr_code, …)` : `string | null` non narrowé dans le closure → `?? ""` + `noopener,noreferrer`.
- 3 apostrophes non échappées → `&apos;` (`developer-content.tsx`, `profile-content.tsx`).
- ESLint absent du tout : `npm run lint` ouvrait un prompt interactif. Ajout de `eslint@8` + `eslint-config-next@14.2.16` et `.eslintrc.json` (`next/core-web-vitals`).
- `ignoreBuildErrors` et `ignoreDuringBuilds` retirés de `next.config.mjs` → `next build` valide désormais types + lint.
- 16 routes vérifiées en dev : toutes en 200 (`/dashboard` n'existe pas, le dashboard est `/`).

## À faire ensuite
- Réactiver l'authentification commentée (« Temporarily disable ») dans `DashboardContent`.
- Tokens dans `localStorage` → cookies httpOnly côté API (sécurité).
- `transactions-content.tsx` (1 775 lignes) et `balance-content.tsx` (1 255) à découper.
- 11 avertissements ESLint restants : `react-hooks/exhaustive-deps` (9) et `@next/next/no-img-element` (5).
