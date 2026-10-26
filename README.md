# Nosh

A small web app for Nosh, a (fictional) charity that helps people on low incomes eat well without overspending.
Browse recipes, set dietary needs and household size, plan the week, and get one combined shopping list.
Built as a demo for an engineering interview. Single user, no sign-in.

## Run it

You need **Node 22.12 or newer** (built and tested on Node 24).

```bash
npm install        # installs the client, server and shared packages together
npm run seed       # creates the database and loads the 20 starter recipes (safe to re-run)
npm run dev        # starts the API (port 8000) and the app (port 3000)
```

Then open **http://localhost:3000**. It is designed for small phones, so try it at about 360px wide
(browser dev tools, device mode).

Optional: `server/.env.example` shows the two settings the server reads (`PORT`, `NODE_ENV`). Both have defaults.

| Command | What it does |
|---|---|
| `npm run dev` | Runs server and client together with live reload |
| `npm run seed` | Loads the starter recipes. Validates the file first and stops with a clear message if anything is wrong |
| `npm test` | Runs all tests (shared + server) |
| `npm run lint` | Lints the client |
| `npm run build` | Builds the client for production (`client/dist`) |

## What it does

- **Recipes:** browse the starter recipes, search, filter by meal and tag, add your own (ingredients and method).
- **Settings:** dietary needs (vegetarian, vegan, gluten-free, dairy-free) and household size. A banner shows
  when recipes are being filtered, and one tap turns the filter off.
- **Plan:** pick a day, then tap a meal slot (breakfast, lunch, dinner, dessert) to choose a recipe, change the
  number of people, swap it or remove it. No drag and drop.
- **Shopping list:** built from the plan, with the same ingredient added up across recipes. Tap "Got it" on anything
  already at home and it moves to "You've got it at home" (and stays there).

## How it is built

```
client/   React + Vite + Tailwind + React Query. Mobile first.
server/   Node + Express + SQLite (better-sqlite3).
shared/   Validation schemas and the dietary rule, used by BOTH client and server.
```

**Server layers.** Each request goes `routes -> controllers -> services -> repositories`:

| Layer | Job | Example |
|---|---|---|
| routes | Map a URL to a handler, validate input | `routes/planRoutes.js` |
| controllers | Read the request, call a service, send the reply | `controllers/planController.js` |
| services | Business rules | `services/planService.js` |
| repositories | The only code that writes SQL | `repositories/planRepository.js` |

The shopping-list maths is separate again, in `server/src/shopping/`. It is **pure** (plain data in, plain data out,
no Express or database), which is why it is easy to test and explain.

**One rule, one place.** The dietary rule lives in `shared/src/dietary.js` and the recipe, preference and plan
schemas in `shared/src/schemas.js`. The server uses them to validate every request, and the client uses the same
ones for instant form messages, so the two can never disagree.

**Errors** always look the same: `{ "error": { "code", "message", "details?" } }`.

### API

| Method and path | Purpose |
|---|---|
| `GET /api/recipes?q=&mealType=&tag=&suitable=true` | List, search and filter recipes (`suitable=true` applies saved dietary needs) |
| `GET /api/recipes/:id` | One recipe |
| `POST /api/recipes` | Add a custom recipe |
| `GET` / `PUT /api/preferences` | Dietary needs and household size |
| `GET /api/plan` | The week's planned meals |
| `PUT` / `DELETE /api/plan/:day/:slot` | Set (or swap) or remove a meal. Day 0 = Monday, slot = breakfast, lunch, dinner or dessert |
| `GET /api/shopping-list` | The list, worked out from the plan: `{ plannedMeals, toBuy, atHome }` |
| `PUT` / `DELETE /api/shopping-list/home-items/:name` | Mark an ingredient as got it at home / need it |

### Shopping list rules in short

1. Each ingredient is scaled by (planned servings / recipe serves).
2. Names are normalised (case, spaces, plural) but never trimmed down: "chopped tomatoes", "cherry tomatoes" and
   "tomatoes" stay separate.
3. Units are grouped into families. Weight (g, kg) and volume (ml, l, tsp, tbsp) convert within the family. Count-like
   units (tin, slice, clove and so on) only add when the unit is identical.
4. Incompatible units stay as separate lines. Nothing is guessed (a tin is never assumed to be 400 ml).
5. Add up first, round last. Things that can't be split round up. 1200 g shows as 1.2 kg.
6. "To taste" items (no quantity) appear once and are never added.
7. `prep` is ignored, and each line shows which recipes it came from.

## Data

Everything is stored in one SQLite file, `server/data/nosh.db` (ignored by git). Tables: `recipes` (each recipe as JSON),
`plan_entries`, `preferences` and `home_items`. The shopping list is never stored; it is worked out each time.

```bash
sqlite3 -header -column server/data/nosh.db "SELECT * FROM plan_entries;"   # have a look
rm server/data/nosh.db && npm run seed                                       # start again from scratch
DB_FILE=/tmp/try-it.db npm run seed                                          # or use a different file entirely
```

## Tests

`npm test` runs about 66 tests. The heart of them is the shopping-list aggregation and the dietary rule (same unit
across recipes, g + kg, ml + tbsp, spelling merges, incompatible units, "to taste", scaling and rounding, the same
recipe planned twice, vegan implying dairy-free, and more). A smaller set of API tests covers the main flows using an
in-memory database, so they never touch your real data.

## Accessibility and mobile

- Checked with the axe engine on every screen and sheet at 360px and 320px wide: no violations, no sideways scrolling.
- Brand colours: text on Nosh Green is always **charcoal** (6.1:1). Green, teal, coral and leaf are never used as text
  on white, where they fail. Charcoal on Deep Teal (4.0:1) and Flame Coral (4.3:1) is also just under AA, so those two
  are for non-text use only.
- Semantic HTML, labelled fields, visible focus ring on everything, large tap targets, friendly error messages that
  are announced to screen readers, and information never relies on colour alone (icons, ticks and number badges).
- Panels use the native `<dialog>` element, so focus is trapped and Esc closes them.

## More

- [DECISIONS.md](DECISIONS.md): every significant decision, its trade-off, and where AI was used.
- Out of scope: sign-in, multiple users, deployment, live prices, drag and drop.
