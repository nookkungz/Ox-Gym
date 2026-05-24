// Create / edit a progress check-in — date + photo + body measurements.
// Shared by the Measurements and Photo Gallery screens.
import { useState } from 'react'
import { Sheet } from './Modal'
import { Field } from './Field'
import Button from './Button'
import { compressImage } from '../lib/image'
import { todayISO } from '../lib/thai'

export const MEASURE_PARTS = [
  { k: 'arm', label: 'แขน · ARM' },
  { k: 'chest', label: 'อก · CHEST' },
  { k: 'waist', label: 'เอว · WAIST' },
  { k: 'hips', label: 'สะโพก · HIPS' },
  { k: 'leg', label: 'ขา · LEG' },
]

export default function CheckinSheet({ mode, checkin, onClose, onSave, onDelete }) {
  const [date, setDate] = useState(checkin?.date || todayISO())
  const [photo, setPhoto] = useState(checkin?.photo || '')
  const [m, setM] = useState(() => {
    const src = checkin?.measurements || {}
    const o = {}
    MEASURE_PARTS.forEach((p) => {
      o[p.k] = src[p.k] ?? ''
    })
    return o
  })
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoError, setPhotoError] = useState('')

  const onPick = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhotoBusy(true)
    setPhotoError('')
    try {
      setPhoto(await compressImage(file))
    } catch (err) {
      setPhotoError(err.message)
    } finally {
      setPhotoBusy(false)
    }
  }

  const submit = (e) => {
    e.preventDefault()
    if (!date) return
    const measurements = {}
    MEASURE_PARTS.forEach((p) => {
      const v = parseFloat(m[p.k])
      measurements[p.k] = Number.isFinite(v) ? v : null
    })
    onSave({ date, photo: photo || '', measurements })
  }

  return (
    <Sheet
      open
      title={mode === 'edit' ? 'แก้ไขการเช็คอิน' : 'บันทึกความคืบหน้า'}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <Field label="วันที่">
          <input
            type="date"
            className="ox-field"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ colorScheme: 'dark' }}
          />
        </Field>

        <Field label="รูปภาพ (ไม่บังคับ)">
          {photo ? (
            <div style={{ position: 'relative' }}>
              <img
                src={photo}
                alt="progress"
                style={{
                  width: '100%',
                  maxHeight: 280,
                  objectFit: 'cover',
                  borderRadius: 6,
                  display: 'block',
                  border: '1px solid var(--ox-line)',
                }}
              />
              <button
                type="button"
                onClick={() => setPhoto('')}
                className="ox-tap"
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  border: 'none',
                  background: 'var(--ox-red)',
                  color: '#fff',
                  padding: '5px 10px',
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                }}
              >
                ลบรูป
              </button>
            </div>
          ) : (
            <label
              className="ox-tap"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px 14px',
                border: '1px dashed var(--ox-line-2)',
                borderRadius: 6,
                color: 'var(--ox-muted)',
                fontSize: 13,
              }}
            >
              {photoBusy ? 'กำลังประมวลผลรูป...' : '＋ เลือกรูปภาพ'}
              <input
                type="file"
                accept="image/*"
                onChange={onPick}
                style={{ display: 'none' }}
              />
            </label>
          )}
          {photoError && (
            <div style={{ color: 'var(--ox-red)', fontSize: 11, marginTop: 4 }}>
              {photoError}
            </div>
          )}
        </Field>

        <div
          className="ox-cap"
          style={{ color: 'var(--ox-muted)', marginBottom: 8, marginTop: 4 }}
        >
          สัดส่วนร่างกาย · นิ้ว (ไม่บังคับ)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {MEASURE_PARTS.map((p) => (
            <Field key={p.k} label={p.label} style={{ marginBottom: 10 }}>
              <input
                className="ox-field ox-mono"
                value={m[p.k]}
                onChange={(e) => setM((s) => ({ ...s, [p.k]: e.target.value }))}
                inputMode="decimal"
                placeholder="—"
              />
            </Field>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {mode === 'edit' && (
            <Button type="button" variant="danger" onClick={() => onDelete(checkin)}>
              ลบ
            </Button>
          )}
          <Button type="submit" variant="primary" full disabled={!date || photoBusy}>
            {mode === 'edit' ? 'บันทึก' : 'บันทึกการเช็คอิน'}
          </Button>
        </div>
      </form>
    </Sheet>
  )
}
