import React from 'react'

export default function MatchingScore({ value }) {
  return (
    <div className="mscore-bar">
      <div className="mscore-bar-track">
        <div className="mscore-bar-fill" style={{ width: `${value}%` }} />
      </div>
      <span className="mscore-bar-label">{value}%</span>
    </div>
  )
}
