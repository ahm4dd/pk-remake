import { db, Quest, UserQuest } from './database.js';
import { UserManager } from './user.js';
import chalk from 'chalk';

export class QuestManager {
  static checkProgress(userId: number, type: string, amount: number = 1) {
    db.updateQuestProgress(userId, type, amount);
    
    // Check for completions and notify (optional, could be done on next 'quests' check)
    const userQuests = db.getUserQuestProgress(userId);
    const quests = db.getAvailableQuests();
    
    userQuests.forEach(uq => {
      if (!uq.completed) {
        const quest = quests.find(q => q.id === uq.quest_id);
        if (quest && uq.current_count >= quest.target_count) {
          console.log(chalk.green(`\n✨ Quest Completed: ${quest.title}! Type 'quests claim' to get your reward!`));
        }
      }
    });
  }

  static claimReward(userId: number, questId: number): { xp: number; item?: string } | null {
    const result = db.completeQuest(userId, questId);
    if (result) {
      // Award XP
      UserManager.updateXP(userId, result.xp);
      
      // Award Item
      if (result.item) {
        db.updateInventory(userId, 'ball', result.item, 1); // Assuming items are balls for now, can expand
      }
      return result;
    }
    return null;
  }

  static assignInitialQuests(userId: number) {
    const quests = db.getAvailableQuests();
    quests.forEach(q => {
      db.assignQuest(userId, q.id);
    });
  }
}
