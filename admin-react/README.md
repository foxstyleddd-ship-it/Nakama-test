# 🎮 Frontend d'Administration React - MMO Harry Potter

Interface web d'administration React avec Shadcn UI pour le backend Nakama du MMO Harry Potter.

## 🚀 Stack Technique

- **React 18** - Bibliothèque UI
- **TypeScript** - Typage statique
- **Vite** - Build tool et dev server
- **Tailwind CSS** - Framework CSS utilitaire
- **Shadcn UI** - Composants UI réutilisables
- **Radix UI** - Primitives accessibles
- **Nakama JS SDK** - Client pour le backend Nakama
- **Lucide React** - Icônes

## 📋 Fonctionnalités

### Authentification
- Connexion sécurisée avec email et mot de passe
- Session persistante avec localStorage
- Vérification automatique de session au démarrage
- Déconnexion

### Gestion des Maisons 🏰
- **Classement en temps réel** : Visualisation du classement des 4 maisons
- **Attribution de points** : Ajouter ou retirer des points
- **Historique** : Affichage des 20 dernières transactions avec horodatage

### Gestion des Personnages 👤
- **Liste complète** : Grille de cartes affichant tous les personnages
- **Détails modifiables** : Modal avec onglets pour informations, sorts, inventaire

## 🛠️ Installation

### Prérequis
- Node.js 18+ et npm
- Serveur Nakama démarré sur localhost:7350

### Installation des dépendances

```bash
cd admin-react
npm install
```

## 🏃 Développement

### Démarrer le serveur de développement

```bash
npm run dev
```

L'application sera accessible sur http://localhost:5173

### Build de production

```bash
npm run build
```

## 🔧 Configuration

Modifiez les constantes dans src/lib/nakama.ts si nécessaire :

```typescript
const NAKAMA_SERVER = "localhost";
const NAKAMA_PORT = "7350";
const NAKAMA_USE_SSL = false;
```

## 📝 Licence

Ce projet fait partie du backend Nakama pour le MMO Harry Potter.
