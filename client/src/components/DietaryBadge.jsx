// Small badge for a dietary tag: icon + text, never colour alone. Icons are from lucide-react.
import { Carrot, MilkOff, Vegan, WheatOff } from 'lucide-react'

const ICONS = { vegetarian: Carrot, vegan: Vegan, 'gluten-free': WheatOff, 'dairy-free': MilkOff }

function DietaryBadge({ tag }) {
  const Icon = ICONS[tag]
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-nosh-green px-2.5 py-0.5 text-sm font-semibold">
      <Icon size={16} aria-hidden="true" />
      {tag}
    </span>
  )
}

export default DietaryBadge
