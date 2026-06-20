import React, { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import TopBar from '../../components/TopBar'
import CandidateForm from './CandidateForm'

export default function CreateCandidate({ theme, onThemeToggle }) {
  const navigate  = useNavigate()
  const handleBack = useCallback(() => navigate('/candidates'), [navigate])

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <TopBar
          title="Add Candidate"
          subtitle={<>Dashboard / Candidate List / <span>Add Candidate</span></>}
          onBack={handleBack}
          theme={theme}
          onThemeToggle={onThemeToggle}
        />
        <div className="content">
          <CandidateForm mode="create" onBack={handleBack} />
        </div>
      </div>
    </div>
  )
}
