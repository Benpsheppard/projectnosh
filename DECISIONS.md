# Decisions

Each entry: what we chose, and the trade-off.

## Stack
- **JavaScript, not TypeScript.** Chosen by the author for now. Shapes are described with zod schemas (runtime-checked at the API boundary) and JSDoc. Trade-off: fewer compile-time checks; TS can be adopted file by file later.
- **npm workspaces (client, server, shared).** One `npm install`, and `@nosh/shared` resolves like any package. Trade-off: slightly more root config than three separate folders.
- **`shared` is an ES module; `server` stays CommonJS.** The existing server was CommonJS. The server loads shared with a dynamic `import()` in the seed script. Trade-off: a little async ceremony; avoids rewriting the server.
- **Tailwind CSS v4 (Vite plugin).** Brand colours and fonts are declared once in `@theme` in `client/src/index.css`. Unused classes are dropped at build, so CSS is ~2 kB gzipped. Trade-off: busier JSX; we keep that tidy with small components.
- **Fonts self-hosted via `@fontsource`, Latin subset only.** No third-party request, works offline. Trade-off: ~70 kB of font files (cached after first load); Arial/system fallbacks apply while loading.

## Data
- **SQLite via `better-sqlite3`.** Synchronous API keeps the data layer very simple for a single-user app. Trade-off: native module (it installed from a prebuilt binary here).
- **Recipes stored as JSON in one column**, with `id` and `is_builtin` as the only real columns. Trade-off: can't query inside ingredients with SQL; fine for 20-ish recipes, filtering happens in JS.
- **Seed is validate-then-write.** Every recipe is checked with the shared schema; all problems are reported together and nothing is written if any fail. Upsert only touches built-in rows, so re-running never overwrites a user's custom recipes.
- **Plan is one recurring Mon-Sun week** (day 0-6 + slot), not calendar dates. Trade-off: no history or "next week".

## Server structure
- **routes -> controllers -> services -> repositories.** `createApp(db)` receives the database, so tests can use an in-memory one.
- **One error shape** `{ error: { code, message, details? } }` from a single error handler.

## Where AI was used
- Claude Code (Claude Sonnet 5.5) planned the architecture with the author, and wrote the scaffold, server layers, seed and client skeleton. The author reviews and commits each phase and chose the key decisions above (JavaScript, Tailwind, recurring week, fonts).
