// Create / edit form for a trainee — used by ClientList and ClientProfile.
import { useState, useRef } from 'react'
import { Sheet } from './Modal'
import { Field } from './Field'
import Button from './Button'
import Avatar from './Avatar'
import { IconCamera } from './Icons'
import { compressImage } from '../lib/image'

export default function TraineeSheet({ mode, trainee, onClose, onSave, onDelete }) {
  const [f, setF] = useState({
    name: trainee?.name || '',
    romanized: trainee?.romanized || '',
    age: trainee?.age || '',
    weight: trainee?.weight || '',
    height: trainee?.height || '',
    phone: trainee?.phone || '',
    goal: trainee?.goal || '',
    status: trainee?.status || 'active',
  })
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))

  const [photo, setPhoto] = useState(trainee?.photo || null)
  const [photoLoading, setPhotoLoading] = useState(false)
  const fileRef = useRef()

  const pickPhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoLoading(true)
    try {
      // 400 px wide is plenty for a profile avatar; 82% quality keeps file size small
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
    if (!f.name.trim()) return
    onSave({
      name: f.name.trim(),
      romanized: f.romanized.trim(),
      age: f.age.trim(),
      weight: f.weight.trim(),
      height: f.height.trim(),
      phone: f.phone.trim(),
      goal: f.goal.trim(),
      status: f.status,
      photo: photo || null,
    })
  }

  return (
    <Sheet
      open
      title={mode === 'edit' ? 'แก้ไขข้อมูลลูกเทรน' : 'เพิ่มลูกเทรนใหม่'}
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
            <Avatar name={f.name || '?'} romanized={f.romanized} photo={photo} size={72} />
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

        <Field label="ชื่อ-สกุล *">
          <input
            className="ox-field"
            value={f.name}
            onChange={set('name')}
            placeholder="ชื่อลูกเทรน"
            autoFocus
          />
        </Field>
        <Field label="ชื่ออังกฤษ (ไม่บังคับ)" hint="ใช้สร้างตัวอักษรย่อบนไอคอน">
          <input
            className="ox-field"
            value={f.romanized}
            onChange={set('romanized')}
            placeholder="ROMANIZED NAME"
          />
        </Field>
        <div style={{ display: 'flex', gap: 10 }}>
          <Field label="อายุ" style={{ flex: 1 }}>
            <input
              className="ox-field"
              value={f.age}
              onChange={set('age')}
              inputMode="numeric"
              placeholder="—"
            />
          </Field>
          <Field label="เบอร์โทร" style={{ flex: 1.7 }}>
            <input
              className="ox-field"
              value={f.phone}
              onChange={set('phone')}
              inputMode="tel"
              placeholder="08x-xxx-xxxx"
            />
          </Field>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Field label="น้ำหนัก (กก.)" style={{ flex: 1 }}>
            <input
              className="ox-field"
              value={f.weight}
              onChange={set('weight')}
              inputMode="decimal"
              placeholder="—"
            />
          </Field>
          <Field label="ส่วนสูง (ซม.)" style={{ flex: 1 }}>
            <input
              className="ox-field"
              value={f.height}
              onChange={set('height')}
              inputMode="decimal"
              placeholder="—"
            />
          </Field>
        </div>
        <Field label="เป้าหมายการฝึก">
          <textarea
            className="ox-field"
            value={f.goal}
            onChange={set('goal')}
            rows={3}
            placeholder="เช่น ลดไขมัน เพิ่มกล้ามเนื้อ"
            style={{ resize: 'vertical' }}
          />
        </Field>
        {mode === 'edit' && (
          <Field label="สถานะ">
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { v: 'active', label: 'กำลังเทรน' },
                { v: 'paused', label: 'พักการเทรน' },
              ].map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => setF((v) => ({ ...v, status: o.v }))}
                  className="ox-tap"
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 6,
                    border: `1px solid ${f.status === o.v ? 'var(--ox-red)' : 'var(--ox-line)'}`,
                    background: f.status === o.v ? 'var(--ox-elev)' : 'transparent',
                    color: f.status === o.v ? 'var(--ox-fg)' : 'var(--ox-dim)',
                  }}
                >
                  <span className="ox-cap" style={{ color: 'inherit' }}>
                    {o.label}
                  </span>
                </button>
              ))}
            </div>
          </Field>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          {mode === 'edit' && (
            <Button type="button" variant="danger" onClick={() => onDelete(trainee)}>
              ลบ
            </Button>
          )}
          <Button type="submit" variant="primary" full disabled={!f.name.trim() || photoLoading}>
            {mode === 'edit' ? 'บันทึก' : 'เพิ่มลูกเทรน'}
          </Button>
        </div>
      </form>
    </Sheet>
  )
}
