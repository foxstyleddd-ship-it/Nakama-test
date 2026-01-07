/**
 * Nakama Server Module pour MMO Harry Potter
 * Gestion des personnages par compte utilisateur
 */

interface Character {
  id: string;
  name: string;
  level: number;
  xp: number;
  createdAt: number;
  updatedAt: number;
}

interface CreateCharacterRequest {
  name: string;
}

interface UpdateCharacterRequest {
  characterId: string;
  level?: number;
  xp?: number;
  name?: string;
}

interface DeleteCharacterRequest {
  characterId: string;
}

const COLLECTION_CHARACTERS = "characters";
const MAX_CHARACTERS_PER_ACCOUNT = 10;

/**
 * Initialise le module serveur
 */
function InitModule(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, initializer: nkruntime.Initializer) {
  // Enregistrement des RPCs
  initializer.registerRpc("create_character", rpcCreateCharacter);
  initializer.registerRpc("get_characters", rpcGetCharacters);
  initializer.registerRpc("update_character", rpcUpdateCharacter);
  initializer.registerRpc("delete_character", rpcDeleteCharacter);
  initializer.registerRpc("get_character", rpcGetCharacter);

  logger.info("Module de gestion des personnages Harry Potter initialisé");
}

/**
 * RPC: Créer un nouveau personnage
 */
function rpcCreateCharacter(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  if (!ctx.userId) {
    throw Error("Utilisateur non authentifié");
  }

  const request: CreateCharacterRequest = JSON.parse(payload);

  // Validation du nom
  if (!request.name || request.name.trim().length < 2 || request.name.trim().length > 20) {
    throw Error("Le nom du personnage doit contenir entre 2 et 20 caractères");
  }

  // Vérifier le nombre de personnages existants
  const existingCharacters = nk.storageRead([{
    collection: COLLECTION_CHARACTERS,
    userId: ctx.userId,
  }]);

  if (existingCharacters.length >= MAX_CHARACTERS_PER_ACCOUNT) {
    throw Error(`Nombre maximum de personnages atteint (${MAX_CHARACTERS_PER_ACCOUNT})`);
  }

  // Créer le personnage
  const characterId = nk.uuidv4();
  const now = Date.now();

  const character: Character = {
    id: characterId,
    name: request.name.trim(),
    level: 1,
    xp: 0,
    createdAt: now,
    updatedAt: now,
  };

  // Sauvegarder dans le storage
  const write: nkruntime.StorageWriteRequest = {
    collection: COLLECTION_CHARACTERS,
    key: characterId,
    userId: ctx.userId,
    value: character,
    permissionRead: 1, // Lecture privée (propriétaire seulement)
    permissionWrite: 0, // Écriture interdite aux clients
  };

  nk.storageWrite([write]);

  logger.info("Nouveau personnage créé: %s pour l'utilisateur %s", character.name, ctx.userId);

  return JSON.stringify(character);
}

/**
 * RPC: Récupérer tous les personnages d'un utilisateur
 */
function rpcGetCharacters(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  if (!ctx.userId) {
    throw Error("Utilisateur non authentifié");
  }

  // Lire tous les personnages de l'utilisateur
  const objects = nk.storageList(ctx.userId, COLLECTION_CHARACTERS, 100);

  const characters: Character[] = objects.map(obj => obj.value as Character);

  // Trier par date de création
  characters.sort((a, b) => a.createdAt - b.createdAt);

  logger.info("Récupération de %d personnages pour l'utilisateur %s", characters.length, ctx.userId);

  return JSON.stringify({ characters });
}

/**
 * RPC: Récupérer un personnage spécifique
 */
function rpcGetCharacter(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  if (!ctx.userId) {
    throw Error("Utilisateur non authentifié");
  }

  const request = JSON.parse(payload);
  const characterId = request.characterId;

  if (!characterId) {
    throw Error("ID du personnage requis");
  }

  // Lire le personnage
  const objects = nk.storageRead([{
    collection: COLLECTION_CHARACTERS,
    key: characterId,
    userId: ctx.userId,
  }]);

  if (objects.length === 0) {
    throw Error("Personnage non trouvé");
  }

  const character = objects[0].value as Character;

  return JSON.stringify(character);
}

/**
 * RPC: Mettre à jour un personnage
 */
function rpcUpdateCharacter(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  if (!ctx.userId) {
    throw Error("Utilisateur non authentifié");
  }

  const request: UpdateCharacterRequest = JSON.parse(payload);

  if (!request.characterId) {
    throw Error("ID du personnage requis");
  }

  // Lire le personnage existant
  const objects = nk.storageRead([{
    collection: COLLECTION_CHARACTERS,
    key: request.characterId,
    userId: ctx.userId,
  }]);

  if (objects.length === 0) {
    throw Error("Personnage non trouvé");
  }

  const character = objects[0].value as Character;

  // Mettre à jour les champs
  if (request.name !== undefined) {
    if (request.name.trim().length < 2 || request.name.trim().length > 20) {
      throw Error("Le nom du personnage doit contenir entre 2 et 20 caractères");
    }
    character.name = request.name.trim();
  }

  if (request.level !== undefined) {
    if (request.level < 1 || request.level > 100) {
      throw Error("Le niveau doit être entre 1 et 100");
    }
    character.level = request.level;
  }

  if (request.xp !== undefined) {
    if (request.xp < 0) {
      throw Error("L'XP ne peut pas être négatif");
    }
    character.xp = request.xp;
  }

  character.updatedAt = Date.now();

  // Sauvegarder
  const write: nkruntime.StorageWriteRequest = {
    collection: COLLECTION_CHARACTERS,
    key: request.characterId,
    userId: ctx.userId,
    value: character,
    permissionRead: 1,
    permissionWrite: 0,
  };

  nk.storageWrite([write]);

  logger.info("Personnage mis à jour: %s (ID: %s)", character.name, character.id);

  return JSON.stringify(character);
}

/**
 * RPC: Supprimer un personnage
 */
function rpcDeleteCharacter(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  if (!ctx.userId) {
    throw Error("Utilisateur non authentifié");
  }

  const request: DeleteCharacterRequest = JSON.parse(payload);

  if (!request.characterId) {
    throw Error("ID du personnage requis");
  }

  // Vérifier que le personnage existe
  const objects = nk.storageRead([{
    collection: COLLECTION_CHARACTERS,
    key: request.characterId,
    userId: ctx.userId,
  }]);

  if (objects.length === 0) {
    throw Error("Personnage non trouvé");
  }

  // Supprimer
  nk.storageDelete([{
    collection: COLLECTION_CHARACTERS,
    key: request.characterId,
    userId: ctx.userId,
  }]);

  logger.info("Personnage supprimé: %s", request.characterId);

  return JSON.stringify({ success: true });
}

// Point d'entrée du module
// @ts-ignore
!InitModule && InitModule(ctx, logger, nk, initializer);
