// The "About £X, plus N items we don't have a price for" box at the top of the shopping list.
// Always labelled as an estimate, with the store and the date its prices were checked.
// Items we cannot price are left out of the total (never counted as £0) and counted in the wording.
// Below it: how the total compares with the weekly budget, or a prompt to set one.
import { Wallet } from 'lucide-react'
import { formatDate, formatMoney } from '../lib/formatPrice'
import BudgetStatus from './BudgetStatus'
import Button from './Button'

function EstimateSummary({ estimate, onOpenSettings }) {
  const { store, dateChecked, totalPence, pricedCount, unknownCount, budgetPence } = estimate
  if (pricedCount + unknownCount === 0) return null // nothing to buy, so nothing to price

  const unknownText = `${unknownCount} ${unknownCount === 1 ? 'item' : 'items'} we don't have a price for`
  const headline =
    pricedCount === 0
      ? `We don't have prices for these items yet.`
      : `About ${formatMoney(totalPence)}${unknownCount > 0 ? `, plus ${unknownText}` : ''}.`

  return (
    <section aria-labelledby="estimate-title" aria-live="polite" className="rounded-xl border-2 border-charcoal p-3">
      <h3 id="estimate-title" className="text-sm font-semibold text-charcoal/75">Estimated cost</h3>
      <p className="font-heading text-xl font-bold">{headline}</p>
      <p className="text-sm text-charcoal/75">
        This is an estimate, using whole packs. Prices are from {store}
        {dateChecked && `, checked ${formatDate(dateChecked)}`}. Things you've got at home are left out.
      </p>

      <div className="mt-3 border-t-2 border-charcoal/20 pt-3">
        {budgetPence === null ? (
          <Button variant="secondary" className="inline-flex items-center gap-2 text-sm" onClick={onOpenSettings}>
            <Wallet aria-hidden="true" size={18} /> Set a weekly budget
          </Button>
        ) : (
          <>
            <BudgetStatus estimate={estimate} />
            <Button variant="secondary" className="mt-2 text-sm" onClick={onOpenSettings}>Change budget</Button>
          </>
        )}
      </div>
    </section>
  )
}

export default EstimateSummary
