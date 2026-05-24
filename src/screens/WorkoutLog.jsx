// Screen 04 — Workout logger. Multi-set logging: a session holds exercises,
// each weight exercise holds an array of sets.
import { useState, useRef } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { useLoad } from '../lib/useLoad'
import * as api from '../lib/api'
import { todayISO, thaiDate } from '../lib/thai'
import Header from '../components/Header'
import Button from '../components/Button'
import { Field } from '../components/Field'
import { Loader, ErrorState, BusyOverlay } from '../components/Feedback'
import { useDialog } from '../components/Dialog'

const WEIGHT_SUGGESTIONS = [
  'ม้านั่งดันบาร์เบล', 'สควอท', 'เดดลิฟท์', 'โอเวอร์เฮดเพรส',
  'พูลอัพ', 'ดัมเบลโรว์', 'ขาดันแมชชีน', 'ลันจ์',
]
const CARDIO_SUGGESTIONS = ['ลู่วิ่ง', 'ปั่นจักรยาน', 'เครื่องเดินวงรี', 'กระโดดเชือก']

const num = (v) => {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

export default function WorkoutLog() {
  const { id, workoutId } = useParams()
  const navigate = useNavigate()

  const { data, loading, error, reload } = useLoad(async () => {
    const [trainee, workout] = await Promise.all([
      api.getTrainee(id),
      workoutId ? api.getWorkout(workoutId) : Promise.resolve(null),
    ])
    return { trainee, workout }
  }, [id, workoutId])

  if (loading) return <Loader />
  if (error) return <ErrorState message={error.message} onRetry={reload} />
  if (!data.trainee) return <Navigate to="/clients" replace />
  if (workoutId && !data.workout) return <Navigate to={`/client/${id}/history`} replace />

  return <WorkoutForm traineeId={id} trainee={data.trainee} workout={data.workout} />
}

function WorkoutForm({ traineeId, trainee, workout }) {
  const navigate = useNavigate()
  const dialog = useDialog()
  const uidRef = useRef(0)
  const uid = () => `e${uidRef.current++}`

  const seed = () => {
    if (workout) {
      return (workout.exercises || []).map((e) => ({
        _id: uid(),
        name: e.name || '',
        type: e.type || 'weight',
        sets: (e.sets || []).map((s) => ({
          reps: s.reps ?? '',
          weight: s.weight ?? '',
        })),
        duration: e.duration ?? '',
      }))
    }
    // New session starts with one blank weight exercise.
    return [{ _id: uid(), name: '', type: 'weight', sets: [{ reps: '', weight: '' }], duration: '' }]
  }

  const [date, setDate] = useState(workout?.date || todayISO())
  const [note, setNote] = useState(workout?.note || '')
  const [exercises, setExercises] = useState(seed)
  const [busy, setBusy] = useState(false)

  const isEdit = !!workout

  const patchExercise = (eid, patch) =>
    setExercises((xs) => xs.map((e) => (e._id === eid ? { ...e, ...patch } : e)))

  const addExercise = (type) =>
    setExercises((xs) => [
      ...xs,
      {
        _id: uid(),
        name: '',
        type,
        sets: type === 'weight' ? [{ reps: '', weight: '' }] : [],
        duration: '',
      },
    ])

  const removeExercise = (eid) =>
    setExercises((xs) => xs.filter((e) => e._id !== eid))

  const addSet = (eid) =>
    setExercises((xs) =>
      xs.map((e) =>
        e._id === eid ? { ...e, sets: [...e.sets, { reps: '', weight: '' }] } : e,
      ),
    )

  const removeSet = (eid, idx) =>
    setExercises((xs) =>
      xs.map((e) =>
        e._id === eid ? { ...e, sets: e.sets.filter((_, i) => i !== idx) } : e,
      ),
    )

  const updateSet = (eid, idx, field, value) =>
    setExercises((xs) =>
      xs.map((e) =>
        e._id === eid
          ? { ...e, sets: e.sets.map((s, i) => (i === idx ? { ...s, [field]: value } : s)) }
          : e,
      ),
    )

  const stepDuration = (eid, delta) =>
    setExercises((xs) =>
      xs.map((e) =>
        e._id === eid
          ? { ...e, duration: String(Math.max(0, num(e.duration) + delta)) }
          : e,
      ),
    )

  const save = async () => {
    if (!date) {
      await dialog.alert('กรุณาเลือกวันที่')
      return
    }
    if (exercises.length === 0) {
      await dialog.alert('กรุณาเพิ่มท่าฝึกอย่างน้อย 1 ท่า')
      return
    }
    if (exercises.some((e) => !e.name.trim())) {
      await dialog.alert('กรุณาตั้งชื่อท่าฝึกให้ครบทุกท่า')
      return
    }

    const payload = {
      date,
      note: note.trim(),
      exercises: exercises.map((e) =>
        e.type === 'weight'
          ? {
              name: e.name.trim(),
              type: 'weight',
              sets: e.sets
                .filter((s) => String(s.reps).trim() !== '' || String(s.weight).trim() !== '')
                .map((s) => ({ reps: num(s.reps), weight: num(s.weight) })),
            }
          : {
              name: e.name.trim(),
              type: 'cardio',
              duration: num(e.duration),
            },
      ),
    }

    setBusy(true)
    try {
      if (isEdit) await api.updateWorkout(workout.id, payload)
      else await api.createWorkout(traineeId, payload)
      await api.syncTraineeStats(traineeId)
      navigate(`/client/${traineeId}/history`, { replace: true })
    } catch (e) {
      await dialog.alert('บันทึกไม่สำเร็จ: ' + e.message)
      setBusy(false)
    }
  }

  const remove = async () => {
    const ok = await dialog.confirm('ลบบันทึกการเทรนนี้?', {
      title: 'ลบเซสชัน',
      confirmLabel: 'ลบ',
      danger: true,
    })
    if (!ok) return
    setBusy(true)
    try {
      await api.deleteWorkout(workout.id)
      await api.syncTraineeStats(traineeId)
      navigate(`/client/${traineeId}/history`, { replace: true })
    } catch (e) {
      await dialog.alert('ลบไม่สำเร็จ: ' + e.message)
      setBusy(false)
    }
  }

  return (
    <div className="ox-screen">
      <Header
        onBack={() => navigate(-1)}
        kicker={isEdit ? 'EDIT SESSION' : 'NEW SESSION'}
        title="บันทึกการเทรน"
        subtitle={`${trainee.name} · ${thaiDate(date)}`}
        right={
          isEdit && (
            <Button size="sm" variant="danger" onClick={remove}>
              ลบ
            </Button>
          )
        }
      />

      <datalist id="ox-weight-ex">
        {WEIGHT_SUGGESTIONS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <datalist id="ox-cardio-ex">
        {CARDIO_SUGGESTIONS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      <div className="ox-body ox-scroll" style={{ padding: '16px 18px 110px' }}>
        <Field label="วันที่ฝึก">
          <input
            type="date"
            className="ox-field"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ colorScheme: 'dark' }}
          />
        </Field>

        {exercises.map((e, i) => (
          <ExerciseCard
            key={e._id}
            index={i + 1}
            exercise={e}
            onName={(name) => patchExercise(e._id, { name })}
            onRemove={() => removeExercise(e._id)}
            onAddSet={() => addSet(e._id)}
            onRemoveSet={(idx) => removeSet(e._id, idx)}
            onUpdateSet={(idx, f, v) => updateSet(e._id, idx, f, v)}
            onDuration={(v) => patchExercise(e._id, { duration: v })}
            onStep={(d) => stepDuration(e._id, d)}
          />
        ))}

        {/* Add exercise */}
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <div
            className="ox-tap"
            onClick={() => addExercise('weight')}
            style={{
              flex: 1,
              padding: 14,
              border: '1px dashed var(--ox-red-dim)',
              borderRadius: 6,
              color: 'var(--ox-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 16 }}>＋</span>
            <span className="ox-cap" style={{ color: 'inherit' }}>
              WEIGHT
            </span>
          </div>
          <div
            className="ox-tap"
            onClick={() => addExercise('cardio')}
            style={{
              flex: 1,
              padding: 14,
              border: '1px dashed rgba(46,159,255,0.4)',
              borderRadius: 6,
              color: 'var(--ox-cardio)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 16 }}>＋</span>
            <span className="ox-cap" style={{ color: 'inherit' }}>
              CARDIO
            </span>
          </div>
        </div>

        {/* Coach notes */}
        <div style={{ marginTop: 18 }}>
          <div className="ox-cap" style={{ color: 'var(--ox-muted)', marginBottom: 8 }}>
            COACH NOTES · บันทึกของโค้ช
          </div>
          <textarea
            className="ox-field"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="เช่น ฟอร์มดีขึ้น ระวังข้อเข่า สัปดาห์หน้าเพิ่มน้ำหนัก"
            style={{ resize: 'vertical' }}
          />
        </div>
      </div>

      {/* Sticky save bar */}
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
        <Button variant="primary" size="lg" full onClick={save}>
          {isEdit ? 'บันทึกการแก้ไข' : 'บันทึกเซสชัน'}
        </Button>
      </div>

      {busy && <BusyOverlay />}
    </div>
  )
}

function ExerciseCard({
  index, exercise, onName, onRemove,
  onAddSet, onRemoveSet, onUpdateSet, onDuration, onStep,
}) {
  const isWeight = exercise.type === 'weight'
  const accent = isWeight ? 'var(--ox-red)' : 'var(--ox-cardio)'

  return (
    <div
      className="ox-card"
      style={{ marginBottom: 12, overflow: 'hidden', borderLeft: `3px solid ${accent}` }}
    >
      {/* header */}
      <div
        style={{
          padding: '8px 10px 8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderBottom: '1px solid var(--ox-line)',
        }}
      >
        <span
          className="ox-mono"
          style={{ fontSize: 10, color: 'var(--ox-dim)', fontWeight: 700, flexShrink: 0 }}
        >
          #{String(index).padStart(2, '0')}
        </span>
        <input
          className="ox-thai"
          value={exercise.name}
          onChange={(e) => onName(e.target.value)}
          placeholder={isWeight ? 'ชื่อท่าฝึก' : 'ชื่อคาร์ดิโอ'}
          list={isWeight ? 'ox-weight-ex' : 'ox-cardio-ex'}
          style={{
            flex: 1,
            minWidth: 0,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--ox-fg)',
            fontSize: 15,
            fontWeight: 600,
          }}
        />
        <span
          className="ox-chip"
          style={{
            background: isWeight ? 'rgba(239,43,45,0.12)' : 'rgba(46,159,255,0.12)',
            color: accent,
            flexShrink: 0,
          }}
        >
          {isWeight ? 'WEIGHT' : 'CARDIO'}
        </span>
        <button
          className="ox-tap"
          onClick={onRemove}
          style={{
            width: 26,
            height: 26,
            borderRadius: 4,
            border: 'none',
            background: 'transparent',
            color: 'var(--ox-dim)',
            fontSize: 16,
            flexShrink: 0,
          }}
          aria-label="Remove exercise"
        >
          ×
        </button>
      </div>

      {isWeight ? (
        <div style={{ padding: '8px 0' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '36px 1fr 1fr 30px',
              padding: '4px 12px',
              gap: 8,
            }}
          >
            <span className="ox-cap" style={{ color: 'var(--ox-dim)', fontSize: 8 }}>
              SET
            </span>
            <span className="ox-cap" style={{ color: 'var(--ox-dim)', fontSize: 8 }}>
              REPS
            </span>
            <span className="ox-cap" style={{ color: 'var(--ox-dim)', fontSize: 8 }}>
              WEIGHT · KG
            </span>
            <span />
          </div>
          {exercise.sets.map((s, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '36px 1fr 1fr 30px',
                gap: 8,
                padding: '5px 12px',
                alignItems: 'center',
                borderTop: i === 0 ? '1px solid var(--ox-line)' : 'none',
              }}
            >
              <span className="ox-mono" style={{ fontSize: 13, color: 'var(--ox-dim)' }}>
                {i + 1}
              </span>
              <input
                className="ox-field ox-mono"
                value={s.reps}
                onChange={(e) => onUpdateSet(i, 'reps', e.target.value)}
                inputMode="numeric"
                placeholder="0"
                style={{ padding: '7px 9px', fontSize: 14 }}
              />
              <input
                className="ox-field ox-mono"
                value={s.weight}
                onChange={(e) => onUpdateSet(i, 'weight', e.target.value)}
                inputMode="decimal"
                placeholder="0"
                style={{ padding: '7px 9px', fontSize: 14, color: 'var(--ox-red)' }}
              />
              <button
                className="ox-tap"
                onClick={() => onRemoveSet(i)}
                disabled={exercise.sets.length <= 1}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--ox-dim)',
                  fontSize: 15,
                  opacity: exercise.sets.length <= 1 ? 0.3 : 1,
                }}
                aria-label="Remove set"
              >
                ×
              </button>
            </div>
          ))}
          <div
            className="ox-tap"
            onClick={onAddSet}
            style={{
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--ox-red)',
              borderTop: '1px solid var(--ox-line)',
              marginTop: 4,
            }}
          >
            <span style={{ fontSize: 14 }}>＋</span>
            <span className="ox-cap" style={{ color: 'inherit' }}>
              ADD SET
            </span>
          </div>
        </div>
      ) : (
        <div style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="ox-cap" style={{ color: 'var(--ox-dim)', flexShrink: 0 }}>
            DURATION
          </span>
          <input
            className="ox-field ox-mono"
            value={exercise.duration}
            onChange={(e) => onDuration(e.target.value)}
            inputMode="numeric"
            placeholder="0"
            style={{ width: 70, padding: '8px 10px', fontSize: 16, color: 'var(--ox-cardio)' }}
          />
          <span className="ox-cap" style={{ color: 'var(--ox-muted)', flexShrink: 0 }}>
            MIN · นาที
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {[['−', -1], ['＋', 1]].map(([label, d]) => (
              <button
                key={label}
                className="ox-tap"
                onClick={() => onStep(d)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 4,
                  border: '1px solid var(--ox-line)',
                  background: 'var(--ox-elev)',
                  color: 'var(--ox-fg-2)',
                  fontSize: 15,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
