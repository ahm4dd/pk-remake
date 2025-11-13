import { type State } from "./../state.js";
// @ts-ignore
import chalk from "chalk";
import { setTheme } from "./../theme.js";

export async function commandTheme(state: State) {
  try {
    const args = state.input.args;
    if (args.length < 1) {
      console.log(chalk.yellow("Usage: theme <theme_name> (default, dark, no-color)"));
      return;
    }

    const theme = args[0];
    setTheme(theme);
    console.log(chalk.green(`Theme set to ${theme}`));
  } catch (error) {
    console.error(chalk.red(`Error: ${error}`));
  }
}