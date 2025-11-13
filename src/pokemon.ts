import { z } from "zod";

export type StatusCondition = "poisoned" | "paralyzed" | "asleep" | "burned" | "frozen" | null;

export type Pokemon = {
  name: string;
  experience: number;
  baseCatchRate: number;
  level: number; 
  status: StatusCondition;
  statusDuration?: number; // Duration of the status condition in turns
  stats: Stat[];
  types: string[];
  moves: Move[];
};

export type Stat = {
  name: string;
  value: number;
};

export type Move = {
  name: string;
  power: number | null;
  type: string;
  category: "physical" | "special" | "status";
  accuracy: number | null;
};

export type Pokeball = {
  name: string;
  catchRateModifier: number;
  description?: string;
};

export const POKEBALLS: Record<string, Pokeball> = {
  pokeball: { name: "pokeball", catchRateModifier: 1, description: "Standard effectiveness" },
  greatball: { name: "greatball", catchRateModifier: 1.5, description: "Better than standard" },
  ultraball: { name: "ultraball", catchRateModifier: 2, description: "Highest effectiveness" },
};

export function getPokemonCatchProbability(pokemon: Pokemon, ball: Pokeball): number {
  let statusModifier = 1;
  if (pokemon.status === "paralyzed" || pokemon.status === "poisoned" || pokemon.status === "burned") {
    statusModifier = 1.5;
  } else if (pokemon.status === "asleep" || pokemon.status === "frozen") {
    statusModifier = 2;
  }

  const levelFactor = 100 / (100 + pokemon.level);
  const catchThreshold = (41.0 * pokemon.baseCatchRate * 255) / (255 * pokemon.experience) * ball.catchRateModifier * levelFactor * statusModifier;
  
  const clampedThreshold = Math.max(0, Math.min(255, catchThreshold));

  return clampedThreshold;
}

// Type Effectiveness Chart (comprehensive)
// Represents multipliers: 2 = super effective, 0.5 = not very effective, 0 = immune
const typeChart: Record<string, Record<string, number>> = {
  normal: {
    rock: 0.5, ghost: 0, steel: 0.5
  },
  fire: {
    fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, dragon: 0.5, fairy: 2
  },
  water: {
    fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5
  },
  grass: {
    fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5
  },
  electric: {
    water: 2, electric: 0.5, grass: 0.5, ground: 0, dragon: 0.5
  },
  ice: {
    fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5
  },
  fighting: {
    normal: 2, rock: 2, 'dark': 2, flying: 0.5, psychic: 0.5, fairy: 0.5
  },
  poison: {
    grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5
  },
  ground: {
    fire: 2, electric: 2, grass: 0.5, poison: 2, rock: 0.5, flying: 0, bug: 0.5
  },
  flying: {
    electric: 0.5, rock: 0.5, fighting: 2, grass: 2, bug: 2, steel: 0.5
  },
  psychic: {
    fighting: 2, poison: 2, 'dark': 0.5
  },
  bug: {
    fire: 0.5, fighting: 0.5, flying: 0.5, rock: 0.5, ghost: 0.5, steel: 0.5, fairy: 0.5
  },
  rock: {
    normal: 2, fire: 2, water: 0.5, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5
  },
  ghost: {
    normal: 0, 'dark': 0.5, ghost: 2, psychic: 2
  },
  dragon: {
    fire: 2, water: 2, electric: 2, grass: 0.5, ice: 2, dragon: 2, fairy: 0.5
  },
  dark: {
    fighting: 0.5, dark: 0.5, fairy: 0.5, ghost: 2
  },
  steel: {
    fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2
  },
  fairy: {
    fighting: 2, poison: 0.5, fire: 0.5, 'dark': 2, dragon: 2, steel: 0.5
  },
};

// Helper function to get type effectiveness multiplier
export function getTypeEffectiveness(moveType: string, defenderTypes: string[]): number {
  let totalEffectiveness = 1;
  for (const defenderType of defenderTypes) {
    const effectiveness = typeChart[moveType]?.[defenderType] ?? 1;
    totalEffectiveness *= effectiveness;
  }
  return totalEffectiveness;
}

// Helper function to map API stat names to a consistent format
export function mapPokemonStats(apiStats: any[]): Stat[] {
  return apiStats?.map(statInfo => ({
    name: statInfo?.stat?.name || 'unknown',
    value: statInfo?.base_stat || 0
  })) || [];
}

// Helper function to map API types to a consistent format
export function mapPokemonTypes(apiTypes: any[]): string[] {
  return apiTypes?.map(typeInfo => typeInfo?.type?.name || 'normal') || [];
}

// Helper function to map API moves to a consistent format
export function mapPokemonMoves(apiMoves: any[]): Move[] {
  // Note: This is a simplified mapping. In a real game, you'd fetch detailed move data.
  return (apiMoves?.map(moveInfo => {
    if (!moveInfo?.move) return null;
    return {
      name: moveInfo.move.name || 'unknown',
      power: moveInfo.move.power || null, // Power might be null for status moves
      type: moveInfo.move.type?.name || 'normal',
      category: moveInfo.move.damage_class?.name || 'physical',
      accuracy: moveInfo.move.accuracy || null, // Accuracy might be null
    };
  }).filter(Boolean) as Move[]) || [];
}
