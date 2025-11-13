import { describe, it, expect, vi, beforeEach } from 'vitest';
import { commandLearn } from '../src/commands/command_learn';
import { type State } from '../src/state';
import { Pokemon } from '../src/pokemon';
import { PokeAPI } from '../src/pokeapi';

describe('Learn Command Tests', () => {
  let mockState: State;
  let consoleSpy: vi.SpyInstance;
  let pokeAPIMock: Partial<PokeAPI>;
  let rlQuestionSpy: vi.SpyInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Mocking PokeAPI methods
    pokeAPIMock = {
      getMoveData: vi.fn(),
    };

    // Mocking readline for input prompts
    rlQuestionSpy = vi.fn().mockImplementation((query, callback) => {
      if (query.includes('Enter the number of the move to forget')) {
        callback('1'); // Default to forgetting the first move
      }
    });

    // Mock State object
    mockState = {
      rl: { question: rlQuestionSpy } as any, 
      commands: {} as any, 
      pokeapi: pokeAPIMock as PokeAPI,
      player: {
        pokemon: [
          // Mock Pokemon with fewer than 4 moves
          { name: 'Pikachu', experience: 100, baseCatchRate: 45, level: 5, status: null, stats: [{ name: 'hp', value: 35 }], types: ['electric'], moves: [{ name: 'Tackle', power: 40, type: 'normal', category: 'physical', accuracy: 100 }] },
          // Mock Pokemon with 4 moves
          { name: 'Charmander', experience: 120, baseCatchRate: 45, level: 7, status: null, stats: [{ name: 'hp', value: 39 }], types: ['fire'], moves: [{ name: 'Scratch', power: 40, type: 'normal', category: 'physical', accuracy: 100 }, { name: 'Growl', power: null, type: 'normal', category: 'status', accuracy: null }, { name: 'Ember', power: 40, type: 'fire', category: 'special', accuracy: 100 }, { name: 'Smokescreen', power: null, type: 'normal', category: 'status', accuracy: 100 }] },
        ],
      },
      input: { command: 'learn', args: [], options: {} },
    };
  });

  it('should prompt for Pokemon and move if not provided', async () => {
    mockState.input.args = [];
    await commandLearn(mockState);
    expect(consoleSpy).toHaveBeenCalledWith('Please specify a Pokemon and a move to learn (e.g., \'learn pikachu thunderbolt\').');
  });

  it('should handle Pokemon not found in party', async () => {
    mockState.input.args = ['nonexistentmon', 'tackle'];
    await commandLearn(mockState);
    expect(consoleSpy).toHaveBeenCalledWith('Pokemon \'nonexistentmon\' not found in your party.');
  });

  it('should handle move data not found', async () => {
    mockState.input.args = ['pikachu', 'invalidmove'];
    pokeAPIMock.getMoveData = vi.fn().mockResolvedValue(null);
    await commandLearn(mockState);
    expect(consoleSpy).toHaveBeenCalledWith('Could not find data for move: invalidmove');
  });

  it('should teach a new move if Pokemon has less than 4 moves', async () => {
    mockState.input.args = ['pikachu', 'thunderbolt'];
    pokeAPIMock.getMoveData = vi.fn().mockResolvedValue({ name: 'thunderbolt', power: 90, type: { name: 'electric' }, damage_class: { name: 'special' }, accuracy: 100 });
    await commandLearn(mockState);
    expect(consoleSpy).toHaveBeenCalledWith('Pikachu learned thunderbolt!');
    expect(mockState.player.pokemon[0].moves.length).toBe(2);
    expect(mockState.player.pokemon[0].moves[1].name).toBe('thunderbolt');
  });

  it('should prompt to forget a move if Pokemon already knows 4 moves', async () => {
    mockState.input.args = ['charmander', 'flamethrower'];
    pokeAPIMock.getMoveData = vi.fn().mockResolvedValue({ name: 'flamethrower', power: 90, type: { name: 'fire' }, damage_class: { name: 'special' }, accuracy: 100 });
    await commandLearn(mockState);
    expect(consoleSpy).toHaveBeenCalledWith('Charmander already knows 4 moves. Which move would you like to forget?');
    expect(consoleSpy).toHaveBeenCalledWith('Charmander forgot Scratch and learned flamethrower!');
    expect(mockState.player.pokemon[1].moves.length).toBe(4);
    expect(mockState.player.pokemon[1].moves[0].name).toBe('flamethrower');
  });

  it('should replace a forgotten move with a new move', async () => {
    mockState.input.args = ['charmander', 'flamethrower'];
    pokeAPIMock.getMoveData = vi.fn().mockResolvedValue({ name: 'flamethrower', power: 90, type: { name: 'fire' }, damage_class: { name: 'special' }, accuracy: 100 });
    // Mocking the user input to choose to forget the first move (Scratch)
    rlQuestionSpy.mockImplementation((query, callback) => {
      if (query.includes('Enter the number of the move to forget')) {
        callback('1'); // Forgetting Scratch
      }
    });
    await commandLearn(mockState);
    expect(consoleSpy).toHaveBeenCalledWith('Charmander forgot Scratch and learned flamethrower!');
    expect(mockState.player.pokemon[1].moves.length).toBe(4);
    expect(mockState.player.pokemon[1].moves[0].name).toBe('flamethrower');
  });

  it('should not learn a move if the user chooses to cancel forgetting', async () => {
    mockState.input.args = ['charmander', 'flamethrower'];
    pokeAPIMock.getMoveData = vi.fn().mockResolvedValue({ name: 'flamethrower', power: 90, type: { name: 'fire' }, damage_class: { name: 'special' }, accuracy: 100 });
    // Mocking the user input to cancel forgetting
    rlQuestionSpy.mockImplementation((query, callback) => {
      if (query.includes('Enter the number of the move to forget')) {
        callback('0'); // Cancel forgetting
      }
    });
    await commandLearn(mockState);
    expect(consoleSpy).toHaveBeenCalledWith('Did not learn the move.');
    expect(mockState.player.pokemon[1].moves.length).toBe(4);
    expect(mockState.player.pokemon[1].moves[0].name).toBe('Scratch'); // Should still have Scratch
  });
});
