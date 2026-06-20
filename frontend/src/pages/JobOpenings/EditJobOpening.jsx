import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import TopBar from '../../components/TopBar'
import CreateForm from './CreateForm'
import { getJob } from '../../services/dataService'

export default function EditJobOpening({ theme, onThemeToggle }) {
  const { jobId }  = useParams()
  const navigate   = useNavigate()
  const [job,      setJob]     = useState(null)
  const [loading,  setLoading] = useState(true)

  useEffect(() => {
    getJob(jobId)
      .then(data => { setJob(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [jobId])

  const handleBack = useCallback(() => navigate('/job-openings'), [navigate])

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <TopBar
          title="Edit Job Opening"
          subtitle={<>Dashboard / Job List / <span>Edit Job Opening</span></>}
          onBack={handleBack}
          theme={theme}
          onThemeToggle={onThemeToggle}
        />
        <div className="content">
          {loading
            ? <div className="cjob-wrap"><p style={{ padding: 24 }}>Loading...</p></div>
            : job
              ? <CreateForm mode="edit" initialData={job} onBack={handleBack} />
              : <div className="cjob-wrap"><p style={{ padding: 24 }}>Job not found.</p></div>
          }
        </div>
      </div>
    </div>
  )
}
