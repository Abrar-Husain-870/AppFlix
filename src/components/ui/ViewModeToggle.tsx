'use client'

import React from 'react'
import { LayoutGrid, Rows3 } from 'lucide-react'

export type CardViewMode = 'grid' | 'pill'
export { useCardViewMode, CARD_VIEW_MODE_STORAGE_KEY, CARD_VIEW_MODE_EVENT } from '@/hooks/useCardViewMode'

interface ViewModeToggleProps {
  viewMode: CardViewMode
  onChange: (mode: CardViewMode) => void
  className?: string
}

export default function ViewModeToggle({
  viewMode,
  onChange,
  className = '',
}: ViewModeToggleProps) {
  return (
    <div
      className={`view-mode-toggle-group ${className}`.trim()}
      role="group"
      aria-label="App card display view mode"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        background: '#141416',
        padding: '3px',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.09)',
        flexShrink: 0,
      }}
    >
      {/* Grid View Option */}
      <button
        id="view-mode-grid-btn"
        type="button"
        data-active={viewMode === 'grid'}
        onClick={() => onChange('grid')}
        title="Grid View (Standard Cards)"
        aria-label="Grid View"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.42rem 0.58rem',
          background: viewMode === 'grid' ? '#E50914' : 'transparent',
          color: viewMode === 'grid' ? '#FFFFFF' : '#8e8e93',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          boxShadow: viewMode === 'grid' ? '0 2px 8px rgba(229, 9, 20, 0.35)' : 'none',
        }}
      >
        <LayoutGrid size={16} />
      </button>

      {/* Pill View Option */}
      <button
        id="view-mode-pill-btn"
        type="button"
        data-active={viewMode === 'pill'}
        onClick={() => onChange('pill')}
        title="Pill View (Horizontal Cards)"
        aria-label="Pill View"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.42rem 0.58rem',
          background: viewMode === 'pill' ? '#E50914' : 'transparent',
          color: viewMode === 'pill' ? '#FFFFFF' : '#8e8e93',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          boxShadow: viewMode === 'pill' ? '0 2px 8px rgba(229, 9, 20, 0.35)' : 'none',
        }}
      >
        <Rows3 size={16} />
      </button>
    </div>
  )
}
