import { Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './store/AppContext'
import { DialogProvider } from './components/Dialog'
import CoachSelect from './screens/CoachSelect'
import ClientList from './screens/ClientList'
import ClientProfile from './screens/ClientProfile'
import WorkoutLog from './screens/WorkoutLog'
import WorkoutHistory from './screens/WorkoutHistory'
import Measurements from './screens/Measurements'
import PhotoGallery from './screens/PhotoGallery'
import BeforeAfter from './screens/BeforeAfter'
import Calendar from './screens/Calendar'
import Appointments from './screens/Appointments'
import Planner from './screens/Planner'

export default function App() {
  return (
    <AppProvider>
      <DialogProvider>
        <div className="ox-app">
          <Routes>
            <Route path="/" element={<CoachSelect />} />
            <Route path="/clients" element={<ClientList />} />
            <Route path="/plan" element={<Planner />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/calendar/:date" element={<Appointments />} />
            <Route path="/client/:id" element={<ClientProfile />} />
            <Route path="/client/:id/workout/new" element={<WorkoutLog />} />
            <Route path="/client/:id/workout/:workoutId" element={<WorkoutLog />} />
            <Route path="/client/:id/history" element={<WorkoutHistory />} />
            <Route path="/client/:id/measurements" element={<Measurements />} />
            <Route path="/client/:id/photos" element={<PhotoGallery />} />
            <Route path="/client/:id/before-after" element={<BeforeAfter />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </DialogProvider>
    </AppProvider>
  )
}
