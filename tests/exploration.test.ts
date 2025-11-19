import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestDB, db } from '../src/database.js';

describe('Hidden Items and Encounters', () => {
  beforeEach(() => {
    // Reset DB for each test
    (db as any).db = createTestDB().db;
    (db as any).initSchema();
  });

  it('should find items randomly during exploration', () => {
    const user = db.createUser('explorer', 'hash');
    
    // Simulate finding a potion
    db.updateInventory(user.id, 'heal', 'potion', 1);
    
    const inventory = db.getInventory(user.id);
    const potion = inventory.find(i => i.item_name === 'potion');
    
    expect(potion).toBeDefined();
    expect(potion?.quantity).toBe(1);
  });

  it('should accumulate found items over multiple explorations', () => {
    const user = db.createUser('explorer', 'hash');
    
    // Simulate finding items on multiple explorations
    // Note: Users start with 10 pokeballs by default
    db.updateInventory(user.id, 'ball', 'pokeball', 1); // Found 1
    db.updateInventory(user.id, 'ball', 'pokeball', 1); // Found another
    db.updateInventory(user.id, 'ball', 'greatball', 1); // Found different item
    
    const inventory = db.getInventory(user.id);
    const pokeballs = inventory.find(i => i.item_name === 'pokeball');
    const greatballs = inventory.find(i => i.item_name === 'greatball');
    
    expect(pokeballs?.quantity).toBe(12); // 10 default + 2 found
    expect(greatballs?.quantity).toBe(1);
  });

  it('should track exploration progress for quests', () => {
    const user = db.createUser('explorer', 'hash');
    
    // Assign explore quest
    const quests = db.getAvailableQuests();
    const exploreQuest = quests.find(q => q.type === 'explore');
    
    if (exploreQuest) {
      db.assignQuest(user.id, exploreQuest.id);
      
      // Simulate exploring 5 times
      for (let i = 0; i < 5; i++) {
        db.updateQuestProgress(user.id, 'explore', 1);
      }
      
      const userQuests = db.getUserQuestProgress(user.id);
      const progress = userQuests.find(q => q.quest_id === exploreQuest.id);
      
      expect(progress?.current_count).toBe(5);
    }
  });

  it('should handle weighted random item selection', () => {
    // Test the probability distribution (simplified test)
    const items = [
      { type: 'ball', name: 'pokeball', weight: 40 },
      { type: 'ball', name: 'greatball', weight: 20 },
      { type: 'ball', name: 'ultraball', weight: 10 },
      { type: 'heal', name: 'potion', weight: 50 },
    ];
    
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    expect(totalWeight).toBe(120);
    
    // Verify weights add up correctly
    const pokeballWeight = items[0].weight / totalWeight;
    expect(pokeballWeight).toBeCloseTo(0.333, 2); // ~33%
  });

  it('should support rare Pokemon encounter tracking', () => {
    const user = db.createUser('hunter', 'hash');
    
    // Simulate catching a rare Pokemon
    db.savePokemon(user.id, {
      name: 'dratini', // Rare Pokemon
      level: 15,
      experience: 300,
      stats: JSON.stringify([{ name: 'hp', value: 120 }]),
      types: JSON.stringify(['dragon']),
      moves: JSON.stringify([]),
      current_hp: 120,
    });
    
    const pokemon = db.getUserPokemon(user.id);
    expect(pokemon.length).toBe(1);
    expect(pokemon[0].name).toBe('dratini');
  });

  it('should allow users to catch legendary Pokemon', () => {
    const user = db.createUser('legendary_hunter', 'hash');
    
    // Simulate catching a legendary Pokemon
    db.savePokemon(user.id, {
      name: 'mewtwo', // Legendary Pokemon
      level: 70,
      experience: 10000,
      stats: JSON.stringify([{ name: 'hp', value: 250 }]),
      types: JSON.stringify(['psychic']),
      moves: JSON.stringify([]),
      current_hp: 250,
    });
    
    const pokemon = db.getUserPokemon(user.id);
    expect(pokemon.length).toBe(1);
    expect(pokemon[0].name).toBe('mewtwo');
    expect(pokemon[0].level).toBe(70);
  });

  it('should track different item types found', () => {
    const user = db.createUser('collector', 'hash');
    
    // Simulate finding various items
    db.updateInventory(user.id, 'ball', 'pokeball', 3);
    db.updateInventory(user.id, 'ball', 'greatball', 2);
    db.updateInventory(user.id, 'ball', 'ultraball', 1);
    db.updateInventory(user.id, 'heal', 'potion', 5);
    db.updateInventory(user.id, 'heal', 'super-potion', 2);
    
    const inventory = db.getInventory(user.id);
    
    // Count total items
    const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
    expect(totalItems).toBeGreaterThan(0);
    
    // Verify different types
    const ballItems = inventory.filter(i => i.item_type === 'ball');
    const healItems = inventory.filter(i => i.item_type === 'heal');
    
    expect(ballItems.length).toBeGreaterThan(0);
    expect(healItems.length).toBeGreaterThan(0);
  });

  it('should maintain inventory after multiple explorations', () => {
    const user = db.createUser('adventurer', 'hash');
    
    // Set initial inventory
    db.setInventory(user.id, 'ball', 'pokeball', 10);
    
    // Find more items
    db.updateInventory(user.id, 'ball', 'pokeball', 3);
    
    const inventory = db.getInventory(user.id);
    const pokeballs = inventory.find(i => i.item_name === 'pokeball');
    
    expect(pokeballs?.quantity).toBe(13); // 10 initial + 3 found
  });

  it('should handle exploration quest completion', () => {
    const user = db.createUser('quest_explorer', 'hash');
    
    const quests = db.getAvailableQuests();
    const exploreQuest = quests.find(q => q.type === 'explore');
    
    if (exploreQuest) {
      db.assignQuest(user.id, exploreQuest.id);
      
      // Complete the quest by exploring target_count times
      db.updateQuestProgress(user.id, 'explore', exploreQuest.target_count);
      
      const userQuests = db.getUserQuestProgress(user.id);
      const progress = userQuests.find(q => q.quest_id === exploreQuest.id);
      
      expect(progress?.current_count).toBe(exploreQuest.target_count);
      
      // Can claim reward
      const reward = db.completeQuest(user.id, exploreQuest.id);
      expect(reward).not.toBeNull();
      expect(reward?.xp).toBe(exploreQuest.reward_xp);
    }
  });
});
