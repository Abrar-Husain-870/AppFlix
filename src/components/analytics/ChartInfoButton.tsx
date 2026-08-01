'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Info, X } from 'lucide-react'

interface ChartInfoButtonProps {
  title: string
  description: string
  calculation: string
}

export default function ChartInfoButton({ title, description, calculation }: ChartInfoButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <div ref={popoverRef} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="About this chart"
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          background: isOpen ? 'rgba(229, 9, 20, 0.2)' : 'rgba(255, 255, 255, 0.06)',
          color: isOpen ? '#FFFFFF' : '#AAAAAA',
          fontSize: '0.72rem',
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          outline: 'none',
          lineHeight: 1,
          fontFamily: 'serif',
          fontStyle: 'italic',
        }}
        onMouseEnter={e => {
          if (!isOpen) {
            e.currentTarget.style.color = '#FFFFFF'
            e.currentTarget.style.borderColor = 'rgba(229, 9, 20, 0.5)'
            e.currentTarget.style.background = 'rgba(229, 9, 20, 0.15)'
          }
        }}
        onMouseLeave={e => {
          if (!isOpen) {
            e.currentTarget.style.color = '#AAAAAA'
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
          }
        }}
      >
        i
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '28px',
          right: '0',
          width: '280px',
          background: '#1A1A1A',
          border: '1px solid #333333',
          borderRadius: '0.65rem',
          padding: '0.9rem 1rem',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.7)',
          zIndex: 9999,
          backdropFilter: 'blur(12px)',
          animation: 'fadeIn 0.15s ease-out',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem', paddingBottom: '0.4rem', borderBottom: '1px solid #2B2B2B' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Info size={14} style={{ color: '#E50914' }} />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF' }}>{title}</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: '#777777', cursor: 'pointer', padding: '0.2rem', display: 'flex' }}
            >
              <X size={14} />
            </button>
          </div>

          <div style={{ fontSize: '0.78rem', lineHeight: 1.55 }}>
            <p style={{ color: '#CCCCCC', margin: '0 0 0.5rem 0' }}>
              <strong style={{ color: '#FFFFFF' }}>What it is: </strong>
              {description}
            </p>
            <p style={{ color: '#999999', margin: 0 }}>
              <strong style={{ color: '#CCCCCC' }}>How it's calculated: </strong>
              {calculation}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
