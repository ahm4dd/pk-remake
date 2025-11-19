import { type State } from "./../state.js";
import chalk from "chalk";
import { db } from "./../database.js";
import { QuestManager } from "./../quests.js";

export async function commandQuests(state: State) {
  if (!state.currentUser) {
    console.log(chalk.red("Please log in to view quests."));
    return;
  }

  const { args } = state.input;
  const subcommand = args[0];

  if (subcommand === 'claim') {
    const userQuests = db.getUserQuestProgress(state.currentUser.id);
    const quests = db.getAvailableQuests();
    let claimed = false;

    for (const uq of userQuests) {
      const quest = quests.find(q => q.id === uq.quest_id);
      if (quest && !uq.completed && uq.current_count >= quest.target_count) {
        const reward = QuestManager.claimReward(state.currentUser.id, quest.id);
        if (reward) {
          console.log(chalk.green(`🎉 Claimed reward for '${quest.title}': ${reward.xp} XP${reward.item ? ` and ${reward.item}` : ''}!`));
          claimed = true;
        }
      }
    }

    if (!claimed) {
      console.log(chalk.yellow("No completed quests to claim."));
    }
    return;
  }

  // List quests
  const userQuests = db.getUserQuestProgress(state.currentUser.id);
  const allQuests = db.getAvailableQuests();

  // If user has no quests assigned (e.g. old user), assign them
  if (userQuests.length === 0) {
    QuestManager.assignInitialQuests(state.currentUser.id);
    console.log(chalk.blue("New quests assigned!"));
    // Re-fetch
    return commandQuests(state);
  }

  console.log(chalk.bold.blue("\n📜 Your Quests:"));
  console.log(chalk.gray("------------------------------------------------"));

  let hasActive = false;
  for (const uq of userQuests) {
    const quest = allQuests.find(q => q.id === uq.quest_id);
    if (!quest) continue;

    if (uq.completed) {
      // Optional: Show completed quests? Maybe hidden or separate list
      // console.log(chalk.gray(`[COMPLETED] ${quest.title}`));
    } else {
      hasActive = true;
      const progress = Math.min(uq.current_count, quest.target_count);
      const percent = Math.floor((progress / quest.target_count) * 100);
      const bar = getProgressBar(percent);
      
      console.log(chalk.bold(`${quest.title}`) + chalk.gray(` (${quest.type})`));
      console.log(chalk.white(quest.description));
      console.log(`${bar} ${progress}/${quest.target_count}`);
      
      if (progress >= quest.target_count) {
        console.log(chalk.green("✅ Ready to claim! Type 'quests claim'"));
      } else {
        console.log(chalk.yellow(`Reward: ${quest.reward_xp} XP${quest.reward_item ? ` + ${quest.reward_item}` : ''}`));
      }
      console.log(chalk.gray("------------------------------------------------"));
    }
  }

  if (!hasActive) {
    console.log(chalk.green("All quests completed! Check back later for more."));
  }
}

function getProgressBar(percent: number): string {
  const width = 20;
  const filled = Math.floor((width * percent) / 100);
  const empty = width - filled;
  return chalk.green("█".repeat(filled)) + chalk.gray("░".repeat(empty));
}
