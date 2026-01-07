# Nakama Backend pour MMO Harry Potter (Unreal Engine)

Ce projet contient la configuration du serveur Nakama pour votre MMO Harry Potter, incluant un système complet de gestion de personnages.

## Qu'est-ce que Nakama?

Nakama est un serveur backend open-source pour les jeux qui fournit:
- Authentification des utilisateurs
- Stockage de données
- Matchmaking
- Chat en temps réel
- Classements (leaderboards)
- Groupes et amis
- Et bien plus...

## Fonctionnalités

### 🎮 Système de Gestion de Personnages

Le serveur inclut un système complet pour gérer les personnages de votre MMO:
- **Création de personnages** (max 10 par compte)
- **Stockage persistant** des données
- **Gestion du niveau et de l'XP**
- **Système de maisons** (Venatrix, Falcon, Brumval, Aerwyn)
- **Mise à jour en temps réel**
- **Suppression de personnages**

Chaque personnage contient:
- ID unique
- Nom (2-20 caractères)
- Niveau (1-100)
- Points d'expérience (XP)
- Maison (assignable après création)
- Timestamps de création et modification

### 🏰 Système de Maisons

Quatre maisons personnalisées pour votre univers:
- **Venatrix** - Pour les chasseurs et stratèges
- **Falcon** - Pour les courageux et audacieux
- **Brumval** - Pour les loyaux et patients
- **Aerwyn** - Pour les sages et créatifs

Chaque personnage commence avec **"Pas de Maison"** et peut être assigné à une maison via une cérémonie de répartition dans votre jeu.

### 🏆 Système de Points de Maison

Compétition entre les maisons avec un système complet de points:
- **Ajout/retrait de points** avec raison et personnage (optionnel)
- **Classement en temps réel** des maisons
- **Historique complet** de toutes les transactions
- **Stockage persistant** des scores

Utilisez ce système pour récompenser les bonnes actions et pénaliser les infractions, créant ainsi une compétition dynamique entre les maisons!

### 🎒 Système d'Inventaire

Gestion complète de l'inventaire pour chaque personnage:
- **19 objets prédéfinis** (baguettes, potions, livres, équipement, ingrédients, consommables)
- **Empilement automatique** avec limites par type d'objet
- **5 niveaux de rareté** (common, uncommon, rare, epic, legendary)
- **Ajout/suppression d'objets** avec validation
- **Stockage persistant** par personnage

Objets légendaires inclus : Baguette de Sureau, Felix Felicis, Cape d'Invisibilité, et plus encore!

### ⚡ Système de Sorts

Apprentissage et progression des sorts magiques:
- **22 sorts prédéfinis** (Expelliarmus, Protego, Incendio, Stupefix, etc.)
- **Amélioration progressive** de niveau 0 à 3
- **5 catégories** : offensif, défensif, soin, contrôle, utilitaire
- **7 éléments magiques** : feu, glace, foudre, nature, lumière, ténèbres, neutre
- **Progression personnalisée** : chaque joueur choisit ses sorts

Maîtrisez des sorts légendaires comme Protego, Bombarda, ou le mystérieux Transplanage!

