export function Logo({ height = 22, style }) {
  return (
    <img
      src="/ox-logo.png"
      alt="OX GYM"
      style={{ height, display: 'block', ...style }}
    />
  )
}

// SVG ox-head mark — fallback / compact contexts.
export function LogoMark({ size = 24, color = 'var(--ox-red)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M3 6 L6 4 L8 8 L12 7 L16 8 L18 4 L21 6 L19 12 C19 17 15.5 20 12 20 C8.5 20 5 17 5 12 Z"
        fill={color}
      />
      <circle cx="9.5" cy="13" r="1" fill="#0a0a0a" />
      <circle cx="14.5" cy="13" r="1" fill="#0a0a0a" />
    </svg>
  )
}
