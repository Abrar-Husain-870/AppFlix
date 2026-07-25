'use client'

import { useActionState, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { submitProject } from '@/app/actions/submit'
import { Upload, X, Loader2, CheckCircle, Globe, GitBranch, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'

const PLATFORMS = ['web', 'ios', 'android', 'windows', 'macos', 'linux', 'browser_extension']
const STAGES    = [
  { value: 'beta',       label: 'Beta',       desc: 'Functional but still being tested' },
  { value: 'production', label: 'Production',  desc: 'Stable and actively maintained' },
]

interface Category { id: number; name: string; slug: string }

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p style={{ color: '#FF6B6B', fontSize: '0.78rem', marginTop: '0.3rem' }}>{msg}</p>
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#CCCCCC', marginBottom: '0.4rem' }}>
      {children}{required && <span style={{ color: '#E50914', marginLeft: '2px' }}>*</span>}
    </label>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.7rem 0.9rem',
  background: '#262626', border: '1px solid #2B2B2B',
  borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.9rem',
  outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box',
}

export default function SubmitPage() {
  const [state, action, pending] = useActionState(submitProject, undefined)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [iconUrl, setIconUrl] = useState('')
  const [screenshotUrls, setScreenshotUrls] = useState<string[]>([])
  const [uploadingIcon, setUploadingIcon] = useState(false)
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
    supabase.from('categories').select('id, name, slug').order('name').then(({ data }) => setCategories(data ?? []))
  }, [])

  function togglePlatform(p: string) {
    setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  async function uploadFile(file: File, bucket: string, onDone: (url: string) => void) {
    if (!userId) return
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${userId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (error) { alert('Upload failed: ' + error.message); return }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    onDone(data.publicUrl)
  }

  async function handleIconUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingIcon(true)
    await uploadFile(file, 'icons', (url) => setIconUrl(url))
    setUploadingIcon(false)
  }

  async function handleScreenshotUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploadingScreenshot(true)
    for (const file of files) {
      await uploadFile(file, 'project-images', (url) => setScreenshotUrls(prev => [...prev, url]))
    }
    setUploadingScreenshot(false)
  }

  const fe = state?.fieldErrors ?? {}

  return (
    <div style={{ minHeight: '100vh', background: '#141414', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div className="accent-line" style={{ width: '2rem', marginBottom: '0.5rem' }} />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.03em', marginBottom: '0.35rem' }}>
            Submit Your Project
          </h1>
          <p style={{ color: '#AAAAAA', fontSize: '0.9rem' }}>
            Share what you've built with the university community. All submissions are reviewed by an admin before going live.
          </p>
        </div>

        {/* Global error */}
        {state?.error && (
          <div style={{
            background: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.3)',
            borderRadius: '0.6rem', padding: '0.85rem 1rem',
            color: '#FF6B6B', fontSize: '0.875rem', marginBottom: '1.5rem',
          }}>
            {state.error}
          </div>
        )}

        <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Hidden fields for file URLs + platforms */}
          <input type="hidden" name="icon_url" value={iconUrl} />
          {screenshotUrls.map((url, i) => (
            <input key={i} type="hidden" name="screenshot_urls" value={url} />
          ))}
          {selectedPlatforms.map(p => (
            <input key={p} type="hidden" name="platforms" value={p} />
          ))}

          {/* ── App Icon ── */}
          <div style={{ background: '#1F1F1F', border: '1px solid #2B2B2B', borderRadius: '0.75rem', padding: '1.25rem' }}>
            <Label>App Icon</Label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '0.75rem',
                background: '#262626', border: '1px solid #2B2B2B',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', flexShrink: 0,
              }}>
                {iconUrl
                  ? <img src={iconUrl} alt="Icon preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <ImageIcon size={24} style={{ color: '#444' }} />}
              </div>
              <div>
                <label htmlFor="icon-upload" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.5rem 1rem', background: '#262626',
                  border: '1px solid #2B2B2B', borderRadius: '0.4rem',
                  color: '#FFFFFF', fontSize: '0.85rem', fontWeight: 500,
                  cursor: 'pointer', transition: 'border-color 0.2s',
                }}>
                  {uploadingIcon ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  {uploadingIcon ? 'Uploading…' : 'Upload icon'}
                </label>
                <input id="icon-upload" type="file" accept="image/*" onChange={handleIconUpload} style={{ display: 'none' }} />
                <p style={{ color: '#555', fontSize: '0.75rem', marginTop: '0.4rem' }}>PNG/JPG, 512×512px recommended</p>
              </div>
            </div>
          </div>

          {/* ── Basic Info ── */}
          <div style={{ background: '#1F1F1F', border: '1px solid #2B2B2B', borderRadius: '0.75rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>Basic Info</h2>

            <div>
              <Label required>Project Name</Label>
              <input id="project-name" name="name" type="text" placeholder="e.g. CampusMap" required maxLength={60} style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = '#E50914'}
                onBlur={e => e.currentTarget.style.borderColor = '#2B2B2B'} />
              <FieldError msg={fe.name} />
            </div>

            <div>
              <Label required>Tagline <span style={{ color: '#555', fontWeight: 400 }}>(one sentence)</span></Label>
              <input id="project-tagline" name="tagline" type="text" placeholder="A maps app built for students, by students." required maxLength={100} style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = '#E50914'}
                onBlur={e => e.currentTarget.style.borderColor = '#2B2B2B'} />
              <FieldError msg={fe.tagline} />
            </div>

            <div>
              <Label required>Description</Label>
              <textarea id="project-description" name="description" placeholder="Tell people what your project does, why you built it, and what makes it special…" required rows={5}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
                onFocus={e => e.currentTarget.style.borderColor = '#E50914'}
                onBlur={e => e.currentTarget.style.borderColor = '#2B2B2B'}
              />
              <FieldError msg={fe.description} />
            </div>
          </div>

          {/* ── Category, Stage, Platforms ── */}
          <div style={{ background: '#1F1F1F', border: '1px solid #2B2B2B', borderRadius: '0.75rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>Classification</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <Label required>Category</Label>
                <select id="project-category" name="category_id" required
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#E50914'}
                  onBlur={e => e.currentTarget.style.borderColor = '#2B2B2B'}
                >
                  <option value="">Select category…</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <FieldError msg={fe.category_id} />
              </div>

              <div>
                <Label required>Stage</Label>
                <select id="project-stage" name="stage" required
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#E50914'}
                  onBlur={e => e.currentTarget.style.borderColor = '#2B2B2B'}
                >
                  <option value="">Select stage…</option>
                  {STAGES.map(s => (
                    <option key={s.value} value={s.value}>{s.label} — {s.desc}</option>
                  ))}
                </select>
                <FieldError msg={fe.stage} />
              </div>
            </div>

            <div>
              <Label required>Platforms</Label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {PLATFORMS.map(p => {
                  const active = selectedPlatforms.includes(p)
                  const label = p.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                  return (
                    <button
                      key={p}
                      type="button"
                      id={`platform-${p}`}
                      onClick={() => togglePlatform(p)}
                      style={{
                        padding: '0.4rem 0.9rem', fontSize: '0.82rem', fontWeight: 500,
                        background: active ? 'rgba(229,9,20,0.15)' : '#262626',
                        border: `1px solid ${active ? 'rgba(229,9,20,0.5)' : '#2B2B2B'}`,
                        color: active ? '#FFFFFF' : '#AAAAAA',
                        borderRadius: '9999px', cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
              <FieldError msg={fe.platforms} />
            </div>
          </div>

          {/* ── Links ── */}
          <div style={{ background: '#1F1F1F', border: '1px solid #2B2B2B', borderRadius: '0.75rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>Links <span style={{ color: '#555', fontWeight: 400 }}>(optional)</span></h2>

            <div>
              <Label>Website URL</Label>
              <div style={{ position: 'relative' }}>
                <Globe size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
                <input id="website-url" name="website_url" type="url" placeholder="https://yourproject.com" style={{ ...inputStyle, paddingLeft: '2.4rem' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#E50914'}
                  onBlur={e => e.currentTarget.style.borderColor = '#2B2B2B'} />
              </div>
            </div>

            <div>
              <Label>GitHub URL</Label>
              <div style={{ position: 'relative' }}>
                <GitBranch size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
                <input id="github-url" name="github_url" type="url" placeholder="https://github.com/you/project" style={{ ...inputStyle, paddingLeft: '2.4rem' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#E50914'}
                  onBlur={e => e.currentTarget.style.borderColor = '#2B2B2B'} />
              </div>
            </div>
          </div>

          {/* ── Screenshots ── */}
          <div style={{ background: '#1F1F1F', border: '1px solid #2B2B2B', borderRadius: '0.75rem', padding: '1.25rem' }}>
            <Label>Screenshots <span style={{ color: '#555', fontWeight: 400 }}>(up to 5)</span></Label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              {screenshotUrls.map((url, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={url} alt={`Screenshot ${i + 1}`} style={{ height: '80px', width: 'auto', borderRadius: '0.4rem', border: '1px solid #2B2B2B', objectFit: 'cover' }} />
                  <button type="button" onClick={() => setScreenshotUrls(prev => prev.filter((_, j) => j !== i))}
                    style={{
                      position: 'absolute', top: '-6px', right: '-6px',
                      width: '20px', height: '20px', borderRadius: '50%',
                      background: '#E50914', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                    <X size={11} style={{ color: '#fff' }} />
                  </button>
                </div>
              ))}
              {screenshotUrls.length < 5 && (
                <label style={{
                  width: '80px', height: '80px', borderRadius: '0.4rem',
                  border: '2px dashed #2B2B2B', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '0.25rem',
                  cursor: 'pointer', color: '#555', fontSize: '0.7rem', transition: 'border-color 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#E50914'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#2B2B2B'}
                >
                  {uploadingScreenshot ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  {uploadingScreenshot ? 'Uploading' : 'Add'}
                  <input type="file" accept="image/*" multiple onChange={handleScreenshotUpload} style={{ display: 'none' }} disabled={uploadingScreenshot} />
                </label>
              )}
            </div>
            <p style={{ color: '#555', fontSize: '0.75rem' }}>Upload files directly to storage before submitting. PNG/JPG, max 5MB each.</p>
          </div>

          {/* Submit button */}
          <button
            id="submit-project-btn"
            type="submit"
            disabled={pending || uploadingIcon || uploadingScreenshot}
            style={{
              width: '100%', padding: '0.9rem',
              background: (pending || uploadingIcon || uploadingScreenshot) ? '#8B0000' : '#E50914',
              color: '#FFFFFF', fontWeight: 700, fontSize: '1rem',
              border: 'none', borderRadius: '0.6rem',
              cursor: (pending || uploadingIcon || uploadingScreenshot) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              transition: 'background 0.2s', boxShadow: '0 4px 20px rgba(229,9,20,0.25)',
            }}
          >
            {pending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
            {pending ? 'Submitting…' : 'Submit for Review'}
          </button>

          <p style={{ textAlign: 'center', color: '#555', fontSize: '0.8rem' }}>
            Your project will be reviewed by an admin and go live once approved. You&apos;ll find it in your{' '}
            <Link href="/dashboard/projects" style={{ color: '#E50914', textDecoration: 'none' }}>dashboard</Link>.
          </p>
        </form>
      </div>
    </div>
  )
}
