// A button with the two looks we use: "primary" (Nosh green) and "secondary" (outlined).
// Charcoal text on green keeps contrast above WCAG AA; min height gives a large tap target.

const looks = {
  primary: 'bg-nosh-green text-charcoal border-2 border-nosh-green',
  secondary: 'bg-white text-charcoal border-2 border-charcoal',
}

function Button({ variant = 'primary', className = '', ...props }) {
  return (
    <button
      type="button"
      className={`min-h-12 rounded-full px-5 font-bold disabled:cursor-not-allowed disabled:opacity-60 ${looks[variant]} ${className}`}
      {...props}
    />
  )
}

export default Button
