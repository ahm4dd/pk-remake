import { describe, it, expect } from 'vitest';
import { PokeAPI } from '../src/pokeapi.js';

describe('Performance Tuning', () => {
  it('should cache API calls for better performance', async () => {
    const api = new PokeAPI();
    const start = Date.now();
    await api.getPokemonData('pikachu');
    const firstCall = Date.now() - start;

    const start2 = Date.now();
    await api.getPokemonData('pikachu');
    const secondCall = Date.now() - start2;

    expect(secondCall).toBeLessThan(firstCall); // Cached call should be faster
  });

  it('should handle database queries efficiently', async () => {
    // Test that getUserPokemon is fast
    const { createTestDB } = await import('../src/database.js');
    const db = createTestDB();
    const user = db.createUser('perfuser', 'hash');
    const start = Date.now();
    db.getUserPokemon(user.id);
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100); // Should be fast
  });
});