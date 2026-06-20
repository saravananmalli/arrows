import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useThemeContext } from './contexts/ThemeContext'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'
import CandidateProtectedRoute from './components/CandidateProtectedRoute'
import PageLoader from './components/PageLoader'
import Dashboard from './pages/Dashboard'
import JobOpenings from './pages/JobOpenings'
import CandidateList from './pages/CandidateList'
import JobDescription from './pages/JobDescription'
import Interviews from './pages/Interviews'
import Client from './pages/Client'
import Login from './pages/Login'
import CandidateLogin from './pages/CandidatePortal/CandidateLogin'
import CandidateDashboard from './pages/CandidatePortal/CandidateDashboard'
import VerifyIdentity from './pages/CandidatePortal/VerifyIdentity'

const EditJobOpening        = lazy(() => import('./pages/JobOpenings/EditJobOpening'))
const CreateJobOpening      = lazy(() => import('./pages/JobOpenings/CreateJobOpening'))
const CreateCandidate       = lazy(() => import('./pages/CandidateList/CreateCandidate'))
const EditCandidate         = lazy(() => import('./pages/CandidateList/EditCandidate'))
const CreateClient          = lazy(() => import('./pages/Client/CreateClient'))
const EditClient            = lazy(() => import('./pages/Client/EditClient'))
const Reports               = lazy(() => import('./pages/Reports'))
const Calendar              = lazy(() => import('./pages/Calendar'))
const UserManagement        = lazy(() => import('./pages/UserManagement'))
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'))

const P = ({ children }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
)

export default function App() {
  const { theme, toggle } = useThemeContext()
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/candidate-login" element={<CandidateLogin />} />
          <Route path="/candidate/dashboard" element={<CandidateProtectedRoute><CandidateDashboard /></CandidateProtectedRoute>} />
          <Route path="/candidate/verify"    element={<CandidateProtectedRoute><VerifyIdentity /></CandidateProtectedRoute>} />
          <Route path="/"                         element={<P><Dashboard      theme={theme} onThemeToggle={toggle} /></P>} />
          <Route path="/job-openings"             element={<P><JobOpenings       theme={theme} onThemeToggle={toggle} /></P>} />
          <Route path="/job-openings/new"         element={<P><CreateJobOpening  theme={theme} onThemeToggle={toggle} /></P>} />
          <Route path="/job-openings/:jobId/edit" element={<P><EditJobOpening    theme={theme} onThemeToggle={toggle} /></P>} />
          <Route path="/job-openings/:jobId"      element={<P><JobDescription    theme={theme} onThemeToggle={toggle} /></P>} />
          <Route path="/candidates"               element={<P><CandidateList  theme={theme} onThemeToggle={toggle} /></P>} />
          <Route path="/candidates/new"           element={<P><CreateCandidate theme={theme} onThemeToggle={toggle} /></P>} />
          <Route path="/candidates/:candidateId/edit" element={<P><EditCandidate theme={theme} onThemeToggle={toggle} /></P>} />
          <Route path="/interviews"               element={<P><Interviews     theme={theme} onThemeToggle={toggle} /></P>} />
          <Route path="/client"                   element={<P><Client         theme={theme} onThemeToggle={toggle} /></P>} />
          <Route path="/client/new"               element={<P><CreateClient   theme={theme} onThemeToggle={toggle} /></P>} />
          <Route path="/client/:clientId/edit"    element={<P><EditClient     theme={theme} onThemeToggle={toggle} /></P>} />
          <Route path="/reports"                  element={<P><Reports        theme={theme} onThemeToggle={toggle} /></P>} />
          <Route path="/calendar"                 element={<P><Calendar       theme={theme} onThemeToggle={toggle} /></P>} />
          <Route path="/user-roles"               element={<P><UserManagement theme={theme} onThemeToggle={toggle} /></P>} />
          <Route path="/profile" element={<P><ProfilePage /></P>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
