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

### Système d'Inventaire

Chaque personnage possède un inventaire persistant avec :
- **19 objets prédéfinis** répartis en 6 catégories
- **Empilement automatique** jusqu'à la limite maxStack
- **5 niveaux de rareté** (common, uncommon, rare, epic, legendary)
- **Catégories** : baguettes, potions, livres, équipement, ingrédients, consommables

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

## RPCs - Système d'Inventaire

### 11. add_item_to_inventory

Ajoute un objet à l'inventaire d'un personnage.

**Payload:**
```json
{
  "characterId": "uuid-du-personnage",
  "itemId": "wand_oak",
  "quantity": 1
}
```

**Champs:**
- `characterId` (requis): ID du personnage
- `itemId` (requis): ID de l'objet (doit exister dans la liste prédéfinie)
- `quantity` (requis): Quantité à ajouter (> 0)

**Réponse:**
```json
{
  "inventory": {
    "characterId": "uuid-du-personnage",
    "items": [
      {
        "itemId": "wand_oak",
        "quantity": 1,
        "addedAt": 1234567890,
        "item": {
          "id": "wand_oak",
          "name": "Baguette en Chêne",
          "description": "Une baguette solide en bois de chêne",
          "type": "wand",
          "rarity": "common",
          "maxStack": 1
        }
      }
    ],
    "updatedAt": 1234567890
  },
  "itemAdded": {
    "id": "wand_oak",
    "name": "Baguette en Chêne",
    "description": "Une baguette solide en bois de chêne",
    "type": "wand",
    "rarity": "common",
    "maxStack": 1
  }
}
```

### 12. remove_item_from_inventory

Retire un objet de l'inventaire d'un personnage.

**Payload:**
```json
{
  "characterId": "uuid-du-personnage",
  "itemId": "potion_health",
  "quantity": 3
}
```

**Champs:**
- `characterId` (requis): ID du personnage
- `itemId` (requis): ID de l'objet à retirer
- `quantity` (requis): Quantité à retirer (> 0)

**Réponse:**
```json
{
  "inventory": {
    "characterId": "uuid-du-personnage",
    "items": [
      {
        "itemId": "potion_health",
        "quantity": 7,
        "addedAt": 1234567890,
        "item": {
          "id": "potion_health",
          "name": "Potion de Soin",
          "description": "Restaure les points de vie",
          "type": "potion",
          "rarity": "common",
          "maxStack": 20
        }
      }
    ],
    "updatedAt": 1234567895
  },
  "itemRemoved": {
    "id": "potion_health",
    "name": "Potion de Soin",
    "description": "Restaure les points de vie",
    "type": "potion",
    "rarity": "common",
    "maxStack": 20
  }
}
```

### 13. get_character_inventory

Récupère l'inventaire complet d'un personnage.

**Payload:**
```json
{
  "characterId": "uuid-du-personnage"
}
```

**Réponse:**
```json
{
  "characterId": "uuid-du-personnage",
  "items": [
    {
      "itemId": "wand_elder",
      "quantity": 1,
      "addedAt": 1234567890,
      "item": {
        "id": "wand_elder",
        "name": "Baguette de Sureau",
        "description": "La baguette la plus puissante jamais créée",
        "type": "wand",
        "rarity": "legendary",
        "maxStack": 1
      }
    },
    {
      "itemId": "potion_felix",
      "quantity": 2,
      "addedAt": 1234567891,
      "item": {
        "id": "potion_felix",
        "name": "Felix Felicis",
        "description": "Potion de chance liquide",
        "type": "potion",
        "rarity": "legendary",
        "maxStack": 5
      }
    }
  ],
  "updatedAt": 1234567895
}
```

### 14. get_available_items

Récupère la liste de tous les objets disponibles dans le jeu.

**Payload:** `{}` (vide ou non requis)

**Réponse:**
```json
{
  "items": [
    {
      "id": "wand_oak",
      "name": "Baguette en Chêne",
      "description": "Une baguette solide en bois de chêne",
      "type": "wand",
      "rarity": "common",
      "maxStack": 1
    },
    {
      "id": "wand_elder",
      "name": "Baguette de Sureau",
      "description": "La baguette la plus puissante jamais créée",
      "type": "wand",
      "rarity": "legendary",
      "maxStack": 1
    },
    {
      "id": "potion_health",
      "name": "Potion de Soin",
      "description": "Restaure les points de vie",
      "type": "potion",
      "rarity": "common",
      "maxStack": 20
    }
  ]
}
```

**Liste complète des objets (19 objets):**

**Baguettes (wand):**
- `wand_oak` - Baguette en Chêne (common, max 1)
- `wand_elder` - Baguette de Sureau (legendary, max 1)
- `wand_phoenix` - Baguette Plume de Phénix (epic, max 1)

**Potions (potion):**
- `potion_health` - Potion de Soin (common, max 20)
- `potion_mana` - Potion de Mana (common, max 20)
- `potion_felix` - Felix Felicis (legendary, max 5)
- `potion_polyjuice` - Polynectar (rare, max 10)

**Livres (book):**
- `book_spells_basic` - Manuel de Sorts de Base (common, max 5)
- `book_potions_advanced` - Potions Avancées (rare, max 3)
- `book_defense` - Défense contre les Forces du Mal (uncommon, max 5)

**Équipement (equipment):**
- `equipment_robe` - Robe de Sorcier (common, max 1)
- `equipment_hat` - Chapeau Pointu (common, max 1)
- `equipment_cloak_invisibility` - Cape d'Invisibilité (legendary, max 1)

**Ingrédients (ingredient):**
- `ingredient_dragon_scale` - Écaille de Dragon (rare, max 99)
- `ingredient_unicorn_hair` - Crin de Licorne (epic, max 99)
- `ingredient_mandrake_root` - Racine de Mandragore (uncommon, max 99)

**Consommables (consumable):**
- `consumable_chocolate_frog` - Chocogrenouille (common, max 50)
- `consumable_bertie_beans` - Dragées Surprises de Bertie Crochue (common, max 50)
- `consumable_pumpkin_juice` - Jus de Citrouille (common, max 30)

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

### Inventaire
- **Quantité:** > 0
- **ItemId:** Doit exister dans la liste prédéfinie (19 objets disponibles)
- **MaxStack:** Varie selon le type d'objet (1 pour baguettes, jusqu'à 99 pour ingrédients)
- **Objets empilables:** Les objets identiques s'empilent automatiquement jusqu'à maxStack
- **Catégories:** wand, potion, book, equipment, ingredient, consumable
- **Raretés:** common, uncommon, rare, epic, legendary

## Sécurité

- Tous les RPCs nécessitent une authentification
- Les personnages sont stockés avec des permissions privées (lecture/écriture réservées au propriétaire)
- Les points de maison et l'historique sont en lecture publique mais écriture interdite aux clients
- Les inventaires sont stockés avec des permissions privées (lecture/écriture réservées au propriétaire)
- Validation des entrées côté serveur
- Vérification de l'existence des objets dans la liste prédéfinie
