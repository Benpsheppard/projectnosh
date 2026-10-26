// Shared test helper: a price lookup with no prices, so API tests never depend on the real
// server/data/prices.json (which you edit). Tests that need prices pass their own table.
import { createPriceLookup } from '../src/pricing/priceLookup.js'

export const noPrices = createPriceLookup({ store: 'Test Store', dateChecked: null, prices: [] })
