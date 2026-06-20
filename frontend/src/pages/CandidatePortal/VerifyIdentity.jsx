import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCandidateAuth } from '../../contexts/CandidateAuthContext'
import { uploadDocument } from '../../services/candidatePortal.service'
import { CandidateSidebar, CandidateTopBar } from './CandidateLayout'

const ID_TYPES = [
  { value: 'aadhaar', label: 'Aadhaar Card' },
  { value: 'pan',     label: 'PAN Card' },
]

// ── Icons ────────────────────────────────────────────────────────
function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M20 6L9 17l-5-5"/>
    </svg>
  )
}

function ArrowLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M13 5l-6 5 6 5"/>
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  )
}

function RetakeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="1 4 1 10 7 10"/>
      <path d="M3.51 15a9 9 0 1 0 .49-4"/>
    </svg>
  )
}

function FilePreview({ file }) {
  if (!file) return null
  if (file.type.startsWith('image/')) {
    const url = URL.createObjectURL(file)
    return <img className="cp-upload-preview-img" src={url} alt="preview" />
  }
  return <div className="cp-upload-preview-file">{file.name}</div>
}

// ── Live camera selfie capture ───────────────────────────────────
function LiveCamera({ onCapture }) {
  const videoRef  = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const [active,   setActive]   = useState(false)
  const [captured, setCaptured] = useState(null)
  const [camError, setCamError] = useState(null)
  const [starting, setStarting] = useState(false)

  // Assign stream to video element after it mounts (active = true triggers render)
  useEffect(() => {
    if (active && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(() => {})
    }
  }, [active])

  const startCamera = useCallback(async () => {
    setCamError(null)
    setStarting(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      })
      streamRef.current = stream
      setActive(true) // video element mounts → useEffect above assigns srcObject
    } catch (err) {
      setCamError('Camera access denied or not available. Please allow camera permission and try again.')
    } finally {
      setStarting(false)
    }
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setActive(false)
  }, [])

  const takePhoto = useCallback(() => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width  = video.videoWidth  || 640
    canvas.height = video.videoHeight || 480
    canvas.getContext('2d').drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    setCaptured(dataUrl)
    stopCamera()
    canvas.toBlob(blob => {
      const file = new File([blob], `selfie_${Date.now()}.jpg`, { type: 'image/jpeg' })
      onCapture(file)
    }, 'image/jpeg', 0.92)
  }, [stopCamera, onCapture])

  const retake = useCallback(() => {
    setCaptured(null)
    onCapture(null)
    startCamera()
  }, [startCamera, onCapture])

  useEffect(() => () => stopCamera(), [stopCamera])

  return (
    <div className="cp-camera-wrap">
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {!active && !captured && (
        <div className="cp-camera-idle">
          <div className="cp-camera-idle-icon"><CameraIcon /></div>
          <p className="cp-camera-idle-text">Use your device camera to take a live selfie</p>
          {camError && <p className="cp-camera-error">{camError}</p>}
          <button
            type="button"
            className="cp-camera-open-btn"
            onClick={startCamera}
            disabled={starting}
          >
            <CameraIcon />
            {starting ? 'Starting Camera…' : 'Open Camera'}
          </button>
        </div>
      )}

      {active && !captured && (
        <div className="cp-camera-live">
          <div className="cp-camera-frame">
            <video ref={videoRef} className="cp-camera-video" playsInline muted autoPlay />
            <div className="cp-camera-overlay-ring" />
          </div>
          <div className="cp-camera-controls">
            <button type="button" className="cp-camera-capture-btn" onClick={takePhoto}>
              <span className="cp-camera-shutter" />
            </button>
            <button type="button" className="cp-camera-cancel-btn" onClick={stopCamera}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {captured && (
        <div className="cp-camera-result">
          <img className="cp-camera-preview" src={captured} alt="Captured selfie" />
          <div className="cp-camera-result-actions">
            <span className="cp-camera-ok-badge"><CheckIcon /> Photo captured</span>
            <button type="button" className="cp-camera-retake-btn" onClick={retake}>
              <RetakeIcon /> Retake
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────
export default function VerifyIdentity() {
  const { candidateSession } = useCandidateAuth()
  const navigate = useNavigate()

  const [idType,    setIdType]    = useState('aadhaar')
  const [files,     setFiles]     = useState({ selfie: null, id_front: null, id_back: null })
  const [uploading, setUploading] = useState(false)
  const [errors,    setErrors]    = useState({})
  const [submitted, setSubmitted] = useState(false)

  const idFrontRef = useRef()

  const docTypeFor = (key) => {
    if (key === 'selfie')   return 'selfie'
    if (key === 'id_front') return idType === 'aadhaar' ? 'aadhaar_front' : 'pan_front'
    return key
  }

  const handleFile = (key, e) => {
    const f = e.target.files[0]
    if (!f) return
    if (f.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, [key]: 'File must be under 5 MB' }))
      return
    }
    setFiles(prev => ({ ...prev, [key]: f }))
    setErrors(prev => ({ ...prev, [key]: null }))
  }

  const handleSelfieCapture = useCallback((file) => {
    setFiles(prev => ({ ...prev, selfie: file }))
    setErrors(prev => ({ ...prev, selfie: null }))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = {}
    if (!files.selfie)   newErrors.selfie   = 'Selfie photo is required'
    if (!files.id_front) newErrors.id_front = 'ID front is required'
    if (Object.keys(newErrors).length) { setErrors(newErrors); return }

    setUploading(true)
    const toUpload = [
      { key: 'selfie',   file: files.selfie  },
      { key: 'id_front', file: files.id_front },
    ]

    const newErrs = {}
    for (const { key, file } of toUpload) {
      try {
        await uploadDocument(candidateSession.candidateId, docTypeFor(key), file)
      } catch (err) {
        newErrs[key] = err.message
      }
    }
    setErrors(newErrs)
    setUploading(false)
    if (Object.keys(newErrs).length === 0) setSubmitted(true)
  }

  if (!candidateSession) return null

  if (submitted) {
    return (
      <div className="layout">
        <CandidateSidebar activeTab="verification" />
        <div className="main">
          <CandidateTopBar title="Identity Verification" subtitle="Candidate Portal" />
          <div className="content">
            <div className="cp-success-card">
              <div className="cp-success-icon"><CheckIcon /></div>
              <h2 className="cp-success-title">Documents Submitted Successfully!</h2>
              <p className="cp-success-msg">
                Your identity verification documents have been submitted and the recruiter has been notified.
                They will review your documents and update you on the status shortly.
              </p>
              <button className="cp-submit-btn" onClick={() => navigate('/candidate/dashboard')}>
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="layout">
      <CandidateSidebar activeTab="verification" />
      <div className="main">
        <CandidateTopBar title="Identity Verification" subtitle="Candidate Portal" onBack={() => navigate('/candidate/dashboard')} />
        <div className="content">
          <div className="cp-card cp-card--full">
            <h2 className="cp-card-title">Identity Verification</h2>
            <p className="cp-verif-desc">
              Take a live selfie and upload a valid government ID to complete your identity verification.
              This is required before proceeding with Pre-Screening.
            </p>

            <form className="cp-upload-form" onSubmit={handleSubmit}>

              {/* Step 1 — Live selfie */}
              <div className="cp-upload-section">
                <h4 className="cp-upload-section-title">
                  <span className="cp-upload-num">1</span>
                  Live Selfie <span className="cp-required">*</span>
                </h4>
                <p className="cp-upload-hint">
                  Open your camera, position your face in the frame, and tap the shutter button to capture.
                </p>
                <LiveCamera onCapture={handleSelfieCapture} />
                {errors.selfie && <p className="cp-field-error">{errors.selfie}</p>}
              </div>

              {/* Step 2 — Government ID */}
              <div className="cp-upload-section">
                <h4 className="cp-upload-section-title">
                  <span className="cp-upload-num">2</span>
                  Government ID Proof <span className="cp-required">*</span>
                </h4>
                <div className="cp-id-type-row">
                  {ID_TYPES.map(t => (
                    <label key={t.value} className={`cp-id-type-btn${idType === t.value ? ' selected' : ''}`}>
                      <input
                        type="radio"
                        name="idType"
                        value={t.value}
                        checked={idType === t.value}
                        onChange={() => { setIdType(t.value); setFiles(p => ({ ...p, id_front: null })) }}
                        style={{ display: 'none' }}
                      />
                      {t.label}
                    </label>
                  ))}
                </div>

                {idType === 'aadhaar' && (
                  <div className="cp-id-both-sides-note">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    Upload a single image/scan showing <strong>both the front and back sides</strong> of your Aadhaar card. Both sides are mandatory.
                  </div>
                )}

                <div className="cp-upload-sub-section">
                  <label className="cp-upload-sub-label">
                    {idType === 'aadhaar' ? 'Aadhaar Card (Front & Back)' : 'PAN Card (Front)'}
                    {' '}<span className="cp-required">*</span>
                  </label>
                  <div
                    className={`cp-dropzone cp-dropzone--small${files.id_front ? ' has-file' : ''}${errors.id_front ? ' error' : ''}`}
                    onClick={() => idFrontRef.current?.click()}
                  >
                    {files.id_front ? <FilePreview file={files.id_front} /> : (
                      <>
                        <UploadIcon />
                        <span>{idType === 'aadhaar' ? 'Upload image with both sides' : 'Upload front side'}</span>
                      </>
                    )}
                    <input ref={idFrontRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={e => handleFile('id_front', e)} />
                  </div>
                  {errors.id_front && <p className="cp-field-error">{errors.id_front}</p>}
                  {files.id_front && (
                    <div className="cp-file-chip">
                      <CheckIcon /> {files.id_front.name}
                      <button type="button" className="cp-file-remove" onClick={() => setFiles(p => ({ ...p, id_front: null }))}>×</button>
                    </div>
                  )}
                </div>
              </div>

              <div className="cp-upload-actions">
                <button type="button" className="cp-btn-secondary" onClick={() => navigate('/candidate/dashboard')}>
                  Cancel
                </button>
                <button type="submit" className="cp-submit-btn" disabled={uploading}>
                  {uploading ? 'Uploading…' : 'Submit Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
