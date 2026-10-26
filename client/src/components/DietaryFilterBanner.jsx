// Banner shown on the Recipes tab whenever dietary preferences are set.
// While filtering is on it says what is applied and offers "Show all recipes";
// once switched off it says so and offers to turn the filter back on.
import { ListFilter } from 'lucide-react'
import Button from './Button'

function DietaryFilterBanner({ dietary, filterOn, onToggle }) {
  return (
    <div role="status" className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border-2 border-charcoal bg-nosh-green/40 p-3">
      <ListFilter aria-hidden="true" className="shrink-0" />
      <p className="flex-1 basis-48 font-semibold">
        {filterOn ? `Showing recipes that are ${dietary.join(' and ')}` : 'Showing all recipes, whatever your settings'}
      </p>
      <Button variant="secondary" className="text-sm" onClick={onToggle}>
        {filterOn ? 'Show all recipes' : 'Use my settings'}
      </Button>
    </div>
  )
}

export default DietaryFilterBanner
