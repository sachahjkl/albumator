[English](README.md) | [Français](README.fr.md)

# albumator

Une application web moderne construite avec SvelteKit 5 pour gérer, partager et consulter vos collections de photos.
Elle privilégie la simplicité et les performances avec une base de données SQLite.

## Démonstration

![Démonstration](./assets/demo.webm)

## Pile technique

- **Frontend** : SvelteKit 5 avec TypeScript
- **Styles** : Tailwind CSS
- **Base de données** : DrizzleORM avec SQLite
- **Langage** : TypeScript

## Fonctionnalités

- Gestion des collections de photos
- Partage facile des photos
- Modes d'affichage des images et des galeries
- Recherche et filtres
- Design responsive
- Design brutaliste
- Expérience utilisateur conviviale

## Démarrage

### Prérequis

- Nix avec les flakes activés
- Node.js 22+ pour travailler hors de `nix develop`

### Développement

```bash
nix develop
pnpm install
cp .env.example .env
pnpm dev
```

`BODY_SIZE_LIMIT` doit rester fini en production. `DATABASE_URL` et `IMAGE_CACHE_DIR`
doivent désigner des emplacements persistants dans lesquels l'utilisateur de l'application peut écrire.
Le compte de démonstration intégré est désactivé par défaut. Activez-le explicitement avec
`ENABLE_DEMO_USER=true` dans les déploiements contrôlés.

La connexion et l'inscription sont limitées par débit pour chaque adresse cliente et chaque compte. Avec un
proxy inverse de confiance, configurez `ADDRESS_HEADER` et `XFF_DEPTH`. Ne faites jamais confiance aux en-têtes transférés
si le service Node est directement accessible.

### Contrôles

```bash
pnpm run format
pnpm run lint
pnpm run check
pnpm run build
```

Vous pouvez aussi exécuter les contrôles natifs du flake :

```bash
nix flake check
```

### Dérivés d'images

Les migrations s'appliquent automatiquement avant le démarrage en développement et en production. Après la mise à niveau
d'une ancienne installation, complétez les métadonnées ThumbHash et les dimensions des images existantes :

```bash
DATABASE_URL="file:local.db" pnpm run images:backfill
```

Les variantes responsives générées sont mises en cache sur le disque dans `IMAGE_CACHE_DIR`.
Les entrées du cache sont publiées de façon atomique et dédupliquées dans le processus du serveur. Elles sont supprimées
après la suppression d'une image et évincées selon leur âge et leur taille totale. Configurez la politique avec
`IMAGE_CACHE_MAX_BYTES`, `IMAGE_CACHE_MAX_AGE_SECONDS` et
`IMAGE_CACHE_CLEANUP_INTERVAL_SECONDS`. La valeur zéro désactive la limite correspondante.

Consultez l'espace actuellement occupé par le cache :

```bash
pnpm run images:cache:stats
```

### Exécuter l'application empaquetée

```bash
nix run .
```

L'application empaquetée applique les migrations validées avant l'écoute. Sauvegardez la base de données SQLite
avant une mise à niveau. Si une migration échoue, l'application s'arrête sans démarrer.

### Construire l'image Docker

```bash
nix build .#dockerImage
```

### Service NixOS

Le flake exporte `nixosModules.default`, qui définit `services.albumator`.
Définissez `services.albumator.enable = true;`, puis configurez `databaseUrl` ou `environmentFile` selon vos besoins.
