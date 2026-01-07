# Nakama Backend pour Unreal Engine

Ce projet contient la configuration du serveur Nakama pour votre projet Unreal Engine.

## Qu'est-ce que Nakama?

Nakama est un serveur backend open-source pour les jeux qui fournit:
- Authentification des utilisateurs
- Stockage de données
- Matchmaking
- Chat en temps réel
- Classements (leaderboards)
- Groupes et amis
- Et bien plus...

## Prérequis

- Docker et Docker Compose installés sur votre machine
- Ports disponibles: 7349, 7350, 7351, 5432, 8080

## Installation

### 1. Démarrer Nakama

```bash
docker-compose up -d
```

Cette commande va:
- Télécharger les images Docker nécessaires (PostgreSQL et Nakama)
- Créer et démarrer les conteneurs
- Initialiser la base de données

### 2. Vérifier que Nakama est en cours d'exécution

```bash
docker-compose ps
```

Vous devriez voir les conteneurs `nakama` et `nakama-postgres` en état "Up".

### 3. Accéder à la console d'administration

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

### Installation du client Nakama

1. Téléchargez le plugin Nakama Unreal depuis: https://github.com/heroiclabs/nakama-unreal
2. Copiez le dossier du plugin dans le dossier `Plugins` de votre projet Unreal
3. Redémarrez Unreal Engine

### Configuration du client

Dans votre projet Unreal, utilisez ces paramètres:
- **Server**: `localhost` (ou l'IP de votre serveur)
- **Port**: `7350`
- **Server Key**: `defaultkey`

### Exemple de connexion

```cpp
// Créer un client Nakama
UNakamaClient* Client = UNakamaClient::CreateDefaultClient(
    TEXT("defaultkey"),
    TEXT("localhost"),
    7350,
    TEXT("http")
);

// Authentifier un utilisateur
Client->AuthenticateDevice(
    TEXT("unique-device-id"),
    TEXT(""),
    true,
    {},
    [](UNakamaSession* Session)
    {
        UE_LOG(LogTemp, Log, TEXT("Connecté avec succès!"));
    },
    [](const FNakamaError& Error)
    {
        UE_LOG(LogTemp, Error, TEXT("Erreur de connexion: %s"), *Error.Message);
    }
);
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

## Ressources

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
