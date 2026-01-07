# 🎮 Frontend d'Administration - MMO Harry Potter

Interface web d'administration et de modération pour le backend Nakama du MMO Harry Potter.

## 📋 Fonctionnalités

### Authentification
- Connexion sécurisée avec email et mot de passe
- Session persistante avec localStorage
- Déconnexion

### Gestion des Maisons 🏰
- **Classement en temps réel** : Visualisation du classement des 4 maisons
- **Attribution de points** : Ajouter ou retirer des points avec :
  - Maison cible
  - Montant
  - Nom du personnage (optionnel)
  - Raison (obligatoire)
- **Historique** : Affichage des 20 dernières transactions

### Gestion des Personnages 👤
- **Liste complète** : Affichage de tous les personnages avec leurs informations
- **Détails modifiables** : Édition de :
  - Nom
  - Niveau (1-100)
  - XP
  - Maison

#### Onglet Sorts ⚡
- Affichage des sorts appris avec leur niveau (0-3)
- Amélioration de sorts (jusqu'au niveau 3)
- Apprentissage de nouveaux sorts depuis la liste prédéfinie (22 sorts)

#### Onglet Inventaire 🎒
- Affichage de tous les objets du personnage avec quantités
- Ajout d'objets depuis la liste prédéfinie (19 objets)
- Retrait d'objets (avec quantité personnalisable)

## 🚀 Installation

### Prérequis
- Serveur Nakama démarré (`docker-compose up -d`)
- Modules serveur compilés (`npm run build` dans `server-modules/`)
- Un serveur web pour héberger les fichiers HTML/CSS/JS

### Déploiement Local

#### Option 1 : Serveur Python
```bash
cd admin
python -m http.server 8000
```

Accédez à : `http://localhost:8000`

#### Option 2 : Serveur Node.js
```bash
npm install -g http-server
cd admin
http-server -p 8000
```

Accédez à : `http://localhost:8000`

#### Option 3 : Visual Studio Code Live Server
1. Installer l'extension "Live Server"
2. Clic droit sur `index.html` > "Open with Live Server"

### Configuration

Si votre serveur Nakama n'est pas sur `localhost:7350`, modifiez les constantes dans `js/app.js` :

```javascript
const NAKAMA_SERVER = "localhost";  // Votre adresse serveur
const NAKAMA_PORT = "7350";         // Votre port
const NAKAMA_USE_SSL = false;       // true si HTTPS
```

## 🔐 Connexion

Pour vous connecter au panneau d'administration, utilisez un compte Nakama avec les droits appropriés.

### Créer un compte admin

Via l'API Nakama :
```bash
curl -X POST http://localhost:7350/v2/account/authenticate/email \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

Ou utilisez l'interface web de Nakama Console : `http://localhost:7351`

## 📖 Guide d'Utilisation

### 1. Gestion des Points de Maison

**Ajouter des points :**
1. Allez dans l'onglet "Maisons"
2. Sélectionnez la maison
3. Choisissez "Ajouter" comme action
4. Entrez le montant
5. (Optionnel) Entrez le nom du personnage
6. Entrez la raison
7. Cliquez sur "Valider"

**Retirer des points :**
1. Même processus, mais choisissez "Retirer"

### 2. Gestion des Personnages

**Voir les personnages :**
1. Allez dans l'onglet "Personnages"
2. La liste s'affiche automatiquement
3. Cliquez sur un personnage pour voir les détails

**Modifier un personnage :**
1. Cliquez sur le personnage
2. Onglet "Informations"
3. Modifiez les champs souhaités
4. Cliquez sur "Enregistrer"

### 3. Gestion des Sorts

**Voir les sorts appris :**
1. Ouvrez les détails d'un personnage
2. Allez dans l'onglet "Sorts"

**Apprendre un nouveau sort :**
1. Onglet "Sorts" du personnage
2. Sélectionnez un sort dans la liste déroulante
3. Cliquez sur "Apprendre le Sort"

**Améliorer un sort :**
1. Cliquez sur le bouton "⬆️" à côté du sort
2. Le sort passe au niveau supérieur (max 3)

### 4. Gestion de l'Inventaire

**Voir l'inventaire :**
1. Ouvrez les détails d'un personnage
2. Allez dans l'onglet "Inventaire"

**Ajouter un objet :**
1. Onglet "Inventaire" du personnage
2. Sélectionnez un objet
3. Entrez la quantité
4. Cliquez sur "Ajouter l'Objet"

**Retirer un objet :**
1. Cliquez sur le bouton "🗑️" à côté de l'objet
2. Entrez la quantité à retirer
3. Confirmez

## 🎨 Structure du Projet

```
admin/
├── index.html          # Page principale
├── css/
│   └── style.css       # Styles de l'interface
├── js/
│   └── app.js          # Logique de l'application
└── README.md           # Ce fichier
```

## 🔧 Technologies Utilisées

- **HTML5** : Structure de l'interface
- **CSS3** : Mise en forme et animations
- **JavaScript (ES6+)** : Logique applicative
- **Nakama JavaScript SDK** : Communication avec le serveur

## 🛡️ Sécurité

### Recommandations pour la Production

1. **HTTPS Obligatoire** : Déployez uniquement sur HTTPS
2. **Authentification forte** : Utilisez des mots de passe robustes
3. **Contrôle d'accès** : Implémentez un système de rôles côté serveur
4. **Validation des entrées** : Toutes les entrées sont validées côté serveur
5. **Logs d'audit** : Tous les changements sont tracés dans l'historique

### Ajouter un Système de Rôles (Futur)

Pour restreindre l'accès, vous pouvez :
1. Ajouter des métadonnées de rôle aux comptes Nakama
2. Vérifier les rôles dans les RPCs côté serveur
3. Retourner une erreur si l'utilisateur n'a pas les droits

Exemple dans `main.ts` :
```typescript
function rpcAddHousePoints(ctx: nkruntime.Context, ...) {
  // Vérifier le rôle
  const account = nk.accountGetId(ctx.userId);
  const metadata = account.user.metadata;

  if (metadata.role !== 'admin' && metadata.role !== 'moderator') {
    throw Error("Accès refusé : droits insuffisants");
  }

  // Suite du code...
}
```

## 📊 Captures d'Écran

### Page de Connexion
Interface simple et élégante pour l'authentification.

### Onglet Maisons
- Classement des maisons en temps réel
- Formulaire d'ajout/retrait de points
- Historique des transactions

### Onglet Personnages
- Liste en grille de tous les personnages
- Badges de maison colorés
- Informations résumées (niveau, XP)

### Modal Personnage
- Onglet Informations : édition des données
- Onglet Sorts : gestion des sorts appris
- Onglet Inventaire : gestion des objets

## 🐛 Résolution de Problèmes

### Erreur de connexion
- Vérifiez que Nakama est démarré (`docker-compose ps`)
- Vérifiez l'adresse et le port dans `app.js`
- Consultez la console du navigateur (F12)

### Les personnages ne s'affichent pas
- Actuellement, seuls les personnages de l'utilisateur connecté s'affichent
- Pour voir tous les personnages, vous devez créer un RPC admin côté serveur

### CORS Errors
- Nakama doit autoriser les requêtes depuis votre domaine
- Vérifiez la configuration CORS dans `nakama/data/local.yml`

## 🚧 Améliorations Futures

- [ ] Système de rôles (Admin, Modérateur, Support)
- [ ] Filtres et recherche de personnages
- [ ] Statistiques et graphiques
- [ ] Export de données (CSV, JSON)
- [ ] Logs d'administration détaillés
- [ ] Gestion des utilisateurs/comptes
- [ ] Mode sombre
- [ ] Support multilingue

## 📝 Licence

Ce projet fait partie du backend Nakama pour le MMO Harry Potter.
