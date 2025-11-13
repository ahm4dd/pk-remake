import { type State } from "./../state.js";
// @ts-ignore
import chalk from "chalk";
import { db } from "./../database.js";

const shopItems = [
  { name: 'pokeball', type: 'ball', price: 10, description: 'Standard Pokeball' },
  { name: 'greatball', type: 'ball', price: 20, description: 'Better catch rate' },
  { name: 'ultraball', type: 'ball', price: 30, description: 'Best catch rate' },
  { name: 'potion', type: 'heal', price: 50, description: 'Heals 20 HP' },
  { name: 'super-potion', type: 'heal', price: 100, description: 'Heals 50 HP' },
];

export async function commandShop(state: State) {
  try {
    if (!state.currentUser) {
      console.log(chalk.red("You must be logged in to access the shop."));
      return;
    }

    const args = state.input.args;
    if (args.length === 0) {
      // List shop items
      console.log(chalk.bold.blue("🛒 Shop Items"));
      shopItems.forEach((item, index) => {
        console.log(`${index + 1}. ${item.name} - ${item.price} XP - ${item.description}`);
      });
      console.log("\nUse 'shop buy <item_name>' to purchase.");
      return;
    }

    const subcommand = args[0];
    if (subcommand === 'buy') {
      if (args.length < 2) {
        console.log("Usage: shop buy <item_name>");
        return;
      }
      const itemName = args[1];
      const item = shopItems.find(i => i.name === itemName);
      if (!item) {
        console.log(chalk.red("Item not found."));
        return;
      }

      if (state.currentUser.xp < item.price) {
        console.log(chalk.red("Not enough XP."));
        return;
      }

      // Deduct XP
      const newXP = state.currentUser.xp - item.price;
      const newLevel = Math.floor(newXP / 100) + 1;
      db.updateUserXP(state.currentUser.id, newXP, newLevel);
      state.currentUser.xp = newXP;
      state.currentUser.level = newLevel;

      // Add to inventory
      db.updateInventory(state.currentUser.id, item.type, item.name, 1);

      console.log(chalk.green(`Purchased ${item.name} for ${item.price} XP!`));
    } else {
      console.log("Unknown subcommand. Use 'shop' to list items.");
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error}`));
  }
}