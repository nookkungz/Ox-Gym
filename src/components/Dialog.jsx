// App-wide alert / confirm dialogs, exposed as promise-returning calls via useDialog().
import { createContext, useContext, useMemo, useState } from 'react'
import { Modal } from './Modal'
import Button from './Button'

const DialogContext = createContext(null)

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null)

  const api = useMemo(
    () => ({
      alert: (message, opts = {}) =>
        new Promise((resolve) => setDialog({ mode: 'alert', message, resolve, ...opts })),
      confirm: (message, opts = {}) =>
        new Promise((resolve) => setDialog({ mode: 'confirm', message, resolve, ...opts })),
    }),
    [],
  )

  const isConfirm = dialog?.mode === 'confirm'

  const resolveWith = (value) => {
    if (dialog) dialog.resolve(value)
    setDialog(null)
  }

  return (
    <DialogContext.Provider value={api}>
      {children}
      <Modal open={!!dialog} onClose={() => resolveWith(isConfirm ? false : undefined)}>
        {dialog && (
          <div style={{ padding: 20 }}>
            <div
              className="ox-cap"
              style={{
                color: dialog.danger ? 'var(--ox-red)' : 'var(--ox-red)',
                fontSize: 9,
                marginBottom: 8,
              }}
            >
              {dialog.title || (isConfirm ? 'ยืนยัน' : 'แจ้งเตือน')}
            </div>
            <div
              className="ox-thai"
              style={{
                fontSize: 14,
                color: 'var(--ox-fg-2)',
                lineHeight: 1.5,
                whiteSpace: 'pre-line',
              }}
            >
              {dialog.message}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
              {isConfirm && (
                <Button variant="dark" full size="sm" onClick={() => resolveWith(false)}>
                  {dialog.cancelLabel || 'ยกเลิก'}
                </Button>
              )}
              <Button
                variant="primary"
                full
                size="sm"
                onClick={() => resolveWith(isConfirm ? true : undefined)}
              >
                {dialog.confirmLabel || (isConfirm ? 'ยืนยัน' : 'ตกลง')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DialogContext.Provider>
  )
}

export function useDialog() {
  const ctx = useContext(DialogContext)
  if (!ctx) throw new Error('useDialog must be used within <DialogProvider>')
  return ctx
}
