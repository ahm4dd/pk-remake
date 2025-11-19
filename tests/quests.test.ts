import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDB } from '../src/database.js';
import { QuestManager } from '../src/quests.js';

describe('Quests System', () => {
  let testDB: ReturnType<typeof createTestDB>;

  beforeEach(() => {
    // Create a fresh test DB for each test
    testDB = createTestDB();
  });

  it('should assign initial quests to a new user', () => {
    const user = testDB.createUser('testuser', 'hash');
    QuestManager.assignInitialQuests(user.id, testDB);

    const userQuests = testDB.getUserQuestProgress(user.id);
    expect(userQuests.length).toBeGreaterThan(0);
    expect(userQuests.find(q => q.quest_id === 1)).toBeDefined(); // Beginner Catcher
  });

  it('should track quest progress', () => {
    const user = testDB.createUser('testuser', 'hash');
    QuestManager.assignInitialQuests(user.id, testDB);

    // Simulate catching a pokemon
    QuestManager.checkProgress(user.id, 'catch', 1, testDB);

    const userQuests = testDB.getUserQuestProgress(user.id);
    const catchQuest = userQuests.find(q => q.quest_id === 1); // Assuming ID 1 is catch quest
    expect(catchQuest?.current_count).toBe(1);
  });

  it('should allow claiming rewards when completed', () => {
    const user = testDB.createUser('testuser', 'hash');
    QuestManager.assignInitialQuests(user.id, testDB);

    // Complete the quest
    QuestManager.checkProgress(user.id, 'catch', 5, testDB);

    const userQuests = testDB.getUserQuestProgress(user.id);
    const catchQuest = userQuests.find(q => q.quest_id === 1);
    expect(catchQuest?.current_count).toBe(5);
    expect(catchQuest?.completed).toBe(false); // Not claimed yet

    // Claim
    const reward = QuestManager.claimReward(user.id, 1, testDB);
    expect(reward).not.toBeNull();
    expect(reward?.xp).toBe(100);

    // Verify user XP
    const updatedUser = testDB.getUserByUsername('testuser');
    expect(updatedUser?.xp).toBe(100);

    // Verify marked as completed
    const finalQuests = testDB.getUserQuestProgress(user.id);
    expect(finalQuests.find(q => q.quest_id === 1)?.completed).toBe(true);
  });
});
