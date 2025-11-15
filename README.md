# Pokemon CLI 🐾

A terminal-based Pokemon adventure! Catch, battle, and trade Pokemon with a fully interactive CLI. Built for fans of retro gaming and command-line setup, endless fun.

> Special thanks to Opencode for contributing lol

<img width="773" height="397" alt="image" src="https://github.com/user-attachments/assets/ab95eb62-8c7a-4026-a739-ab6e14955f3f" />


## ✨ Features
- **Epic Battles**: Turn-based combat with HP bars, status effects, and type matchups.
- **Exploration & Catching**: Discover locations, encounter wild Pokemon, and build your team.
- **Daily Challenges & XP**: Complete goals for rewards and level up.
- **Trading & Social**: Swap Pokemon with friends and climb leaderboards.
- **Customization**: Themes (colorblind-friendly), languages (EN/ES), and profiles.
- **Performance**: Optimized with caching and efficient queries.

Perfect for Pokemon lovers who prefer terminals over touchscreens!

## 🚀 Installation
### Requirements
- Node.js 16+ ([download](https://nodejs.org/))
- A compatible terminal (most work; test with `stty -echo`)

### Quick Setup
1. Clone: `git clone https://github.com/yourusername/pk-remake.git && cd pk-remake`
2. Install: `npm install`
3. Build: `npm run build`
4. Run: `npm start`

Welcome screen appears? You're ready!

## 🎮 Quick Start
1. Register: `register TrainerName password`
2. Login: `login TrainerName password`
3. Catch: `catch pikachu`
4. Battle: `battle charmander`
5. Explore: `explore route-1`

Type `help` for guidance anytime.

## 📖 Usage
- **Interactive Mode**: Type commands at `Pokedex > ` prompt.
- **Persistence**: Data saves to `pokemon.db`—no cloud needed.
- **Tips**: Use `theme no-color` for accessibility; `daily` for challenges.
- **Exiting**: `exit` or Ctrl+C (progress auto-saves).

For command details, see [Commands Manual](COMMANDS.md).

## 🛠️ Development
- **Build**: `npm run build`
- **Test**: `npm test` (32 tests included)
- **Docs**: `npm run docs` (generates API docs and command manual)
- **Lint**: Add ESLint for code quality.
- **Contribute**: Fork, branch, test, PR. Follow TDD for new features.

## 🐛 Troubleshooting
- **App Won't Start?** Ensure Node.js is installed; try `node --version`.
- **REPL Issues?** Use a basic terminal; disable echo with `stty -echo`.
- **Database Errors?** Delete `pokemon.db` to reset (loses data).
- **Performance?** Check internet for API calls; app caches responses.

Open an issue for help!

## 🤝 Contributing
Love Pokemon? Help us improve!
1. Check [issues](https://github.com/yourusername/pk-remake/issues).
2. Write tests first (TDD style).
3. Keep code clean and documented.
4. PR with clear descriptions.

## 📄 License
ISC License – Free to use and modify.

## 🙏 Credits
- [PokeAPI](https://pokeapi.co/) for data.
- Community for inspiration.
- Built with ❤️ using TypeScript & SQLite.

Catch 'em all in the terminal! 🎉
