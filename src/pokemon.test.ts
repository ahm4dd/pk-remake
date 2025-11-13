import { describe, it, expect, vi } from 'vitest';
import { Pokemon, Pokeball, POKEBALLS, getPokemonCatchProbability, mapPokemonStats, mapPokemonTypes, Move, Stat } from '../src/pokemon';

describe('Pokemon Utilities Tests', () => {

  describe('getPokemonCatchProbability', () => {
    const mockPokemonBase: Omit<Pokemon, 'experience' | 'baseCatchRate' | 'level' | 'status' | 'stats' | 'types' | 'moves'> = {
      name: 'testmon',
    };

    it('should calculate catch probability correctly for a standard catch', () => {
      const pokemon: Pokemon = {
        ...mockPokemonBase,
        experience: 500, // Moderate experience
        baseCatchRate: 45, // Standard catch rate
        level: 5, // Moderate level
        status: null,
        stats: [{ name: 'hp', value: 50 }],
        types: ['normal'],
        moves: [],
      };
      const ball = POKEBALLS['pokeball'];
      const probability = getPokemonCatchProbability(pokemon, ball);
      // Based on the formula: (41 * 45 * 255) / (255 * 500) * 1 * (100 / (100 + 5)) = ~31.2
      expect(probability).toBeGreaterThan(30);
      expect(probability).toBeLessThan(33);
    });

    it('should increase catch probability with a Great Ball', () => {
      const pokemon: Pokemon = {
        ...mockPokemonBase,
        experience: 500,
        baseCatchRate: 45,
        level: 5,
        status: null,
        stats: [{ name: 'hp', value: 50 }],
        types: ['normal'],
        moves: [],
      };
      const ball = POKEBALLS['greatball'];
      const probability = getPokemonCatchProbability(pokemon, ball);
      // Probability should be higher than with a Pokeball
      expect(probability).toBeGreaterThan(31.2 * 1.5 * 0.85); // Approx with random factor
    });

    it('should decrease catch probability with higher level and experience', () => {
      const pokemonHighLevel: Pokemon = {
        ...mockPokemonBase,
        experience: 1500, // Higher experience
        baseCatchRate: 45,
        level: 15, // Higher level
        status: null,
        stats: [{ name: 'hp', value: 50 }],
        types: ['normal'],
        moves: [],
      };
      const pokemonLowLevel: Pokemon = {
        ...mockPokemonBase,
        experience: 200, // Lower experience
        baseCatchRate: 45,
        level: 2, // Lower level
        status: null,
        stats: [{ name: 'hp', value: 50 }],
        types: ['normal'],
        moves: [],
      };
      const ball = POKEBALLS['pokeball'];
      const probHigh = getPokemonCatchProbability(pokemonHighLevel, ball);
      const probLow = getPokemonCatchProbability(pokemonLowLevel, ball);
      expect(probLow).toBeGreaterThan(probHigh);
    });

    it('should increase catch probability with status conditions', () => {
      const pokemonParalyzed: Pokemon = {
        ...mockPokemonBase,
        experience: 500,
        baseCatchRate: 45,
        level: 5,
        status: 'paralyzed',
        stats: [{ name: 'hp', value: 50 }],
        types: ['normal'],
        moves: [],
      };
      const pokemonAsleep: Pokemon = {
        ...mockPokemonBase,
        experience: 500,
        baseCatchRate: 45,
        level: 5,
        status: 'asleep',
        stats: [{ name: 'hp', value: 50 }],
        types: ['normal'],
        moves: [],
      };
      const ball = POKEBALLS['pokeball'];
      const probNormal = getPokemonCatchProbability({...mockPokemonBase, experience: 500, baseCatchRate: 45, level: 5, status: null, stats: [{ name: 'hp', value: 50 }], types: ['normal'], moves: []}, ball);
      const probParalyzed = getPokemonCatchProbability(pokemonParalyzed, ball);
      const probAsleep = getPokemonCatchProbability(pokemonAsleep, ball);

      expect(probParalyzed).toBeGreaterThan(probNormal);
      expect(probAsleep).toBeGreaterThan(probParalyzed);
    });
  });

  // Tests for mapPokemonStats, mapPokemonTypes, mapPokemonMoves would require mocking API responses
  // and are more complex. Focusing on core logic for now.
});
