import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDB } from '../src/database.js';

describe('Database Tests', () => {
  let db: ReturnType<typeof createTestDB>;

  beforeEach(() => {
    db = createTestDB();
  });

  it('should create user', () => {
    const user = db.createUser('testuser1', 'hash');
    expect(user.username).toBe('testuser1');
    expect(user.password_hash).toBe('hash');
    expect(user.level).toBe(1);
    expect(user.xp).toBe(0);
  });

  it('should get user by username', () => {
    db.createUser('testuser2', 'hash');
    const user = db.getUserByUsername('testuser2');
    expect(user).toBeTruthy();
    expect(user?.username).toBe('testuser2');
  });

  it('should save and load pokemon', () => {
    const user = db.createUser('testuser3', 'hash');
    const pokemonData = {
      name: 'pikachu',
      level: 5,
      experience: 400,
      stats: JSON.stringify([{ name: 'hp', value: 35 }]),
      types: JSON.stringify(['electric']),
      moves: JSON.stringify([{ name: 'thunderbolt', power: 90, type: 'electric', category: 'special', accuracy: 100 }]),
    };
    db.savePokemon(user.id, pokemonData);

    const pokemon = db.getUserPokemon(user.id);
    expect(pokemon.length).toBe(1);
    expect(pokemon[0].name).toBe('pikachu');
    expect(pokemon[0].level).toBe(5);
  });

  it('should manage inventory', () => {
    const user = db.createUser('testuser4', 'hash');
    db.updateInventory(user.id, 'ball', 'pokeball', 5);
    const inventory = db.getInventory(user.id);
    expect(inventory.length).toBe(1);
    expect(inventory[0].item_name).toBe('pokeball');
    expect(inventory[0].quantity).toBe(5);
  });

  it('should handle achievements', () => {
    const user = db.createUser('testuser5', 'hash');
    db.unlockAchievement(user.id, 'First Catch');
    const achievements = db.getUserAchievements(user.id);
    expect(achievements.length).toBe(1);
    expect(achievements[0].achievement_name).toBe('First Catch');
  });
});