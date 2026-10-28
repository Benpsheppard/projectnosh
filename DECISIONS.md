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

## Shopping list and "got it at home" (phase f)
- **The list is derived on demand, never stored.** `GET /api/shopping-list` reads the plan, runs the pure `aggregate` function and returns `{ plannedMeals, toBuy, atHome }`. The plan is the single source of truth, so the list can never go stale. Trade-off: it is recalculated on every request (cheap at this size).
- **"Got it at home" is stored by normalised ingredient name**, not by list line. It therefore survives plan changes, and an item you marked at home stays marked if it leaves the plan and comes back. Marking "chopped tomato" moves every chopped-tomato line (e.g. tins and grams) together. Trade-off: you can't mark just one of two lines for the same ingredient.
- **Plan changes refresh the list** (the client invalidates both caches), and the toggle is a simple "send, then refetch" rather than an optimistic update. Trade-off: a short delay on slow connections, but far less code.
- **One-tap toggle is a labelled button** ("Got it" / "Need it") with an icon, not a bare checkbox, so its meaning is clear to everyone and its accessible name contains its visible text.
- **Friendly empty states**: nothing planned (with a link to the plan), nothing to buy (everything at home), and nothing at home yet.
- **`DB_FILE` environment variable** selects a different database file, so experiments and browser tests can run against a scratch copy instead of real data.

## Accessibility and mobile polish (phase g)
- **Measured, not assumed.** I ran the axe engine in a real browser over every screen and sheet (Recipes, expanded card, empty state, add form with errors, Settings, picker, meal sheet, Add to plan, Plan, Shopping list) at 360px and 320px wide. Result: zero violations, no sideways scrolling. Trade-off: axe catches roughly a third of accessibility problems, so I also checked keyboard use by hand (Tab to a slot, Enter opens the sheet, Esc returns focus to it).
- **Brand colours and contrast** (WCAG AA needs 4.5:1 for text, 3:1 for icons and borders):

  | Combination | Ratio | Use |
  |---|---|---|
  | Charcoal on white | 12.1:1 | Body text |
  | Charcoal on Nosh Green | 6.1:1 | Buttons, chips, badges, active tab |
  | Nosh Green on charcoal | 6.1:1 | Header title and gear icon |
  | Charcoal at 75% on white | 5.6:1 | Hints and secondary text |
  | Charcoal at 70% on white | 4.8:1 | Placeholder text |
  | Nosh Green / Deep Teal / Flame Coral / Leaf as text on white | 2.0 / 3.0 / 2.8 / 1.8 | Fail, so never used as text |
  | Charcoal on Deep Teal / Flame Coral | 4.0 / 4.3 | Just under AA, so only for non-text accents (Teal tints the checkboxes) |

  Tailwind's default placeholder colour was 2.8:1, so inputs now use charcoal at 70%.
