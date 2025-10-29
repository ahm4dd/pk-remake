import ReadLine from "node:readline";
import process from "node:process";
import { type State, type CLICommand, Command } from "./state.js";

export function cleanInput(input: string): string[] {
  return input
    .toLowerCase()
    .trim()
    .split(" ")
    .filter((word) => word.length > 0);
}

export async function startREPL(state: State) {
  let rl = state.rl;
  let commands = state.commands;
  rl.prompt();

  rl.on("line", async (input) => {
    let cleanedInput = cleanInput(input);
    let command: CLICommand | undefined =
      commands[cleanedInput[0] as Command] ?? undefined;

    if (command === undefined) {
      console.log("Unknown command");
    } else if (cleanedInput.length !== 0) {
      await command.callback(state);
    }

    rl.prompt();
  });
}
