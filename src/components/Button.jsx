const SIZES = {
  sm: { padY: 8, padX: 12, fs: 11, lsp: 0.12 },
  md: { padY: 12, padX: 16, fs: 12, lsp: 0.14 },
  lg: { padY: 16, padX: 20, fs: 14, lsp: 0.16 },
}
const VARIANTS = {
  primary: { bg: 'var(--ox-red)', fg: '#fff', bd: 'transparent' },
  ghost: { bg: 'transparent', fg: 'var(--ox-fg)', bd: 'var(--ox-line-2)' },
  dark: { bg: 'var(--ox-elev)', fg: 'var(--ox-fg)', bd: 'var(--ox-line)' },
  danger: { bg: 'transparent', fg: 'var(--ox-red)', bd: 'var(--ox-red-dim)' },
}

export default function Button({
  children, variant = 'primary', size = 'md', icon,
  onClick, style, full, type = 'button', disabled,
}) {
  const s = SIZES[size]
  const v = VARIANTS[variant]
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="ox-tap"
      style={{
        background: v.bg,
        color: v.fg,
        border: `1px solid ${v.bd}`,
        padding: `${s.padY}px ${s.padX}px`,
        fontFamily: 'var(--f-body)',
        fontSize: s.fs,
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: `${s.lsp}em`,
        borderRadius: 4,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        width: full ? '100%' : 'auto',
        opacity: disabled ? 0.4 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        ...style,
      }}
    >
      {icon}
      {children}
    </button>
  )
}
