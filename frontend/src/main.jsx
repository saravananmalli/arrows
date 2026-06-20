import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { CandidateAuthProvider } from './contexts/CandidateAuthContext'
import { initMasters } from './services/masters.service'
import './styles/main.scss'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

/**
 * Fetch /api/masters BEFORE importing App so every constants.js module that reads
 * `masters.pipelineTabs` (etc.) at module-evaluation time gets server data, not a
 * stale bundled snapshot. When moving to a real database, only the API endpoint
 * changes — no frontend code needs to be touched.
 */
initMasters().finally(() => {
  import('./App').then(({ default: App }) => {
    createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <AuthProvider>
                <CandidateAuthProvider>
                  <ToastProvider>
                    <App />
                  </ToastProvider>
                </CandidateAuthProvider>
              </AuthProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </BrowserRouter>
      </React.StrictMode>
    )
  })
})
