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

export interface Trade {
  id: number;
  from_user_id: number;
  to_user_id: number;
  from_pokemon_id: number;
  to_pokemon_id: number | null;
  status: string;
  created_at: string;
}

export interface DailyChallenge {
  id: number;
  user_id: number;
  challenge_type: string;
  target: number;
  progress: number;
  reward_xp: number;
  date: string;
  completed: boolean;
}

class DatabaseManager {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const defaultPath = path.join(process.cwd(), 'pokemon.db');
    const finalPath = dbPath || defaultPath;
    const exists = fs.existsSync(finalPath);
    this.db = new Database(finalPath);

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

    // Trades table
    this.db.exec(`
      CREATE TABLE trades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_user_id INTEGER NOT NULL,
        to_user_id INTEGER NOT NULL,
        from_pokemon_id INTEGER NOT NULL,
        to_pokemon_id INTEGER,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (from_user_id) REFERENCES users (id),
        FOREIGN KEY (to_user_id) REFERENCES users (id),
        FOREIGN KEY (from_pokemon_id) REFERENCES pokemon (id),
        FOREIGN KEY (to_pokemon_id) REFERENCES pokemon (id)
      )
    `);

    // Daily challenges table
    this.db.exec(`
      CREATE TABLE daily_challenges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        challenge_type TEXT NOT NULL,
        target INTEGER NOT NULL,
        progress INTEGER DEFAULT 0,
        reward_xp INTEGER NOT NULL,
        date TEXT NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Default inventory will be added on user creation
  }

  // User methods
  createUser(username: string, passwordHash: string): User {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO users (username, password_hash) VALUES (?, ?)
      `);
      const result = stmt.run(username, passwordHash);
      const userId = result.lastInsertRowid as number;

      // Add default inventory
      this.setInventory(userId, 'ball', 'pokeball', 10);

      return {
        id: userId,
        username,
        password_hash: passwordHash,
        level: 1,
        xp: 0,
        created_at: new Date().toISOString(),
      };
    } catch (err: unknown) {
      console.error(`DB Error creating user: ${err}`);
      throw new Error("Failed to create user. Username may already exist.");
    }
  }

  getUserByUsername(username: string): User | null {
    const stmt = this.db.prepare(`
      SELECT * FROM users WHERE username = ?
    `);
    return stmt.get(username) as User | null;
  }

  getUsernameById(userId: number): string | null {
    const stmt = this.db.prepare(`
      SELECT username FROM users WHERE id = ?
    `);
    const row = stmt.get(userId) as { username: string } | undefined;
    return row ? row.username : null;
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

  getPokemonIdByUserAndName(userId: number, name: string): number | null {
    const stmt = this.db.prepare(`
      SELECT id FROM pokemon WHERE user_id = ? AND name = ? LIMIT 1
    `);
    const row = stmt.get(userId, name) as { id: number } | undefined;
    return row ? row.id : null;
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

  updateInventory(userId: number, itemType: string, itemName: string, delta: number) {
    const current = this.getInventory(userId).find(i => i.item_type === itemType && i.item_name === itemName)?.quantity || 0;
    const newQuantity = Math.max(0, current + delta);
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO inventory (user_id, item_type, item_name, quantity)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(userId, itemType, itemName, newQuantity);
  }

  setInventory(userId: number, itemType: string, itemName: string, quantity: number) {
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

  // Trade methods
  createTrade(fromUserId: number, toUserId: number, fromPokemonId: number, toPokemonId?: number): number {
    const stmt = this.db.prepare(`
      INSERT INTO trades (from_user_id, to_user_id, from_pokemon_id, to_pokemon_id)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(fromUserId, toUserId, fromPokemonId, toPokemonId || null);
    return result.lastInsertRowid as number;
  }

  getPendingTradesForUser(userId: number): Trade[] {
    const stmt = this.db.prepare(`
      SELECT * FROM trades WHERE to_user_id = ? AND status = 'pending'
    `);
    return stmt.all(userId) as Trade[];
  }

  acceptTrade(tradeId: number, toPokemonId: number) {
    const stmt = this.db.prepare(`
      UPDATE trades SET to_pokemon_id = ?, status = 'accepted' WHERE id = ?
    `);
    stmt.run(toPokemonId, tradeId);
  }

  rejectTrade(tradeId: number) {
    const stmt = this.db.prepare(`
      UPDATE trades SET status = 'rejected' WHERE id = ?
    `);
    stmt.run(tradeId);
  }

  executeTrade(tradeId: number) {
    // Get the trade
    const tradeStmt = this.db.prepare(`
      SELECT * FROM trades WHERE id = ? AND status = 'accepted'
    `);
    const trade = tradeStmt.get(tradeId) as Trade;
    if (!trade || !trade.to_pokemon_id) return;

    // Swap user_id of the Pokemon
    const updateStmt = this.db.prepare(`
      UPDATE pokemon SET user_id = CASE
        WHEN id = ? THEN ?
        WHEN id = ? THEN ?
        ELSE user_id
      END
      WHERE id IN (?, ?)
    `);
    updateStmt.run(trade.from_pokemon_id, trade.to_user_id, trade.to_pokemon_id, trade.from_user_id, trade.from_pokemon_id, trade.to_pokemon_id);
  }

  // Daily challenges methods
  getOrCreateDailyChallenges(userId: number): DailyChallenge[] {
    const today = new Date().toISOString().split('T')[0];
    const existing = this.db.prepare(`
      SELECT * FROM daily_challenges WHERE user_id = ? AND date = ?
    `).all(userId, today) as DailyChallenge[];

    if (existing.length > 0) return existing;

    // Create new challenges
    const challenges = [
      { type: 'catch', target: 3, reward: 50 },
      { type: 'battle', target: 2, reward: 30 },
      { type: 'explore', target: 5, reward: 20 },
    ];

    const insertStmt = this.db.prepare(`
      INSERT INTO daily_challenges (user_id, challenge_type, target, reward_xp, date)
      VALUES (?, ?, ?, ?, ?)
    `);

    challenges.forEach(c => {
      insertStmt.run(userId, c.type, c.target, c.reward, today);
    });

    return this.db.prepare(`
      SELECT * FROM daily_challenges WHERE user_id = ? AND date = ?
    `).all(userId, today) as DailyChallenge[];
  }

  updateChallengeProgress(userId: number, type: string, increment: number = 1) {
    const today = new Date().toISOString().split('T')[0];
    const stmt = this.db.prepare(`
      UPDATE daily_challenges
      SET progress = progress + ?
      WHERE user_id = ? AND challenge_type = ? AND date = ? AND completed = FALSE
    `);
    stmt.run(increment, userId, type, today);
  }

  completeChallenge(challengeId: number): number {
    const stmt = this.db.prepare(`
      UPDATE daily_challenges
      SET completed = TRUE
      WHERE id = ? AND completed = FALSE
    `);
    stmt.run(challengeId);
    // Return reward_xp
    const rewardStmt = this.db.prepare(`
      SELECT reward_xp FROM daily_challenges WHERE id = ?
    `);
    const row = rewardStmt.get(challengeId) as { reward_xp: number };
    return row.reward_xp;
  }

  getTopUsersByXP(limit: number = 10): { username: string; level: number; xp: number }[] {
    const stmt = this.db.prepare(`
      SELECT username, level, xp FROM users ORDER BY xp DESC LIMIT ?
    `);
    return stmt.all(limit) as { username: string; level: number; xp: number }[];
  }

  close() {
    this.db.close();
  }
}

export const db = new DatabaseManager();

// For tests
export const createTestDB = () => new DatabaseManager(':memory:');