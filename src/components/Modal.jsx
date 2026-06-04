import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === ref.current) onClose()
      }}
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`w-full ${maxWidth} animate-fade-up rounded-t-3xl border border-white/10 bg-ink-700 shadow-card sm:rounded-3xl`}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
            <h3 className="font-display text-2xl font-bold text-chalk">{title}</h3>
            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-xl text-ash transition hover:bg-white/5 hover:text-chalk cursor-pointer"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="max-h-[75vh] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
