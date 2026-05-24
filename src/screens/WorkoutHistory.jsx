// Screen 05 — Workout history. Volume trend + chronological session cards.
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { useLoad } from '../lib/useLoad'
import * as api from '../lib/api'
import { parseISO, thaiDate, enDateLabel, THAI_MONTHS_ABBR } from '../lib/thai'
import Header from '../components/Header'
import Fab from '../components/Fab'
import BottomNav from '../components/BottomNav'
import { Loader, ErrorState, EmptyState } from '../components/Feedback'
import Button from '../components/Button'

const n = (v) => {
  const x = parseFloat(v)
  return Number.isFinite(x) ? x : 0
}

function workoutVolume(w) {
  let v = 0
  for (const e of w.exercises || []) {
    if (e.type === 'weight') {
      for (const s of e.sets || []) v += n(s.reps) * n(s.weight)
    }
  }
  return v
}

export default function WorkoutHistory() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data, loading, error, reload } = useLoad(async () => {
    const [trainee, workouts] = await Promise.all([
      api.getTrainee(id),
      api.listWorkouts(id),
    ])
    return { trainee, workouts }
  }, [id])

  if (loading) return <Loader />
  if (error) return <ErrorState message={error.message} onRetry={reload} />
  if (!data.trainee) return <Navigate to="/clients" replace />

  const { trainee, workouts } = data

  // 12-week volume buckets — index 11 = current week.
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const buckets = Array(12).fill(0)
  for (const w of workouts) {
    const d = parseISO(w.date)
    d.setHours(0, 0, 0, 0)
    const weeksAgo = Math.floor((today - d) / (7 * 86400000))
    if (weeksAgo >= 0 && weeksAgo < 12) buckets[11 - weeksAgo] += workoutVolume(w)
  }
  const totalVolume = buckets.reduce((a, b) => a + b, 0)
  const maxBucket = Math.max(...buckets, 1)
  const recent = buckets.slice(8).reduce((a, b) => a + b, 0)
  const prior = buckets.slice(4, 8).reduce((a, b) => a + b, 0)
  const deltaPct = prior > 0 ? Math.round(((recent - prior) / prior) * 100) : null

  return (
    <div className="ox-screen">
      <Header
        onBack={() => navigate(`/client/${id}`)}
        kicker="HISTORY · ประวัติการเทรน"
        title={trainee.name}
        subtitle={`${workouts.length} SESSIONS`}
      />

      <div className="ox-body ox-scroll" style={{ padding: '16px 18px 96px' }}>
        {workouts.length === 0 ? (
          <EmptyState
            icon="🏋️"
            title="ยังไม่มีบันทึกการเทรน"
            hint="แตะปุ่ม LOG เพื่อบันทึกเซสชันแรก"
            action={
              <Button size="sm" onClick={() => navigate(`/client/${id}/workout/new`)}>
                + บันทึกการเทรน
              </Button>
            }
          />
        ) : (
          <>
            {/* Volume trend */}
            {totalVolume > 0 && (
              <div className="ox-card" style={{ padding: 14, marginBottom: 18 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                  }}
                >
                  <span className="ox-cap" style={{ color: 'var(--ox-muted)' }}>
                    VOLUME · 12 สัปดาห์
                  </span>
                  {deltaPct !== null && (
                    <span
                      className="ox-mono"
                      style={{
                        fontSize: 10,
                        color: deltaPct >= 0 ? 'var(--ox-active)' : 'var(--ox-dim)',
                      }}
                    >
                      {deltaPct >= 0 ? '+' : ''}
                      {deltaPct}%
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60 }}>
                  {buckets.map((v, i) => (
                    <div
                      key={i}
                      title={`${Math.round(v).toLocaleString()} kg·reps`}
                      style={{
                        flex: 1,
                        height: `${Math.max(3, (v / maxBucket) * 100)}%`,
                        background: i >= 10 ? 'var(--ox-red)' : 'var(--ox-elev-2)',
                        borderRadius: 1,
                      }}
                    />
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <span className="ox-mono" style={{ fontSize: 9, color: 'var(--ox-dim)' }}>
                    12 สัปดาห์ก่อน
                  </span>
                  <span className="ox-mono" style={{ fontSize: 9, color: 'var(--ox-dim)' }}>
                    สัปดาห์นี้
                  </span>
                </div>
              </div>
            )}

            {/* Session cards */}
            {workouts.map((w) => (
              <DayCard
                key={w.id}
                workout={w}
                onClick={() => navigate(`/client/${id}/workout/${w.id}`)}
              />
            ))}
          </>
        )}
      </div>

      <Fab label="LOG" onClick={() => navigate(`/client/${id}/workout/new`)} />
      <BottomNav active="workout" clientId={id} />
    </div>
  )
}

function DayCard({ workout, onClick }) {
  const d = parseISO(workout.date)
  const items = workout.exercises || []
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div
          style={{
            width: 38,
            padding: '6px 0',
            background: 'var(--ox-elev)',
            border: '1px solid var(--ox-line)',
            borderRadius: 4,
            textAlign: 'center',
            flexShrink: 0,
          }}
        >
          <div
            className="ox-mono"
            style={{ fontSize: 16, fontWeight: 700, color: 'var(--ox-red)', lineHeight: 1 }}
          >
            {d.getDate()}
          </div>
          <div className="ox-cap" style={{ fontSize: 7, color: 'var(--ox-dim)' }}>
            {THAI_MONTHS_ABBR[d.getMonth()]}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="ox-thai" style={{ fontSize: 13, fontWeight: 600 }}>
            {thaiDate(workout.date)}
          </div>
          <div className="ox-cap" style={{ color: 'var(--ox-dim)' }}>
            {enDateLabel(workout.date)}
          </div>
        </div>
        <span className="ox-mono" style={{ fontSize: 10, color: 'var(--ox-dim)' }}>
          {items.length} EX
        </span>
      </div>

      <div className="ox-tap ox-card" onClick={onClick} style={{ overflow: 'hidden' }}>
        {items.length === 0 && (
          <div
            className="ox-thai"
            style={{ padding: '12px 14px', fontSize: 12, color: 'var(--ox-dim)' }}
          >
            ไม่มีท่าฝึก
          </div>
        )}
        {items.map((it, i) => (
          <div
            key={i}
            style={{
              padding: '10px 14px',
              borderBottom: i < items.length - 1 ? '1px solid var(--ox-line)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div
              style={{
                width: 3,
                height: 30,
                flexShrink: 0,
                background: it.type === 'weight' ? 'var(--ox-red)' : 'var(--ox-cardio)',
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="ox-thai" style={{ fontSize: 13, fontWeight: 600 }}>
                {it.name || (it.type === 'weight' ? 'ท่าฝึก' : 'คาร์ดิโอ')}
              </div>
              {it.type === 'weight' ? (
                <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                  {(it.sets || []).length === 0 && (
                    <span className="ox-mono" style={{ fontSize: 10, color: 'var(--ox-dim)' }}>
                      —
                    </span>
                  )}
                  {(it.sets || []).map((s, si) => (
                    <span
                      key={si}
                      className="ox-mono"
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: '2px 6px',
                        background: 'rgba(239,43,45,0.08)',
                        color: 'var(--ox-red)',
                        borderRadius: 3,
                      }}
                    >
                      {n(s.reps)}×{n(s.weight)}
                    </span>
                  ))}
                </div>
              ) : (
                <div style={{ marginTop: 4 }}>
                  <span
                    className="ox-mono"
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: '2px 6px',
                      background: 'rgba(46,159,255,0.1)',
                      color: 'var(--ox-cardio)',
                      borderRadius: 3,
                    }}
                  >
                    {n(it.duration)} MIN
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
        {workout.note && (
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(255,255,255,0.02)',
              borderTop: '1px solid var(--ox-line)',
              display: 'flex',
              gap: 8,
            }}
          >
            <span
              className="ox-cap"
              style={{ color: 'var(--ox-red)', fontSize: 8, flexShrink: 0, marginTop: 2 }}
            >
              NOTE
            </span>
            <span
              className="ox-thai"
              style={{ fontSize: 12, color: 'var(--ox-fg-2)', lineHeight: 1.4 }}
            >
              {workout.note}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
