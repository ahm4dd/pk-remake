import ReadLine from "node:readline";
import process from "node:process";
import { CLICommand, commands } from "./commands/index.js";

export const rl = ReadLine.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "Pokedex > ",
});

export function cleanInput(input: string): string[] {
  return input
    .toLowerCase()
    .trim()
    .split(" ")
    .filter((word) => word.length > 0);
}

export function startREPL() {
  rl.prompt();

  rl.on("line", (input) => {
    let cleanedInput = cleanInput(input);
    let command: CLICommand | undefined =
      commands[cleanedInput[0]] ?? undefined;

    if (command === undefined) {
      console.log("Unknown command");
    } else if (cleanedInput.length !== 0) {
      command.callback(commands);
    }

    rl.prompt();
  });
}
