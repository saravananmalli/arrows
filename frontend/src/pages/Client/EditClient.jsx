import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import TopBar from '../../components/TopBar'
import ClientForm from './ClientForm'
import { getClientById } from '../../services/dataService'

export default function EditClient({ theme, onThemeToggle }) {
  const navigate = useNavigate()
  const { clientId } = useParams()
  const [client, setClient] = useState(undefined) // undefined = loading, null = not found

  useEffect(() => {
    getClientById(clientId).then(setClient)
  }, [clientId])

  const handleBack = useCallback(() => navigate('/client'), [navigate])

  if (client === undefined) return null
  if (client === null) { handleBack(); return null }

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <TopBar
          title="Edit Client"
          subtitle={<>Dashboard / Client / <span>Edit Client</span></>}
          onBack={handleBack}
          theme={theme}
          onThemeToggle={onThemeToggle}
        />
        <div className="content">
          <ClientForm onBack={handleBack} mode="edit" initialData={client} />
        </div>
      </div>
    </div>
  )
}
