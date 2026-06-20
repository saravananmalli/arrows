import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import TopBar from '../../components/TopBar'
import CandidateForm from './CandidateForm'
import { getCandidateById } from '../../services/dataService'

export default function EditCandidate({ theme, onThemeToggle }) {
  const { candidateId } = useParams()
  const navigate        = useNavigate()
  const [candidate, setCandidate] = useState(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    getCandidateById(candidateId)
      .then(data => { setCandidate(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [candidateId])

  const handleBack = useCallback(() => navigate('/candidates'), [navigate])

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <TopBar
          title="Edit Candidate"
          subtitle={<>Dashboard / Candidate List / <span>Edit Candidate</span></>}
          onBack={handleBack}
          theme={theme}
          onThemeToggle={onThemeToggle}
        />
        <div className="content">
          {loading
            ? <div className="cjob-wrap"><p style={{ padding: 24 }}>Loading...</p></div>
            : candidate
              ? <CandidateForm mode="edit" initialData={candidate} onBack={handleBack} />
              : <div className="cjob-wrap"><p style={{ padding: 24 }}>Candidate not found.</p></div>
          }
        </div>
      </div>
    </div>
  )
}
