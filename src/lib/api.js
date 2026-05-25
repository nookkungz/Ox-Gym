// Firestore data layer. Every list query uses a single `where` filter and
// sorts client-side — this keeps the app free of composite-index requirements.
import {
  collection, doc, addDoc, getDoc, getDocs,
  updateDoc, setDoc, deleteDoc, query, where,
} from 'firebase/firestore'
import { db, COL } from '../firebase'

const now = () => Date.now()
const mapDocs = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }))

async function listWhere(colName, field, value) {
  const snap = await getDocs(query(collection(db, colName), where(field, '==', value)))
  return mapDocs(snap)
}
const byCreated = (a, b) => (a.createdAt || 0) - (b.createdAt || 0)
const byDateDesc = (a, b) =>
  (b.date || '').localeCompare(a.date || '') || (b.createdAt || 0) - (a.createdAt || 0)
const byDateAsc = (a, b) =>
  (a.date || '').localeCompare(b.date || '') || (a.createdAt || 0) - (b.createdAt || 0)

// ─── Coaches ──────────────────────────────────────────────────
export async function listCoaches() {
  const snap = await getDocs(collection(db, COL.coaches))
  return mapDocs(snap).sort(byCreated)
}
export async function getCoach(id) {
  const s = await getDoc(doc(db, COL.coaches, id))
  return s.exists() ? { id: s.id, ...s.data() } : null
}
export async function createCoach(data) {
  const ref = await addDoc(collection(db, COL.coaches), { ...data, createdAt: now() })
  return ref.id
}
export function updateCoach(id, data) {
  return updateDoc(doc(db, COL.coaches, id), data)
}
export function deleteCoach(id) {
  return deleteDoc(doc(db, COL.coaches, id))
}

// ─── Shared Training Plan ─────────────────────────────────────
// One plan document shared by all coach profiles.
// Stored at ox5_shared_plan/main — created on first write.
const PLAN_COL = 'ox5_shared_plan'
const PLAN_ID  = 'main'
export async function getSharedPlan() {
  const s = await getDoc(doc(db, PLAN_COL, PLAN_ID))
  return s.exists() ? s.data().datePlans || {} : {}
}
export function updateSharedPlan(datePlans) {
  return setDoc(doc(db, PLAN_COL, PLAN_ID), { datePlans }, { merge: true })
}
// Dotted-path single-day update. Prevents collaborative data loss: concurrent
// edits to different days merge instead of overwriting the whole map.
export async function updateSharedPlanDay(isoDate, value) {
  const docRef = doc(db, PLAN_COL, PLAN_ID)
  try {
    await updateDoc(docRef, {
      [`datePlans.${isoDate}`]: value,
    })
  } catch (err) {
    if (err.code === 'not-found') {
      await setDoc(docRef, {
        datePlans: {
          [isoDate]: value,
        },
      })
    } else {
      throw err
    }
  }
}

// ─── Trainees ─────────────────────────────────────────────────
export async function listAllTrainees() {
  const snap = await getDocs(collection(db, COL.trainees))
  return mapDocs(snap)
}
export async function listTrainees(coachId) {
  const list = await listWhere(COL.trainees, 'coachId', coachId)
  return list.sort(byCreated)
}
export async function getTrainee(id) {
  const s = await getDoc(doc(db, COL.trainees, id))
  return s.exists() ? { id: s.id, ...s.data() } : null
}
export async function createTrainee(coachId, data) {
  const ref = await addDoc(collection(db, COL.trainees), {
    ...data,
    coachId,
    status: data.status || 'active',
    createdAt: now(),
  })
  return ref.id
}
export function updateTrainee(id, data) {
  return updateDoc(doc(db, COL.trainees, id), data)
}
export function deleteTrainee(id) {
  return deleteDoc(doc(db, COL.trainees, id))
}

// ─── Workouts ─────────────────────────────────────────────────
// doc shape: { traineeId, date, note, exercises: [{ name, type, sets:[{reps,weight}], duration }], createdAt }
export async function listWorkouts(traineeId) {
  const list = await listWhere(COL.workouts, 'traineeId', traineeId)
  return list.sort(byDateDesc)
}
export async function getWorkout(id) {
  const s = await getDoc(doc(db, COL.workouts, id))
  return s.exists() ? { id: s.id, ...s.data() } : null
}
export async function createWorkout(traineeId, data) {
  const ref = await addDoc(collection(db, COL.workouts), {
    ...data, traineeId, createdAt: now(),
  })
  return ref.id
}
export function updateWorkout(id, data) {
  return updateDoc(doc(db, COL.workouts, id), data)
}
export function deleteWorkout(id) {
  return deleteDoc(doc(db, COL.workouts, id))
}

// Recompute the denormalized session count + last-workout date on a trainee.
// Called after any workout mutation so the roster stays accurate without N+1 reads.
export async function syncTraineeStats(traineeId) {
  const workouts = await listWorkouts(traineeId) // already sorted date-desc
  const stats = {
    sessionCount: workouts.length,
    lastWorkoutDate: workouts[0]?.date || null,
  }
  await updateTrainee(traineeId, stats)
  return stats
}

// ─── Check-ins (progress: photo + measurements) ───────────────
// doc shape: { traineeId, date, photo, measurements:{arm,chest,waist,hips,leg}, createdAt }
export async function listCheckins(traineeId) {
  const list = await listWhere(COL.checkins, 'traineeId', traineeId)
  return list.sort(byDateAsc) // oldest → newest (gallery / before-after order)
}
export async function createCheckin(traineeId, data) {
  const ref = await addDoc(collection(db, COL.checkins), {
    ...data, traineeId, createdAt: now(),
  })
  return ref.id
}
export function updateCheckin(id, data) {
  return updateDoc(doc(db, COL.checkins, id), data)
}
export function deleteCheckin(id) {
  return deleteDoc(doc(db, COL.checkins, id))
}

// ─── Appointments ─────────────────────────────────────────────
// doc shape: { coachId, date, time, traineeId, clientName, label, createdAt }
export async function listAppointments(coachId) {
  return listWhere(COL.appointments, 'coachId', coachId)
}
export async function createAppointment(coachId, data) {
  const ref = await addDoc(collection(db, COL.appointments), {
    ...data, coachId, createdAt: now(),
  })
  return ref.id
}
export function updateAppointment(id, data) {
  return updateDoc(doc(db, COL.appointments, id), data)
}
export function deleteAppointment(id) {
  return deleteDoc(doc(db, COL.appointments, id))
}
