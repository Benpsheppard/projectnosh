-- Database tables: recipes (JSON blob), plan entries, preferences (one row) and "got it at home" items.
-- Run on every start by connection.js, so every statement is idempotent.

-- The whole recipe lives as JSON in `data`; only what we query on is a column.
CREATE TABLE IF NOT EXISTS recipes (
  id         TEXT PRIMARY KEY,
  is_builtin INTEGER NOT NULL DEFAULT 0,
  data       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS plan_entries (
  day       INTEGER NOT NULL CHECK (day BETWEEN 0 AND 6), -- 0 = Monday
  slot      TEXT NOT NULL,
  recipe_id TEXT NOT NULL REFERENCES recipes(id),
  servings  INTEGER NOT NULL CHECK (servings > 0),
  PRIMARY KEY (day, slot)
);

CREATE TABLE IF NOT EXISTS preferences (
  id             INTEGER PRIMARY KEY CHECK (id = 1), -- single row, no accounts
  dietary        TEXT NOT NULL DEFAULT '[]',
  household_size INTEGER NOT NULL DEFAULT 2,
  weekly_budget_pence INTEGER -- NULL means no budget set
);
INSERT OR IGNORE INTO preferences (id) VALUES (1);

CREATE TABLE IF NOT EXISTS home_items (
  normalised_name TEXT PRIMARY KEY
);
