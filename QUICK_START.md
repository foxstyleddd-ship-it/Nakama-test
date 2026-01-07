# 🚀 Démarrage Rapide - Windows

## Le problème que tu rencontres

L'erreur `JavaScript entrypoint must be a valid path` signifie que Nakama ne trouve pas le fichier compilé `index.js`.

## ✅ Solution en 3 étapes

### 1. Compiler les modules serveur (OBLIGATOIRE)

```powershell
# Dans PowerShell, depuis le dossier Nakama-test
cd server-modules
npm install
npm run build
cd ..
```

Cela va créer le fichier `server-modules\build\index.js` (35 KB).

### 2. Vérifier que le fichier existe

```powershell
# Doit afficher le fichier index.js
dir server-modules\build\
```

### 3. Redémarrer Docker

```powershell
docker-compose down
docker-compose up -d
```

## 🔍 Vérification

```powershell
# Voir les logs Nakama
docker logs nakama

# Doit afficher des lignes comme :
# {"level":"info"...,"msg":"Registered RPC function","id":"create_character"}
# {"level":"info"...,"msg":"Startup done"}
```

## 📝 Workflow de développement

Chaque fois que tu modifies `server-modules/src/main.ts` :

```powershell
# 1. Recompiler
cd server-modules
npm run build
cd ..

# 2. Redémarrer Nakama
docker-compose restart nakama

# 3. Vérifier les logs
docker logs -f nakama
```

## 🎯 Tester avec le frontend

```powershell
# Terminal 1 : Nakama doit tourner
docker-compose up -d

# Terminal 2 : Lancer le frontend React
cd admin-react
npm install
npm run dev

# Ouvrir http://localhost:5173
```

## ❌ Problèmes fréquents

### "npm ERR! 404 @heroiclabs/nakama-runtime"
✅ **Résolu !** Pull les derniers changements : `git pull`

### "stat modules/index.js: no such file or directory"
✅ Tu dois compiler : `cd server-modules && npm run build`

### Container en restart loop
```powershell
# Vérifier PostgreSQL
docker ps

# Nettoyer et recréer
docker-compose down -v
docker-compose up -d
```

## 🔗 Liens utiles

- Console Nakama : http://localhost:7351 (admin/password)
- API HTTP : http://localhost:7350
- Frontend React : http://localhost:5173 (après `npm run dev`)
