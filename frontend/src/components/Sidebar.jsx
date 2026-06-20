import React from 'react'
import { NavLink } from 'react-router-dom'
import { useSidebar } from '../contexts/SidebarContext'

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
  const { isOpen, close } = useSidebar()

  return (
    <>
      <div
        className={`sidebar-backdrop${isOpen ? ' sidebar-backdrop--open' : ''}`}
        onClick={close}
        aria-hidden="true"
      />
      <aside className={`sidebar${isOpen ? ' sidebar--open' : ''}`}>
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
              onClick={close}
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
    </>
  )
}
