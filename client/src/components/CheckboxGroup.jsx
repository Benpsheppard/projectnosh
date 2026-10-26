// A labelled group of checkboxes (e.g. dietary tags). Used by the add-recipe form and the settings sheet.
import { errorClass, labelClass } from './ui'

function CheckboxGroup({ legend, options, selected, onChange, error }) {
  const toggle = (value) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value])
  return (
    <fieldset>
      <legend className={labelClass}>{legend}</legend>
      <div className="flex flex-wrap gap-x-5 gap-y-1">
        {options.map((option) => (
          <label key={option} className="flex min-h-11 items-center gap-2">
            <input
              type="checkbox"
              className="size-6 accent-teal"
              checked={selected.includes(option)}
              onChange={() => toggle(option)}
            />
            {option}
          </label>
        ))}
      </div>
      {error && <p className={errorClass}>{error}</p>}
    </fieldset>
  )
}

export default CheckboxGroup
