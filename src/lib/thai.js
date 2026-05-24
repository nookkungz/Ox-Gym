// Thai localization — Buddhist calendar (CE + 543), month & day names.
// Convention: Thai-language labels use the BE year; English labels use CE.

export const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
]
export const THAI_MONTHS_ABBR = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
]
export const THAI_DOWS = ['อา', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.']
export const THAI_DOWS_FULL = [
  'วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ',
  'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์',
]
export const EN_DOWS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
export const EN_MONTHS = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
]

export const beYear = (y) => y + 543

// ── ISO date <-> Date (local time, no timezone drift) ──────────
export function toISO(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
export function parseISO(iso) {
  const [y, m, d] = (iso || '').split('-').map(Number)
  return new Date(y || 1970, (m || 1) - 1, d || 1)
}
export const todayISO = () => toISO(new Date())

// ── Formatters ─────────────────────────────────────────────────
// "20 พ.ค. 2569"
export function thaiDate(iso) {
  if (!iso) return ''
  const d = parseISO(iso)
  return `${d.getDate()} ${THAI_MONTHS_ABBR[d.getMonth()]} ${beYear(d.getFullYear())}`
}
// "วันพุธ 20 พฤษภาคม 2569"
export function thaiDateFull(iso) {
  if (!iso) return ''
  const d = parseISO(iso)
  return `${THAI_DOWS_FULL[d.getDay()]} ${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${beYear(d.getFullYear())}`
}
// "MON · MAY 20"
export function enDateLabel(iso) {
  if (!iso) return ''
  const d = parseISO(iso)
  return `${EN_DOWS[d.getDay()]} · ${EN_MONTHS[d.getMonth()]} ${d.getDate()}`
}
// "20 MAY 26" — English short date, CE 2-digit year
export function shortDate(iso) {
  if (!iso) return ''
  const d = parseISO(iso)
  return `${String(d.getDate()).padStart(2, '0')} ${EN_MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`
}
// Buddhist filename-safe stamp — "25-05-2569"
export function beStamp(iso) {
  const d = parseISO(iso || todayISO())
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${beYear(d.getFullYear())}`
}

// "TODAY" / "YESTERDAY" / "3D AGO" / "2W AGO" / "4MO AGO"
export function relativeLabel(iso) {
  if (!iso) return '—'
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const d = parseISO(iso); d.setHours(0, 0, 0, 0)
  const days = Math.round((today - d) / 86400000)
  if (days <= 0) return 'TODAY'
  if (days === 1) return 'YESTERDAY'
  if (days < 7) return `${days}D AGO`
  if (days < 56) return `${Math.floor(days / 7)}W AGO`
  return `${Math.floor(days / 30)}MO AGO`
}

// Days between two ISO dates (b - a), used for "X WEEKS" transformation spans.
export function daysBetween(a, b) {
  return Math.round((parseISO(b) - parseISO(a)) / 86400000)
}
