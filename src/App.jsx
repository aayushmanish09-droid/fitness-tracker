import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import { PageLoader } from './components/ui.jsx'
import Layout from './components/Layout.jsx'

import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Log from './pages/Log.jsx'
import RoutineBuilder from './pages/RoutineBuilder.jsx'
import WorkoutLogger from './pages/WorkoutLogger.jsx'
import Progress from './pages/Progress.jsx'
import ExerciseDetail from './pages/ExerciseDetail.jsx'
import Friends from './pages/Friends.jsx'
import Profile from './pages/Profile.jsx'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return children
}

function RedirectIfAuthed({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (user) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<RedirectIfAuthed><Login /></RedirectIfAuthed>} />
      <Route path="/signup" element={<RedirectIfAuthed><Signup /></RedirectIfAuthed>} />

      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Log />} />
        <Route path="/routines" element={<RoutineBuilder />} />
        <Route path="/routines/:type" element={<RoutineBuilder />} />
        <Route path="/workout/edit/:workoutId" element={<WorkoutLogger />} />
        <Route path="/workout/day/:routineId" element={<WorkoutLogger />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/progress/exercise/:exerciseId" element={<ExerciseDetail />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
