'use client'

import { useActionState, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { submitProject, uploadScreenshotAction } from '@/app/actions/submit'
import { Upload, X, Loader2, CheckCircle, Globe, GitBranch, Smartphone, Image as ImageIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import IconUploadCropper from '@/components/projects/IconUploadCropper'

const PLATFORMS = ['web', 'ios', 'android', 'windows', 'macos', 'linux', 'browser_extension']
const STAGES    = [
  { value: 'beta',       label: 'Beta',       desc: 'Functional but still being tested' },
  { value: 'production', label: 'Production',  desc: 'Stable and actively maintained' },
]

const AVAILABLE_TAGS = [
  'notes', 'assignments', 'study', 'exams', 'attendance', 'timetable',
  'hostel', 'events', 'library', 'canteen', 'todo', 'calendar',
  'reminders', 'productivity', 'ai', 'chatbot', 'web', 'mobile',
  'react', 'python', 'offline', 'open-source', 'authentication',
  'analytics', 'pdf', 'images', 'internships', 'resume', 'calculator',
  'scanner', 'Other'
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
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [appName, setAppName] = useState('')
  const [tagline, setTagline] = useState('')
  const [iconUrl, setIconUrl] = useState('')
  const [screenshotUrls, setScreenshotUrls] = useState<string[]>([])
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false)
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/login?redirectTo=/submit')
      } else {
        setUserId(data.user.id)
        setCheckingAuth(false)
      }
    })
    supabase.from('categories').select('id, name, slug').order('name').then(({ data }) => setCategories(data ?? []))
  }, [router])

  if (checkingAuth) {
    return (
      <div style={{
        minHeight: '100vh', background: '#080808',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#FFFFFF',
      }}>
        <Loader2 size={36} className="animate-spin" style={{ color: '#E50914' }} />
      </div>
    )
  }

  function togglePlatform(p: string) {
    setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  function toggleTag(t: string) {
    setSelectedTags(prev => {
      if (prev.includes(t)) return prev.filter(x => x !== t)
      if (prev.length >= 5) return prev
      return [...prev, t]
    })
  }

  async function uploadFile(file: File, onDone: (url: string) => void) {
    if (!userId) {
      alert('You must be signed in to upload screenshots.')
      return
    }

    const supabase = createClient()
    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token

    // 1. Try Server Action first (Native Next.js RPC, eliminates manual HTTP parsing glitches)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const actionRes = await uploadScreenshotAction(formData, accessToken)
      if (actionRes?.url) {
        onDone(actionRes.url)
        return
      }
    } catch (actionErr) {
      console.warn('Server action upload failed, trying API route fallback:', actionErr)
    }

    // 2. Try server API route with Bearer token authentication
    try {
      const formData = new FormData()
      formData.append('file', file)

      const headers: Record<string, string> = {}
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
      }

      const res = await fetch('/api/upload/screenshot', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: formData,
      })

      if (res.ok) {
        const contentType = res.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
          const data = await res.json()
          if (data?.url) {
            onDone(data.url)
            return
          }
        }
      }
    } catch (apiErr) {
      console.warn('Server upload route failed, attempting direct storage fallback:', apiErr)
    }

    // 3. Direct client-side Supabase storage fallback (with auto-recovery for response gzip decoding)
    try {
      const ext = file.name.split('.').pop() || 'png'
      const randomSuffix = Math.random().toString(36).substring(2, 8)
      const path = `${userId}/screenshot-${Date.now()}-${randomSuffix}.${ext}`

      const { error: storageError } = await supabase.storage
        .from('project-images')
        .upload(path, file, { contentType: file.type || 'image/png', upsert: true })

      if (storageError) {
        const errMsg = storageError.message || ''
        // If the error was the known V8/storage-js JSON decoding issue on gzip responses,
        // verify whether the file was successfully written to the bucket.
        if (errMsg.includes('Unexpected token') || errMsg.includes('JSON')) {
          const { data: urlData } = supabase.storage.from('project-images').getPublicUrl(path)
          if (urlData?.publicUrl) {
            try {
              const checkRes = await fetch(urlData.publicUrl, { method: 'HEAD' })
              if (checkRes.ok) {
                onDone(urlData.publicUrl)
                return
              }
            } catch {
              // File not reachable, rethrow
            }
          }
        }
        throw new Error(storageError.message)
      }

      const { data: urlData } = supabase.storage.from('project-images').getPublicUrl(path)
      if (urlData?.publicUrl) {
        onDone(urlData.publicUrl)
        return
      }
    } catch (fallbackErr: any) {
      console.error('Direct storage upload error:', fallbackErr)
      alert('Upload failed: ' + (fallbackErr?.message || 'Could not upload image. Please try a different or smaller image.'))
    }
  }

  async function handleScreenshotUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploadingScreenshot(true)
    for (const file of files) {
      await uploadFile(file, (url) => setScreenshotUrls(prev => [...prev, url]))
    }
    setUploadingScreenshot(false)
    e.target.value = ''
  }

  const fe = state?.fieldErrors ?? {}

  return (
    <div style={{ minHeight: '100vh', background: '#080808', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div className="accent-line" style={{ width: '2rem', marginBottom: '0.5rem' }} />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.03em', marginBottom: '0.35rem' }}>
            Submit Your App
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
          {selectedTags.map(t => (
            <input key={t} type="hidden" name="tags" value={t} />
          ))}

          {/* ── App Icon ── */}
          <div style={{ background: '#1F1F1F', border: '1px solid #2B2B2B', borderRadius: '0.75rem', padding: '1.25rem' }}>
            <Label required>App Icon</Label>
            <IconUploadCropper
              currentIconUrl={iconUrl}
              appName={appName}
              tagline={tagline || 'A maps app built for students, by students.'}
              userId={userId || undefined}
              onIconChange={(url) => setIconUrl(url)}
            />
          </div>

          {/* ── Basic Info ── */}
          <div style={{ background: '#1F1F1F', border: '1px solid #2B2B2B', borderRadius: '0.75rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>Basic Info</h2>

            <div>
              <Label required>App Name</Label>
              <input id="project-name" name="name" type="text" placeholder="e.g. CampusMap" required maxLength={60} style={inputStyle}
                value={appName}
                onChange={e => setAppName(e.target.value)}
                onFocus={e => e.currentTarget.style.borderColor = '#E50914'}
                onBlur={e => e.currentTarget.style.borderColor = '#2B2B2B'} />
              <FieldError msg={fe.name} />
            </div>

            <div>
              <Label required>Tagline <span style={{ color: '#555', fontWeight: 400 }}>(one sentence)</span></Label>
              <input id="project-tagline" name="tagline" type="text" placeholder="A maps app built for students, by students." required maxLength={100} style={inputStyle}
                value={tagline}
                onChange={e => setTagline(e.target.value)}
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

            <div>
              <Label>Tags <span style={{ color: '#555', fontWeight: 400 }}>(Choose up to 5)</span></Label>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                {AVAILABLE_TAGS.map(t => {
                  const active = selectedTags.includes(t)
                  return (
                    <button
                      key={t}
                      type="button"
                      id={`tag-${t}`}
                      onClick={() => toggleTag(t)}
                      style={{
                        padding: '0.35rem 0.8rem', fontSize: '0.78rem', fontWeight: 500,
                        background: active ? 'rgba(229,9,20,0.15)' : '#262626',
                        border: `1px solid ${active ? 'rgba(229,9,20,0.5)' : '#2B2B2B'}`,
                        color: active ? '#FFFFFF' : '#AAAAAA',
                        borderRadius: '9999px', cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      {t}
                    </button>
                  )
                })}
              </div>
              <FieldError msg={fe.tags} />
            </div>
          </div>

          {/* ── Links ── */}
          <div style={{ background: '#1F1F1F', border: '1px solid #2B2B2B', borderRadius: '0.75rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 0.15rem' }}>
                Links <span style={{ color: '#E50914', fontWeight: 600, fontSize: '0.78rem' }}>*&nbsp;at least one required</span>
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#555', margin: 0 }}>Add your app's website, GitHub repo, App Store, or Play Store link.</p>
            </div>

            {/* Website URL */}
            <div>
              <Label>Website URL</Label>
              <div style={{ position: 'relative' }}>
                <Globe size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
                <input id="website-url" name="website_url" type="url" placeholder="https://yourproject.com" style={{ ...inputStyle, paddingLeft: '2.4rem' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#E50914'}
                  onBlur={e => e.currentTarget.style.borderColor = '#2B2B2B'} />
              </div>
            </div>

            {/* GitHub URL */}
            <div>
              <Label>GitHub URL</Label>
              <div style={{ position: 'relative' }}>
                <GitBranch size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
                <input id="github-url" name="github_url" type="url" placeholder="https://github.com/you/project" style={{ ...inputStyle, paddingLeft: '2.4rem' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#E50914'}
                  onBlur={e => e.currentTarget.style.borderColor = '#2B2B2B'} />
              </div>
            </div>

            {/* App Store URL */}
            <div>
              <Label>App Store URL</Label>
              <div style={{ position: 'relative' }}>
                <Smartphone size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
                <input id="appstore-url" name="appstore_url" type="url" placeholder="https://apps.apple.com/app/…" style={{ ...inputStyle, paddingLeft: '2.4rem' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#E50914'}
                  onBlur={e => e.currentTarget.style.borderColor = '#2B2B2B'} />
              </div>
            </div>

            {/* Play Store URL */}
            <div>
              <Label>Play Store URL</Label>
              <div style={{ position: 'relative' }}>
                <Smartphone size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
                <input id="playstore-url" name="playstore_url" type="url" placeholder="https://play.google.com/store/apps/details?id=…" style={{ ...inputStyle, paddingLeft: '2.4rem' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#E50914'}
                  onBlur={e => e.currentTarget.style.borderColor = '#2B2B2B'} />
              </div>
            </div>

            <FieldError msg={fe.links} />
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
            disabled={pending || uploadingScreenshot}
            style={{
              width: '100%', padding: '0.9rem',
              background: (pending || uploadingScreenshot) ? '#8B0000' : '#E50914',
              color: '#FFFFFF', fontWeight: 700, fontSize: '1rem',
              border: 'none', borderRadius: '0.6rem',
              cursor: (pending || uploadingScreenshot) ? 'not-allowed' : 'pointer',
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
