// A bottom sheet built on the native <dialog> element, which gives us focus trapping, the Esc key
// and a backdrop for free (good for accessibility, and no extra library).
// Children are only rendered while open, so each opening starts fresh (cancelled edits are dropped).
import { useEffect, useId, useRef } from 'react'

function Sheet({ open, onClose, title, children }) {
  const dialogRef = useRef(null)
  const openRef = useRef(open)
  const titleId = useId()

  // Keep the native dialog in step with our `open` prop.
  useEffect(() => {
    openRef.current = open
    const dialog = dialogRef.current
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      // The browser's "close" event arrives a moment AFTER dialog.close(). Only react to it when the
      // user closed the sheet (Esc), not when we did; otherwise a late event from a sheet we just
      // closed would also close the next sheet that opened in its place.
      onClose={() => openRef.current && onClose()}
      onClick={(e) => e.target === dialogRef.current && onClose()} // tap the backdrop to close
      className="m-0 mt-auto w-full max-w-none rounded-t-2xl bg-white p-0 text-charcoal backdrop:bg-charcoal/60"
    >
      <div className="mx-auto max-h-[90vh] max-w-2xl overflow-y-auto p-5">
        <h2 id={titleId} className="mb-4 font-heading text-2xl font-bold">{title}</h2>
        {open && children}
      </div>
    </dialog>
  )
}

export default Sheet
