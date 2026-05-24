// Screen 01 — Coach selector. Pick or manage a coaching profile.
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { useLoad } from '../lib/useLoad'
import * as api from '../lib/api'
import { Logo } from '../components/Logo'
import Avatar from '../components/Avatar'
import Button from '../components/Button'
import { Sheet } from '../components/Modal'
import { Field } from '../components/Field'
import { Loader, ErrorState, BusyOverlay } from '../components/Feedback'
import { useDialog } from '../components/Dialog'
import { IconEdit, IconCamera } from '../components/Icons'
import { compressImage } from '../lib/image'

export default function CoachSelect() {
  const navigate = useNavigate()
  const { coachId, setCoachId } = useApp()
  const dialog = useDialog()
  const { data, loading, error, reload } = useLoad(async () => {
    const [coaches, trainees] = await Promise.all([
      api.listCoaches(),
      api.listAllTrainees(),
    ])
    return { coaches, trainees }
  })
  const [sheet, setSheet] = useState(null) // null | { mode:'new' } | { mode:'edit', coach }
  const [busy, setBusy] = useState(false)

  if (loading) return <Loader />
  if (error) return <ErrorState message={error.message} onRetry={reload} />

  const { coaches, trainees } = data
  const countFor = (id) => trainees.filter((t) => t.coachId === id).length

  const enter = (c) => {
    setCoachId(c.id)
    navigate('/clients')
  }

  const saveCoach = async (form) => {
    setBusy(true)
    try {
      if (sheet.mode === 'edit') await api.updateCoach(sheet.coach.id, form)
      else await api.createCoach(form)
      setSheet(null)
      reload()
    } catch (e) {
      await dialog.alert('บันทึกไม่สำเร็จ: ' + e.message)
    } finally {
      setBusy(false)
    }
  }

  const removeCoach = async (c) => {
    const ok = await dialog.confirm(
      `ลบโปรไฟล์ "${c.name}" ?\nข้อมูลลูกเทรนของโค้ชนี้จะไม่ถูกลบ แต่จะเข้าถึงไม่ได้`,
      { title: 'ลบโปรไฟล์โค้ช', confirmLabel: 'ลบโปรไฟล์', danger: true },
    )
    if (!ok) return
    setBusy(true)
    try {
      await api.deleteCoach(c.id)
      if (coachId === c.id) setCoachId(null)
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
      <div style={{ padding: '30px 22px 24px', flexShrink: 0 }}>
        <Logo height={28} />
        <div style={{ marginTop: 26 }}>
          <div className="ox-cap" style={{ color: 'var(--ox-red)', marginBottom: 6 }}>
            SELECT PROFILE
          </div>
          <div className="ox-display" style={{ fontSize: 34, color: 'var(--ox-fg)' }}>
            WHO'S<br />COACHING<br />TODAY?
          </div>
          <div
            className="ox-thai"
            style={{ color: 'var(--ox-muted)', fontSize: 13, marginTop: 12, maxWidth: 252 }}
          >
            เลือกโปรไฟล์โค้ชเพื่อเริ่มจัดการลูกเทรน ตารางนัด และบันทึกการฝึก
          </div>
        </div>
      </div>

      <div className="ox-body ox-scroll" style={{ padding: '0 18px 18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {coaches.map((c) => {
            const isCurrent = c.id === coachId
            return (
              <div
                key={c.id}
                className="ox-tap"
                onClick={() => enter(c)}
                style={{
                  background: isCurrent ? 'var(--ox-elev)' : 'var(--ox-surface)',
                  border: `1px solid ${isCurrent ? 'var(--ox-red)' : 'var(--ox-line)'}`,
                  borderRadius: 8,
                  padding: '14px 12px',
                  minHeight: 170,
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {isCurrent && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 10,
                      left: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <div className="ox-pulse" />
                    <span className="ox-cap" style={{ color: 'var(--ox-red)', fontSize: 8 }}>
                      LAST
                    </span>
                  </div>
                )}
                <button
                  className="ox-tap"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSheet({ mode: 'edit', coach: c })
                  }}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 24,
                    height: 24,
                    borderRadius: 4,
                    border: '1px solid var(--ox-line)',
                    background: 'var(--ox-bg)',
                    color: 'var(--ox-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label="Edit coach"
                >
                  <IconEdit size={12} />
                </button>
                <Avatar
                  name={c.name}
                  romanized={c.romanized}
                  photo={c.photo || null}
                  size={72}
                  style={{ marginTop: isCurrent ? 18 : 0 }}
                />
                <div style={{ marginTop: 'auto' }}>
                  <div
                    className="ox-thai ox-trunc"
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: 'var(--ox-fg)',
                    }}
                  >
                    {c.name}
                  </div>
                  <div className="ox-cap" style={{ color: 'var(--ox-dim)', marginTop: 4 }}>
                    {countFor(c.id)} TRAINEES
                  </div>
                </div>
              </div>
            )
          })}

          <div
            className="ox-tap"
            onClick={() => setSheet({ mode: 'new' })}
            style={{
              background: 'transparent',
              border: '1px dashed var(--ox-line-2)',
              borderRadius: 8,
              minHeight: 140,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              color: 'var(--ox-dim)',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 4,
                border: '1px solid var(--ox-line-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 300,
              }}
            >
              +
            </div>
            <span className="ox-cap" style={{ fontSize: 9 }}>
              NEW COACH
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          padding: '12px 22px 18px',
          borderTop: '1px solid var(--ox-line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <span className="ox-mono" style={{ fontSize: 9, color: 'var(--ox-dim)', letterSpacing: 1 }}>
          OX GYM v1.0 · {trainees.length} TRAINEES
        </span>
        <span className="ox-mono" style={{ fontSize: 9, color: 'var(--ox-dim)' }}>
          {coaches.length} COACHES
        </span>
      </div>

      {sheet && (
        <CoachSheet
          mode={sheet.mode}
          coach={sheet.coach}
          onClose={() => setSheet(null)}
          onSave={saveCoach}
          onDelete={removeCoach}
        />
      )}
      {busy && <BusyOverlay />}
    </div>
  )
}

