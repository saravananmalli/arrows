import React from 'react'

const DIMENSIONS = [
  { key: 'skillsMatch',       label: 'Skills Match'        },
  { key: 'experienceLevel',   label: 'Experience Level'    },
  { key: 'education',         label: 'Education'           },
  { key: 'certifications',    label: 'Certifications'      },
  { key: 'projectExperience', label: 'Project Experience'  },
]

function scoreColor(v) {
  if (v >= 80) return 'var(--green, #22C55E)'
  if (v >= 60) return 'var(--yellow, #EAB308)'
  return 'var(--red, #EF4444)'
}

export default function CandidateScore({ score, recommendedRoles, strengths, gaps, summary }) {
  const {
    overall = 0, skillsMatch = 0, experienceLevel = 0,
    education = 0, certifications = 0, projectExperience = 0
  } = score || {}

  const values = { skillsMatch, experienceLevel, education, certifications, projectExperience }

  return (
    <div className="cscore-card">

      {summary && (
        <div className="cscore-summary">
          <span className="cscore-summary-label">Candidate Summary</span>
          <p className="cscore-summary-text">{summary}</p>
        </div>
      )}

      <div className="cscore-top">
        {/* Overall score circle */}
        <div className="cscore-circle-wrap">
          <div className="cscore-circle" style={{ '--score-color': scoreColor(overall) }}>
            <span className="cscore-number">{overall}</span>
            <span className="cscore-denom">/100</span>
          </div>
          <span className="cscore-circle-label">Overall Score</span>
        </div>

        {/* Dimension bars */}
        <div className="cscore-bars">
          {DIMENSIONS.map(d => {
            const val = values[d.key] || 0
            return (
              <div key={d.key} className="cscore-bar-row">
                <span className="cscore-bar-label">{d.label}</span>
                <div className="cscore-bar-track">
                  <div
                    className="cscore-bar-fill"
                    style={{ width: `${val}%`, background: scoreColor(val) }}
                  />
                </div>
                <span className="cscore-bar-value">{val}</span>
              </div>
            )
          })}
        </div>
      </div>

      {recommendedRoles?.length > 0 && (
        <div className="cscore-roles-row">
          <span className="cscore-section-label">Recommended Roles</span>
          <div className="cscore-role-tags">
            {recommendedRoles.map((r, i) => (
              <span key={i} className="cscore-role-tag">{r}</span>
            ))}
          </div>
        </div>
      )}

      <div className="cscore-bottom">
        {strengths?.length > 0 && (
          <div className="cscore-col">
            <span className="cscore-section-label cscore-strengths-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Strengths
            </span>
            <ul className="cscore-list cscore-strengths-list">
              {strengths.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}
        {gaps?.length > 0 && (
          <div className="cscore-col">
            <span className="cscore-section-label cscore-gaps-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Gaps
            </span>
            <ul className="cscore-list cscore-gaps-list">
              {gaps.map((g, i) => <li key={i}>{g}</li>)}
            </ul>
          </div>
        )}
      </div>

    </div>
  )
}
