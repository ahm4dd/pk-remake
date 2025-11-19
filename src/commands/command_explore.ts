import chalk from "chalk";
import ora from "ora";
import { printPokemons } from "./../helpers.js";
import { type State } from "./../state.js";
import { db } from "./../database.js";
import { QuestManager } from "./../quests.js";

// Rare Pokemon that can appear during exploration
const RARE_POKEMON = [
  'dratini', 'larvitar', 'beldum', 'gible', 'deino',
  'eevee', 'porygon', 'lapras', 'aerodactyl', 'snorlax'
];

// Legendary Pokemon (even rarer)
const LEGENDARY_POKEMON = [
  'articuno', 'zapdos', 'moltres', 'mewtwo', 'mew',
  'raikou', 'entei', 'suicune', 'lugia', 'ho-oh'
];

// Items that can be found
const FINDABLE_ITEMS = [
  { type: 'ball', name: 'pokeball', weight: 40 },
  { type: 'ball', name: 'greatball', weight: 20 },
  { type: 'ball', name: 'ultraball', weight: 10 },
  { type: 'heal', name: 'potion', weight: 50 },
  { type: 'heal', name: 'super-potion', weight: 30 },
  { type: 'heal', name: 'hyper-potion', weight: 10 },
];

// Location type mapping (based on location name keywords)
const LOCATION_TYPES = {
  water: ['lake', 'ocean', 'sea', 'river', 'pond', 'bay', 'shore'],
  fire: ['volcano', 'mountain', 'peak', 'cave'],
  grass: ['forest', 'garden', 'meadow', 'grove'],
  electric: ['power', 'city', 'town'],
  ice: ['snow', 'ice', 'frozen', 'glacier'],
  rock: ['cave', 'mountain', 'quarry', 'mine'],
  ground: ['desert', 'canyon', 'valley'],
  flying: ['sky', 'tower', 'peak'],
};

function getLocationType(locationName: string): string | null {
  const lowerName = locationName.toLowerCase();
  for (const [type, keywords] of Object.entries(LOCATION_TYPES)) {
    if (keywords.some(keyword => lowerName.includes(keyword))) {
      return type;
    }
  }
  return null;
}

function getWeightedRandomItem(): { type: string; name: string } {
  const totalWeight = FINDABLE_ITEMS.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of FINDABLE_ITEMS) {
    random -= item.weight;
    if (random <= 0) {
      return { type: item.type, name: item.name };
    }
  }
  
  return FINDABLE_ITEMS[0]; // Fallback
}

export async function commandExplore(state: State) {
  try {
    if (state.input.args.length <= 0) {
      console.log(chalk.red("Insufficient number of arguments was provided. Type `help` for more information about your command."));
      return;
    }

    const locationName = state.input.args[0];
    if (!locationName.includes('-area')) {
      console.log(chalk.yellow("Location names should end with '-area'. Try something like 'pallet-town-area'."));
      return;
    }

    const spinner = ora(chalk.blue(`Exploring ${locationName}...`)).start();

    let locationInfo = await state.pokeapi.fetchLocation(locationName);
    spinner.succeed(chalk.green(`Explored ${locationName}!`));

    // Display normal Pokemon encounters
    printPokemons(locationInfo.pokemon_encounters);

    // Check for rare encounters (5% chance for rare, 1% for legendary)
    const rareRoll = Math.random();
    if (rareRoll < 0.01 && state.currentUser) {
      // Legendary encounter!
      const legendaryPokemon = LEGENDARY_POKEMON[Math.floor(Math.random() * LEGENDARY_POKEMON.length)];
      console.log(chalk.bold.magenta(`\n✨ A LEGENDARY Pokemon appears! You encountered ${legendaryPokemon.toUpperCase()}! ✨`));
      console.log(chalk.gray(`Use 'catch ${legendaryPokemon}' to attempt capture (very difficult!)`));
    } else if (rareRoll < 0.05) {
      // Rare encounter
      const rarePokemon = RARE_POKEMON[Math.floor(Math.random() * RARE_POKEMON.length)];
      console.log(chalk.bold.cyan(`\n⭐ Rare encounter! You spotted a ${rarePokemon}!`));
      console.log(chalk.gray(`Use 'catch ${rarePokemon}' to attempt capture.`));
    }

    // Check for item finds (10% chance)
    if (Math.random() < 0.10 && state.currentUser) {
      const foundItem = getWeightedRandomItem();
      db.updateInventory(state.currentUser.id, foundItem.type, foundItem.name, 1);
      console.log(chalk.yellow(`\n🎁 You found a ${foundItem.name}! It was added to your inventory.`));
    }

    // Location-based bonus message
    const locationType = getLocationType(locationName);
    if (locationType) {
      const typeEmojis: Record<string, string> = {
        water: '💧', fire: '🔥', grass: '🌿', electric: '⚡',
        ice: '❄️', rock: '🪨', ground: '⛰️', flying: '🦅'
      };
      console.log(chalk.blue(`\n${typeEmojis[locationType] || '🌍'} This area has many ${locationType}-type Pokemon!`));
    }

    // Update challenges and quests
    if (state.currentUser) {
      db.updateChallengeProgress(state.currentUser.id, 'explore');
      QuestManager.checkProgress(state.currentUser.id, 'explore');
    }

    // Random exploration tips (15% chance)
    if (Math.random() < 0.15) {
      const tips = [
        "💡 Tip: Explore different areas to find diverse Pokemon types!",
        "💡 Tip: Rare Pokemon are more likely to appear in remote locations.",
        "💡 Tip: Keep exploring to complete your daily challenges!",
        "💡 Tip: Some locations have better chances for specific item types.",
        "💡 Tip: Legendary Pokemon are extremely rare - keep searching!"
      ];
      console.log(chalk.gray(`\n${tips[Math.floor(Math.random() * tips.length)]}`));
    }

  } catch (err: unknown) {
    console.error(chalk.red(`Error exploring: ${err}`));
  }
}
