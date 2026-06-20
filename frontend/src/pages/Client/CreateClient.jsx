import React, { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import TopBar from '../../components/TopBar'
import ClientForm from './ClientForm'

export default function CreateClient({ theme, onThemeToggle }) {
  const navigate = useNavigate()
  const handleBack = useCallback(() => navigate('/client'), [navigate])

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <TopBar
          title="Add Client"
          subtitle={<>Dashboard / Client / <span>Add Client</span></>}
          onBack={handleBack}
          theme={theme}
          onThemeToggle={onThemeToggle}
        />
        <div className="content">
          <ClientForm onBack={handleBack} />
        </div>
      </div>
    </div>
  )
}
