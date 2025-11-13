import { db } from './database.js';

export const ACHIEVEMENTS = {
  FIRST_CATCH: { name: 'First Catch', description: 'Catch your first Pokemon' },
  TEN_CATCHES: { name: 'Collector', description: 'Catch 10 Pokemon' },
  FIFTY_CATCHES: { name: 'Trainer', description: 'Catch 50 Pokemon' },
  LEGENDARY: { name: 'Legendary Hunter', description: 'Catch a legendary Pokemon' },
  LEVEL_10: { name: 'Apprentice', description: 'Reach level 10' },
  LEVEL_25: { name: 'Expert', description: 'Reach level 25' },
};

export class GamificationManager {
  static gainXP(userId: number, xpAmount: number, reason: string) {
    // Update user XP
    const user = db.getUserByUsername(''); // Need to get by ID
    if (user) {
      const newXP = user.xp + xpAmount;
      const newLevel = Math.floor(newXP / 100) + 1;
      db.updateUserXP(userId, newXP, newLevel);

      console.log(`+${xpAmount} XP for ${reason}!`);

      // Check for level achievements
      if (newLevel >= 10 && !this.hasAchievement(userId, 'LEVEL_10')) {
        this.unlockAchievement(userId, 'LEVEL_10');
      }
      if (newLevel >= 25 && !this.hasAchievement(userId, 'LEVEL_25')) {
        this.unlockAchievement(userId, 'LEVEL_25');
      }
    }
  }

  static onCatch(userId: number, pokemonName: string) {
    // XP for catching
    let xp = 10;
    if (['mewtwo', 'mew', 'articuno', 'zapdos', 'moltres', 'lugia', 'ho-oh', 'celebi'].includes(pokemonName.toLowerCase())) {
      xp = 100; // Legendary bonus
      if (!this.hasAchievement(userId, 'LEGENDARY')) {
        this.unlockAchievement(userId, 'LEGENDARY');
      }
    }

    this.gainXP(userId, xp, `catching ${pokemonName}`);

    // Check catch achievements
    const pokemonCount = db.getUserPokemon(userId).length;
    if (pokemonCount >= 1 && !this.hasAchievement(userId, 'FIRST_CATCH')) {
      this.unlockAchievement(userId, 'FIRST_CATCH');
    }
    if (pokemonCount >= 10 && !this.hasAchievement(userId, 'TEN_CATCHES')) {
      this.unlockAchievement(userId, 'TEN_CATCHES');
    }
    if (pokemonCount >= 50 && !this.hasAchievement(userId, 'FIFTY_CATCHES')) {
      this.unlockAchievement(userId, 'FIFTY_CATCHES');
    }
  }

  static unlockAchievement(userId: number, achievementKey: string) {
    const achievement = ACHIEVEMENTS[achievementKey as keyof typeof ACHIEVEMENTS];
    if (achievement) {
      db.unlockAchievement(userId, achievement.name);
      console.log(`🏆 Achievement Unlocked: ${achievement.name} - ${achievement.description}!`);
    }
  }

  static hasAchievement(userId: number, achievementKey: string): boolean {
    const achievement = ACHIEVEMENTS[achievementKey as keyof typeof ACHIEVEMENTS];
    if (!achievement) return false;

    const achievements = db.getUserAchievements(userId);
    return achievements.some(a => a.achievement_name === achievement.name);
  }
}