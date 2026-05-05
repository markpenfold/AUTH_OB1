'use client'
import { useState } from 'react'

export default function OmenAvatar({ src, name, size = 'md' }: { src?: string | null, name: string, size?: 'sm' | 'md' | 'lg' }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  // Mapping sizes to actual CSS values
  const dims = {
    sm: { width: '32px', height: '32px', fontSize: '12px' },
    md: { width: '48px', height: '48px', fontSize: '16px' },
    lg: { width: '96px', height: '96px', fontSize: '24px' }
  }

  const currentDim = dims[size]
  const initials = name.slice(0, 1).toUpperCase()

  const getHashColor = (str: string) => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    return `hsl(${Math.abs(hash % 360)}, 65%, 65%)`
  }

  // Common styles to keep the JSX clean
  const containerStyle: React.CSSProperties = {
    ...currentDim,
    position: 'relative',
    display: 'flex',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    overflow: 'hidden',
    backgroundColor: getHashColor(name),
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
    border: '1px solid rgba(0,0,0,0.05)',
    userSelect: 'none'
  }

  return (
    <div style={containerStyle}>
      {/* Fallback Initials */}
      <span style={{ fontWeight: 'bold', color: 'white' }}>{initials}</span>

      {/* Image Layer */}
      {src && !hasError && (
        <img
          src={src}
          alt={name}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'opacity 0.2s ease',
            opacity: isLoaded ? 1 : 0
          }}
        />
      )}
    </div>
  )
}