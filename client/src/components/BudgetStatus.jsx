// Shows how the shopping list estimate compares with the weekly budget: how much is left, or how much over.
// Plain and factual (never preachy). The wording and an icon carry the meaning, not colour alone.
import { CircleAlert, CircleCheck } from 'lucide-react'
import { formatMoney } from '../lib/formatPrice'

function BudgetStatus({ estimate }) {
  const { budgetPence, remainingPence, unknownCount } = estimate
  const budget = formatMoney(budgetPence)

  if (remainingPence === null) {
    return <p>We can't compare with your {budget} weekly budget yet, because we don't have prices for these items.</p>
  }

  const over = remainingPence < 0
  const amount = formatMoney(Math.abs(remainingPence))
  const text =
    remainingPence === 0
      ? `Right on your ${budget} weekly budget.`
      : `${amount} ${over ? 'over' : 'under'} your ${budget} weekly budget.`

  return (
    <div className="flex items-start gap-2">
      {over ? <CircleAlert aria-hidden="true" className="mt-0.5 shrink-0" /> : <CircleCheck aria-hidden="true" className="mt-0.5 shrink-0" />}
      <div>
        <p className="font-bold">{text}</p>
        {unknownCount > 0 && (
          <p className="text-sm text-charcoal/75">This doesn't include the items we don't have a price for.</p>
        )}
      </div>
    </div>
  )
}

export default BudgetStatus
