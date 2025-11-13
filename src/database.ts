// @ts-ignore
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export interface User {
  id: number;
  username: string;
  password_hash: string;
  level: number;
  xp: number;
  created_at: string;
}

export interface Pokemon {
  id: number;
  user_id: number;
  name: string;
  level: number;
  experience: number;
  stats: string; // JSON
  types: string; // JSON
  moves: string; // JSON
  caught_at: string;
}

export interface InventoryItem {
  user_id: number;
  item_type: string;
  item_name: string;
  quantity: number;
}

export interface Achievement {
  user_id: number;
  achievement_name: string;
  unlocked_at: string;
}

class DatabaseManager {
  private db: Database.Database;

  constructor() {
    const dbPath = path.join(process.cwd(), 'pokemon.db');
    const exists = fs.existsSync(dbPath);
    this.db = new Database(dbPath);

    if (!exists) {
      this.initSchema();
    }
  }

  private initSchema() {
    // Users table
    this.db.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        level INTEGER DEFAULT 1,
        xp INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Pokemon table
    this.db.exec(`
      CREATE TABLE pokemon (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        level INTEGER DEFAULT 1,
        experience INTEGER DEFAULT 0,
        stats TEXT NOT NULL,
        types TEXT NOT NULL,
        moves TEXT NOT NULL,
        caught_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Inventory table
    this.db.exec(`
      CREATE TABLE inventory (
        user_id INTEGER NOT NULL,
        item_type TEXT NOT NULL,
        item_name TEXT NOT NULL,
        quantity INTEGER DEFAULT 0,
        PRIMARY KEY (user_id, item_type, item_name),
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Achievements table
    this.db.exec(`
      CREATE TABLE achievements (
        user_id INTEGER NOT NULL,
        achievement_name TEXT NOT NULL,
        unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, achievement_name),
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Default inventory will be added on user creation
  }

  // User methods
  createUser(username: string, passwordHash: string): User {
    const stmt = this.db.prepare(`
      INSERT INTO users (username, password_hash) VALUES (?, ?)
    `);
    const result = stmt.run(username, passwordHash);
    const userId = result.lastInsertRowid as number;

    // Add default inventory
    this.updateInventory(userId, 'ball', 'pokeball', 10);

    return {
      id: userId,
      username,
      password_hash: passwordHash,
      level: 1,
      xp: 0,
      created_at: new Date().toISOString(),
    };
  }

  getUserByUsername(username: string): User | null {
    const stmt = this.db.prepare(`
      SELECT * FROM users WHERE username = ?
    `);
    return stmt.get(username) as User | null;
  }

  updateUserXP(userId: number, xp: number, level: number) {
    const stmt = this.db.prepare(`
      UPDATE users SET xp = ?, level = ? WHERE id = ?
    `);
    stmt.run(xp, level, userId);
  }

  // Pokemon methods
  savePokemon(userId: number, pokemon: Omit<Pokemon, 'id' | 'user_id' | 'caught_at'>) {
    const stmt = this.db.prepare(`
      INSERT INTO pokemon (user_id, name, level, experience, stats, types, moves)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      userId,
      pokemon.name,
      pokemon.level,
      pokemon.experience,
      pokemon.stats,
      pokemon.types,
      pokemon.moves
    );
  }

  getUserPokemon(userId: number): Pokemon[] {
    const stmt = this.db.prepare(`
      SELECT * FROM pokemon WHERE user_id = ? ORDER BY caught_at DESC
    `);
    return stmt.all(userId) as Pokemon[];
  }

  deletePokemon(pokemonId: number, userId: number) {
    const stmt = this.db.prepare(`
      DELETE FROM pokemon WHERE id = ? AND user_id = ?
    `);
    stmt.run(pokemonId, userId);
  }

  // Inventory methods
  getInventory(userId: number): InventoryItem[] {
    const stmt = this.db.prepare(`
      SELECT * FROM inventory WHERE user_id = ?
    `);
    return stmt.all(userId) as InventoryItem[];
  }

  updateInventory(userId: number, itemType: string, itemName: string, quantity: number) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO inventory (user_id, item_type, item_name, quantity)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(userId, itemType, itemName, quantity);
  }

  // Achievement methods
  unlockAchievement(userId: number, achievementName: string) {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO achievements (user_id, achievement_name) VALUES (?, ?)
    `);
    stmt.run(userId, achievementName);
  }

  getUserAchievements(userId: number): Achievement[] {
    const stmt = this.db.prepare(`
      SELECT * FROM achievements WHERE user_id = ?
    `);
    return stmt.all(userId) as Achievement[];
  }

  close() {
    this.db.close();
  }
}

export const db = new DatabaseManager();