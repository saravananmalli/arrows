import React, { useState } from 'react'
import TabBar from '../../components/TabBar'

const JDD_TABS = ['Job Information', 'Client Details', 'Client Requirement', 'Team Members']

function JddField({ label, children }) {
  return (
    <div className="jdd-field">
      <div className="jdd-field-label">{label}</div>
      <div className="jdd-field-value">{children || '—'}</div>
    </div>
  )
}

function initials(name) {
  return (name || '').split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function JDDetailDrawer({ job, onClose }) {
  const [tab, setTab] = useState('Job Information')

  const recruiterInTeam = (job.assignedTeam || []).find(
    u => u.role === 'Recruiter' || u.designation === 'Recruiter'
  )
  const recruiterPhone = recruiterInTeam?.mobile || ''

  const expText = job.experienceMin || job.experienceMax
    ? `Min ${job.experienceMin || '—'} to max ${job.experienceMax || '—'} Yrs`
    : '—'

  const salaryText = job.salaryMin || job.salaryMax
    ? `Min: ${job.salaryMin || '—'} LPA, Max: ${job.salaryMax || '—'} LPA`
    : '—'

  return (
    <>
      <div className="jdd-overlay" onClick={onClose} />
      <div className="jdd-panel">

        {/* Header */}
        <div className="jdd-header">
          <div className="jdd-avatar">{(job.postingTitle || 'J')[0].toUpperCase()}</div>
          <div className="jdd-header-info">
            <div className="jdd-title">JD id: {job.id}</div>
            <div className="jdd-subtitle">Position Name:&nbsp; {job.postingTitle || '—'}</div>
            <div className="jdd-meta">
              <span className="jdd-meta-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                {job.recruiter || '—'}
              </span>
              <span className="jdd-meta-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                {job.city || '—'}
              </span>
              {recruiterPhone && (
                <span className="jdd-meta-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z"/>
                  </svg>
                  {recruiterPhone}
                </span>
              )}
            </div>
          </div>
          <button className="jdd-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <TabBar tabs={JDD_TABS} active={tab} onChange={setTab} className="jdd-tabs" />

        {/* Body */}
        <div className="jdd-body">
          {tab === 'Job Information' && (
            <div className="jdd-grid">
              <JddField label="JD ID">{job.id}</JddField>
              <JddField label="Position Name">{job.postingTitle}</JddField>
              <JddField label="Experience">{expText}</JddField>

              <div className="jdd-field">
                <div className="jdd-field-label">Job Description Link</div>
                {job.jdLink
                  ? <a className="jdd-field-link" href={job.jdLink} target="_blank" rel="noreferrer">link</a>
                  : <div className="jdd-field-value">—</div>
                }
              </div>

              <JddField label="Position Level">{job.positionLevel}</JddField>
              <JddField label="Location">{job.city}</JddField>
              <JddField label="No of Positions">{job.noOfPositions}</JddField>
              <JddField label="Job Received Date">{job.jobReceivedDate}</JddField>
              <JddField label="Hiring Type">{job.hiringType}</JddField>
              <JddField label="Salary in CTC">{salaryText}</JddField>
              <JddField label="Job Type">{job.jobType}</JddField>

              <div className="jdd-field">
                <div className="jdd-field-label">JD Attachment</div>
                {job.jdLink
                  ? <a className="jdd-field-link" href={job.jdLink} target="_blank" rel="noreferrer">Link</a>
                  : <div className="jdd-field-value">—</div>
                }
              </div>

              <JddField label="Primary Skills">
                {job.techSkills?.length ? job.techSkills.join(', ') : null}
              </JddField>
              <JddField label="Secondary Skills">
                {job.secondarySkills?.length ? job.secondarySkills.join(', ') : null}
              </JddField>
              <JddField label="Soft Skills">
                {job.softSkills?.length ? job.softSkills.join(', ') : null}
              </JddField>
              <JddField label="Additional Skills">
                {job.additionalSkills?.length ? job.additionalSkills.join(', ') : null}
              </JddField>

              <JddField label="Target Date">{job.targetDate}</JddField>
            </div>
          )}

          {tab === 'Client Details' && (
            <div className="jdd-grid">
              <JddField label="Client ID">{job.clientId}</JddField>
              <JddField label="Client Name">{job.clientName}</JddField>
              <JddField label="Contact Person">{job.contactPersonName}</JddField>
              <JddField label="Contact Email">{job.contactPersonEmail}</JddField>
            </div>
          )}

          {tab === 'Client Requirement' && (
            <div className="jdd-grid">
              <JddField label="Hiring Manager">{job.hiringManager}</JddField>
              <JddField label="Sub Vendor">{job.subVendor}</JddField>
              <JddField label="Focus Location">{job.focusLocationText || job.focusLocation}</JddField>
              <JddField label="Job Activation">{job.jobActivation}</JddField>
              {job.availability?.length > 0 && (
                <JddField label="Availability">{job.availability.join(', ')}</JddField>
              )}
            </div>
          )}

          {tab === 'Team Members' && (
            job.assignedTeam?.length > 0 ? (
              <div className="jdd-team-list">
                {job.assignedTeam.map(u => (
                  <div key={u.id} className="jdd-team-card">
                    {u.photo
                      ? <img className="jdd-team-avatar" src={u.photo} alt={u.name} />
                      : <div className="jdd-team-avatar jdd-team-avatar--init">{initials(u.name)}</div>
                    }
                    <div className="jdd-team-info">
                      <div className="jdd-team-name">{u.name}</div>
                      <div className="jdd-team-role">{u.designation || u.role}</div>
                      {u.email  && <div className="jdd-team-meta">{u.email}</div>}
                      {u.mobile && <div className="jdd-team-meta">{u.mobile}</div>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="jdd-empty">No team members assigned.</div>
            )
          )}
        </div>

      </div>
    </>
  )
}
