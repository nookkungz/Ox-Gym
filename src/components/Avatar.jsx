import { hueFor, initials as deriveInitials, isAscii } from '../lib/ui'

export default function Avatar({
  name, romanized, initials, size = 40, hue, paused, active, photo, style,
}) {
  // ── Photo variant ────────────────────────────────────────────
  if (photo) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 6,
          overflow: 'hidden',
          flexShrink: 0,
          position: 'relative',
          filter: paused ? 'grayscale(1) opacity(0.55)' : 'none',
          border: paused ? '1px solid var(--ox-line)' : 'none',
          ...style,
        }}
      >
        <img
          src={photo}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        {active && (
          <div
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--ox-active)',
              border: '2px solid var(--ox-bg)',
            }}
          />
        )}
      </div>
    )
  }

  // ── Initials variant ─────────────────────────────────────────
  const text = initials || deriveInitials(name, romanized)
  const h = hue ?? hueFor(romanized || name || '')
  const ascii = isAscii(text)
  const bg = paused
    ? '#1a1a1a'
    : `linear-gradient(140deg, oklch(0.35 0.12 ${h}) 0%, oklch(0.22 0.08 ${h}) 100%)`
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 6,
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: paused ? 'var(--ox-dim)' : '#fff',
        fontFamily: ascii ? 'var(--f-display)' : 'var(--f-thai)',
        fontWeight: ascii ? 400 : 700,
        fontSize: size * (ascii ? 0.42 : 0.38),
        letterSpacing: ascii ? 1 : 0,
        textTransform: 'uppercase',
        border: paused ? '1px solid var(--ox-line)' : 'none',
        flexShrink: 0,
        position: 'relative',
        filter: paused ? 'grayscale(1) opacity(0.55)' : 'none',
        ...style,
      }}
    >
      {text}
      {active && (
        <div
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--ox-active)',
            border: '2px solid var(--ox-bg)',
          }}
        />
      )}
    </div>
  )
}
