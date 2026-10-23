// Small badge for a dietary tag: icon + text, never colour alone.

const ICONS = { vegetarian: '🥕', vegan: '🌱', 'gluten-free': '🌾', 'dairy-free': '🥛' }

function DietaryBadge({ tag }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-nosh-green px-2.5 py-0.5 text-sm font-semibold">
      <span aria-hidden="true">{ICONS[tag]}</span>
      {tag}
    </span>
  )
}

export default DietaryBadge
