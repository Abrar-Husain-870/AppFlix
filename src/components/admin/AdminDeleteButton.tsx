'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { adminDeleteProject } from '@/app/actions/admin'

export default function AdminDeleteButton({ projectId, appName }: { projectId: string; appName: string }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [reason, setReason] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    startTransition(async () => {
      try {
        await adminDeleteProject(projectId, reason || 'Removed by admin')
        router.push('/browse?removed=true')
        router.refresh()
      } catch (err: any) {
        alert(err.message || 'Failed to delete app.')
      }
    })
  }

  return (
    <>
      <button
        id="admin-delete-app-btn"
        onClick={() => setShowConfirm(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem',
          padding: '0.6rem 1rem',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          color: '#EF4444',
          fontWeight: 700,
          fontSize: '0.85rem',
          borderRadius: '0.5rem',
          cursor: 'pointer',
          transition: 'all 0.2s',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = '#EF4444'
          e.currentTarget.style.color = '#FFFFFF'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'
          e.currentTarget.style.color = '#EF4444'
        }}
      >
        <Trash2 size={14} /> Delete App (Admin)
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
        }}>
          <div style={{
            background: '#1A1A1A',
            border: '1px solid #333333',
            borderRadius: '0.85rem',
            padding: '1.75rem',
            maxWidth: '460px',
            width: '100%',
            boxShadow: '0 20px 50px rgba(0,0,0,0.9)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#EF4444', marginBottom: '0.75rem' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                Remove &quot;{appName}&quot;?
              </h3>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#AAAAAA', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              This app will be immediately withdrawn from the public browse directory and all search listings. The developer will see it listed under <strong style={{ color: '#FFF' }}>&quot;Removed by Admin&quot;</strong> in their dashboard.
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#DDDDDD', marginBottom: '0.4rem', fontWeight: 600 }}>
                Removal Reason (optional):
              </label>
              <input
                type="text"
                placeholder="e.g. Violation of platform guidelines"
                value={reason}
                onChange={e => setReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: '#111111',
                  border: '1px solid #333333',
                  borderRadius: '0.4rem',
                  color: '#FFFFFF',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isPending}
                style={{
                  padding: '0.55rem 1.1rem',
                  background: '#262626',
                  border: '1px solid #333333',
                  color: '#CCCCCC',
                  borderRadius: '0.4rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                style={{
                  padding: '0.55rem 1.25rem',
                  background: '#EF4444',
                  border: 'none',
                  color: '#FFFFFF',
                  borderRadius: '0.4rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                {isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
