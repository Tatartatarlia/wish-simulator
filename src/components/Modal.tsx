import type { ReactNode } from 'react'

export function Modal({
  title,
  wide = false,
  hidden = false,
  onClose,
  children,
}: {
  title: string
  wide?: boolean
  hidden?: boolean
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="modal-back" hidden={hidden} inert={hidden} onClick={hidden ? undefined : onClose}>
      <div
        className={`modal ${wide ? 'modal-wide' : ''}`}
        role="dialog"
        aria-modal={hidden ? undefined : true}
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="modal-x" onClick={onClose} aria-label="关闭">
          ×
        </button>
        <h2>{title}</h2>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
