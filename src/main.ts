import { startREPL } from "./repl.js";
import { initState } from "./state.js";
function main() {
  let state = initState();
  startREPL(state);
}

main();
