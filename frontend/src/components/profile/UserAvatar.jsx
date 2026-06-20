import React from 'react'

// Consistent color palette based on name hash
const PALETTE = [
  ['#F97316', '#EC4899'], // orange → pink
  ['#3B82F6', '#6366F1'], // blue → indigo
  ['#10B981', '#06B6D4'], // emerald → cyan
  ['#8B5CF6', '#EC4899'], // violet → pink
  ['#F59E0B', '#F97316'], // amber → orange
  ['#EF4444', '#F97316'], // red → orange
  ['#06B6D4', '#3B82F6'], // cyan → blue
  ['#84CC16', '#10B981'], // lime → emerald
]

function hashName(name = '') {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0
  return Math.abs(hash) % PALETTE.length
}

function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'
}

const SIZE_MAP = {
  xs:  24,
  sm:  32,
  md:  40,
  lg:  48,
  xl:  64,
  '2xl': 80,
}

const FONT_MAP = {
  xs:  9,
  sm:  11,
  md:  13,
  lg:  16,
  xl:  22,
  '2xl': 28,
}

export default function UserAvatar({ name = '', src, size = 'md', className = '', style = {} }) {
  const px = SIZE_MAP[size] ?? 40
  const fs = FONT_MAP[size] ?? 13
  const [from, to] = PALETTE[hashName(name)]

  const base = {
    width:          px,
    height:         px,
    borderRadius:   '50%',
    flexShrink:     0,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    fontWeight:     700,
    fontSize:       fs,
    color:          '#fff',
    background:     src ? 'transparent' : `linear-gradient(135deg, ${from}, ${to})`,
    overflow:       'hidden',
    userSelect:     'none',
    ...style,
  }

  return (
    <div className={`ua ${className}`} style={base} aria-label={name || 'User avatar'}>
      {src
        ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span>{getInitials(name)}</span>
      }
    </div>
  )
}

export { getInitials, hashName }
