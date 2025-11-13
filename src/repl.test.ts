import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cleanInput, parseInput } from '../src/repl';
import { type CLICommand, type CommandRegistry } from '../src/state';

// Mock CommandRegistry for testing
const mockCommandRegistry: CommandRegistry = {
  help: {
    name: 'help',
    description: 'Displays help',
    usage: 'help [command]',
    arguments: [{ name: 'command', description: 'Command to get help for', required: false }],
    options: [{ name: 'verbose', description: 'Enable verbose output', alias: 'v', type: 'boolean', defaultValue: false }],
    examples: ['help', 'help map'],
    callback: vi.fn(),
  },
  map: {
    name: 'map',
    description: 'Shows map',
    usage: 'map',
    arguments: [],
    options: [],
    examples: ['map'],
    callback: vi.fn(),
  },
  catch: {
    name: 'catch',
    description: 'Tries to catch a Pokemon',
    usage: 'catch <pokemon> [--ball <ball>]',
    arguments: [{ name: 'pokemon', description: 'Pokemon to catch', required: true }],
    options: [{ name: 'ball', description: 'Ball type', alias: 'b', type: 'string', defaultValue: 'pokeball' }],
    examples: ['catch pikachu', 'catch --balls'],
    callback: vi.fn(),
  }
} as const;

describe('CLI Parsing and Help System Tests', () => {

  describe('cleanInput', () => {
    it('should clean and normalize input correctly', () => {
      expect(cleanInput('  MAP  ')).toEqual(['map']);
      expect(cleanInput('Catch PIKACHU --ball greatball')).toEqual(['catch', 'pikachu', '--ball', 'greatball']);
      expect(cleanInput('  ')).toEqual([]);
      expect(cleanInput('exit')).toEqual(['exit']);
    });
  });

  describe('parseInput', () => {
    it('should parse command, arguments, and options correctly', () => {
      const result = parseInput('catch pikachu --ball greatball', mockCommandRegistry);
      expect(result.command?.name).toBe('catch');
      expect(result.parsedArgs).toEqual(['pikachu']);
      expect(result.parsedOptions).toEqual({ ball: 'greatball', verbose: false }); // verbose is default from help command, but should not be here
    });

    it('should handle commands with no arguments or options', () => {
      const result = parseInput('map', mockCommandRegistry);
      expect(result.command?.name).toBe('map');
      expect(result.parsedArgs).toEqual([]);
      expect(result.parsedOptions).toEqual({});
    });

    it('should handle boolean options', () => {
      const result = parseInput('help --verbose', mockCommandRegistry);
      expect(result.command?.name).toBe('help');
      expect(result.parsedArgs).toEqual([]);
      expect(result.parsedOptions).toEqual({ verbose: true });
    });

    it('should handle aliased options', () => {
      const result = parseInput('catch charmander -b ultraball', mockCommandRegistry);
      expect(result.command?.name).toBe('catch');
      expect(result.parsedArgs).toEqual(['charmander']);
      expect(result.parsedOptions).toEqual({ ball: 'ultraball', verbose: false });
    });

    it('should return an error for unknown commands', () => {
      const result = parseInput('unknown command', mockCommandRegistry);
      expect(result.error).toBe('Unknown command: unknown');
      expect(result.command).toBeUndefined();
    });

    it('should return an error for missing option values', () => {
      const result = parseInput('catch pikachu --ball', mockCommandRegistry);
      expect(result.error).toBe('Option --ball requires a value.');
    });

    it('should return an error for invalid number of arguments', () => {
      const result = parseInput('catch', mockCommandRegistry); // Missing required pokemon argument
      expect(result.error).toBe('Invalid number of arguments for command catch. Expected 1 required arguments.');
    });

    it('should handle commands with no input', () => {
      const result = parseInput('', mockCommandRegistry);
      expect(result.error).toBe('No input provided.');
    });
  });

  // Tests for displayCommandHelp and displayGeneralHelp would require mocking console.log
  // and are more integration-level tests. For now, we focus on parsing logic.
});
