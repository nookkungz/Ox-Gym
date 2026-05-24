// Tiny async-data hook — runs `fn`, tracks loading/error, exposes reload + setData.
//
// The fetch is debounced by DEBOUNCE_MS. A screen the user merely passes through
// during rapid navigation unmounts before the timer fires, so it never queries
// at all. This stops abandoned-but-uncancellable Firestore reads from piling up
// — which froze mobile for 20-30s, because mobile Firestore falls back to HTTP
// long-polling and the screen the user lands on stalls behind the backlog.
import { useState, useEffect, useCallback } from 'react'

const DEBOUNCE_MS = 250

export function useLoad(fn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [nonce, setNonce] = useState(0)

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    // Wait out DEBOUNCE_MS before touching the network — clearTimeout in the
    // cleanup means a screen unmounted within the window fires no query.
    const timer = setTimeout(() => {
      Promise.resolve()
        .then(fn)
        .then(
          (d) => {
            if (alive) {
              setData(d)
              setLoading(false)
            }
          },
          (e) => {
            if (alive) {
              console.error(e)
              setError(e)
              setLoading(false)
            }
          },
        )
    }, DEBOUNCE_MS)
    return () => {
      alive = false
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce])

  return { data, loading, error, reload, setData }
}
