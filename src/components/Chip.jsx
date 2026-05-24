export default function Chip({ children, color = 'var(--ox-muted)', bg = 'var(--ox-elev-2)', style }) {
  return (
    <span className="ox-chip" style={{ background: bg, color, ...style }}>
      {children}
    </span>
  )
}
