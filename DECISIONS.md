# Decisions

Each entry: what we chose, and the trade-off.

## Stack
- **JavaScript, not TypeScript.** Chosen by the author for now. Shapes are described with zod schemas (runtime-checked at the API boundary) and JSDoc. Trade-off: fewer compile-time checks; TS can be adopted file by file later.
- **npm workspaces (client, server, shared).** One `npm install`, and `@nosh/shared` resolves like any package. Trade-off: slightly more root config than three separate folders.
- **`shared` is an ES module; `server` stays CommonJS.** The existing server was CommonJS. The server simply `require()`s shared (Node 22+ can require ES modules). Trade-off: relies on a recent Node; avoids rewriting the server.
- **Tailwind CSS v4 (Vite plugin).** Brand colours and fonts are declared once in `@theme` in `client/src/index.css`. Unused classes are dropped at build, so CSS is ~2 kB gzipped. Trade-off: busier JSX; we keep that tidy with small components.
- **Fonts self-hosted via `@fontsource`, Latin subset only.** No third-party request, works offline. Trade-off: ~70 kB of font files (cached after first load); Arial/system fallbacks apply while loading.

- **Icons from `lucide-react`, no emojis.** Cleaner and consistent across phones (emoji look different per device). Named imports are tree-shaken, so only the ~12 icons we use ship (about +2.6 kB gzipped). Icons are decorative (`aria-hidden`); every one sits beside a text label.

## Data
- **SQLite via `better-sqlite3`.** Synchronous API keeps the data layer very simple for a single-user app. Trade-off: native module (it installed from a prebuilt binary here).
- **Recipes stored as JSON in one column**, with `id` and `is_builtin` as the only real columns. Trade-off: can't query inside ingredients with SQL; fine for 20-ish recipes, filtering happens in JS.
- **Seed is validate-then-write.** Every recipe is checked with the shared schema; all problems are reported together and nothing is written if any fail. Upsert only touches built-in rows, so re-running never overwrites a user's custom recipes.
- **Plan is one recurring Mon-Sun week** (day 0-6 + slot), not calendar dates. Trade-off: no history or "next week".

## Server structure
- **routes -> controllers -> services -> repositories.** `createApp(db)` receives the database, so tests can use an in-memory one.
- **One error shape** `{ error: { code, message, details? } }` from a single error handler.

## Dietary filtering (`shared/src/dietary.js`)
- **Lives in `shared`**, because the server (API filter) and the client (picker, banner) must apply the identical rule. Trade-off: it's ES-module code the CommonJS server has to `import()`.
- **Strict "carries every selected tag"; untagged = not suitable.** The only implication is vegan -> vegetarian + dairy-free, held in one small `IMPLIES` table so adding a rule is a one-line change. Trade-off: an untagged recipe that happens to be vegetarian is hidden; we'd rather under-promise than make a wrong claim.

## Shopping list (`server/src/shopping/`)
- **Pure modules** (`normaliseName`, `units`, `format`, `aggregate`): no Express or database, so they are unit-tested directly and easy to walk through.
- **Name normalising only singularises the last word.** Nothing is ever stripped, so "chopped tomatoes", "cherry tomatoes" and "tomatoes" stay separate. Trade-off: a genuinely irregular plural needs an entry in `NOT_PLURAL`; the shown name is the first spelling seen (e.g. "carrot" even when 3 are needed).
- **Unit families.** Weight (g, kg) and volume (ml, l, tsp, tbsp; 5 ml and 15 ml spoons) convert within the family. Count-like units only add when the unit is identical. Different families stay as separate lines; we never guess (no tin = 400 ml).
- **Sum first, round last.** Counts round up; grams round up to whole grams (kg from 1000 g); ml to whole ml (l from 1000 ml). Totals made only of spoons under 60 ml stay as spoons, rounded up to half a teaspoon. Trade-off: rounding up slightly over-buys, which suits "can't buy half a tin".
- **"To taste" lines** (null quantity) are one line per item, separate from any quantified line of the same item.
- **Each line lists the recipes it came from** (once per recipe, even if planned twice).

