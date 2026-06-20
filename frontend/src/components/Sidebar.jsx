import React from 'react'
import { NavLink } from 'react-router-dom'

const NAV = [
  { id: 'dashboard',    label: 'Dashboard',                    path: '/'              },
  { id: 'job-openings', label: <>Job<br />Openings</>,          path: '/job-openings'  },
  { id: 'candidates',   label: 'Candidates',                   path: '/candidates'    },
  { id: 'interviews',   label: 'Interviews',                   path: '/interviews'    },
  { id: 'client',       label: 'Client',                       path: '/client'        },
  { id: 'reports',      label: 'Reports',                      path: '/reports'       },
  { id: 'calendar',     label: 'Calendar',                     path: '/calendar'      },
  { id: 'user-roles',   label: <>User<br />Roles</>,            path: '/user-roles'    },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src="/logo.png" alt="Arrows" className="sidebar-logo-img" style={{ width: '40px', height: '46px' }} />
      </div>

      <nav className="sidebar-nav">
        {NAV.map(({ id, label, path }) => (
          <NavLink
            key={id}
            to={path}
            end={path === '/'}
            className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
            title={id}
          >
            <div className="sidebar-item-icon-wrap">
              <img
                className="sidebar-item-icon"
                src={`/icons/${id}.svg`}
                alt=""
                aria-hidden="true"
              />
            </div>
            <div className="sidebar-item-text">{label}</div>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
