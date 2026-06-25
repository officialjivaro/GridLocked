# Jivaro Crossword

A complete standalone crossword game built with Vue 3, Vite, JavaScript, npm, and plain CSS.

The game generates a connected crossword from local JSON word records. Players can filter by topic, choose a difficulty, type with a physical or on-screen keyboard, check or reveal answers, undo edits, resume a saved puzzle, and view local statistics.

## Included features

- Dark neon arcade home screen and game HUD
- Fixed full-viewport layout with no document scrollbar
- Mobile Board/Clues switcher and tabbed clue sheet
- Touch panning for large puzzles with hidden scrollbar tracks
- Board and clue lists side by side on desktop
- Collapsible desktop on-screen keyboard
- Compact Undo, Check, Hint, and More action dock
- Layered neon animations, richer synthesized arcade sounds, and a generated retro-future background
- 225 curated word records across 25 alphabetized JSON files
- All Topics, Science, Nature, Technology, and General Knowledge filters
- Easy, Normal, and Hard puzzle generation
- Seeded, repeatable crossword layouts
- Touch, mouse, and physical keyboard controls
- Check Cell, Check Word, and Check Puzzle
- Reveal Letter, Reveal Word, and Reveal Puzzle
- Undo, timer, scoring, upgraded completion screen, local statistics, and a placeholder arcade store
- Local save and resume using browser storage
- GitHub Pages deployment workflow
- A Games button linking to https://jivaro.net/games

## Requirements

- Node.js 20.19 or newer; Node 22 is recommended
- npm

## Run locally

```bash
npm install
npm run dev
```

Open the local address printed by Vite.

## Validate and test

```bash
npm run validate:words
npm test
npm run check
```

`npm run check` validates all word records, runs generator, scoring, data, and word-completion tests, then creates a production build.

## Production preview

```bash
npm run build
npm run preview
```

## Mobile layout

The app is designed to stay inside one `100dvh` viewport.

- The document itself does not scroll.
- On mobile, the current clue remains visible above the board.
- The **Board / Clues** control opens a tabbed clue sheet without extending the page.
- Large Normal and Hard boards use native touch panning while scrollbar tracks remain hidden.
- The minimum primary target is 360×640, with a compact fallback at 320×568.
- Short coarse-pointer landscape screens use the mobile game layout.

## Word files

Starter records are stored in:

```text
src/features/crossword/data/words/
```

Each record contains an ID, answer, clue, topic tags, difficulty, enabled state, language, source, and internal notes. See the README inside that folder before adding records.

## GitHub Pages

This project includes `.github/workflows/deploy.yml`.

1. Create or open the GitHub repository.
2. Push this complete project to the repository's `main` branch.
3. In GitHub, open **Settings → Pages**.
4. Set the Pages source to **GitHub Actions**.
5. Push a commit or manually run the deployment workflow.

During a GitHub Actions build, `vite.config.js` automatically uses the repository name as the Vite base path. Local development continues to use `/`.

For a custom domain or root user site, change the `base` logic in `vite.config.js` to use `/` for the production build.

## Main project structure

```text
.github/workflows/deploy.yml
public/favicon.svg
scripts/validateWords.mjs
src/App.vue
src/main.js
src/assets/main.css
src/features/crossword/
tests/crossword/
index.html
package.json
vite.config.js
```

## Editing the Games link

The return destination is stored in:

```text
src/features/crossword/data/gameConfig.js
```

Change `gamesUrl` there when the destination changes.
