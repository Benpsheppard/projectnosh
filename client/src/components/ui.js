// Shared Tailwind class strings for form fields, so every input looks and focuses the same.
// Fields are at least 48px tall (easy to tap) and have a dark border (visible without colour).

// placeholder:text-charcoal/70 because Tailwind's default placeholder colour is too faint (2.8:1; we need 4.5:1).
export const inputClass =
  'w-full min-h-12 rounded-lg border-2 border-charcoal/60 bg-white px-3 text-base placeholder:text-charcoal/70'
export const labelClass = 'mb-1 block font-semibold'
export const errorClass = 'mt-1 text-sm font-semibold text-red-800'
