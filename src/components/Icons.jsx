// Shared inline SVG icons. Stroke uses currentColor so callers control colour.

export const IconSearch = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5" />
    <path d="M9 9l3 3" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

export const IconPlus = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" />
  </svg>
)

export const IconTrash = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path
      d="M3 4.5h10M6.5 4.5V3h3v1.5M4.6 4.5l.6 9h5.6l.6-9"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const IconEdit = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path
      d="M10.4 2.6l3 3L6 13H3v-3z"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
  </svg>
)

export const IconDownload = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <path d="M7 2v8M3 7l4 4 4-4M2 12h10" stroke="currentColor" strokeWidth="1.6" />
  </svg>
)

export const IconSliders = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M3 6h10M3 10h10" stroke="currentColor" strokeWidth="1.5" />
    <path d="M5 3v2M11 3v2" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

export const IconCamera = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <path d="M2 6h3l1.5-2h5L14 6h2v9H2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <circle cx="9" cy="10" r="3" stroke="currentColor" strokeWidth="1.4" />
  </svg>
)
