import { type State } from "./../state.js";
// @ts-ignore
import chalk from "chalk";
import fs from "fs";
import path from "path";
import { db } from "./../database.js";

export async function commandSave(state: State) {
  try {
    if (!state.currentUser) {
      console.log(chalk.red("You must be logged in to save profile."));
      return;
    }

    const user = state.currentUser;
    const pokemon = db.getUserPokemon(user.id);
    const inventory = db.getInventory(user.id);
    const achievements = db.getUserAchievements(user.id);

    const profile = {
      user,
      pokemon,
      inventory,
      achievements,
    };

    const fileName = `${user.username}_profile.json`;
    const filePath = path.join(process.cwd(), fileName);
    fs.writeFileSync(filePath, JSON.stringify(profile, null, 2));

    console.log(chalk.green(`Profile saved to ${fileName}`));
  } catch (error) {
    console.error(chalk.red(`Error: ${error}`));
  }
}

export async function commandLoad(state: State) {
  try {
    const args = state.input.args;
    if (args.length < 1) {
      console.log("Usage: load <filename>");
      return;
    }

    const fileName = args[0];
    const filePath = path.join(process.cwd(), fileName);

    if (!fs.existsSync(filePath)) {
      console.log(chalk.red("File not found."));
      return;
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // For simplicity, just log the loaded data
    console.log(chalk.green("Profile loaded (displaying data):"));
    console.log(data);
    // In a real implementation, you would update the state and DB
  } catch (error) {
    console.error(chalk.red(`Error: ${error}`));
  }
}