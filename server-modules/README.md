# Modules Serveur Nakama - MMO Harry Potter

Ce dossier contient les modules serveur TypeScript pour gérer la logique backend du MMO Harry Potter.

## Fonctionnalités

### Gestion des Personnages

Chaque joueur peut créer jusqu'à 10 personnages avec :
- **ID unique** généré automatiquement
- **Nom** (2-20 caractères)
- **Niveau** (1-100)
- **XP** (points d'expérience)
- **Timestamps** de création et modification

## Compilation

```bash
cd server-modules
npm install
npm run build
```

Le fichier compilé sera généré dans `build/index.js`.

## Mode développement

```bash
npm run watch
```

Le module sera recompilé automatiquement à chaque modification.

## RPCs Disponibles

Tous les RPCs nécessitent une authentification.

### 1. create_character

Crée un nouveau personnage.

**Payload:**
```json
{
  "name": "Harry Potter"
}
```

**Réponse:**
```json
{
  "id": "uuid-generé",
  "name": "Harry Potter",
  "level": 1,
  "xp": 0,
  "createdAt": 1234567890,
  "updatedAt": 1234567890
}
```

### 2. get_characters

Récupère tous les personnages de l'utilisateur connecté.

**Payload:** `{}` (vide)

**Réponse:**
```json
{
  "characters": [
    {
      "id": "uuid-1",
      "name": "Harry Potter",
      "level": 5,
      "xp": 1250,
      "createdAt": 1234567890,
      "updatedAt": 1234567900
    },
    {
      "id": "uuid-2",
      "name": "Hermione Granger",
      "level": 3,
      "xp": 800,
      "createdAt": 1234567891,
      "updatedAt": 1234567901
    }
  ]
}
```

### 3. get_character

Récupère un personnage spécifique.

**Payload:**
```json
{
  "characterId": "uuid-du-personnage"
}
```

**Réponse:**
```json
{
  "id": "uuid-du-personnage",
  "name": "Harry Potter",
  "level": 5,
  "xp": 1250,
  "createdAt": 1234567890,
  "updatedAt": 1234567900
}
```

### 4. update_character

Met à jour un personnage (niveau, XP, nom).

**Payload:**
```json
{
  "characterId": "uuid-du-personnage",
  "level": 6,
  "xp": 1500,
  "name": "Harry J. Potter"
}
```

Tous les champs sauf `characterId` sont optionnels.

**Réponse:**
```json
{
  "id": "uuid-du-personnage",
  "name": "Harry J. Potter",
  "level": 6,
  "xp": 1500,
  "createdAt": 1234567890,
  "updatedAt": 1234567999
}
```

### 5. delete_character

Supprime un personnage.

**Payload:**
```json
{
  "characterId": "uuid-du-personnage"
}
```

**Réponse:**
```json
{
  "success": true
}
```

## Limites

- **Maximum 10 personnages par compte**
- **Nom:** 2-20 caractères
- **Niveau:** 1-100
- **XP:** >= 0

## Sécurité

- Tous les RPCs nécessitent une authentification
- Les personnages sont stockés avec des permissions privées (lecture/écriture réservées au propriétaire)
- Validation des entrées côté serveur
