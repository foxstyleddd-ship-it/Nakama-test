# Modules Serveur Nakama - MMO Harry Potter

Ce dossier contient les modules serveur TypeScript pour gérer la logique backend du MMO Harry Potter.

## Fonctionnalités

### Gestion des Personnages

Chaque joueur peut créer jusqu'à 10 personnages avec :
- **ID unique** généré automatiquement
- **Nom** (2-20 caractères)
- **Niveau** (1-100)
- **XP** (points d'expérience)
- **Maison** (Venatrix, Falcon, Brumval, Aerwyn, ou "Pas de Maison")
- **Timestamps** de création et modification

### Système de Maisons

Quatre maisons sont disponibles dans le MMO:
- **Venatrix** 🦅
- **Falcon** 🦅
- **Brumval** 🦡
- **Aerwyn** 🦁

À la création, chaque personnage commence avec **"Pas de Maison"** et peut ensuite être assigné à une maison via le RPC `assign_house`.

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
  "house": "Pas de Maison",
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
      "house": "Venatrix",
      "createdAt": 1234567890,
      "updatedAt": 1234567900
    },
    {
      "id": "uuid-2",
      "name": "Hermione Granger",
      "level": 3,
      "xp": 800,
      "house": "Falcon",
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
  "house": "Venatrix",
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
  "house": "Venatrix",
  "createdAt": 1234567890,
  "updatedAt": 1234567999
}
```

### 5. assign_house

Assigne une maison à un personnage.

**Payload:**
```json
{
  "characterId": "uuid-du-personnage",
  "house": "Venatrix"
}
```

**Maisons valides:**
- `"Pas de Maison"` (par défaut)
- `"Venatrix"`
- `"Falcon"`
- `"Brumval"`
- `"Aerwyn"`

**Réponse:**
```json
{
  "id": "uuid-du-personnage",
  "name": "Harry Potter",
  "level": 5,
  "xp": 1250,
  "house": "Venatrix",
  "createdAt": 1234567890,
  "updatedAt": 1234567999
}
```

### 6. delete_character

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

---

## RPCs - Système de Points de Maison

### 7. add_house_points

Ajoute des points à une maison.

**Payload:**
```json
{
  "house": "Venatrix",
  "amount": 10,
  "characterName": "Harry Potter",
  "reason": "A sauvé un élève en danger"
}
```

**Champs:**
- `house` (requis): Nom de la maison (Venatrix, Falcon, Brumval, Aerwyn)
- `amount` (requis): Nombre de points à ajouter (> 0)
- `characterName` (optionnel): Nom du personnage qui a gagné les points
- `reason` (requis): Raison de l'attribution des points

**Réponse:**
```json
{
  "house": "Venatrix",
  "points": 150,
  "updatedAt": 1234567890
}
```

### 8. remove_house_points

Retire des points à une maison.

**Payload:**
```json
{
  "house": "Falcon",
  "amount": 5,
  "characterName": "Ron Weasley",
  "reason": "Désobéissance aux règles"
}
```

**Champs:** Identiques à `add_house_points`

**Réponse:**
```json
{
  "house": "Falcon",
  "points": 145,
  "updatedAt": 1234567890
}
```

### 9. get_house_rankings

Récupère le classement des maisons triées par points.

**Payload:** `{}` (vide ou non requis)

**Réponse:**
```json
{
  "rankings": [
    {
      "house": "Venatrix",
      "points": 250,
      "updatedAt": 1234567890
    },
    {
      "house": "Falcon",
      "points": 220,
      "updatedAt": 1234567891
    },
    {
      "house": "Aerwyn",
      "points": 180,
      "updatedAt": 1234567892
    },
    {
      "house": "Brumval",
      "points": 175,
      "updatedAt": 1234567893
    }
  ]
}
```

### 10. get_house_points_history

Récupère l'historique des transactions de points.

**Payload:**
```json
{
  "house": "Venatrix",
  "limit": 20
}
```

**Champs (tous optionnels):**
- `house`: Filtrer par maison spécifique
- `limit`: Nombre maximum de transactions (par défaut: 50)

**Réponse:**
```json
{
  "history": [
    {
      "id": "uuid-transaction-1",
      "house": "Venatrix",
      "amount": 10,
      "characterName": "Harry Potter",
      "reason": "A sauvé un élève",
      "type": "add",
      "timestamp": 1234567890
    },
    {
      "id": "uuid-transaction-2",
      "house": "Venatrix",
      "amount": 5,
      "characterName": "Hermione Granger",
      "reason": "Mauvaise conduite",
      "type": "remove",
      "timestamp": 1234567880
    }
  ]
}
```

---

## Limites

### Personnages
- **Maximum 10 personnages par compte**
- **Nom:** 2-20 caractères
- **Niveau:** 1-100
- **XP:** >= 0
- **Maison:** Doit être l'une des 5 maisons valides

### Points de Maison
- **Montant des points:** > 0
- **Raison:** Obligatoire, non vide
- **Maisons valides pour les points:** Venatrix, Falcon, Brumval, Aerwyn (pas "Pas de Maison")
- **Historique:** Limite par défaut de 50 transactions

## Sécurité

- Tous les RPCs nécessitent une authentification
- Les personnages sont stockés avec des permissions privées (lecture/écriture réservées au propriétaire)
- Les points de maison et l'historique sont en lecture publique mais écriture interdite aux clients
- Validation des entrées côté serveur