function CoachSheet({ mode, coach, onClose, onSave, onDelete }) {
  const [name, setName] = useState(coach?.name || '')
  const [romanized, setRomanized] = useState(coach?.romanized || '')
  const [photo, setPhoto] = useState(coach?.photo || null)
  const [photoLoading, setPhotoLoading] = useState(false)
  const fileRef = useRef()

  const pickPhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoLoading(true)
    try {
      // 400 px wide is plenty for an avatar; 82% quality keeps file size small
      const compressed = await compressImage(file, 400, 0.82)
      setPhoto(compressed)
    } catch {
      // silently ignore — user can retry
    } finally {
      setPhotoLoading(false)
      e.target.value = ''
    }
  }

  const submit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name: name.trim(), romanized: romanized.trim(), photo: photo || null })
  }

  return (
    <Sheet
      open
      title={mode === 'edit' ? 'แก้ไขโปรไฟล์โค้ช' : 'เพิ่มโปรไฟล์โค้ช'}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        {/* ── Photo picker ─────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 22 }}>
          <div
            className="ox-tap"
            onClick={() => fileRef.current?.click()}
            style={{ position: 'relative', display: 'inline-block' }}
          >
            <Avatar name={name || 'C'} romanized={romanized} photo={photo} size={72} />
            {/* camera overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 6,
                background: 'rgba(0,0,0,0.42)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                pointerEvents: 'none',
              }}
            >
              {photoLoading
                ? <span style={{ fontSize: 10, letterSpacing: 1, fontFamily: 'var(--f-mono)' }}>…</span>
                : <IconCamera size={20} />
              }
            </div>
          </div>
          <span className="ox-cap" style={{ fontSize: 9, color: 'var(--ox-dim)' }}>
            แตะเพื่อเลือกรูป
          </span>
          {photo && (
            <button
              type="button"
              className="ox-tap"
              onClick={() => setPhoto(null)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: 'var(--ox-muted)',
                fontSize: 11,
                fontFamily: 'var(--f-thai)',
                cursor: 'pointer',
              }}
            >
              ลบรูป
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={pickPhoto}
          />
        </div>

        <Field label="ชื่อโค้ช (ภาษาไทย) *">
          <input
            className="ox-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="เช่น โค้ชอั้ม"
            autoFocus
          />
        </Field>
        <Field label="ชื่อย่อ / อังกฤษ (ไม่บังคับ)" hint="ใช้สร้างตัวอักษรย่อบนไอคอน">
          <input
            className="ox-field"
            value={romanized}
            onChange={(e) => setRomanized(e.target.value)}
            placeholder="COACH AUM"
          />
        </Field>
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          {mode === 'edit' && (
            <Button type="button" variant="danger" onClick={() => onDelete(coach)}>
              ลบ
            </Button>
          )}
          <Button type="submit" variant="primary" full disabled={!name.trim() || photoLoading}>
            {mode === 'edit' ? 'บันทึก' : 'เพิ่มโปรไฟล์'}
          </Button>
        </div>
      </form>
    </Sheet>
  )
}
