import { type State } from "./../state.js";
// @ts-ignore
import chalk from "chalk";
import { setLanguage, t } from "./../i18n.js";

export async function commandLanguage(state: State) {
  try {
    const args = state.input.args;
    if (args.length < 1) {
      console.log(chalk.yellow("Usage: language <lang> (en, es)"));
      return;
    }

    const lang = args[0];
    setLanguage(lang);
    console.log(chalk.green(t('language_set', lang)));
  } catch (error) {
    console.error(chalk.red(`Error: ${error}`));
  }
}