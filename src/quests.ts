import { db, Quest, UserQuest } from './database.js';
import type { DatabaseManager } from './database.js';
import { UserManager } from './user.js';
import chalk from 'chalk';

export class QuestManager {
  static checkProgress(userId: number, type: string, amount: number = 1, database: any = db) {
    database.updateQuestProgress(userId, type, amount);
    
    // Check for completions and notify (optional, could be done on next 'quests' check)
    const userQuests = database.getUserQuestProgress(userId);
    const quests = database.getAvailableQuests();
    
    userQuests.forEach(uq => {
      if (!uq.completed) {
        const quest = quests.find(q => q.id === uq.quest_id);
        if (quest && uq.current_count >= quest.target_count) {
          console.log(chalk.green(`\n✨ Quest Completed: ${quest.title}! Type 'quests claim' to get your reward!`));
        }
      }
    });
  }

  static claimReward(userId: number, questId: number, database: any = db): { xp: number; item?: string } | null {
    const result = database.completeQuest(userId, questId);
    if (result) {
      // Award XP
      UserManager.updateXP(userId, result.xp, database);
      
      // Award Item
      if (result.item) {
        database.updateInventory(userId, 'ball', result.item, 1); // Assuming items are balls for now, can expand
      }
      return result;
    }
    return null;
  }

  static assignInitialQuests(userId: number, database: any = db) {
    const quests = database.getAvailableQuests();
    quests.forEach(q => {
      database.assignQuest(userId, q.id);
    });
  }
}
