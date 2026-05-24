// Small presentational helpers shared across components.

// Deterministic hue (0–359) from any string seed — used for avatar gradients.
export function hueFor(seed = '') {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360
  return h
}

// Avatar initials — Latin names → first letters of two words; Thai → first 2 chars.
export function initials(name, romanized) {
  const r = (romanized || '').trim()
  if (r) {
    const parts = r.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return r.slice(0, 2).toUpperCase()
  }
  const n = (name || '').trim()
  return n ? n.slice(0, 2) : '—'
}

export const isAscii = (s = '') => /^[\x00-\x7F]*$/.test(s)
