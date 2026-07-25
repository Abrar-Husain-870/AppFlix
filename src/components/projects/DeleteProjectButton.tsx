'use client'

import { useState, useTransition } from 'react'
import { deleteProject } from '@/app/actions/project-management'
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'

interface Props {
  projectId: string
  projectName: string
}

export default function DeleteProjectButton({ projectId, projectName }: Props) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteProject(projectId)
        setShowConfirm(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong')
      }
    })
  }

  return (
    <>
      {/* Delete Trigger Button */}
      <button
        id={`delete-project-${projectId}`}
        type="button"
        onClick={() => setShowConfirm(true)}
        title="Delete project"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '32px', height: '32px', borderRadius: '0.4rem',
          background: 'transparent', border: '1px solid transparent',
          color: '#666', cursor: 'pointer', transition: 'all 0.15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(229,9,20,0.1)'
          e.currentTarget.style.borderColor = 'rgba(229,9,20,0.3)'
          e.currentTarget.style.color = '#E50914'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.borderColor = 'transparent'
          e.currentTarget.style.color = '#666'
        }}
      >
        <Trash2 size={15} />
      </button>

      {/* Confirmation Modal Overlay */}
      {showConfirm && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowConfirm(false) }}
        >
          <div style={{
            background: '#1F1F1F', border: '1px solid #2B2B2B',
            borderRadius: '1rem', padding: '2rem', maxWidth: '420px', width: '100%',
            animation: 'slideUp 0.2s ease',
          }}>
            {/* Icon */}
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%',
              background: 'rgba(229,9,20,0.12)', border: '1px solid rgba(229,9,20,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}>
              <AlertTriangle size={24} style={{ color: '#E50914' }} />
            </div>

            <h3 style={{
              fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF',
              textAlign: 'center', marginBottom: '0.5rem',
            }}>
              Remove from AppFlix?
            </h3>
            <p style={{
              fontSize: '0.875rem', color: '#AAAAAA',
              textAlign: 'center', lineHeight: 1.6, marginBottom: '1.5rem',
            }}>
              Are you sure you want to remove{' '}
              <strong style={{ color: '#FFFFFF' }}>&quot;{projectName}&quot;</strong>{' '}
              from the AppFlix list? This action will hide it from the platform immediately.
            </p>

            {error && (
              <p style={{
                background: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.3)',
                borderRadius: '0.4rem', padding: '0.6rem 0.8rem',
                color: '#FF6B6B', fontSize: '0.8rem', marginBottom: '1rem', textAlign: 'center',
              }}>
                {error}
              </p>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                id={`cancel-delete-${projectId}`}
                type="button"
                onClick={() => { setShowConfirm(false); setError(null) }}
                disabled={isPending}
                style={{
                  flex: 1, padding: '0.75rem',
                  background: '#262626', border: '1px solid #2B2B2B',
                  borderRadius: '0.5rem', color: '#FFFFFF',
                  fontWeight: 600, fontSize: '0.875rem',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                Cancel
              </button>
              <button
                id={`confirm-delete-${projectId}`}
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                style={{
                  flex: 1, padding: '0.75rem',
                  background: isPending ? '#8B0000' : '#E50914',
                  border: '1px solid transparent',
                  borderRadius: '0.5rem', color: '#FFFFFF',
                  fontWeight: 700, fontSize: '0.875rem',
                  cursor: isPending ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                  transition: 'all 0.15s',
                }}
              >
                {isPending ? (
                  <><Loader2 size={14} className="animate-spin" /> Removing…</>
                ) : (
                  <><Trash2 size={14} /> Yes, Remove It</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  )
}
