import React, { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import TopBar from '../../components/TopBar'
import JobList from './JobList'

export default function JobOpenings({ theme, onThemeToggle }) {
  const navigate = useNavigate()
  const handleCreate = useCallback(() => navigate('/job-openings/new'), [navigate])

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <TopBar
          title="All Job Opening"
          subtitle={<>Dashboard / <span>Job Opening</span></>}
          theme={theme}
          onThemeToggle={onThemeToggle}
        />
        <div className="content">
          <JobList onCreate={handleCreate} />
        </div>
      </div>
    </div>
  )
}
