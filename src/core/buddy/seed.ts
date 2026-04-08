import * as crypto from 'crypto';

/**
 * 18 species * 6 eyes * 8 hats = 864 physical looks.
 * Then * 5 rarity levels = 4,320 possible combinations.
 */

const SPECIES = [
  'duck', 'goose', 'blob', 'cat', 'dragon', 'octopus', 'owl', 'penguin', 
  'turtle', 'snail', 'ghost', 'axolotl', 'capybara', 'cactus', 'robot', 
  'rabbit', 'mushroom', 'chonk'
];

const RARITIES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];

export interface Companion {
  species: string;
  eyes: number;
  hat: number;
  rarity: string;
  stats: {
    debugging: number;
    patience: number;
    chaos: number;
    wisdom: number;
    snark: number;
  };
}

// Mulberry32 PRNG
function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

export function generateCompanion(userId: string): Companion {
  // Deterministic seed generation
  const hashStr = crypto.createHash('sha256').update(`${userId}friend-2026-401`).digest('hex');
  const seed = parseInt(hashStr.substring(0, 8), 16);
  const prng = mulberry32(seed);

  const species = SPECIES[Math.floor(prng() * SPECIES.length)];
  const eyes = Math.floor(prng() * 6);
  const hat = Math.floor(prng() * 8);

  // Rarity roll based on probabilities in notes
  const r = prng();
  let rarity = 'Common';
  if (r > 0.60) rarity = 'Uncommon';
  if (r > 0.85) rarity = 'Rare';
  if (r > 0.95) rarity = 'Epic';
  if (r > 0.99) rarity = 'Legendary';

  // Stats generation logic
  const stats = {
    debugging: Math.floor(prng() * 100),
    patience: Math.floor(prng() * 100),
    chaos: Math.floor(prng() * 100),
    wisdom: Math.floor(prng() * 100),
    snark: Math.floor(prng() * 100),
  };

  return { species, eyes, hat, rarity, stats };
}
