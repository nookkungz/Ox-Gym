// Global app state — the currently selected coach, persisted to localStorage.
import { createContext, useContext, useState, useCallback } from 'react'

const AppContext = createContext(null)
const STORAGE_KEY = 'ox5_coachId'

export function AppProvider({ children }) {
  const [coachId, setCoachIdState] = useState(
    () => localStorage.getItem(STORAGE_KEY) || null,
  )

  const setCoachId = useCallback((id) => {
    if (id) localStorage.setItem(STORAGE_KEY, id)
    else localStorage.removeItem(STORAGE_KEY)
    setCoachIdState(id || null)
  }, [])

  return (
    <AppContext.Provider value={{ coachId, setCoachId }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within <AppProvider>')
  return ctx
}