## Recipes tab (phase c)
- **Search and filters run on the server** (`GET /api/recipes?q=&mealType=&tag=`), so the rule lives in one place and the client stays thin. Search matches name, cuisine, tags and ingredient names; selected tags must ALL match. Trade-off: one request per keystroke (fine locally; add a debounce if it ever mattered).
- **The add-recipe form validates with the same shared schema as the server.** Users get friendly messages instantly, and the server re-checks anyway. Trade-off: zod is now in the client bundle (JS grew from ~79 kB to ~107 kB gzipped). If that matters on old phones, swap to `zod/mini` or hand-written checks.
- **Blank amount = "to taste"; unit "none / count" = plain count.** Fully blank ingredient/step rows are ignored, and errors still point at the row the user sees.
- **Custom recipe ids are `slug-xxxx`** (readable name + 4 random hex chars). Trade-off: a collision is possible but very unlikely; the primary key would reject it.
- **Cards expand in place** using a real button with `aria-expanded`. The "Add to plan" button appears once the Plan tab (phase e) passes in a handler.
- **Tabs are plain state, not a router.** Trade-off: no deep links or browser back between tabs.
- Accessibility so far: labelled fields, 44-48px tap targets, visible focus ring, errors announced via `role="alert"`, filter state shown with a tick as well as colour.

## Settings and dietary filtering (phase d)
- **Preferences are one saved row on the server** (`GET/PUT /api/preferences`), so every device and tab sees the same settings and the API can use them.
- **`GET /api/recipes?suitable=true` filters using the saved preferences** with the shared `filterSuitable`. The client waits for preferences before fetching recipes, so the list never flashes unfiltered. Trade-off: the client asks for filtering explicitly rather than the server always doing it, which keeps "show all" a simple switch.
- **"Show all recipes" is temporary UI state** (held in `App`, so it survives tab changes but resets on reload). The saved settings are never changed by it. Trade-off: not remembered across visits, which avoids someone forgetting their filter is off.
- **The banner shows in both states** (filter on: "Showing recipes that are vegan" + "Show all recipes"; off: "Showing all recipes, whatever your settings" + "Use my settings"), so it is always clear what the list is doing.
- **Empty results get friendly copy and a way out** ("Show all recipes", "Clear filters"), never a blank screen.
- **Settings sheet uses the native `<dialog>`**: focus trapping, Esc to close and the backdrop come from the browser, with no modal library. The form inside only mounts while open, so cancelled edits are discarded.
- **Household size uses a number field with +/- buttons** (big tap targets) and is validated by the shared schema.
- Global focus ring moved into Tailwind's base layer so components can override its colour (needed on the dark header).

## Plan tab (phase e)
- **Plan entries are keyed by (day, slot)**, so a slot holds at most one meal and setting it again swaps it. `PUT /api/plan/:day/:slot` does both "add" and "change", and the day and slot in the URL are validated with a shared schema just like a request body.
- **The plan response includes the recipe's name, serves and tags**, so the screen needs one request, not one per meal. Trade-off: the server does a small lookup per entry (at most 28), which is fine at this size.
- **Servings are stored per meal, set to the household size when you add it.** Changing the household size later does not rewrite meals you already planned. Trade-off: simple and predictable, but a household change means adjusting existing meals by hand. (Storing "no value = follow the household" would track it, at the cost of a nullable column and a migration.)
- **Any recipe can go in any slot** (e.g. a dinner as lunch leftovers). The picker only *suggests* recipes for the slot's meal type, and the server does not enforce it.
- **Day markers are a number badge**, not just colour, and each day button's accessible name says how many meals it holds.
- **Tap-to-add only, no drag and drop**: an empty slot opens a picker sheet; a planned meal opens a sheet to change servings, swap or remove. This meets WCAG 2.2's rule that dragging needs a non-drag alternative, and is easier on touch.
- **"Create your own" from a slot** opens the add-recipe form with that meal ticked, and the saved recipe drops straight into the slot.
- **"Add to plan" on a recipe card** opens a day + meal chooser (defaulting to today and the recipe's meal type) and warns if it will swap an existing meal.
- **One shared `Sheet` component** (native `<dialog>`) now serves Settings, the picker, the meal sheet and Add to plan. It ignores the browser's late `close` event when we closed it ourselves; without that, swapping from one sheet to the next closed the new sheet too (found in browser testing).

## Where AI was used
- Claude Code (Claude Sonnet 5.5) planned the architecture with the author, and wrote the scaffold, server layers, seed and client skeleton. The author reviews and commits each phase and chose the key decisions above (JavaScript, Tailwind, recurring week, fonts).
