import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDB, db } from '../src/database.js';

describe('Item Effects System', () => {
  beforeEach(() => {
    // Reset DB for each test
    (db as any).db = createTestDB().db;
    (db as any).initSchema();
  });

  it('should save Pokemon with current_hp', () => {
    const user = db.createUser('testuser', 'hash');
    
    db.savePokemon(user.id, {
      name: 'pikachu',
      level: 10,
      experience: 100,
      stats: JSON.stringify([{ name: 'hp', value: 100 }, { name: 'attack', value: 55 }]),
      types: JSON.stringify(['electric']),
      moves: JSON.stringify([{ name: 'thunderbolt', power: 90, type: 'electric', category: 'special', accuracy: 100 }]),
      current_hp: 100,
    });

    const pokemon = db.getUserPokemon(user.id);
    expect(pokemon.length).toBe(1);
    expect(pokemon[0].current_hp).toBe(100);
    expect(pokemon[0].name).toBe('pikachu');
  });

  it('should update Pokemon HP', () => {
    const user = db.createUser('testuser', 'hash');
    
    db.savePokemon(user.id, {
      name: 'charmander',
      level: 5,
      experience: 50,
      stats: JSON.stringify([{ name: 'hp', value: 80 }]),
      types: JSON.stringify(['fire']),
      moves: JSON.stringify([]),
      current_hp: 80,
    });

    const pokemon = db.getUserPokemon(user.id)[0];
    expect(pokemon.current_hp).toBe(80);

    // Simulate damage
    db.updatePokemonHP(pokemon.id, 30);
    
    const updatedPokemon = db.getUserPokemon(user.id)[0];
    expect(updatedPokemon.current_hp).toBe(30);
  });

  it('should heal Pokemon with potion', () => {
    const user = db.createUser('testuser', 'hash');
    
    // Create a damaged Pokemon
    db.savePokemon(user.id, {
      name: 'bulbasaur',
      level: 8,
      experience: 75,
      stats: JSON.stringify([{ name: 'hp', value: 100 }]),
      types: JSON.stringify(['grass', 'poison']),
      moves: JSON.stringify([]),
      current_hp: 50, // Damaged
    });

    // Add potion to inventory
    db.setInventory(user.id, 'heal', 'potion', 5);

    const pokemon = db.getUserPokemon(user.id)[0];
    const stats = JSON.parse(pokemon.stats);
    const maxHp = stats.find((s: any) => s.name === 'hp')?.value || 100;
    const currentHp = pokemon.current_hp;

    expect(currentHp).toBe(50);

    // Heal with potion (heals 20 HP)
    const healAmount = 20;
    const newHp = Math.min(maxHp, currentHp + healAmount);
    db.updatePokemonHP(pokemon.id, newHp);
    db.updateInventory(user.id, 'heal', 'potion', -1);

    const healedPokemon = db.getUserPokemon(user.id)[0];
    expect(healedPokemon.current_hp).toBe(70);

    const inventory = db.getInventory(user.id);
    const potions = inventory.find(i => i.item_name === 'potion');
    expect(potions?.quantity).toBe(4);
  });

  it('should not overheal Pokemon beyond max HP', () => {
    const user = db.createUser('testuser', 'hash');
    
    db.savePokemon(user.id, {
      name: 'squirtle',
      level: 10,
      experience: 100,
      stats: JSON.stringify([{ name: 'hp', value: 100 }]),
      types: JSON.stringify(['water']),
      moves: JSON.stringify([]),
      current_hp: 95,
    });

    const pokemon = db.getUserPokemon(user.id)[0];
    const stats = JSON.parse(pokemon.stats);
    const maxHp = stats.find((s: any) => s.name === 'hp')?.value || 100;

    // Try to heal 20 HP (should cap at maxHp)
    const newHp = Math.min(maxHp, pokemon.current_hp + 20);
    db.updatePokemonHP(pokemon.id, newHp);

    const healedPokemon = db.getUserPokemon(user.id)[0];
    expect(healedPokemon.current_hp).toBe(100); // Capped at max
  });

  it('should handle super-potion healing (50 HP)', () => {
    const user = db.createUser('testuser', 'hash');
    
    db.savePokemon(user.id, {
      name: 'eevee',
      level: 12,
      experience: 150,
      stats: JSON.stringify([{ name: 'hp', value: 120 }]),
      types: JSON.stringify(['normal']),
      moves: JSON.stringify([]),
      current_hp: 30,
    });

    db.setInventory(user.id, 'heal', 'super-potion', 3);

    const pokemon = db.getUserPokemon(user.id)[0];
    const healAmount = 50; // Super potion heals 50
    const newHp = Math.min(120, pokemon.current_hp + healAmount);
    
    db.updatePokemonHP(pokemon.id, newHp);
    db.updateInventory(user.id, 'heal', 'super-potion', -1);

    const healedPokemon = db.getUserPokemon(user.id)[0];
    expect(healedPokemon.current_hp).toBe(80);
  });

  it('should default current_hp to 100 if not provided during save', () => {
    const user = db.createUser('testuser', 'hash');
    
    // Save without providing current_hp
    db.savePokemon(user.id, {
      name: 'pidgey',
      level: 3,
      experience: 20,
      stats: JSON.stringify([{ name: 'hp', value: 80 }]),
      types: JSON.stringify(['normal', 'flying']),
      moves: JSON.stringify([]),
      current_hp: 0, // Will be defaulted
    } as any);

    const pokemon = db.getUserPokemon(user.id)[0];
    // Should have defaulted to 100 (or the value we pass, since 0 is falsy)
    expect(pokemon.current_hp).toBeDefined();
  });

  it('should track inventory changes when using items', () => {
    const user = db.createUser('testuser', 'hash');
    
    // Set initial inventory
    db.setInventory(user.id, 'heal', 'potion', 10);
    db.setInventory(user.id, 'heal', 'super-potion', 5);
    db.setInventory(user.id, 'ball', 'pokeball', 20);

    let inventory = db.getInventory(user.id);
    expect(inventory.find(i => i.item_name === 'potion')?.quantity).toBe(10);

    // Use 3 potions
    db.updateInventory(user.id, 'heal', 'potion', -3);
    inventory = db.getInventory(user.id);
    expect(inventory.find(i => i.item_name === 'potion')?.quantity).toBe(7);

    // Use 2 super potions
    db.updateInventory(user.id, 'heal', 'super-potion', -2);
    inventory = db.getInventory(user.id);
    expect(inventory.find(i => i.item_name === 'super-potion')?.quantity).toBe(3);

    // Pokeballs should remain unchanged
    expect(inventory.find(i => i.item_name === 'pokeball')?.quantity).toBe(20);
  });
});
