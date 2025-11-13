import { writeFileSync } from 'fs';

// Simple script to generate COMMANDS.md from state.ts
// This is a placeholder - in a real implementation, parse the TS file or import the built module

const commandsContent = `# Pokemon CLI Commands Manual 📖

Welcome to the official commands manual for the Pokemon CLI! This guide covers every command in detail, with examples, options, and tips. Think of it as your trainer's handbook.

Commands are grouped by category. Type \`help\` in the app for a quick overview, or \`help <command>\` for specifics.

## Table of Contents
- [User Management](#user-management)
- [Pokemon Management](#pokemon-management)
- [Exploration](#exploration)
- [Gamification](#gamification)
- [Items & Shop](#items--shop)
- [Social](#social)
- [Utilities](#utilities)
- [System](#system)

## User Management
Commands for creating accounts and managing your profile.

### \`register <username> <password>\`
Create a new account.
- **Example**: \`register AshKetchum mypassword123\`
- **Notes**: Username must be 3+ chars, password 6+. Starts you with basic inventory.

### \`login <username> <password>\`
Log in to your account.
- **Example**: \`login AshKetchum mypassword123\`
- **Notes**: Required for most actions. Loads your saved Pokemon and progress.

### \`logout\`
Log out of your account.
- **Example**: \`logout\`
- **Notes**: Clears your session. Data is saved automatically.

### \`profile\`
View your stats, level, XP, and achievements.
- **Example**: \`profile\`
- **Notes**: Shows total Pokemon caught and next level requirements.

## Pokemon Management
Core commands for interacting with Pokemon.

### \`catch <pokemon_name> [--ball <ball_type>]\`
Attempt to catch a wild Pokemon.
- **Options**: \`--ball\` (pokeball, greatball, ultraball) – Default: pokeball
- **Example**: \`catch pikachu --ball greatball\`
- **Notes**: Success depends on Pokemon's catch rate and ball modifier. Adds to your collection if successful.

### \`battle <pokemon_name>\`
Battle a wild Pokemon.
- **Example**: \`battle charmander\`
- **Notes**: Turn-based combat with move selection. Win for XP; weakened opponents can be caught afterward.

### \`evolve <pokemon_name_or_index>\`
Evolve a Pokemon if eligible.
- **Example**: \`evolve pikachu\` or \`evolve 1\`
- **Notes**: Checks evolution criteria (e.g., level). Updates stats and appearance.

### \`learn <pokemon_name_or_index> <move_name>\`
Teach a move to a Pokemon.
- **Example**: \`learn charmander ember\`
- **Notes**: Pokemon must be able to learn the move. Replaces existing moves if full.

### \`release <pokemon_name_or_index>\`
Release a Pokemon back to the wild.
- **Example**: \`release caterpie\`
- **Notes**: Permanent action. Confirms before proceeding.

### \`trade <subcommand> [args]\`
Manage Pokemon trades.
- **Subcommands**:
  - \`offer <to_username> <my_pokemon_index>\`: Offer a trade.
  - \`list\`: View pending offers.
  - \`accept <trade_id> <my_pokemon_index>\`: Accept a trade.
  - \`reject <trade_id>\`: Reject a trade.
- **Example**: \`trade offer Misty 1\`
- **Notes**: Trades are pending until accepted. Both users must be logged in for execution.

### \`pokedex [--sort <criteria>]\`
View your caught Pokemon.
- **Options**: \`--sort\` (name, level, index) – Default: index
- **Example**: \`pokedex --sort level\`
- **Notes**: Shows stats, types, and moves. Use indices for other commands.

## Exploration
Discover the Pokemon world.

### \`map\`
Show the next 20 locations.
- **Example**: \`map\`
- **Notes**: Paginated list of areas to explore.

### \`mapb\`
Show the previous 20 locations.
- **Example**: \`mapb\`
- **Notes**: Navigate back through locations.

### \`explore <location_name>\`
Explore an area and see wild Pokemon.
- **Example**: \`explore pallet-town\`
- **Notes**: Lists encounterable Pokemon. Use names for catching/battling.

## Gamification
Track progress and earn rewards.

### \`daily\`
View and complete daily challenges.
- **Example**: \`daily\`
- **Notes**: Goals like "catch 3 Pokemon" give XP. Completes automatically when met.

### \`leaderboard\`
View top players by XP.
- **Example**: \`leaderboard\`
- **Notes**: Shows ranks, usernames, levels, and XP.

## Items & Shop
Manage inventory and purchases.

### \`shop [buy <item_name>]\`
View shop items or buy one.
- **Example**: \`shop\` (lists items) or \`shop buy potion\`
- **Notes**: Items cost XP. Bought items go to inventory.

### \`use <item_name> <pokemon_index>\`
Use an item on a Pokemon.
- **Example**: \`use potion 1\`
- **Notes**: E.g., potions heal HP. Consumes the item.

## Social
Interact with other users.

### \`leaderboard\`
See the top trainers.
- **Example**: \`leaderboard\`
- **Notes**: Encourages competition and community.

## Utilities
Save and load your progress.

### \`save\`
Export your profile to a JSON file.
- **Example**: \`save\`
- **Notes**: Saves to \`<username>_profile.json\` in the project root.

### \`load <filename>\`
Import a profile from a JSON file.
- **Example**: \`load AshKetchum_profile.json\`
- **Notes**: Overwrites current session data. Use with caution.

## System
App settings and help.

### \`theme <theme_name>\`
Change the app's color theme.
- **Example**: \`theme no-color\`
- **Notes**: Options: default, dark, no-color (for accessibility).

### \`language <lang>\`
Switch the app's language.
- **Example**: \`language es\`
- **Notes**: Supports 'en' (English) and 'es' (Spanish).

### \`help [command_name]\`
Get help on commands.
- **Example**: \`help\` or \`help catch\`
- **Notes**: Shows usage, options, and examples.

### \`exit\`
Quit the app.
- **Example**: \`exit\`
- **Notes**: Or press Ctrl+C. Saves progress automatically.

---

This manual is your go-to for mastering the Pokemon CLI. Experiment, have fun, and remember: the journey is the reward! If something's unclear, check the in-app help or open an issue. Happy training! 🏆
`;

writeFileSync('COMMANDS.md', commandsContent);
console.log('COMMANDS.md generated successfully!');