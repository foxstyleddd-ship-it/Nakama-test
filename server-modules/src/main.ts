/**
 * Nakama Server Module pour MMO Harry Potter
 * Gestion des personnages par compte utilisateur
 */

// Maisons disponibles dans le MMO Harry Potter
type House = "Pas de Maison" | "Venatrix" | "Falcon" | "Brumval" | "Aerwyn";

const VALID_HOUSES: House[] = ["Pas de Maison", "Venatrix", "Falcon", "Brumval", "Aerwyn"];
const DEFAULT_HOUSE: House = "Pas de Maison";

interface Character {
  id: string;
  name: string;
  level: number;
  xp: number;
  house: House;
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

interface AssignHouseRequest {
  characterId: string;
  house: House;
}

interface DeleteCharacterRequest {
  characterId: string;
}

// Système de points de maison
interface HousePoints {
  house: House;
  points: number;
  updatedAt: number;
}

interface HousePointsTransaction {
  id: string;
  house: House;
  amount: number;
  characterName?: string;
  reason: string;
  type: "add" | "remove";
  timestamp: number;
}

interface AddHousePointsRequest {
  house: House;
  amount: number;
  characterName?: string;
  reason: string;
}

interface RemoveHousePointsRequest {
  house: House;
  amount: number;
  characterName?: string;
  reason: string;
}

interface GetHousePointsHistoryRequest {
  house?: House;
  limit?: number;
}

// Système d'inventaire
type ItemType = "wand" | "potion" | "book" | "equipment" | "ingredient" | "quest" | "consumable" | "notebook";
type ItemRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

interface Item {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
  maxStack: number;
}

interface InventoryItem {
  itemId: string;
  quantity: number;
  acquiredAt: number;
}

interface Inventory {
  characterId: string;
  items: InventoryItem[];
  updatedAt: number;
}

interface AddItemRequest {
  characterId: string;
  itemId: string;
  quantity: number;
}

interface RemoveItemRequest {
  characterId: string;
  itemId: string;
  quantity: number;
}

interface GetInventoryRequest {
  characterId: string;
}

// Système de sorts
type SpellType = "offensive" | "defensive" | "utility" | "healing" | "control";
type SpellElement = "fire" | "ice" | "lightning" | "nature" | "light" | "dark" | "neutral";

interface Spell {
  id: string;
  name: string;
  description: string;
  type: SpellType;
  element: SpellElement;
  maxLevel: number; // Toujours 3
}

interface LearnedSpell {
  spellId: string;
  level: number; // 0 à 3
  learnedAt: number;
  lastUpgradedAt: number;
}

interface CharacterSpells {
  characterId: string;
  spells: LearnedSpell[];
  updatedAt: number;
}

interface LearnSpellRequest {
  characterId: string;
  spellId: string;
}

interface UpgradeSpellRequest {
  characterId: string;
  spellId: string;
}

interface GetCharacterSpellsRequest {
  characterId: string;
}

// Système de carnets de notes
type NotebookSubject =
  | "Défense contre les forces du mal"
  | "Potions"
  | "Sortilèges"
  | "Botanique"
  | "Histoire de la magie"
  | "Métamorphose"
  | "Astronomie"
  | "Divination"
  | "Soins aux créatures magiques"
  | "Vol sur balai"
  | "Notes personnelles";

interface Notebook {
  id: string;
  characterId: string;
  title: string;
  content: string;
  subject: NotebookSubject;
  createdAt: number;
  updatedAt: number;
}

interface CreateNotebookRequest {
  characterId: string;
  title: string;
  content: string;
  subject: NotebookSubject;
}

interface UpdateNotebookRequest {
  notebookId: string;
  title?: string;
  content?: string;
  subject?: NotebookSubject;
}

interface DeleteNotebookRequest {
  notebookId: string;
}

interface GetNotebookRequest {
  notebookId: string;
}

interface GetCharacterNotebooksRequest {
  characterId: string;
}

const COLLECTION_CHARACTERS = "characters";
const COLLECTION_HOUSE_POINTS = "house_points";
const COLLECTION_HOUSE_POINTS_HISTORY = "house_points_history";
const COLLECTION_INVENTORY = "character_inventory";
const COLLECTION_SPELLS = "character_spells";
const COLLECTION_NOTEBOOKS = "character_notebooks";
const MAX_CHARACTERS_PER_ACCOUNT = 10;
const PLAYABLE_HOUSES: House[] = ["Venatrix", "Falcon", "Brumval", "Aerwyn"];
const MAX_SPELL_LEVEL = 3;

// Liste des objets prédéfinis
const PREDEFINED_ITEMS: Item[] = [
  // Baguettes magiques
  { id: "wand_oak", name: "Baguette en Chêne", description: "Baguette en bois de chêne avec cœur de crin de licorne", type: "wand", rarity: "common", maxStack: 1 },
  { id: "wand_elder", name: "Baguette de Sureau", description: "Baguette légendaire en bois de sureau", type: "wand", rarity: "legendary", maxStack: 1 },
  { id: "wand_holly", name: "Baguette en Houx", description: "Baguette en bois de houx avec plume de phénix", type: "wand", rarity: "rare", maxStack: 1 },

  // Potions
  { id: "potion_health", name: "Potion de Soin", description: "Restaure la santé", type: "potion", rarity: "common", maxStack: 20 },
  { id: "potion_mana", name: "Potion de Mana", description: "Restaure la magie", type: "potion", rarity: "common", maxStack: 20 },
  { id: "potion_felix", name: "Felix Felicis", description: "Potion de chance liquide", type: "potion", rarity: "legendary", maxStack: 5 },
  { id: "potion_poly", name: "Polynectar", description: "Permet de prendre l'apparence d'autrui", type: "potion", rarity: "epic", maxStack: 10 },

  // Livres
  { id: "book_spells_1", name: "Livre de Sorts Niveau 1", description: "Manuel de sortilèges basiques", type: "book", rarity: "common", maxStack: 1 },
  { id: "book_spells_2", name: "Livre de Sorts Niveau 2", description: "Manuel de sortilèges intermédiaires", type: "book", rarity: "uncommon", maxStack: 1 },
  { id: "book_dark_arts", name: "Défense contre les Forces du Mal", description: "Guide complet de défense", type: "book", rarity: "rare", maxStack: 1 },
  { id: "book_potions", name: "Potions Magiques Avancées", description: "Recettes de potions complexes", type: "book", rarity: "rare", maxStack: 1 },

  // Équipements
  { id: "robe_student", name: "Robe d'Étudiant", description: "Robe standard d'étudiant", type: "equipment", rarity: "common", maxStack: 1 },
  { id: "robe_house", name: "Robe de Maison", description: "Robe aux couleurs de votre maison", type: "equipment", rarity: "uncommon", maxStack: 1 },
  { id: "cloak_invisibility", name: "Cape d'Invisibilité", description: "Cape légendaire d'invisibilité", type: "equipment", rarity: "legendary", maxStack: 1 },

  // Ingrédients
  { id: "ingredient_unicorn", name: "Crin de Licorne", description: "Ingrédient magique précieux", type: "ingredient", rarity: "rare", maxStack: 99 },
  { id: "ingredient_phoenix", name: "Plume de Phénix", description: "Plume rare d'un phénix", type: "ingredient", rarity: "epic", maxStack: 99 },
  { id: "ingredient_spider", name: "Venin d'Acromentule", description: "Venin d'araignée géante", type: "ingredient", rarity: "uncommon", maxStack: 99 },
  { id: "ingredient_mandrake", name: "Racine de Mandragore", description: "Racine hurlante utilisée en potions", type: "ingredient", rarity: "uncommon", maxStack: 99 },

  // Consommables
  { id: "food_chocolate", name: "Chocogrenouille", description: "Friandise magique au chocolat", type: "consumable", rarity: "common", maxStack: 50 },
  { id: "food_beans", name: "Dragées Surprises de Bertie Crochue", description: "Bonbons aux saveurs surprenantes", type: "consumable", rarity: "common", maxStack: 50 },

  // Carnets de notes
  { id: "notebook_basic", name: "Carnet de Notes", description: "Un carnet pour prendre des notes de cours", type: "notebook", rarity: "common", maxStack: 10 },
];

// Liste des sorts prédéfinis
const PREDEFINED_SPELLS: Spell[] = [
  // Sorts offensifs
  { id: "spell_expelliarmus", name: "Expelliarmus", description: "Désarme l'adversaire", type: "offensive", element: "neutral", maxLevel: 3 },
  { id: "spell_stupefix", name: "Stupéfix", description: "Stupéfie la cible", type: "offensive", element: "neutral", maxLevel: 3 },
  { id: "spell_incendio", name: "Incendio", description: "Projette des flammes", type: "offensive", element: "fire", maxLevel: 3 },
  { id: "spell_glacius", name: "Glacius", description: "Gèle la cible", type: "offensive", element: "ice", maxLevel: 3 },
  { id: "spell_bombarda", name: "Bombarda", description: "Provoque une explosion", type: "offensive", element: "fire", maxLevel: 3 },
  { id: "spell_fulgur", name: "Fulgur", description: "Lance un éclair foudroyant", type: "offensive", element: "lightning", maxLevel: 3 },

  // Sorts défensifs
  { id: "spell_protego", name: "Protego", description: "Crée un bouclier protecteur", type: "defensive", element: "neutral", maxLevel: 3 },
  { id: "spell_finite", name: "Finite Incantatem", description: "Annule les sorts", type: "defensive", element: "neutral", maxLevel: 3 },
  { id: "spell_repello", name: "Repello", description: "Repousse les ennemis", type: "defensive", element: "neutral", maxLevel: 3 },

  // Sorts de soin
  { id: "spell_episkey", name: "Episkey", description: "Soigne les blessures mineures", type: "healing", element: "light", maxLevel: 3 },
  { id: "spell_vulnera", name: "Vulnera Sanentur", description: "Soigne les blessures graves", type: "healing", element: "light", maxLevel: 3 },
  { id: "spell_rennervate", name: "Rennervate", description: "Ranime une personne inconsciente", type: "healing", element: "light", maxLevel: 3 },

  // Sorts de contrôle
  { id: "spell_immobulus", name: "Immobulus", description: "Immobilise la cible", type: "control", element: "neutral", maxLevel: 3 },
  { id: "spell_petrificus", name: "Petrificus Totalus", description: "Paralyse complètement la cible", type: "control", element: "neutral", maxLevel: 3 },
  { id: "spell_confundo", name: "Confundo", description: "Embrouille l'esprit de la cible", type: "control", element: "neutral", maxLevel: 3 },

  // Sorts utilitaires
  { id: "spell_lumos", name: "Lumos", description: "Crée de la lumière", type: "utility", element: "light", maxLevel: 3 },
  { id: "spell_nox", name: "Nox", description: "Éteint la lumière", type: "utility", element: "dark", maxLevel: 3 },
  { id: "spell_alohomora", name: "Alohomora", description: "Déverrouille les serrures", type: "utility", element: "neutral", maxLevel: 3 },
  { id: "spell_wingardium", name: "Wingardium Leviosa", description: "Fait léviter les objets", type: "utility", element: "neutral", maxLevel: 3 },
  { id: "spell_accio", name: "Accio", description: "Attire un objet à soi", type: "utility", element: "neutral", maxLevel: 3 },
  { id: "spell_revelio", name: "Revelio", description: "Révèle ce qui est caché", type: "utility", element: "light", maxLevel: 3 },
  { id: "spell_apparate", name: "Transplanage", description: "Téléportation courte distance", type: "utility", element: "neutral", maxLevel: 3 },
];

/**
 * Initialise le module serveur
 */
function InitModule(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, initializer: nkruntime.Initializer) {
  // Enregistrement des RPCs - Personnages
  initializer.registerRpc("create_character", rpcCreateCharacter);
  initializer.registerRpc("get_characters", rpcGetCharacters);
  initializer.registerRpc("update_character", rpcUpdateCharacter);
  initializer.registerRpc("delete_character", rpcDeleteCharacter);
  initializer.registerRpc("get_character", rpcGetCharacter);
  initializer.registerRpc("assign_house", rpcAssignHouse);

  // Enregistrement des RPCs - Points de maison
  initializer.registerRpc("add_house_points", rpcAddHousePoints);
  initializer.registerRpc("remove_house_points", rpcRemoveHousePoints);
  initializer.registerRpc("get_house_rankings", rpcGetHouseRankings);
  initializer.registerRpc("get_house_points_history", rpcGetHousePointsHistory);

  // Enregistrement des RPCs - Inventaire
  initializer.registerRpc("add_item_to_inventory", rpcAddItemToInventory);
  initializer.registerRpc("remove_item_from_inventory", rpcRemoveItemFromInventory);
  initializer.registerRpc("get_character_inventory", rpcGetCharacterInventory);
  initializer.registerRpc("get_available_items", rpcGetAvailableItems);

  // Enregistrement des RPCs - Sorts
  initializer.registerRpc("learn_spell", rpcLearnSpell);
  initializer.registerRpc("upgrade_spell", rpcUpgradeSpell);
  initializer.registerRpc("get_character_spells", rpcGetCharacterSpells);
  initializer.registerRpc("get_available_spells", rpcGetAvailableSpells);

  // Enregistrement des RPCs - Carnets de notes
  initializer.registerRpc("create_notebook", rpcCreateNotebook);
  initializer.registerRpc("get_notebook", rpcGetNotebook);
  initializer.registerRpc("get_character_notebooks", rpcGetCharacterNotebooks);
  initializer.registerRpc("update_notebook", rpcUpdateNotebook);
  initializer.registerRpc("delete_notebook", rpcDeleteNotebook);

  // Initialiser les points de maison à 0
  initializeHousePoints(nk, logger);

  logger.info("Module de gestion des personnages Harry Potter initialisé avec système de maisons, points, inventaire, sorts et carnets");
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
    house: DEFAULT_HOUSE,
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

/**
 * RPC: Assigner une maison à un personnage
 */
function rpcAssignHouse(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  if (!ctx.userId) {
    throw Error("Utilisateur non authentifié");
  }

  const request: AssignHouseRequest = JSON.parse(payload);

  if (!request.characterId) {
    throw Error("ID du personnage requis");
  }

  if (!request.house) {
    throw Error("Maison requise");
  }

  // Valider la maison
  if (!VALID_HOUSES.includes(request.house)) {
    throw Error(`Maison invalide. Maisons valides: ${VALID_HOUSES.join(", ")}`);
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

  // Assigner la maison
  character.house = request.house;
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

  logger.info("Maison assignée: %s pour le personnage %s (ID: %s)", request.house, character.name, character.id);

  return JSON.stringify(character);
}

// ============================================================================
// SYSTÈME DE POINTS DE MAISON
// ============================================================================

/**
 * Initialise les points de toutes les maisons à 0 si elles n'existent pas
 */
function initializeHousePoints(nk: nkruntime.Nakama, logger: nkruntime.Logger): void {
  PLAYABLE_HOUSES.forEach(house => {
    const existing = nk.storageRead([{
      collection: COLLECTION_HOUSE_POINTS,
      key: house,
    }]);

    if (existing.length === 0) {
      const housePoints: HousePoints = {
        house: house,
        points: 0,
        updatedAt: Date.now(),
      };

      nk.storageWrite([{
        collection: COLLECTION_HOUSE_POINTS,
        key: house,
        value: housePoints,
        permissionRead: 2, // Lecture publique
        permissionWrite: 0, // Écriture interdite aux clients
      }]);

      logger.info("Points initialisés pour la maison: %s", house);
    }
  });
}

/**
 * Récupère ou crée les points d'une maison
 */
function getOrCreateHousePoints(nk: nkruntime.Nakama, house: House): HousePoints {
  const objects = nk.storageRead([{
    collection: COLLECTION_HOUSE_POINTS,
    key: house,
  }]);

  if (objects.length > 0) {
    return objects[0].value as HousePoints;
  }

  // Créer si n'existe pas
  const housePoints: HousePoints = {
    house: house,
    points: 0,
    updatedAt: Date.now(),
  };

  nk.storageWrite([{
    collection: COLLECTION_HOUSE_POINTS,
    key: house,
    value: housePoints,
    permissionRead: 2,
    permissionWrite: 0,
  }]);

  return housePoints;
}

/**
 * RPC: Ajouter des points à une maison
 */
function rpcAddHousePoints(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  if (!ctx.userId) {
    throw Error("Utilisateur non authentifié");
  }

  const request: AddHousePointsRequest = JSON.parse(payload);

  // Validation
  if (!request.house) {
    throw Error("Maison requise");
  }

  if (!PLAYABLE_HOUSES.includes(request.house)) {
    throw Error(`Impossible d'ajouter des points à "${request.house}". Maisons valides: ${PLAYABLE_HOUSES.join(", ")}`);
  }

  if (!request.amount || request.amount <= 0) {
    throw Error("Le montant doit être supérieur à 0");
  }

  if (!request.reason || request.reason.trim().length === 0) {
    throw Error("Une raison est requise");
  }

  // Récupérer les points actuels
  const housePoints = getOrCreateHousePoints(nk, request.house);

  // Ajouter les points
  housePoints.points += request.amount;
  housePoints.updatedAt = Date.now();

  // Sauvegarder
  nk.storageWrite([{
    collection: COLLECTION_HOUSE_POINTS,
    key: request.house,
    value: housePoints,
    permissionRead: 2,
    permissionWrite: 0,
  }]);

  // Créer une transaction dans l'historique
  const transactionId = nk.uuidv4();
  const transaction: HousePointsTransaction = {
    id: transactionId,
    house: request.house,
    amount: request.amount,
    characterName: request.characterName,
    reason: request.reason.trim(),
    type: "add",
    timestamp: Date.now(),
  };

  nk.storageWrite([{
    collection: COLLECTION_HOUSE_POINTS_HISTORY,
    key: transactionId,
    value: transaction,
    permissionRead: 2,
    permissionWrite: 0,
  }]);

  logger.info(
    "Points ajoutés: +%d pour %s%s. Raison: %s. Total: %d",
    request.amount,
    request.house,
    request.characterName ? ` (par ${request.characterName})` : "",
    request.reason,
    housePoints.points
  );

  return JSON.stringify(housePoints);
}

/**
 * RPC: Retirer des points à une maison
 */
function rpcRemoveHousePoints(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  if (!ctx.userId) {
    throw Error("Utilisateur non authentifié");
  }

  const request: RemoveHousePointsRequest = JSON.parse(payload);

  // Validation
  if (!request.house) {
    throw Error("Maison requise");
  }

  if (!PLAYABLE_HOUSES.includes(request.house)) {
    throw Error(`Impossible de retirer des points à "${request.house}". Maisons valides: ${PLAYABLE_HOUSES.join(", ")}`);
  }

  if (!request.amount || request.amount <= 0) {
    throw Error("Le montant doit être supérieur à 0");
  }

  if (!request.reason || request.reason.trim().length === 0) {
    throw Error("Une raison est requise");
  }

  // Récupérer les points actuels
  const housePoints = getOrCreateHousePoints(nk, request.house);

  // Retirer les points (peut être négatif)
  housePoints.points -= request.amount;
  housePoints.updatedAt = Date.now();

  // Sauvegarder
  nk.storageWrite([{
    collection: COLLECTION_HOUSE_POINTS,
    key: request.house,
    value: housePoints,
    permissionRead: 2,
    permissionWrite: 0,
  }]);

  // Créer une transaction dans l'historique
  const transactionId = nk.uuidv4();
  const transaction: HousePointsTransaction = {
    id: transactionId,
    house: request.house,
    amount: request.amount,
    characterName: request.characterName,
    reason: request.reason.trim(),
    type: "remove",
    timestamp: Date.now(),
  };

  nk.storageWrite([{
    collection: COLLECTION_HOUSE_POINTS_HISTORY,
    key: transactionId,
    value: transaction,
    permissionRead: 2,
    permissionWrite: 0,
  }]);

  logger.info(
    "Points retirés: -%d pour %s%s. Raison: %s. Total: %d",
    request.amount,
    request.house,
    request.characterName ? ` (par ${request.characterName})` : "",
    request.reason,
    housePoints.points
  );

  return JSON.stringify(housePoints);
}

/**
 * RPC: Récupérer le classement des maisons
 */
function rpcGetHouseRankings(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  // Pas besoin d'authentification pour voir le classement

  const rankings: HousePoints[] = [];

  // Récupérer les points de chaque maison
  PLAYABLE_HOUSES.forEach(house => {
    const housePoints = getOrCreateHousePoints(nk, house);
    rankings.push(housePoints);
  });

  // Trier par points décroissants
  rankings.sort((a, b) => b.points - a.points);

  logger.info("Classement des maisons récupéré");

  return JSON.stringify({ rankings });
}

/**
 * RPC: Récupérer l'historique des points de maison
 */
function rpcGetHousePointsHistory(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  const request: GetHousePointsHistoryRequest = payload ? JSON.parse(payload) : {};

  const limit = request.limit || 50;

  // Lire toutes les transactions
  const allTransactions = nk.storageList(
    "",
    COLLECTION_HOUSE_POINTS_HISTORY,
    limit
  );

  let transactions = allTransactions.map(obj => obj.value as HousePointsTransaction);

  // Filtrer par maison si spécifié
  if (request.house) {
    transactions = transactions.filter(t => t.house === request.house);
  }

  // Trier par timestamp décroissant (plus récent en premier)
  transactions.sort((a, b) => b.timestamp - a.timestamp);

  logger.info(
    "Historique récupéré: %d transactions%s",
    transactions.length,
    request.house ? ` pour ${request.house}` : ""
  );

  return JSON.stringify({ history: transactions });
}

// ============================================================================
// SYSTÈME D'INVENTAIRE
// ============================================================================

/**
 * Trouve un objet dans la liste prédéfinie
 */
function findItem(itemId: string): Item | null {
  return PREDEFINED_ITEMS.find(item => item.id === itemId) || null;
}

/**
 * Récupère ou crée l'inventaire d'un personnage
 */
function getOrCreateInventory(nk: nkruntime.Nakama, characterId: string, userId: string): Inventory {
  const objects = nk.storageRead([{
    collection: COLLECTION_INVENTORY,
    key: characterId,
    userId: userId,
  }]);

  if (objects.length > 0) {
    return objects[0].value as Inventory;
  }

  // Créer un inventaire vide
  const inventory: Inventory = {
    characterId: characterId,
    items: [],
    updatedAt: Date.now(),
  };

  nk.storageWrite([{
    collection: COLLECTION_INVENTORY,
    key: characterId,
    userId: userId,
    value: inventory,
    permissionRead: 1,
    permissionWrite: 0,
  }]);

  return inventory;
}

/**
 * RPC: Ajouter un objet à l'inventaire
 */
function rpcAddItemToInventory(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  if (!ctx.userId) {
    throw Error("Utilisateur non authentifié");
  }

  const request: AddItemRequest = JSON.parse(payload);

  // Validation
  if (!request.characterId) {
    throw Error("ID du personnage requis");
  }

  if (!request.itemId) {
    throw Error("ID de l'objet requis");
  }

  if (!request.quantity || request.quantity <= 0) {
    throw Error("La quantité doit être supérieure à 0");
  }

  // Vérifier que l'objet existe
  const item = findItem(request.itemId);
  if (!item) {
    throw Error(`Objet "${request.itemId}" non trouvé dans la liste des objets disponibles`);
  }

  // Vérifier que le personnage appartient à l'utilisateur
  const characterObjects = nk.storageRead([{
    collection: COLLECTION_CHARACTERS,
    key: request.characterId,
    userId: ctx.userId,
  }]);

  if (characterObjects.length === 0) {
    throw Error("Personnage non trouvé ou n'appartient pas à l'utilisateur");
  }

  // Récupérer l'inventaire
  const inventory = getOrCreateInventory(nk, request.characterId, ctx.userId);

  // Chercher si l'objet existe déjà dans l'inventaire
  const existingItemIndex = inventory.items.findIndex(i => i.itemId === request.itemId);

  if (existingItemIndex >= 0) {
    // L'objet existe, on ajoute à la quantité
    const newQuantity = inventory.items[existingItemIndex].quantity + request.quantity;

    // Vérifier la limite de stack
    if (newQuantity > item.maxStack) {
      throw Error(`Impossible d'ajouter ${request.quantity} ${item.name}. Maximum ${item.maxStack} par stack (actuellement ${inventory.items[existingItemIndex].quantity})`);
    }

    inventory.items[existingItemIndex].quantity = newQuantity;
  } else {
    // Nouvel objet
    if (request.quantity > item.maxStack) {
      throw Error(`Impossible d'ajouter ${request.quantity} ${item.name}. Maximum ${item.maxStack} par stack`);
    }

    inventory.items.push({
      itemId: request.itemId,
      quantity: request.quantity,
      acquiredAt: Date.now(),
    });
  }

  inventory.updatedAt = Date.now();

  // Sauvegarder
  nk.storageWrite([{
    collection: COLLECTION_INVENTORY,
    key: request.characterId,
    userId: ctx.userId,
    value: inventory,
    permissionRead: 1,
    permissionWrite: 0,
  }]);

  logger.info(
    "Objet ajouté: %s x%d pour le personnage %s",
    item.name,
    request.quantity,
    request.characterId
  );

  return JSON.stringify({ inventory, itemAdded: item });
}

/**
 * RPC: Retirer un objet de l'inventaire
 */
function rpcRemoveItemFromInventory(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  if (!ctx.userId) {
    throw Error("Utilisateur non authentifié");
  }

  const request: RemoveItemRequest = JSON.parse(payload);

  // Validation
  if (!request.characterId) {
    throw Error("ID du personnage requis");
  }

  if (!request.itemId) {
    throw Error("ID de l'objet requis");
  }

  if (!request.quantity || request.quantity <= 0) {
    throw Error("La quantité doit être supérieure à 0");
  }

  // Vérifier que l'objet existe
  const item = findItem(request.itemId);
  if (!item) {
    throw Error(`Objet "${request.itemId}" non trouvé`);
  }

  // Vérifier que le personnage appartient à l'utilisateur
  const characterObjects = nk.storageRead([{
    collection: COLLECTION_CHARACTERS,
    key: request.characterId,
    userId: ctx.userId,
  }]);

  if (characterObjects.length === 0) {
    throw Error("Personnage non trouvé ou n'appartient pas à l'utilisateur");
  }

  // Récupérer l'inventaire
  const inventory = getOrCreateInventory(nk, request.characterId, ctx.userId);

  // Chercher l'objet dans l'inventaire
  const itemIndex = inventory.items.findIndex(i => i.itemId === request.itemId);

  if (itemIndex < 0) {
    throw Error(`L'objet "${item.name}" n'est pas dans l'inventaire`);
  }

  const currentQuantity = inventory.items[itemIndex].quantity;

  if (currentQuantity < request.quantity) {
    throw Error(`Quantité insuffisante. Demandé: ${request.quantity}, disponible: ${currentQuantity}`);
  }

  // Retirer la quantité
  const newQuantity = currentQuantity - request.quantity;

  if (newQuantity === 0) {
    // Supprimer l'objet complètement
    inventory.items.splice(itemIndex, 1);
  } else {
    // Juste réduire la quantité
    inventory.items[itemIndex].quantity = newQuantity;
  }

  inventory.updatedAt = Date.now();

  // Sauvegarder
  nk.storageWrite([{
    collection: COLLECTION_INVENTORY,
    key: request.characterId,
    userId: ctx.userId,
    value: inventory,
    permissionRead: 1,
    permissionWrite: 0,
  }]);

  logger.info(
    "Objet retiré: %s x%d pour le personnage %s",
    item.name,
    request.quantity,
    request.characterId
  );

  return JSON.stringify({ inventory, itemRemoved: item });
}

/**
 * RPC: Récupérer l'inventaire d'un personnage
 */
function rpcGetCharacterInventory(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  if (!ctx.userId) {
    throw Error("Utilisateur non authentifié");
  }

  const request: GetInventoryRequest = JSON.parse(payload);

  if (!request.characterId) {
    throw Error("ID du personnage requis");
  }

  // Vérifier que le personnage appartient à l'utilisateur
  const characterObjects = nk.storageRead([{
    collection: COLLECTION_CHARACTERS,
    key: request.characterId,
    userId: ctx.userId,
  }]);

  if (characterObjects.length === 0) {
    throw Error("Personnage non trouvé ou n'appartient pas à l'utilisateur");
  }

  // Récupérer l'inventaire
  const inventory = getOrCreateInventory(nk, request.characterId, ctx.userId);

  // Enrichir avec les données complètes des objets
  const enrichedItems = inventory.items.map(invItem => {
    const itemData = findItem(invItem.itemId);
    return {
      ...invItem,
      item: itemData,
    };
  });

  logger.info("Inventaire récupéré pour le personnage %s: %d objets", request.characterId, inventory.items.length);

  return JSON.stringify({
    characterId: inventory.characterId,
    items: enrichedItems,
    updatedAt: inventory.updatedAt,
  });
}

/**
 * RPC: Récupérer la liste de tous les objets disponibles
 */
function rpcGetAvailableItems(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  // Pas besoin d'authentification pour voir les objets disponibles

  logger.info("Liste des objets disponibles récupérée: %d objets", PREDEFINED_ITEMS.length);

  return JSON.stringify({ items: PREDEFINED_ITEMS });
}

// ============================================================================
// SYSTÈME DE SORTS
// ============================================================================

/**
 * Trouve un sort dans la liste prédéfinie
 */
function findSpell(spellId: string): Spell | null {
  return PREDEFINED_SPELLS.find(spell => spell.id === spellId) || null;
}

/**
 * Récupère ou crée les sorts d'un personnage
 */
function getOrCreateCharacterSpells(nk: nkruntime.Nakama, characterId: string, userId: string): CharacterSpells {
  const objects = nk.storageRead([{
    collection: COLLECTION_SPELLS,
    key: characterId,
    userId: userId,
  }]);

  if (objects.length > 0) {
    return objects[0].value as CharacterSpells;
  }

  // Créer une liste vide de sorts
  const characterSpells: CharacterSpells = {
    characterId: characterId,
    spells: [],
    updatedAt: Date.now(),
  };

  nk.storageWrite([{
    collection: COLLECTION_SPELLS,
    key: characterId,
    userId: userId,
    value: characterSpells,
    permissionRead: 1,
    permissionWrite: 0,
  }]);

  return characterSpells;
}

/**
 * RPC: Apprendre un nouveau sort
 */
function rpcLearnSpell(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  if (!ctx.userId) {
    throw Error("Utilisateur non authentifié");
  }

  const request: LearnSpellRequest = JSON.parse(payload);

  // Validation
  if (!request.characterId) {
    throw Error("ID du personnage requis");
  }

  if (!request.spellId) {
    throw Error("ID du sort requis");
  }

  // Vérifier que le sort existe
  const spell = findSpell(request.spellId);
  if (!spell) {
    throw Error(`Sort "${request.spellId}" non trouvé dans la liste des sorts disponibles`);
  }

  // Vérifier que le personnage appartient à l'utilisateur
  const characterObjects = nk.storageRead([{
    collection: COLLECTION_CHARACTERS,
    key: request.characterId,
    userId: ctx.userId,
  }]);

  if (characterObjects.length === 0) {
    throw Error("Personnage non trouvé ou n'appartient pas à l'utilisateur");
  }

  // Récupérer les sorts du personnage
  const characterSpells = getOrCreateCharacterSpells(nk, request.characterId, ctx.userId);

  // Vérifier si le sort est déjà appris
  const existingSpell = characterSpells.spells.find(s => s.spellId === request.spellId);
  if (existingSpell) {
    throw Error(`Le sort "${spell.name}" est déjà appris (niveau ${existingSpell.level})`);
  }

  // Ajouter le sort au niveau 0
  const now = Date.now();
  characterSpells.spells.push({
    spellId: request.spellId,
    level: 0,
    learnedAt: now,
    lastUpgradedAt: now,
  });

  characterSpells.updatedAt = now;

  // Sauvegarder
  nk.storageWrite([{
    collection: COLLECTION_SPELLS,
    key: request.characterId,
    userId: ctx.userId,
    value: characterSpells,
    permissionRead: 1,
    permissionWrite: 0,
  }]);

  logger.info(
    "Sort appris: %s (niveau 0) pour le personnage %s",
    spell.name,
    request.characterId
  );

  return JSON.stringify({ characterSpells, spellLearned: spell });
}

/**
 * RPC: Améliorer un sort existant
 */
function rpcUpgradeSpell(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  if (!ctx.userId) {
    throw Error("Utilisateur non authentifié");
  }

  const request: UpgradeSpellRequest = JSON.parse(payload);

  // Validation
  if (!request.characterId) {
    throw Error("ID du personnage requis");
  }

  if (!request.spellId) {
    throw Error("ID du sort requis");
  }

  // Vérifier que le sort existe
  const spell = findSpell(request.spellId);
  if (!spell) {
    throw Error(`Sort "${request.spellId}" non trouvé`);
  }

  // Vérifier que le personnage appartient à l'utilisateur
  const characterObjects = nk.storageRead([{
    collection: COLLECTION_CHARACTERS,
    key: request.characterId,
    userId: ctx.userId,
  }]);

  if (characterObjects.length === 0) {
    throw Error("Personnage non trouvé ou n'appartient pas à l'utilisateur");
  }

  // Récupérer les sorts du personnage
  const characterSpells = getOrCreateCharacterSpells(nk, request.characterId, ctx.userId);

  // Chercher le sort
  const learnedSpell = characterSpells.spells.find(s => s.spellId === request.spellId);
  if (!learnedSpell) {
    throw Error(`Le sort "${spell.name}" n'a pas encore été appris. Utilisez learn_spell d'abord.`);
  }

  // Vérifier si le sort peut être amélioré
  if (learnedSpell.level >= MAX_SPELL_LEVEL) {
    throw Error(`Le sort "${spell.name}" est déjà au niveau maximum (${MAX_SPELL_LEVEL})`);
  }

  // Améliorer le sort
  learnedSpell.level += 1;
  learnedSpell.lastUpgradedAt = Date.now();
  characterSpells.updatedAt = Date.now();

  // Sauvegarder
  nk.storageWrite([{
    collection: COLLECTION_SPELLS,
    key: request.characterId,
    userId: ctx.userId,
    value: characterSpells,
    permissionRead: 1,
    permissionWrite: 0,
  }]);

  logger.info(
    "Sort amélioré: %s niveau %d -> %d pour le personnage %s",
    spell.name,
    learnedSpell.level - 1,
    learnedSpell.level,
    request.characterId
  );

  return JSON.stringify({ characterSpells, spellUpgraded: spell, newLevel: learnedSpell.level });
}

/**
 * RPC: Récupérer les sorts d'un personnage
 */
function rpcGetCharacterSpells(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  if (!ctx.userId) {
    throw Error("Utilisateur non authentifié");
  }

  const request: GetCharacterSpellsRequest = JSON.parse(payload);

  if (!request.characterId) {
    throw Error("ID du personnage requis");
  }

  // Vérifier que le personnage appartient à l'utilisateur
  const characterObjects = nk.storageRead([{
    collection: COLLECTION_CHARACTERS,
    key: request.characterId,
    userId: ctx.userId,
  }]);

  if (characterObjects.length === 0) {
    throw Error("Personnage non trouvé ou n'appartient pas à l'utilisateur");
  }

  // Récupérer les sorts
  const characterSpells = getOrCreateCharacterSpells(nk, request.characterId, ctx.userId);

  // Enrichir avec les données complètes des sorts
  const enrichedSpells = characterSpells.spells.map(learnedSpell => {
    const spellData = findSpell(learnedSpell.spellId);
    return {
      ...learnedSpell,
      spell: spellData,
    };
  });

  logger.info("Sorts récupérés pour le personnage %s: %d sorts", request.characterId, characterSpells.spells.length);

  return JSON.stringify({
    characterId: characterSpells.characterId,
    spells: enrichedSpells,
    updatedAt: characterSpells.updatedAt,
  });
}

/**
 * RPC: Récupérer la liste de tous les sorts disponibles
 */
function rpcGetAvailableSpells(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  // Pas besoin d'authentification pour voir les sorts disponibles

  logger.info("Liste des sorts disponibles récupérée: %d sorts", PREDEFINED_SPELLS.length);

  return JSON.stringify({ spells: PREDEFINED_SPELLS });
}

// ============================================================================
// SYSTÈME DE CARNETS DE NOTES
// ============================================================================

/**
 * RPC: Créer un nouveau carnet de notes
 */
function rpcCreateNotebook(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  if (!ctx.userId) {
    throw Error("Utilisateur non authentifié");
  }

  const request: CreateNotebookRequest = JSON.parse(payload);

  // Validation
  if (!request.characterId) {
    throw Error("ID du personnage requis");
  }

  if (!request.title || request.title.trim().length === 0) {
    throw Error("Titre requis");
  }

  if (!request.subject) {
    throw Error("Matière requise");
  }

  // Vérifier que le personnage appartient à l'utilisateur
  const characterObjects = nk.storageRead([{
    collection: COLLECTION_CHARACTERS,
    key: request.characterId,
    userId: ctx.userId,
  }]);

  if (characterObjects.length === 0) {
    throw Error("Personnage non trouvé ou n'appartient pas à l'utilisateur");
  }

  // Créer le carnet
  const now = Date.now();
  const notebookId = nk.uuidv4();

  const notebook: Notebook = {
    id: notebookId,
    characterId: request.characterId,
    title: request.title.trim(),
    content: request.content || "",
    subject: request.subject,
    createdAt: now,
    updatedAt: now,
  };

  // Sauvegarder le carnet
  nk.storageWrite([{
    collection: COLLECTION_NOTEBOOKS,
    key: notebookId,
    userId: ctx.userId,
    value: notebook,
    permissionRead: 1,
    permissionWrite: 0,
  }]);

  logger.info(
    "Carnet créé: %s (%s) pour le personnage %s",
    notebook.title,
    notebook.subject,
    request.characterId
  );

  return JSON.stringify(notebook);
}

/**
 * RPC: Récupérer un carnet de notes
 */
function rpcGetNotebook(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  if (!ctx.userId) {
    throw Error("Utilisateur non authentifié");
  }

  const request: GetNotebookRequest = JSON.parse(payload);

  if (!request.notebookId) {
    throw Error("ID du carnet requis");
  }

  // Récupérer le carnet
  const notebooks = nk.storageRead([{
    collection: COLLECTION_NOTEBOOKS,
    key: request.notebookId,
    userId: ctx.userId,
  }]);

  if (notebooks.length === 0) {
    throw Error("Carnet non trouvé ou n'appartient pas à l'utilisateur");
  }

  logger.info("Carnet récupéré: %s", request.notebookId);

  return JSON.stringify(notebooks[0].value);
}

/**
 * RPC: Récupérer tous les carnets d'un personnage
 */
function rpcGetCharacterNotebooks(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  if (!ctx.userId) {
    throw Error("Utilisateur non authentifié");
  }

  const request: GetCharacterNotebooksRequest = JSON.parse(payload);

  if (!request.characterId) {
    throw Error("ID du personnage requis");
  }

  // Vérifier que le personnage appartient à l'utilisateur
  const characterObjects = nk.storageRead([{
    collection: COLLECTION_CHARACTERS,
    key: request.characterId,
    userId: ctx.userId,
  }]);

  if (characterObjects.length === 0) {
    throw Error("Personnage non trouvé ou n'appartient pas à l'utilisateur");
  }

  // Récupérer tous les carnets du personnage
  const notebooksList = nk.storageList(ctx.userId, COLLECTION_NOTEBOOKS, 100);

  // Filtrer les carnets appartenant au personnage
  const notebooks = notebooksList
    .map(obj => obj.value as Notebook)
    .filter(notebook => notebook.characterId === request.characterId);

  logger.info(
    "Carnets récupérés pour le personnage %s: %d carnets",
    request.characterId,
    notebooks.length
  );

  return JSON.stringify({ notebooks });
}

/**
 * RPC: Mettre à jour un carnet de notes
 */
function rpcUpdateNotebook(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  if (!ctx.userId) {
    throw Error("Utilisateur non authentifié");
  }

  const request: UpdateNotebookRequest = JSON.parse(payload);

  if (!request.notebookId) {
    throw Error("ID du carnet requis");
  }

  // Récupérer le carnet existant
  const notebooks = nk.storageRead([{
    collection: COLLECTION_NOTEBOOKS,
    key: request.notebookId,
    userId: ctx.userId,
  }]);

  if (notebooks.length === 0) {
    throw Error("Carnet non trouvé ou n'appartient pas à l'utilisateur");
  }

  const notebook = notebooks[0].value as Notebook;

  // Mettre à jour les champs
  if (request.title !== undefined) {
    notebook.title = request.title.trim();
  }

  if (request.content !== undefined) {
    notebook.content = request.content;
  }

  if (request.subject !== undefined) {
    notebook.subject = request.subject;
  }

  notebook.updatedAt = Date.now();

  // Sauvegarder les modifications
  nk.storageWrite([{
    collection: COLLECTION_NOTEBOOKS,
    key: request.notebookId,
    userId: ctx.userId,
    value: notebook,
    permissionRead: 1,
    permissionWrite: 0,
  }]);

  logger.info("Carnet mis à jour: %s", request.notebookId);

  return JSON.stringify(notebook);
}

/**
 * RPC: Supprimer un carnet de notes
 */
function rpcDeleteNotebook(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  if (!ctx.userId) {
    throw Error("Utilisateur non authentifié");
  }

  const request: DeleteNotebookRequest = JSON.parse(payload);

  if (!request.notebookId) {
    throw Error("ID du carnet requis");
  }

  // Vérifier que le carnet existe et appartient à l'utilisateur
  const notebooks = nk.storageRead([{
    collection: COLLECTION_NOTEBOOKS,
    key: request.notebookId,
    userId: ctx.userId,
  }]);

  if (notebooks.length === 0) {
    throw Error("Carnet non trouvé ou n'appartient pas à l'utilisateur");
  }

  // Supprimer le carnet
  nk.storageDelete([{
    collection: COLLECTION_NOTEBOOKS,
    key: request.notebookId,
    userId: ctx.userId,
  }]);

  logger.info("Carnet supprimé: %s", request.notebookId);

  return JSON.stringify({ success: true, notebookId: request.notebookId });
}

// Point d'entrée du module
// @ts-ignore
!InitModule && InitModule(ctx, logger, nk, initializer);
