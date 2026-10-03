export type CharacterId =
  | 'hero_t1'
  | 'hero_t2'
  | 'hero_t3'
  | 'companion_shield'
  | 'companion_tech';

export type WeaponId =
  | 'runic_blade'
  | 'fire_axe'
  | 'plasma_crossbow'
  | 'lightning_staff'
  | 'twin_daggers'
  | 'demon_greatsword';

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  coins: number;
  hearts: number;
  maxHearts: number;
  unlockedCharacters: string[];
  selectedCharacter: CharacterId;
  unlockedWeapons: string[];
  selectedWeapon: WeaponId;
  currentLevel: number;
  highScore: number;
  totalKills: number;
  bossesDefeated: number;
}

export interface CharacterConfig {
  id: CharacterId;
  name: string;
  title: string;
  tier: 1 | 2 | 3;
  category: 'hero' | 'companion';
  description: string;
  speed: number;
  defense: number; // damage reduction %
  damageMultiplier: number;
  abilityName: string;
  abilityCooldown: number; // in seconds
  abilityDescription: string;
  accentColor: string;
  price: number;
}

export interface WeaponConfig {
  id: WeaponId;
  name: string;
  type: 'melee' | 'ranged' | 'magic';
  damage: number;
  speed: number; // attacks per second
  range: number;
  critChance: number;
  accentColor: string;
  description: string;
  specialEffect: string;
  price: number;
}

export type EnemySpecies = 'bat' | 'wyvern' | 'demon_boss' | 'shadow_entity';

export interface LevelConfig {
  id: number;
  name: string;
  zone: string;
  description: string;
  theme: 'volcano' | 'arena' | 'forest';
  bossSpecies: EnemySpecies;
  ambientColor: number;
  fogColor: number;
  fogDensity: number;
  targetKills: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  opacity: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  radius: number;
  color: string;
  damage: number;
  fromPlayer: boolean;
  life: number;
  maxLife: number;
}
