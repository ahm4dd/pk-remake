import { type State } from "./../state.js";
// @ts-ignore
import chalk from "chalk";
import { db } from "./../database.js";

export async function commandDaily(state: State) {
  try {
    if (!state.currentUser) {
      console.log(chalk.red("You must be logged in to view daily challenges."));
      return;
    }

    const user = state.currentUser;
    const challenges = db.getOrCreateDailyChallenges(user.id);

    console.log(chalk.bold.blue("Daily Challenges"));
    challenges.forEach(challenge => {
      const status = challenge.completed ? chalk.green("Completed") : `${challenge.progress}/${challenge.target}`;
      console.log(`${challenge.challenge_type}: ${status} (+${challenge.reward_xp} XP)`);
    });

    // Check for auto-completion
    challenges.forEach(challenge => {
      if (!challenge.completed && challenge.progress >= challenge.target) {
        const xp = db.completeChallenge(challenge.id);
        console.log(chalk.green(`Challenge completed: ${challenge.challenge_type} (+${xp} XP)`));
        // Update user XP
        const newXP = user.xp + xp;
        const newLevel = Math.floor(newXP / 100) + 1;
        db.updateUserXP(user.id, newXP, newLevel);
        user.xp = newXP;
        user.level = newLevel;
      }
    });
  } catch (error) {
    console.error(chalk.red(`Error: ${error}`));
  }
}