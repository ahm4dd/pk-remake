import { describe, it, expect } from 'vitest';
import { BattleSystem } from '../src/battle.js';
import { Pokemon } from '../src/pokemon.js';

describe('BattleSystem', () => {
  it('should calculate damage correctly', () => {
    const attacker: Pokemon = {
      name: 'Pikachu',
      experience: 100,
      baseCatchRate: 45,
      level: 5,
      status: null,
      stats: [
        { name: 'attack', value: 30 },
        { name: 'special-attack', value: 40 },
        { name: 'defense', value: 20 },
        { name: 'special-defense', value: 25 },
        { name: 'speed', value: 50 },
        { name: 'hp', value: 35 },
      ],
      types: ['electric'],
      moves: [
        { name: 'Thunderbolt', power: 90, type: 'electric', category: 'special' as const, accuracy: 100 },
      ],
    };

    const defender: Pokemon = {
      name: 'Squirtle',
      experience: 100,
      baseCatchRate: 45,
      level: 5,
      status: null,
      stats: [
        { name: 'attack', value: 25 },
        { name: 'special-attack', value: 30 },
        { name: 'defense', value: 35 },
        { name: 'special-defense', value: 30 },
        { name: 'speed', value: 25 },
        { name: 'hp', value: 44 },
      ],
      types: ['water'],
      moves: [
        { name: 'Water Gun', power: 40, type: 'water', category: 'special' as const, accuracy: 100 },
      ],
    };

    const move = attacker.moves[0];
    const damage = BattleSystem.calculateDamage(attacker, defender, move);
    expect(damage).toBeGreaterThan(0);
    expect(damage).toBeLessThanOrEqual(100); // Rough check
  });

  it('should handle move hit', () => {
    const move = { name: 'Tackle', power: 40, type: 'normal', category: 'physical' as const, accuracy: 100 };
    const hit = BattleSystem.doesMoveHit(move);
    expect(hit).toBe(true);
  });

  it('should get stat by name', () => {
    const stats = [{ name: 'hp', value: 100 }];
    const value = BattleSystem.getStatByName(stats, 'hp');
    expect(value).toBe(100);
  });
});