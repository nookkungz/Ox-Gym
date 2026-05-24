// Screen 08 — Before / after comparison export.
import { useState } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { useLoad } from '../lib/useLoad'
import * as api from '../lib/api'
import { shortDate, daysBetween, beStamp } from '../lib/thai'
import { buildComparison } from '../lib/export'
import { downloadDataUrl } from '../lib/image'
import Header from '../components/Header'
import Button from '../components/Button'
import { Logo } from '../components/Logo'
import { Loader, ErrorState, BusyOverlay, EmptyState } from '../components/Feedback'
import { useDialog } from '../components/Dialog'

const fmt = (v) => {
  const x = parseFloat(v)
  return Number.isFinite(x) ? x.toFixed(1) : '—'
}
const delta = (b, a, k) => {
  const bv = parseFloat(b?.measurements?.[k])
  const av = parseFloat(a?.measurements?.[k])
  if (!Number.isFinite(av) || !Number.isFinite(bv)) return null
  return av - bv
}

const MODES = [
  {
    id: 'full',
    label: 'FULL OVERLAY',
    fmt: 'PNG',
    desc: 'รูป + สัดส่วน + สถิติ + ลายน้ำ + กรอบ',
  },
  {
    id: 'clean',
    label: 'CLEAN FRAME',
    fmt: 'JPEG',
    desc: 'รูปภาพ + ลายน้ำ + กรอบ',
  },
  {
    id: 'simple',
    label: 'SIMPLE OVERLAY',
    fmt: 'JPEG',
    desc: 'รูปภาพเคียงข้าง + ป้ายกำกับ & วันที่ (ไม่มีกรอบ)',
  },
  {
    id: 'blank',
    label: 'COMPLETELY BLANK',
    fmt: 'JPEG',
    desc: 'รูปภาพเคียงข้างเท่านั้น (ไม่มีกรอบ / ไม่มีข้อความ)',
  },
]


