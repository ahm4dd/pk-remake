import { type State } from "./../state.js";
// @ts-ignore
import chalk from "chalk";
import Table from "cli-table3";
import { db } from "./../database.js";

export async function commandLeaderboard(state: State) {
  try {
    // Get top 10 users by XP
    const users = db.getTopUsersByXP(10);

    if (users.length === 0) {
      console.log(chalk.yellow("No users found."));
      return;
    }

    const table = new Table({
      head: [chalk.bold('Rank'), chalk.bold('Username'), chalk.bold('Level'), chalk.bold('XP')],
      colWidths: [10, 20, 10, 10],
    });

    users.forEach((user, index) => {
      table.push([index + 1, user.username, user.level, user.xp]);
    });

    console.log(chalk.bold.blue("🏆 Leaderboard (Top 10 by XP)"));
    console.log(table.toString());
  } catch (error) {
    console.error(chalk.red(`Error: ${error}`));
  }
}