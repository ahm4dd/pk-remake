// @ts-ignore
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export function migrate() {
  const dbPath = path.join(process.cwd(), 'pokemon.db');
  const exists = fs.existsSync(dbPath);
  if (exists) {
    console.log('Database already exists, skipping migration.');
    return;
  }

  const db = new Database(dbPath);

  // Users table
  db.exec(`
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
  db.exec(`
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
  db.exec(`
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
  db.exec(`
    CREATE TABLE achievements (
      user_id INTEGER NOT NULL,
      achievement_name TEXT NOT NULL,
      unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, achievement_name),
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  console.log('Database schema created successfully.');
  db.close();
}