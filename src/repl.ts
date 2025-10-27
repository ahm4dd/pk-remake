import ReadLine from "node:readline";
import process from "node:process";
import { type State, type CLICommand } from "./state.js";

export function cleanInput(input: string): string[] {
  return input
    .toLowerCase()
    .trim()
    .split(" ")
    .filter((word) => word.length > 0);
}

export function startREPL(state: State) {
  let rl = state.rl;
  let commands = state.commands;
  rl.prompt();

  rl.on("line", (input) => {
    let cleanedInput = cleanInput(input);
    let command: CLICommand | undefined =
      commands[cleanedInput[0]] ?? undefined;

    if (command === undefined) {
      console.log("Unknown command");
    } else if (cleanedInput.length !== 0) {
      command.callback(state);
    }

    rl.prompt();
  });
}