export default function BeforeAfter() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dialog = useDialog()

  const { data, loading, error, reload } = useLoad(async () => {
    const trainee = await api.getTrainee(id)
    const [checkins, coach] = await Promise.all([
      api.listCheckins(id),
      trainee?.coachId ? api.getCoach(trainee.coachId) : Promise.resolve(null),
    ])
    return { trainee, checkins, coach }
  }, [id])

  const [mode, setMode] = useState('full')
  const [busy, setBusy] = useState(false)
  const [localSelected, setLocalSelected] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)


  if (loading) return <Loader />
  if (error) return <ErrorState message={error.message} onRetry={reload} />
  if (!data.trainee) return <Navigate to="/clients" replace />

  const { trainee, checkins, coach } = data
  const photos = checkins.filter((c) => c.photo)

  const currentSelected = localSelected || (photos.length >= 2
    ? [photos[0].id, photos[photos.length - 1].id]
    : photos.map((p) => p.id))

  const selectedPhotos = photos.filter((p) => currentSelected.includes(p.id))
  selectedPhotos.sort((a, b) => (a.date || '').localeCompare(b.date || ''))

  const before = selectedPhotos[0]
  const after = selectedPhotos[1]
  const full = mode === 'full'
  const showFrames = mode === 'full' || mode === 'clean'
  const isSimple = mode === 'simple'
  const isBlank = mode === 'blank'

  const weeks = before && after
    ? Math.max(1, Math.round(daysBetween(before.date, after.date) / 7))
    : 0


  const handleToggle = (id) => {
    if (currentSelected.includes(id)) {
      setLocalSelected(currentSelected.filter((x) => x !== id))
    } else {
      if (currentSelected.length >= 2) {
        setLocalSelected([currentSelected[1], id])
      } else {
        setLocalSelected([...currentSelected, id])
      }
    }
  }

  const handleGeneratePreview = async () => {
    setBusy(true)
    try {
      const url = await buildComparison({
        mode,
        before,
        after,
        traineeName: trainee.name,
        coachName: coach?.name || 'COACH',
      })
      setPreviewUrl(url)
    } catch (e) {
      await dialog.alert(
        'ส่งออกรูปไม่สำเร็จ: ' + e.message,
        { title: 'ส่งออกล้มเหลว' },
      )
    } finally {
      setBusy(false)
    }
  }

  const handleDownload = () => {
    if (!previewUrl) return
    downloadDataUrl(previewUrl, `oxgym-before-after-${beStamp(after.date)}.${full ? 'png' : 'jpg'}`)
  }


  const statItems = [
    { lab: 'CHEST', d: delta(before, after, 'chest'), unit: '″' },
    { lab: 'WAIST', d: delta(before, after, 'waist'), unit: '″' },
    { lab: 'HIPS', d: delta(before, after, 'hips'), unit: '″' },
  ]

  return (
    <div className="ox-screen">
      <Header
        onBack={() => navigate(`/client/${id}/photos`)}
        kicker="BEFORE / AFTER · เปรียบเทียบ"
        title="ส่งออกการเปรียบเทียบ"
        subtitle={
          before && after ? `${shortDate(before.date)} → ${shortDate(after.date)} · ${weeks} WEEKS` : ''
        }
      />

      {photos.length < 2 ? (
        <div className="ox-body">
          <EmptyState
            icon="🖼️"
            title="ต้องมีรูปอย่างน้อย 2 รูป"
            hint="อัปโหลดรูปความคืบหน้าเพิ่มเพื่อสร้างภาพเปรียบเทียบ"
            action={
              <Button size="sm" variant="ghost" onClick={() => navigate(`/client/${id}/photos`)}>
                กลับไปหน้าแกลเลอรี
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <div className="ox-body ox-scroll" style={{ padding: '16px 18px 110px' }}>
            {/* Preview card */}
            <div
              style={{
                background: '#0a0a0a',
                border: '1px solid var(--ox-line)',
                borderRadius: 4,
                padding: showFrames ? 12 : 0,
                marginBottom: 18,
                overflow: 'hidden',
              }}
            >
              {showFrames && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: 8,
                    marginBottom: 8,
                    borderBottom: '1px solid var(--ox-line)',
                  }}
                >
                  <Logo height={14} />
                  <span className="ox-cap" style={{ color: 'var(--ox-dim)', fontSize: 7 }}>
                    {weeks} WEEK TRANSFORMATION
                  </span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: showFrames ? 6 : 0 }}>
                {[
                  { c: before, label: 'BEFORE', hot: false },
                  { c: after, label: 'AFTER', hot: true },
                ].map((p) => {
                  if (!p.c) {
                    return (
                      <div
                        key={p.label}
                        style={{
                          width: '100%',
                          aspectRatio: '3/4',
                          borderRadius: 2,
                          border: '1px dashed var(--ox-line)',
                          background: '#111',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column',
                          gap: 8,
                        }}
                      >
                        <span className="ox-cap" style={{ fontSize: 10, color: 'var(--ox-dim)' }}>
                          {p.label}
                        </span>
                        <span className="ox-thai" style={{ fontSize: 11, color: 'var(--ox-dim)' }}>
                          เลือกรูปภาพ
                        </span>
                      </div>
                    )
                  }
                  return (
                    <div key={p.label} style={{ position: 'relative' }}>
                      <div
                        style={{
                          width: '100%',
                          aspectRatio: '3/4',
                          borderRadius: showFrames ? 2 : 0,
                          overflow: 'hidden',
                          border: showFrames ? `1px solid ${p.hot ? 'var(--ox-red)' : 'var(--ox-line)'}` : 'none',
                          background: '#111',
                        }}
                      >
                        <img
                          src={p.c.photo}
                          alt={p.label}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      
                      {/* Standard Frame Badges */}
                      {showFrames && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 6,
                            left: 6,
                            padding: '3px 7px',
                            background: p.hot ? 'var(--ox-red)' : 'var(--ox-bg)',
                            color: p.hot ? '#fff' : 'var(--ox-fg)',
                            border: p.hot ? 'none' : '1px solid var(--ox-line)',
                          }}
                        >
                          <span className="ox-cap" style={{ fontSize: 8, color: 'inherit' }}>
                            {p.label}
                          </span>
                        </div>
                      )}

                      {/* Simple Mode Overlay Badge */}
                      {isSimple && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 10,
                            left: 10,
                            padding: '4px 8px',
                            background: p.hot ? 'var(--ox-red)' : '#000',
                            color: '#fff',
                            fontWeight: 800,
                          }}
                        >
                          <span className="ox-cap" style={{ fontSize: 8, color: 'inherit' }}>
                            {p.label}
                          </span>
                        </div>
                      )}

                      {/* Standard Info Panel */}
                      {showFrames && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 6,
                            left: 6,
                            right: 6,
                            background: 'rgba(0,0,0,0.78)',
                            padding: '5px 6px',
                          }}
                        >
                          <div
                            className="ox-mono"
                            style={{ fontSize: 7, color: 'var(--ox-dim)', letterSpacing: 1 }}
                          >
                            {shortDate(p.c.date)}
                          </div>
                          {full && (
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginTop: 3,
                              }}
                            >
                              {['chest', 'waist', 'hips'].map((k) => (
                                <div key={k} style={{ textAlign: 'center', flex: 1 }}>
                                  <div
                                    className="ox-mono"
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 700,
                                      color: p.hot ? 'var(--ox-red)' : '#fff',
                                      lineHeight: 1,
                                    }}
                                  >
                                    {fmt(p.c.measurements?.[k])}
                                  </div>
                                  <div
                                    className="ox-cap"
                                    style={{ fontSize: 6, color: 'var(--ox-dim)' }}
                                  >
                                    {k}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Simple Mode Date Overlay */}
                      {isSimple && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 10,
                            left: 10,
                            background: 'rgba(0,0,0,0.6)',
                            padding: '4px 6px',
                          }}
                        >
                          <div
                            className="ox-mono"
                            style={{ fontSize: 7, color: '#fff', letterSpacing: 0.5 }}
                          >
                            {shortDate(p.c.date)}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {showFrames && full && (
                <div
                  style={{
                    marginTop: 10,
                    padding: '8px 6px',
                    background: 'var(--ox-surface)',
                    display: 'flex',
                    justifyContent: 'space-around',
                  }}
                >
                  {[
                    ...statItems,
                    { lab: 'DAYS', raw: before && after ? String(daysBetween(before.date, after.date)) : '—' },
                  ].map((s) => (
                    <div key={s.lab} style={{ textAlign: 'center' }}>
                      <div
                        className="ox-mono"
                        style={{ fontSize: 13, fontWeight: 700, color: 'var(--ox-red)' }}
                      >
                        {s.raw !== undefined
                          ? s.raw
                          : s.d == null
                            ? '—'
                            : `${s.d > 0 ? '+' : ''}${s.d.toFixed(1)}${s.unit}`}
                      </div>
                      <div className="ox-cap" style={{ fontSize: 7, color: 'var(--ox-dim)' }}>
                        {s.lab}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showFrames && (
                <div
                  style={{
                    marginTop: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: 'var(--ox-dim)',
                    padding: '0 4px',
                  }}
                >
                  <span className="ox-thai" style={{ fontSize: 8 }}>
                    {trainee.name}
                  </span>
                  <span className="ox-mono" style={{ fontSize: 8 }}>
                    {(coach?.name || 'COACH') + ' · OX GYM'}
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail Selection Strip */}
            <div className="ox-cap" style={{ color: 'var(--ox-muted)', marginBottom: 10 }}>
              SELECT PHOTOS TO COMPARE · เลือกรูปภาพเพื่อเปรียบเทียบ ({currentSelected.length}/2)
            </div>
            <div
              className="ox-scroll"
              style={{
                display: 'flex',
                gap: 8,
                padding: '4px 0 16px',
                overflow: 'auto',
                marginBottom: 12,
              }}
            >
              {photos.map((p) => {
                const isSelected = currentSelected.includes(p.id)
                let label = ''
                if (isSelected) {
                  if (p.id === before?.id) label = 'BEFORE'
                  else if (p.id === after?.id) label = 'AFTER'
                }

                return (
                  <div
                    key={p.id}
                    onClick={() => handleToggle(p.id)}
                    className="ox-tap"
                    style={{ flexShrink: 0, width: 68, position: 'relative' }}
                  >
                    <div
                      style={{
                        width: 68,
                        height: 86,
                        borderRadius: 4,
                        overflow: 'hidden',
                        border: isSelected
                          ? '2px solid var(--ox-red)'
                          : '1px solid var(--ox-line)',
                        position: 'relative',
                        background: '#111',
                      }}
                    >
                      <img
                        src={p.photo}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      
                      {/* Selection Overlay */}
                      {isSelected && (
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(239, 43, 45, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <div
                            style={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              width: 14,
                              height: 14,
                              borderRadius: '50%',
                              background: 'var(--ox-red)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                              <path d="M2.5 4 L3.8 5.2 L6 2.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Badge */}
                    {isSelected && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 4,
                          left: 4,
                          background: label === 'BEFORE' ? 'var(--ox-bg)' : 'var(--ox-red)',
                          border: label === 'BEFORE' ? '1px solid var(--ox-line)' : 'none',
                          color: label === 'BEFORE' ? 'var(--ox-fg)' : '#fff',
                          padding: '1px 4px',
                          borderRadius: 2,
                        }}
                      >
                        <span className="ox-cap" style={{ fontSize: 6, color: 'inherit' }}>
                          {label}
                        </span>
                      </div>
                    )}

                    <div
                      className="ox-mono"
                      style={{
                        fontSize: 8,
                        color: isSelected ? 'var(--ox-red)' : 'var(--ox-dim)',
                        fontWeight: 700,
                        marginTop: 4,
                        textAlign: 'center',
                      }}
                    >
                      {shortDate(p.date)}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Mode selector */}
            <div className="ox-cap" style={{ color: 'var(--ox-muted)', marginBottom: 10 }}>
              EXPORT MODE
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {MODES.map((m) => {
                const on = m.id === mode
                return (
                  <div
                    key={m.id}
                    className="ox-tap"
                    onClick={() => setMode(m.id)}
                    style={{
                      padding: 14,
                      background: on ? 'var(--ox-elev)' : 'var(--ox-surface)',
                      border: `1px solid ${on ? 'var(--ox-red)' : 'var(--ox-line)'}`,
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        border: `1.5px solid ${on ? 'var(--ox-red)' : 'var(--ox-line-2)'}`,
                        position: 'relative',
                        flexShrink: 0,
                      }}
                    >
                      {on && (
                        <div
                          style={{
                            position: 'absolute',
                            inset: 3,
                            borderRadius: '50%',
                            background: 'var(--ox-red)',
                          }}
                        />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          className="ox-cap"
                          style={{ fontSize: 12, letterSpacing: '0.12em' }}
                        >
                          {m.label}
                        </span>
                        <span
                          className="ox-mono"
                          style={{
                            fontSize: 9,
                            padding: '1px 5px',
                            background: 'var(--ox-elev-2)',
                            color: 'var(--ox-dim)',
                            borderRadius: 2,
                          }}
                        >
                          {m.fmt}
                        </span>
                      </div>
                      <div
                        className="ox-thai"
                        style={{ fontSize: 11, color: 'var(--ox-muted)', marginTop: 3 }}
                      >
                        {m.desc}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to top, var(--ox-bg) 62%, transparent)',
              padding: '14px 18px 18px',
            }}
          >
            <Button
              variant="primary"
              size="lg"
              full
              disabled={currentSelected.length < 2}
              onClick={handleGeneratePreview}
            >
              {currentSelected.length < 2 ? 'กรุณาเลือกรูปภาพ 2 รูปเพื่อเปรียบเทียบ' : 'ดาวน์โหลดรูปเปรียบเทียบ'}
            </Button>
          </div>
        </>
      )}

      {previewUrl && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 130,
            background: 'rgba(5, 5, 5, 0.98)',
            display: 'flex',
            flexDirection: 'column',
            animation: 'ox-fade-in 0.18s ease',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--ox-line)',
              background: 'var(--ox-bg)',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => setPreviewUrl(null)}
                className="ox-tap"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 4,
                  border: '1px solid var(--ox-line)',
                  background: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--ox-fg-2)',
                }}
                aria-label="Back"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M9 2 L4 7 L9 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" />
                </svg>
              </button>
              <div>
                <div className="ox-cap" style={{ color: 'var(--ox-red)', fontSize: 9, marginBottom: 3 }}>
                  EXPORT PREVIEW · ตัวอย่างรูปภาพ
                </div>
                <div className="ox-thai" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ox-fg)' }}>
                  พร้อมดาวน์โหลด
                </div>
              </div>
            </div>
          </div>

          {/* Preview Container */}
          <div
            className="ox-body"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px 18px',
            }}
          >
            <div
              style={{
                width: '100%',
                maxHeight: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
                border: '1px solid var(--ox-line-2)',
                borderRadius: 4,
                overflow: 'hidden',
                background: '#0e0e0e',
                animation: 'ox-rise 0.25s ease',
              }}
            >
              <img
                src={previewUrl}
                alt="Export Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                }}
              />
            </div>
          </div>

          {/* Footer with Download Button */}
          <div
            style={{
              padding: '14px 18px 24px',
              borderTop: '1px solid var(--ox-line)',
              background: 'var(--ox-bg)',
              flexShrink: 0,
            }}
          >
            <Button
              variant="primary"
              size="lg"
              full
              onClick={handleDownload}
            >
              ดาวน์โหลดรูปภาพ (DOWNLOAD)
            </Button>
          </div>
        </div>
      )}

      {busy && <BusyOverlay label="กำลังสร้างรูป..." />}
    </div>
  )
}
