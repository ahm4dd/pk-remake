// @ts-ignore
import bcrypt from 'bcrypt';
import { db, User } from './database.js';

export class UserManager {
  static async register(username: string, password: string): Promise<User | null> {
    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    if (username.length < 3 || password.length < 6) {
      throw new Error('Username must be at least 3 characters, password at least 6');
    }

    const existing = db.getUserByUsername(username);
    if (existing) {
      throw new Error('Username already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = db.createUser(username, passwordHash);

    // Initialize inventory
    db.updateInventory(user.id, 'ball', 'pokeball', 10);

    return user;
  }

  static async login(username: string, password: string): Promise<User | null> {
    const user = db.getUserByUsername(username);
    if (!user) {
      throw new Error('User not found');
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid password');
    }

    return user;
  }

  static logout(): void {
    // In a real app, clear session
  }

  static getProfile(userId: number): User | null {
    // Since we have the user, but for consistency
    return db.getUserByUsername('')?.id === userId ? db.getUserByUsername('') : null;
  }

  static updateXP(userId: number, xpGained: number) {
    const user = db.getUserById(userId);
    if (user) {
      const newXP = user.xp + xpGained;
      const newLevel = Math.floor(newXP / 100) + 1;
      db.updateUserXP(userId, newXP, newLevel);
    }
  }
}