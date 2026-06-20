import React, { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import TopBar from '../../components/TopBar'
import CreateForm from './CreateForm'

export default function CreateJobOpening({ theme, onThemeToggle }) {
  const navigate   = useNavigate()
  const handleBack    = useCallback(() => navigate('/job-openings'), [navigate])
  const handleCreated = useCallback((job) => {
    navigate(`/job-openings/${job.id}`, { state: { justCreated: true } })
  }, [navigate])

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <TopBar
          title="Create Job Opening"
          subtitle={<>Dashboard / Job Opening / <span>Create Job Opening</span></>}
          onBack={handleBack}
          theme={theme}
          onThemeToggle={onThemeToggle}
        />
        <div className="content">
          <CreateForm onBack={handleBack} onCreated={handleCreated} />
        </div>
      </div>
    </div>
  )
}
