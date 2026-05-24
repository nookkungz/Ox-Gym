// Screen 06 — Body measurements. Latest snapshot on a diagram + delta table + history.
import { useState } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { useLoad } from '../lib/useLoad'
import * as api from '../lib/api'
import { shortDate, daysBetween } from '../lib/thai'
import Header from '../components/Header'
import Section from '../components/Section'
import Button from '../components/Button'
import BottomNav from '../components/BottomNav'
import CheckinSheet, { MEASURE_PARTS } from '../components/CheckinSheet'
import { Loader, ErrorState, BusyOverlay, EmptyState } from '../components/Feedback'
import { useDialog } from '../components/Dialog'

const fmt = (v) => {
  const x = parseFloat(v)
  return Number.isFinite(x) ? x.toFixed(1) : '—'
}
// Parts where a larger number is progress (vs waist/hips where smaller is progress).
const GROWS = { arm: true, chest: true, waist: false, hips: false, leg: true }

export default function Measurements() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dialog = useDialog()

  const { data, loading, error, reload } = useLoad(async () => {
    const [trainee, checkins] = await Promise.all([
      api.getTrainee(id),
      api.listCheckins(id),
    ])
    return { trainee, checkins }
  }, [id])

  const [sheet, setSheet] = useState(null) // { mode, checkin }
  const [busy, setBusy] = useState(false)

  if (loading) return <Loader />
  if (error) return <ErrorState message={error.message} onRetry={reload} />
  if (!data.trainee) return <Navigate to="/clients" replace />

  const { trainee, checkins } = data
  const latest = checkins[checkins.length - 1] || null
  const previous = checkins[checkins.length - 2] || null

  const saveCheckin = async (form) => {
    setBusy(true)
    try {
      if (sheet.mode === 'edit') await api.updateCheckin(sheet.checkin.id, form)
      else await api.createCheckin(id, form)
      setSheet(null)
      reload()
    } catch (e) {
      await dialog.alert('บันทึกไม่สำเร็จ: ' + e.message)
    } finally {
      setBusy(false)
    }
  }
  const removeCheckin = async (c) => {
    const ok = await dialog.confirm('ลบการเช็คอินนี้?', {
      title: 'ลบการเช็คอิน',
      confirmLabel: 'ลบ',
      danger: true,
    })
    if (!ok) return
    setBusy(true)
    try {
      await api.deleteCheckin(c.id)
      setSheet(null)
      reload()
    } catch (e) {
      await dialog.alert('ลบไม่สำเร็จ: ' + e.message)
    } finally {
      setBusy(false)
    }
  }

  const lm = latest?.measurements || {}
  const pm = previous?.measurements || {}

  // Label positions on the body diagram.
  const pins = [
    { k: 'chest', side: 'left', x: 8, y: 48 },
    { k: 'arm', side: 'left', x: 8, y: 96 },
    { k: 'waist', side: 'right', y: 104 },
    { k: 'hips', side: 'right', y: 152 },
    { k: 'leg', side: 'left', x: 8, y: 206 },
  ]
  const labelFor = (k) => MEASURE_PARTS.find((p) => p.k === k)?.label.split(' · ')[1] || k

  return (
    <div className="ox-screen">
      <Header
        onBack={() => navigate(`/client/${id}`)}
        kicker="MEASUREMENTS · สัดส่วน"
        title={trainee.name}
        subtitle={latest ? `LATEST · ${shortDate(latest.date)}` : 'ยังไม่มีข้อมูล'}
        right={
          <Button size="sm" variant="ghost" onClick={() => setSheet({ mode: 'new' })}>
            + NEW
          </Button>
        }
      />

      <div className="ox-body ox-scroll" style={{ padding: '16px 18px 96px' }}>
        {checkins.length === 0 ? (
          <EmptyState
            icon="📏"
            title="ยังไม่มีบันทึกสัดส่วน"
            hint="บันทึกการเช็คอินครั้งแรกพร้อมรูปและสัดส่วนร่างกาย"
            action={
              <Button size="sm" onClick={() => setSheet({ mode: 'new' })}>
                + บันทึกความคืบหน้า
              </Button>
            }
          />
        ) : (
          <>
            {/* Body diagram */}
            <div
              style={{
                position: 'relative',
                background: 'var(--ox-surface)',
                border: '1px solid var(--ox-line)',
                borderRadius: 8,
                padding: '20px 0',
                minHeight: 290,
                display: 'flex',
                justifyContent: 'center',
                marginBottom: 18,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage:
                    'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />
              <svg width="110" height="244" viewBox="0 0 110 244" style={{ position: 'relative', zIndex: 1 }}>
                <circle cx="55" cy="20" r="14" stroke="var(--ox-line-2)" strokeWidth="1.5" fill="none" />
                <line x1="55" y1="34" x2="55" y2="44" stroke="var(--ox-line-2)" strokeWidth="1.5" />
                <path d="M30 50 L80 50 L75 130 L35 130 Z" stroke="var(--ox-red)" strokeWidth="1.5" fill="rgba(239,43,45,0.05)" />
                <path d="M30 50 L18 110 L22 150" stroke="var(--ox-line-2)" strokeWidth="1.5" fill="none" />
                <path d="M80 50 L92 110 L88 150" stroke="var(--ox-line-2)" strokeWidth="1.5" fill="none" />
                <path d="M38 130 L36 200 L38 232" stroke="var(--ox-line-2)" strokeWidth="1.5" fill="none" />
                <path d="M72 130 L74 200 L72 232" stroke="var(--ox-line-2)" strokeWidth="1.5" fill="none" />
                <line x1="38" y1="100" x2="72" y2="100" stroke="var(--ox-red)" strokeWidth="1" strokeDasharray="2 2" />
              </svg>

              {pins.map((m) => (
                <div
                  key={m.k}
                  style={{
                    position: 'absolute',
                    top: m.y,
                    [m.side === 'right' ? 'right' : 'left']: m.side === 'right' ? 8 : m.x,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexDirection: m.side === 'right' ? 'row-reverse' : 'row',
                  }}
                >
                  <div
                    style={{
                      padding: '4px 8px',
                      background: 'var(--ox-bg)',
                      border: '1px solid var(--ox-red)',
                      borderRadius: 3,
                    }}
                  >
                    <div className="ox-cap" style={{ color: 'var(--ox-dim)', fontSize: 7, lineHeight: 1 }}>
                      {labelFor(m.k)}
                    </div>
                    <div
                      className="ox-mono"
                      style={{ fontSize: 13, fontWeight: 700, color: 'var(--ox-red)', lineHeight: 1.15 }}
                    >
                      {fmt(lm[m.k])}
                      <span style={{ fontSize: 8, color: 'var(--ox-dim)', marginLeft: 2 }}>IN</span>
                    </div>
                  </div>
                  <div
                    style={{
                      width: m.side === 'right' ? 30 : 20,
                      height: 1,
                      background: 'var(--ox-red)',
                      opacity: 0.5,
                    }}
                  />
                </div>
              ))}

              <div
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <div className="ox-pulse" />
                <span className="ox-cap" style={{ color: 'var(--ox-active)' }}>
                  {shortDate(latest.date)}
                </span>
              </div>
            </div>

            {/* Delta table */}
            <div className="ox-card" style={{ overflow: 'hidden', marginBottom: 18 }}>
              <div
                style={{
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.02)',
                  borderBottom: '1px solid var(--ox-line)',
                  display: 'grid',
                  gridTemplateColumns: '1fr 64px 64px',
                }}
              >
                <span className="ox-cap" style={{ color: 'var(--ox-muted)' }}>
                  PART
                </span>
                <span className="ox-cap" style={{ color: 'var(--ox-muted)', textAlign: 'right' }}>
                  NOW
                </span>
                <span className="ox-cap" style={{ color: 'var(--ox-muted)', textAlign: 'right' }}>
                  {previous ? `Δ ${daysBetween(previous.date, latest.date)}วัน` : 'Δ'}
                </span>
              </div>
              {MEASURE_PARTS.map((p, i) => {
                const now = parseFloat(lm[p.k])
                const before = parseFloat(pm[p.k])
                const hasDelta = Number.isFinite(now) && Number.isFinite(before)
                const d = hasDelta ? now - before : null
                const improving = hasDelta && (GROWS[p.k] ? d > 0 : d < 0)
                return (
                  <div
                    key={p.k}
                    style={{
                      padding: '12px 14px',
                      display: 'grid',
                      gridTemplateColumns: '1fr 64px 64px',
                      alignItems: 'center',
                      borderBottom:
                        i < MEASURE_PARTS.length - 1 ? '1px solid var(--ox-line)' : 'none',
                    }}
                  >
                    <span className="ox-thai" style={{ fontSize: 13, fontWeight: 500 }}>
                      {p.label}
                    </span>
                    <span
                      className="ox-mono"
                      style={{ fontSize: 14, fontWeight: 700, textAlign: 'right' }}
                    >
                      {fmt(lm[p.k])}
                      <span style={{ fontSize: 9, color: 'var(--ox-dim)' }}>″</span>
                    </span>
                    <span
                      className="ox-mono"
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        textAlign: 'right',
                        color: !hasDelta
                          ? 'var(--ox-faint)'
                          : improving
                            ? 'var(--ox-active)'
                            : 'var(--ox-dim)',
                      }}
                    >
                      {hasDelta ? `${d > 0 ? '+' : ''}${d.toFixed(1)}` : '—'}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* History */}
            <Section title="HISTORY · ประวัติ" padded={false}>
              <div style={{ padding: '0 18px' }}>
                {[...checkins].reverse().map((c, i) => (
                  <div
                    key={c.id}
                    className="ox-tap"
                    onClick={() => setSheet({ mode: 'edit', checkin: c })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 0',
                      borderBottom: i < checkins.length - 1 ? '1px solid var(--ox-line)' : 'none',
                      opacity: i === 0 ? 1 : 0.75,
                    }}
                  >
                    <span
                      className="ox-mono"
                      style={{
                        fontSize: 10,
                        color: i === 0 ? 'var(--ox-red)' : 'var(--ox-dim)',
                        fontWeight: 700,
                        width: 66,
                        flexShrink: 0,
                      }}
                    >
                      {shortDate(c.date)}
                    </span>
                    <div style={{ flex: 1, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {MEASURE_PARTS.map((p) => (
                        <span
                          key={p.k}
                          className="ox-mono"
                          style={{
                            fontSize: 10,
                            color: 'var(--ox-muted)',
                            padding: '2px 5px',
                            background: 'var(--ox-elev)',
                            borderRadius: 2,
                          }}
                        >
                          {fmt(c.measurements?.[p.k])}
                        </span>
                      ))}
                    </div>
                    <span style={{ color: 'var(--ox-dim)' }}>›</span>
                  </div>
                ))}
              </div>
            </Section>
          </>
        )}
      </div>

      <BottomNav active="progress" clientId={id} />

      {sheet && (
        <CheckinSheet
          mode={sheet.mode}
          checkin={sheet.checkin}
          onClose={() => setSheet(null)}
          onSave={saveCheckin}
          onDelete={removeCheckin}
        />
      )}
      {busy && <BusyOverlay />}
    </div>
  )
}