- **A real `<h1>`** ("Nosh") and a proper heading order (h1, then h2 per tab, h3 for cards and sections), so screen-reader users can jump around. The browser tab title also changes per tab.
- **Day buttons**: spoken as "Monday, 2 meals planned" while showing "Mon". The short name is hidden from screen readers and the full name is hidden visually, so what is seen and what is heard both make sense. Their gap was reduced so they are 43-45px wide at 360px (39px at 320px, which is above WCAG 2.2's 24px minimum).
- **Phone details**: the tab bar clears the iPhone home indicator (`viewport-fit=cover` plus a safe-area padding), inputs use 16px text so iOS does not zoom in on focus, `touch-action: manipulation` removes the tap delay and double-tap zoom, each tab opens scrolled to the top, and disabled buttons look disabled.
- **README** covers running, scripts, structure, API, shopping rules, data, tests and accessibility. It targets Node 22.12+ (needed to `require()` the shared ES module) and the root `package.json` says so in `engines`.
- **`server/.env.example`** documents the two settings; the real `.env` stays out of git. Both settings have defaults, so a fresh clone works without it.

## Estimated cost (phase h, the stretch)
- **A replaceable price lookup.** `pricing/priceLookup.js` exposes `{ store, dateChecked, find(itemKey) }`. The estimate code only knows that shape, so a different store or a database could replace it, and tests inject a tiny fake table. Prices are keyed by normalised ingredient name and the file's names are normalised too, so whoever fills in the file doesn't need to know our spelling rules.
- **Whole packs, never pro-rata.** Packs needed = amount needed / pack size, rounded up; cost = packs x pack price. Trade-off: it over-states what you'd "use" but matches what you actually pay at the till.
- **Unknown is not zero.** No price, or a unit that is a different kind from the pack (weight vs volume vs count, or two different count units), gives "Price unknown". Those lines are left out of the total and counted in the sentence ("About £X, plus N items we don't have a price for"). We never guess a conversion.
- **"To taste" lines carry no price and aren't counted as unknown**, because there is nothing to buy; counting salt and pepper would make the "N items" figure noisy.
- **Pence, not pounds.** The file is in pounds (easy to edit), but the server converts to whole pence so totals have no floating-point drift. The client only formats at the end.
- **Only "to buy" lines are priced**, so marking something "got it at home" drops it out of the total.
- **The price file is validated at start-up** with a shared schema (every problem listed), like the recipe seed. Trade-off: a typo stops the server rather than silently showing wrong prices.
- **The shipped file is a skeleton** with six placeholder prices labelled "Example store (placeholder prices, not real)" and no date, so the feature can be demoed without implying real prices.
- **Items we can't price are said plainly in words** ("Price unknown"), not only by colour.
- **Price file errors name the ingredient** (`"bread" (price number 7) packSize: packSize must be a number`), so a typo is easy to find. API tests use an empty price table (`test/helpers.js`) instead of the real file, so editing `prices.json` can't break unrelated tests; one test still checks that the real file is valid.
- **`API_URL` for the Vite proxy** lets the client point at an API on another port, so experiments can run on a separate database without touching the usual one.

## Weekly budget (added after phase h)
- **Stored with the other preferences**, as one nullable column (`weekly_budget_pence`; null = no budget). It is a personal setting like household size, so it shares their API (`GET/PUT /api/preferences`) and the Settings sheet.
- **Whole pence in the API, pounds in the form.** The form accepts "40" or "40.50" and converts, like prices (see "Pence, not pounds" above). Limits are £1 to £1,000 with friendly messages from the shared schema. Blank means no budget.
- **A small, safe migration.** `CREATE TABLE IF NOT EXISTS` ignores an existing table, so databases made before this feature lacked the column. `openDb` now checks the table and adds the column if missing (SQLite has no "add column if not exists"). Saved data is untouched, and a test builds an old-style database to prove it. Trade-off: a hand-rolled check is fine for one column; a second or third change is the point to adopt a proper migration tool.
- **The comparison is done on the server**, in a pure `compareToBudget` function next to the cost estimate: `remainingPence = budget - total` (positive = under, negative = over). One place for the rule, easy to unit test, and the screen only has to display it.
- **No false comfort.** If nothing could be priced the total is £0, which would look "under budget". In that case there is no comparison ("we can't compare yet"). If some items have no price, the screen says the figure doesn't include them, because the real total could be higher.
- **Plain, non-judgemental wording**: "£3.00 over your £11.61 weekly budget." No advice, no alarm colours. An icon (tick or alert) plus the words carry the meaning, never colour alone.
- **Two ways in**: the gear icon, or a "Set a weekly budget" / "Change budget" button on the shopping list (which opens the same Settings sheet). Saving refreshes the list straight away.

## Brand wordmark (after phase h)
- **The header shows the supplied Nosh wordmark** instead of plain text, on the charcoal header as the brand guide asks. It is not recoloured, stretched or cropped (including its "Meal planning platform" line).
- **A resized copy ships, not the original.** The supplied PNGs are about 210 kB each, which is heavy for older phones on a small header. `brandName-header.png` is the same artwork resampled to 210 px wide (about 2x its 105 px display size), 26 kB. The originals stay in `src/assets/` but are not imported, so Vite does not bundle them.
- **Still the page's `<h1>`.** The image has `alt="Nosh"`, so screen readers hear the same heading as before. `width` and `height` are set so the header does not jump while the image loads, and the header height is unchanged.
- **The mark is used for the favicon and home-screen icon, not in the header.** The brand guide shows the mark and wordmark stacked as one lockup, so placing them side by side in the header would rearrange the logo.
- **Icons are the mark on a Nosh Charcoal square**, centred with padding (never cropped, stretched or recoloured): `favicon-32.png` for the browser tab and `apple-touch-icon.png` (180 px) for "Add to Home Screen". Charcoal keeps the mark visible on both light and dark browser tabs. They live in `client/public/` because browsers ask for them by a fixed URL. Together they are about 24 kB. Trade-off: at 32 px the fork and knife blur, so the tab icon reads as the flame and leaf in a teal ring.

## Recipe filters: dietary chips and a collapsible panel
- **Dietary chips share the `tags` list with the other chips.** The server splits them: tags in `DIETARY_TAGS` go through the shared `filterSuitable` rule (so vegan also counts as vegetarian and dairy-free, and untagged recipes are never shown as suitable), and the rest match a recipe's free-form tags. Trade-off: the `tag` URL parameter has two meanings that the server untangles. A separate `diet` parameter would be clearer if the API grew.
- **Saved settings and the chips both apply** (they combine as "and"), so a saved vegetarian setting plus the vegan chip shows only vegan recipes.
- **The 8 less-used chips (tags and dietary) sit behind a filters button; the 4 meal chips stay visible**, because meal type is the most common filter and mirrors the Plan tab. This keeps recipes visible on a small phone instead of pushing them below the fold.
- **The button is icon-only, so it carries what the missing word would have:** `aria-label` ("Filters, 2 selected"), `aria-expanded` and `aria-controls` for its open/closed state, a 48 px tap target, and a number badge that only appears when something is selected. The badge counts only the hidden filters. Trade-off: an icon is less obvious than a word for people less used to apps, which is why the label, state and count are all spelled out for assistive technology.
- **Chips wrap to their own width** instead of a fixed four-column grid, which had split words like "gluten-free" across lines and clipped "vegetarian" at 320 px.

## Where AI was used
- Claude Code (Claude Sonnet 5.5) planned the architecture with the author, and wrote the scaffold, server layers, seed and client skeleton. The author reviews and commits each phase and chose the key decisions above (JavaScript, Tailwind, recurring week, fonts).
