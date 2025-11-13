import chalk from "chalk";

export interface CommandOption {
  name: string;
  description: string;
  alias?: string;
  type: 'boolean' | 'string' | 'number';
  defaultValue?: any;
  required?: boolean;
}

export interface CommandArg {
  name: string;
  description: string;
  required?: boolean;
  variadic?: boolean;
}

export class Command {
  public name: string;
  public description: string;
  public category: string;
  public usage: string;
  public args: CommandArg[];
  public options: CommandOption[];
  public examples: string[];
  public action: (args: any[], options: Record<string, any>) => void | Promise<void>;

  constructor(name: string, description: string, category: string = 'General') {
    this.name = name;
    this.description = description;
    this.category = category;
    this.usage = name;
    this.args = [];
    this.options = [];
    this.examples = [];
    this.action = () => {};
  }

  argument(name: string, description: string, required = false, variadic = false): this {
    this.args.push({ name, description, required, variadic });
    return this;
  }

  option(name: string, description: string, type: 'boolean' | 'string' | 'number' = 'boolean', defaultValue?: any, alias?: string): this {
    this.options.push({ name, description, type, defaultValue, alias });
    return this;
  }

  example(example: string): this {
    this.examples.push(example);
    return this;
  }

  setAction(fn: (args: any[], options: Record<string, any>) => void | Promise<void>): this {
    this.action = fn;
    return this;
  }

  help(): string {
    let help = chalk.bold.blue(`Command: ${this.name}\n`);
    help += chalk.yellow(`Usage: ${this.usage}\n`);
    help += `${this.description}\n`;

    if (this.args.length > 0) {
      help += chalk.green('\nArguments:\n');
      this.args.forEach(arg => {
        help += `  ${chalk.cyan(arg.name)}${arg.required ? chalk.red(' (required)') : chalk.gray(' (optional)')}: ${arg.description}\n`;
      });
    }

    if (this.options.length > 0) {
      help += chalk.green('\nOptions:\n');
      this.options.forEach(opt => {
        help += `  --${chalk.cyan(opt.name)}${opt.alias ? `, -${opt.alias}` : ''}: ${opt.description}\n`;
      });
    }

    if (this.examples.length > 0) {
      help += chalk.green('\nExamples:\n');
      this.examples.forEach(ex => {
        help += `  ${chalk.magenta(ex)}\n`;
      });
    }

    return help;
  }
}

export class Commander {
  private commands: Map<string, Command> = new Map();
  private categories: Map<string, Command[]> = new Map();

  command(name: string, description: string, category = 'General'): Command {
    const cmd = new Command(name, description, category);
    this.commands.set(name, cmd);
    if (!this.categories.has(category)) {
      this.categories.set(category, []);
    }
    this.categories.get(category)!.push(cmd);
    return cmd;
  }

  getCommand(name: string): Command | undefined {
    return this.commands.get(name);
  }

  getAllCommands(): Command[] {
    return Array.from(this.commands.values());
  }

  getCommandsByCategory(): Map<string, Command[]> {
    return this.categories;
  }

  parse(args: string[]): { command?: Command; args: any[]; options: Record<string, any>; help: boolean } {
    if (args.length === 0) {
      return { args: [], options: {}, help: false };
    }

    const [cmdName, ...rest] = args;
    const command = this.commands.get(cmdName);

    if (!command) {
      return { args: [cmdName, ...rest], options: {}, help: false };
    }

    // Validate required args
    const requiredArgs = command.args.filter(arg => arg.required);
    if (rest.length < requiredArgs.length) {
      throw new Error(`Command '${cmdName}' requires at least ${requiredArgs.length} arguments.`);
    }

    let parsedArgs: any[] = [];
    let parsedOptions: Record<string, any> = {};
    let help = false;

    // Simple parsing
    for (let i = 0; i < rest.length; i++) {
      const arg = rest[i];
      if (arg === '--help' || arg === '-h') {
        help = true;
        break;
      }
      if (arg.startsWith('--')) {
        const optName = arg.slice(2);
        const option = command.options.find(o => o.name === optName);
        if (option) {
          if (option.type === 'boolean') {
            parsedOptions[optName] = true;
          } else {
            parsedOptions[optName] = rest[i + 1];
            i++;
          }
        }
      } else {
        parsedArgs.push(arg);
      }
    }

    return { command, args: parsedArgs, options: parsedOptions, help };
  }

  showHelp(category?: string): void {
    if (category) {
      const cmds = this.categories.get(category);
      if (cmds) {
        console.log(chalk.bold.blue(`\n${category} Commands:`));
        cmds.forEach(cmd => {
          console.log(`  ${chalk.cyan(cmd.name)}: ${cmd.description}`);
        });
      } else {
        console.log(chalk.red(`Category '${category}' not found.`));
      }
    } else {
      console.log(chalk.bold.blue('\nAvailable Commands:'));

      for (const [cat, cmds] of this.categories) {
        console.log(chalk.yellow(`\n${cat}:`));
        cmds.forEach(cmd => {
          console.log(`  ${chalk.cyan(cmd.name)}: ${cmd.description}`);
        });
      }

      console.log(chalk.gray('\nType <command> --help for more details.'));
    }
  }
}