📖 **[Guide d'intégration Unreal Engine complet →](UNREAL_INTEGRATION.md)**

## Prérequis

- Docker et Docker Compose installés sur votre machine
- Node.js et npm (pour compiler les modules serveur)
- Ports disponibles: 7349, 7350, 7351, 5432, 8080

## Installation

### 1. Compiler les modules serveur

```bash
cd server-modules
npm install
npm run build
cd ..
```

Cette étape compile le code TypeScript du système de gestion de personnages.

### 2. Démarrer Nakama

```bash
docker-compose up -d
```

Cette commande va:
- Télécharger les images Docker nécessaires (PostgreSQL et Nakama)
- Créer et démarrer les conteneurs
- Initialiser la base de données
- Charger les modules serveur personnalisés

### 3. Vérifier que Nakama est en cours d'exécution

```bash
docker-compose ps
```

Vous devriez voir les conteneurs `nakama` et `nakama-postgres` en état "Up".

### 4. Accéder à la console d'administration

Ouvrez votre navigateur et allez à: http://localhost:7351

**Identifiants par défaut:**
- Username: `admin`
- Password: `password`

⚠️ **Important**: Changez ces identifiants en production!

## Arrêter Nakama

```bash
docker-compose down
```

Pour supprimer également les données:
```bash
docker-compose down -v
```

## Configuration

### Ports utilisés

- **7349**: Nakama API HTTP
- **7350**: Nakama Socket (WebSocket pour temps réel)
- **7351**: Console d'administration Nakama
- **5432**: PostgreSQL database
- **8080**: PostgreSQL metrics

### Modifier la configuration

Éditez le fichier `nakama/data/local.yml` pour personnaliser:
- Les clés de sécurité (⚠️ **obligatoire en production**)
- Les durées d'expiration des tokens
- Les paramètres du logger
- Et plus...

Après modification, redémarrez Nakama:
```bash
docker-compose restart nakama
```

## Intégration avec Unreal Engine

### Guide complet

📖 **Consultez le [Guide d'intégration Unreal Engine](UNREAL_INTEGRATION.md)** pour:
- Intégration complète du client Nakama
- Exemples de code C++ pour la gestion de personnages
- Utilisation en Blueprints
- Système de sauvegarde automatique
- Gestion de la progression (niveau/XP)

### Installation rapide du client Nakama

1. Téléchargez le plugin depuis: https://github.com/heroiclabs/nakama-unreal
2. Placez-le dans `VotreProjet/Plugins/Nakama/`
3. Redémarrez Unreal Engine

### Configuration de base

```cpp
UNakamaClient* Client = UNakamaClient::CreateDefaultClient(
    TEXT("defaultkey"),
    TEXT("localhost"),
    7350,
    TEXT("http")
);
```

### Utiliser les RPCs de personnages

Une fois authentifié, appelez les RPCs:

```cpp
// Créer un personnage
Client->RPC(Session, TEXT("create_character"), TEXT("{\"name\":\"Harry Potter\"}"), ...);

// Récupérer tous les personnages
Client->RPC(Session, TEXT("get_characters"), TEXT("{}"), ...);

// Assigner une maison
Client->RPC(Session, TEXT("assign_house"),
    TEXT("{\"characterId\":\"xxx\",\"house\":\"Venatrix\"}"), ...);

// Mettre à jour (niveau/XP)
Client->RPC(Session, TEXT("update_character"),
    TEXT("{\"characterId\":\"xxx\",\"level\":5,\"xp\":1250}"), ...);

// Ajouter des points à une maison
Client->RPC(Session, TEXT("add_house_points"),
    TEXT("{\"house\":\"Venatrix\",\"amount\":10,\"characterName\":\"Harry\",\"reason\":\"Courage\"}"), ...);

// Obtenir le classement des maisons
Client->RPC(Session, TEXT("get_house_rankings"), TEXT("{}"), ...);

// Ajouter un objet à l'inventaire
Client->RPC(Session, TEXT("add_item_to_inventory"),
    TEXT("{\\\"characterId\\\":\\\"xxx\\\",\\\"itemId\\\":\\\"wand_oak\\\",\\\"quantity\\\":1}"), ...);

// Récupérer l'inventaire d'un personnage
Client->RPC(Session, TEXT("get_character_inventory"),
    TEXT("{\\\"characterId\\\":\\\"xxx\\\"}"), ...);

// Obtenir la liste des objets disponibles
Client->RPC(Session, TEXT("get_available_items"), TEXT("{}"), ...);

// Apprendre un sort
Client->RPC(Session, TEXT("learn_spell"),
    TEXT("{\\\"characterId\\\":\\\"xxx\\\",\\\"spellId\\\":\\\"spell_expelliarmus\\\"}"), ...);

// Améliorer un sort
Client->RPC(Session, TEXT("upgrade_spell"),
    TEXT("{\\\"characterId\\\":\\\"xxx\\\",\\\"spellId\\\":\\\"spell_expelliarmus\\\"}"), ...);

// Récupérer les sorts d'un personnage
Client->RPC(Session, TEXT("get_character_spells"),
    TEXT("{\\\"characterId\\\":\\\"xxx\\\"}"), ...);

// Obtenir la liste des sorts disponibles
Client->RPC(Session, TEXT("get_available_spells"), TEXT("{}"), ...);
```

## Logs

Pour voir les logs en temps réel:
```bash
docker-compose logs -f nakama
```

## Sauvegarde

Les données de la base de données sont stockées dans un volume Docker. Pour sauvegarder:

```bash
docker exec nakama-postgres pg_dump -U postgres nakama > backup.sql
```

Pour restaurer:
```bash
cat backup.sql | docker exec -i nakama-postgres psql -U postgres nakama
```

## Sécurité pour la Production

⚠️ **Avant de déployer en production, modifiez:**

1. **Mot de passe de la base de données** dans `docker-compose.yml`
2. **Clés de sécurité** dans `nakama/data/local.yml`:
   - `signing_key`
   - `server_key`
   - `encryption_key`
   - `refresh_encryption_key`
   - `http_key`
3. **Identifiants console** dans `nakama/data/local.yml`

Générez des clés aléatoires sécurisées avec:
```bash
openssl rand -base64 32
```

## Structure du Projet

```
Nakama-test/
├── docker-compose.yml              # Configuration Docker
├── nakama/
│   └── data/
│       └── local.yml               # Configuration Nakama
├── server-modules/                 # Modules serveur personnalisés
│   ├── src/
│   │   └── main.ts                 # Logique de gestion des personnages
│   ├── build/                      # Code compilé (généré)
│   ├── package.json
│   └── tsconfig.json
├── README.md                       # Ce fichier
└── UNREAL_INTEGRATION.md           # Guide d'intégration Unreal
```

## Développement des Modules Serveur

Les modules serveur sont écrits en TypeScript et compilés en JavaScript.

### Modifier la logique serveur

1. Éditez `server-modules/src/main.ts`
2. Compilez: `cd server-modules && npm run build`
3. Redémarrez Nakama: `docker-compose restart nakama`

### Mode développement (auto-recompilation)

```bash
cd server-modules
npm run watch
```

### Ajouter de nouvelles fonctionnalités

Vous pouvez facilement étendre le système pour ajouter:
- ✅ **Maisons** (déjà implémenté: Venatrix, Falcon, Brumval, Aerwyn)
- ✅ **Points de maison** (déjà implémenté: ajout/retrait, classement, historique)
- ✅ **Inventaire** (déjà implémenté: 19 objets, 6 catégories, empilement automatique)
- ✅ **Sorts** (déjà implémenté: 22 sorts, 5 types, amélioration jusqu'au niveau 3)
- Quêtes complétées
- Statistiques de jeu
- Récompenses automatiques pour les maisons gagnantes
- Crafting et alchimie
- Système de cooldown pour les sorts

Consultez `server-modules/README.md` pour plus de détails.

## Ressources

- 📖 [Guide d'intégration Unreal Engine](UNREAL_INTEGRATION.md)
- 📖 [Documentation modules serveur](server-modules/README.md)
- [Documentation Nakama](https://heroiclabs.com/docs/)
- [Documentation Nakama Unreal](https://heroiclabs.com/docs/unreal-client-guide/)
- [API Reference](https://heroiclabs.com/docs/runtime-code-basics/)
- [Forum Communautaire](https://forum.heroiclabs.com/)

## Dépannage

### Le serveur ne démarre pas

Vérifiez que les ports ne sont pas déjà utilisés:
```bash
netstat -tuln | grep -E '7349|7350|7351|5432'
```

### Erreur de connexion depuis Unreal

1. Vérifiez que Nakama est démarré: `docker-compose ps`
2. Vérifiez que le `server_key` correspond
3. Vérifiez le firewall si vous utilisez un serveur distant

### Réinitialiser complètement

```bash
docker-compose down -v
docker-compose up -d
```

Cela supprimera toutes les données et recréera une installation fraîche.
