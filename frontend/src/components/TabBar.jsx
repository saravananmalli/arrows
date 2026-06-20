import React from 'react'

export default function TabBar({ tabs, active, onChange, className = '', children }) {
  return (
    <div className={`tab-bar${className ? ` ${className}` : ''}`}>
      {tabs.map(tab => (
        <button
          key={tab}
          className={`tab-bar-btn${active === tab ? ' active' : ''}`}
          onClick={() => onChange(tab)}
        >
          {tab}
        </button>
      ))}
      {children}
    </div>
  )
}
