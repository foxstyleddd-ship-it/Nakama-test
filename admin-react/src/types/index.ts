export type House = "Venatrix" | "Falcon" | "Brumval" | "Aerwyn" | "Pas de Maison";

export interface Character {
  id: string;
  name: string;
  level: number;
  xp: number;
  house: House;
}

export interface HouseScore {
  house: House;
  points: number;
}

export interface HousePointHistory {
  id: string;
  house: House;
  points: number;
  characterName?: string;
  reason: string;
  timestamp: number;
}

export type SpellElement = "Feu" | "Eau" | "Terre" | "Air" | "Lumière" | "Ombre" | "Arcane";
export type SpellCategory = "Offensif" | "Défensif" | "Utilitaire" | "Soin" | "Contrôle";

export interface Spell {
  id: string;
  name: string;
  description: string;
  element: SpellElement;
  category: SpellCategory;
  basePower: number;
}

export interface CharacterSpell {
  spellId: string;
  level: number;
}

export type ItemType = "consumable" | "equipment" | "quest" | "material" | "notebook";
export type ItemRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface Item {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
}

export interface InventoryItem {
  itemId: string;
  quantity: number;
}

export type NotebookSubject =
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

export interface Notebook {
  id: string;
  characterId: string;
  title: string;
  content: string;
  subject: NotebookSubject;
  createdAt: number;
  updatedAt: number;
}
