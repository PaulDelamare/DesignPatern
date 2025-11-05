# TP Design Patterns en Sécurité Applicative

Ce dépôt regroupe les deux livrables du TP :

- `designpatern/` : API Node.js/Express documentant l’implémentation des patterns de sécurité (authentification, RBAC, validation, audit, etc.).
- `design-front/` : interface SvelteKit 2 qui consomme l’API et applique les mêmes patterns côté client.

> ℹ️ Chaque dossier contient un README détaillé expliquant l’installation, l’architecture, les extraits de code clés et les scénarios de tests. Reportez-vous à ces documents pour toute information approfondie.

## Prérequis généraux

- Node.js 20+
- npm 10+
- Une base PostgreSQL disponible (pour l’API)

## Démarrage rapide

```powershell
# cloner le dépôt puis installer les deux projets
cd designpatern
npm install
cd ..\design-front
npm install
```

Suivez ensuite les instructions propres à chaque sous-projet :

- **Backend** : voir `designpatern/Readme.md` (configuration `.env`, migrations Prisma, scripts npm).
- **Frontend** : voir `design-front/README.md` (variables d’environnement, commandes SvelteKit, scénarios utilisateur).

## Structure

```
├── designpatern/     # API sécurisée (Node.js/Express + Prisma/PostgreSQL)
└── design-front/     # Frontend SvelteKit 2 consommant l’API
```

Bon courage pour la suite du TP !`