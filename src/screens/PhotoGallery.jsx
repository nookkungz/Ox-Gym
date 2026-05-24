// Screen 07 — Progress photo gallery / carousel.
import { useState } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { useLoad } from '../lib/useLoad'
import * as api from '../lib/api'
import { shortDate, daysBetween } from '../lib/thai'
import Header from '../components/Header'
import Button from '../components/Button'
import BottomNav from '../components/BottomNav'
import CheckinSheet from '../components/CheckinSheet'
import { Loader, ErrorState, BusyOverlay, EmptyState } from '../components/Feedback'
import { useDialog } from '../components/Dialog'
import { IconSliders, IconDownload, IconEdit } from '../components/Icons'

const OVERLAY_PARTS = [
  { k: 'chest', label: 'CHEST', top: '22%' },
  { k: 'waist', label: 'WAIST', top: '40%' },
  { k: 'hips', label: 'HIPS', top: '58%' },
]

export default function PhotoGallery() {
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

  const [idx, setIdx] = useState(999) // large = newest after clamp
  const [sheet, setSheet] = useState(null)
  const [busy, setBusy] = useState(false)

  if (loading) return <Loader />
  if (error) return <ErrorState message={error.message} onRetry={reload} />
  if (!data.trainee) return <Navigate to="/clients" replace />

  const { trainee, checkins } = data
  const photos = checkins.filter((c) => c.photo) // ascending by date
  const safeIdx = Math.min(Math.max(0, idx), Math.max(0, photos.length - 1))
  const cur = photos[safeIdx]

  const weekOf = (c) => Math.floor(daysBetween(photos[0].date, c.date) / 7)
  const weekLabel = (c, i) => {
    const w = `WEEK ${String(weekOf(c)).padStart(2, '0')}`
    if (i === 0) return `${w} · START`
    if (i === photos.length - 1) return `${w} · NOW`
    return w
  }

  const saveCheckin = async (form) => {
    setBusy(true)
    try {
      if (sheet.mode === 'edit') await api.updateCheckin(sheet.checkin.id, form)
      else await api.createCheckin(id, form)
      setSheet(null)
      setIdx(999)
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

  return (
    <div className="ox-screen">
      <Header
        onBack={() => navigate(`/client/${id}`)}
        kicker="GALLERY · ภาพร่างกาย"
        title={trainee.name}
        subtitle={`${photos.length} PROGRESS PHOTOS`}
        right={
          <button
            className="ox-tap"
            onClick={() => navigate(`/client/${id}/measurements`)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 4,
              border: '1px solid var(--ox-line)',
              background: 'transparent',
              color: 'var(--ox-fg-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="View measurements"
          >
            <IconSliders size={16} />
          </button>
        }
      />

      {photos.length === 0 ? (
        <div className="ox-body">
          <EmptyState
            icon="📸"
            title="ยังไม่มีรูปความคืบหน้า"
            hint="อัปโหลดรูปแรกเพื่อเริ่มติดตามการเปลี่ยนแปลง"
            action={
              <Button size="sm" onClick={() => setSheet({ mode: 'new' })}>
                + อัปโหลดรูป
              </Button>
            }
          />
        </div>
      ) : (
        <div className="ox-body ox-scroll">
          {/* Main photo */}
          <div style={{ padding: '14px 18px 0' }}>
            <div
              style={{
                width: '100%',
                aspectRatio: '4/5',
                borderRadius: 6,
                border: '1px solid var(--ox-line)',
                position: 'relative',
                overflow: 'hidden',
                background: '#111',
              }}
            >
              <img
                src={cur.photo}
                alt="progress"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />

              {/* date / week badge */}
              <div
                style={{
                  position: 'absolute',
                  top: 12,
                  left: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div
                  className="ox-cap"
                  style={{
                    background: 'var(--ox-red)',
                    color: '#fff',
                    padding: '4px 8px',
                    letterSpacing: '0.16em',
                    width: 'fit-content',
                  }}
                >
                  {weekLabel(cur, safeIdx)}
                </div>
                <div
                  className="ox-mono"
                  style={{
                    background: 'rgba(0,0,0,0.72)',
                    padding: '3px 8px',
                    fontSize: 10,
                    color: '#fff',
                    width: 'fit-content',
                  }}
                >
                  {shortDate(cur.date)}
                </div>
              </div>

              {/* edit affordance */}
              <button
                className="ox-tap"
                onClick={() => setSheet({ mode: 'edit', checkin: cur })}
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  width: 30,
                  height: 30,
                  borderRadius: 4,
                  border: 'none',
                  background: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Edit check-in"
              >
                <IconEdit size={14} />
              </button>

              {/* measurement overlay pins */}
              {OVERLAY_PARTS.map((p) => {
                const v = cur.measurements?.[p.k]
                if (v == null || v === '') return null
                return (
                  <div
                    key={p.k}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: `calc(${p.top} - 10px)`,
                      padding: '2px 6px',
                      background: 'var(--ox-bg)',
                      border: '1px solid var(--ox-red)',
                    }}
                  >
                    <span
                      className="ox-mono"
                      style={{ fontSize: 10, color: 'var(--ox-red)', fontWeight: 700 }}
                    >
                      {p.label} {Number(v).toFixed(1)}″
                    </span>
                  </div>
                )
              })}
            </div>

            {/* dots */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 14 }}>
              {photos.map((_, i) => (
                <div
                  key={i}
                  onClick={() => setIdx(i)}
                  style={{
                    width: i === safeIdx ? 18 : 6,
                    height: 6,
                    borderRadius: 3,
                    background: i === safeIdx ? 'var(--ox-red)' : 'var(--ox-elev-2)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                />
              ))}
            </div>
          </div>

          {/* thumbnail strip */}
          <div
            className="ox-scroll"
            style={{ display: 'flex', gap: 8, padding: '16px 18px', overflow: 'auto' }}
          >
            {photos.map((p, i) => (
              <div
                key={p.id}
                onClick={() => setIdx(i)}
                className="ox-tap"
                style={{ flexShrink: 0, width: 64 }}
              >
                <div
                  style={{
                    width: 64,
                    height: 80,
                    borderRadius: 3,
                    overflow: 'hidden',
                    border: i === safeIdx ? '2px solid var(--ox-red)' : '1px solid var(--ox-line)',
                  }}
                >
                  <img
                    src={p.photo}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div
                  className="ox-mono"
                  style={{
                    fontSize: 8,
                    color: i === safeIdx ? 'var(--ox-red)' : 'var(--ox-dim)',
                    fontWeight: 700,
                    marginTop: 4,
                    textAlign: 'center',
                  }}
                >
                  W{String(weekOf(p)).padStart(2, '0')}
                </div>
              </div>
            ))}
          </div>

          {/* actions */}
          <div style={{ padding: '0 18px 18px', display: 'flex', gap: 8 }}>
            <Button
              variant="primary"
              full
              disabled={photos.length < 2}
              icon={<IconDownload size={14} />}
              onClick={() => navigate(`/client/${id}/before-after`)}
            >
              EXPORT B/A
            </Button>
            <Button variant="ghost" full onClick={() => setSheet({ mode: 'new' })}>
              UPLOAD
            </Button>
          </div>
        </div>
      )}

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
