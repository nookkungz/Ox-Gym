// Firebase initialization — reuses the `ox-gym-coach-aum` project.
// Web config keys are public by design (they ship to every client);
// Firestore security rules are what protect the data.
import { initializeApp } from 'firebase/app'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyDy8d5WCjxmAerLHOX_WAjOFb_XuxvpuLE',
  authDomain: 'ox-gym-coach-aum.firebaseapp.com',
  projectId: 'ox-gym-coach-aum',
  storageBucket: 'ox-gym-coach-aum.firebasestorage.app',
  messagingSenderId: '793947103042',
  appId: '1:793947103042:web:351de2314cd04f7f3e72db',
  measurementId: 'G-Z43Q6CBQ8L',
}

const app = initializeApp(firebaseConfig)

// Persistent IndexedDB cache. On flaky mobile connections the SDK serves reads
// from local cache instead of hanging on the network, and queues writes until
// it reconnects. `persistentMultipleTabManager` keeps the cache consistent if
// the app is open in more than one tab. Falls back to memory cache silently
// where IndexedDB is unavailable (e.g. some private-browsing modes).
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
})

// Fresh collections for the redesigned app — the old app's collections
// (Profiles / Clients / Workouts / Proportions / Schedules) are left untouched.
export const COL = {
  coaches: 'ox5_coaches',
  trainees: 'ox5_trainees',
  workouts: 'ox5_workouts',
  checkins: 'ox5_checkins',
  appointments: 'ox5_appointments',
}
