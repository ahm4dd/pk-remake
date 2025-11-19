import { type State } from "./../state.js";
// @ts-ignore
import chalk from "chalk";
import inquirer from 'inquirer';
import { BattleSystem } from "./../battle.js";
import { db } from "./../database.js";

const gyms = [
  {
    name: "Pewter Gym",
    leader: "Brock",
    badge: "Boulder Badge",
    pokemon: [
      { name: "Geodude", level: 10 },
      { name: "Onix", level: 12 }
    ],
    rewardXp: 100
  },
  {
    name: "Cerulean Gym",
    leader: "Misty",
    badge: "Cascade Badge",
    pokemon: [
      { name: "Staryu", level: 15 },
      { name: "Starmie", level: 18 }
    ],
    rewardXp: 150
  },
  // Add more gyms as needed
];

export async function commandGym(state: State) {
  try {
    if (!state.currentUser) {
      console.log(chalk.red("You must be logged in to challenge gyms."));
      return;
    }

    if (state.player.pokemon.length === 0) {
      console.log(chalk.red("You have no Pokemon to battle with."));
      return;
    }

    const { gymChoice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'gymChoice',
        message: 'Choose a gym to challenge:',
        choices: gyms.map(g => ({ name: `${g.name} (Leader: ${g.leader})`, value: g }))
      }
    ]);

    const gym = gymChoice;
    console.log(chalk.bold.blue(`Challenging ${gym.name} led by ${gym.leader}!`));

    // Check if badge already earned
    const achievements = db.getUserAchievements(state.currentUser.id);
    const hasBadge = achievements.some(a => a.achievement_name === gym.badge);
    if (hasBadge) {
      console.log(chalk.yellow(`You already have the ${gym.badge}!`));
      return;
    }

    // Battle each Pokemon in sequence
    for (const poke of gym.pokemon) {
      console.log(chalk.cyan(`\nBattling ${poke.name} (Level ${poke.level})...`));
      const result = await BattleSystem.startBattle(state, poke.name);
      if (result !== 'win') {
        console.log(chalk.red(`You lost to ${poke.name}. Gym challenge failed!`));
        return;
      }
    }

    // Win: Award badge and XP
    db.unlockAchievement(state.currentUser.id, gym.badge);
    const newXp = state.currentUser.xp + gym.rewardXp;
    const newLevel = Math.floor(newXp / 100) + 1;
    db.updateUserXP(state.currentUser.id, newXp, newLevel);
    state.currentUser.xp = newXp;
    state.currentUser.level = newLevel;

    console.log(chalk.green(`Congratulations! You defeated ${gym.leader} and earned the ${gym.badge}!`));
    console.log(chalk.gray(`Gained ${gym.rewardXp} XP. New level: ${newLevel}`));
  } catch (error) {
    console.error(chalk.red(`Error: ${error}`));
  }
}