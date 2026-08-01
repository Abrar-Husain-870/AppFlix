'use client'

import { useActionState, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateProjectText, updateProjectMedia } from '@/app/actions/project-management'
import {
  Upload, X, Loader2, CheckCircle, Globe, GitBranch,
  Image as ImageIcon, ArrowLeft, AlertTriangle, Info
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const PLATFORMS = ['web', 'ios', 'android', 'windows', 'macos', 'linux', 'browser_extension']
const STAGES = [
  { value: 'beta',       label: 'Beta',       desc: 'Functional but still being tested' },
  { value: 'production', label: 'Production',  desc: 'Stable and actively maintained' },
]

interface Category { id: number; name: string; slug: string }

interface Project {
  id: string
  name: string
  tagline: string
  description: string
  category_id: number
  stage: string
  platforms: string[]
  is_open_source: boolean
  is_free: boolean
  icon_url: string | null
  website_url: string | null
  github_url: string | null
  appstore_url: string | null
  playstore_url: string | null
  status: string
  tags?: string[]
  project_images: { url: string; display_order: number }[]
}

const AVAILABLE_TAGS = [
  'notes', 'assignments', 'study', 'exams', 'attendance', 'timetable',
  'hostel', 'events', 'library', 'canteen', 'todo', 'calendar',
  'reminders', 'productivity', 'ai', 'chatbot', 'web', 'mobile',
  'react', 'python', 'offline', 'open-source', 'authentication',
  'analytics', 'pdf', 'images', 'internships', 'resume', 'calculator',
  'scanner', 'Other'
]

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

export default function EditProjectClient({ project }: { project: Project }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'text' | 'media'>('text')

  // Text form state
  const [textState, textAction, textPending] = useActionState(updateProjectText, undefined)
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(project.platforms ?? [])
  const [selectedTags, setSelectedTags] = useState<string[]>(project.tags ?? [])
  const [isOpenSource, setIsOpenSource] = useState(project.is_open_source)
  const [isFree, setIsFree] = useState(project.is_free)
  const [categories, setCategories] = useState<Category[]>([])

  // Media form state
  const [mediaState, mediaAction, mediaPending] = useActionState(updateProjectMedia, undefined)
  const [iconUrl, setIconUrl] = useState(project.icon_url ?? '')
  const [screenshotUrls, setScreenshotUrls] = useState<string[]>(
    (project.project_images ?? [])
      .sort((a, b) => a.display_order - b.display_order)
      .map(i => i.url)
  )
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

  function toggleTag(t: string) {
    setSelectedTags(prev => {
      if (prev.includes(t)) return prev.filter(x => x !== t)
      if (prev.length >= 5) return prev
      return [...prev, t]
    })
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

  const tabStyle = (tab: 'text' | 'media'): React.CSSProperties => ({
    padding: '0.65rem 1.25rem',
    fontSize: '0.875rem', fontWeight: 600,
    background: activeTab === tab ? '#E50914' : 'transparent',
    color: activeTab === tab ? '#FFFFFF' : '#AAAAAA',
    border: activeTab === tab ? '1px solid #E50914' : '1px solid #2B2B2B',
    borderRadius: '0.5rem', cursor: 'pointer',
    transition: 'all 0.2s',
  })

  return (
    <div style={{ minHeight: '100vh', background: '#141414', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <Link href="/dashboard/projects" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            color: '#AAAAAA', fontSize: '0.85rem', textDecoration: 'none',
            marginBottom: '1rem',
          }}>
            <ArrowLeft size={14} /> Back to My Projects
          </Link>
          <div className="accent-line" style={{ width: '2rem', marginBottom: '0.5rem' }} />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>
            Edit Project
          </h1>
          <p style={{ color: '#AAAAAA', fontSize: '0.875rem' }}>
            <strong style={{ color: '#FFFFFF' }}>{project.name}</strong> · Last status:{' '}
            <span style={{ color: project.status === 'approved' ? '#2ECC71' : project.status === 'pending' ? '#F39C12' : '#AAAAAA', textTransform: 'capitalize' }}>
              {project.status}
            </span>
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem' }}>
          <button id="tab-text" type="button" onClick={() => setActiveTab('text')} style={tabStyle('text')}>
            ✏️ Instant Edit
          </button>
          <button id="tab-media" type="button" onClick={() => setActiveTab('media')} style={tabStyle('media')}>
            🖼️ Media & URLs
          </button>
        </div>

        {/* ───────────── TAB 1: INSTANT TEXT EDITS ───────────── */}
        {activeTab === 'text' && (
          <div>
            {/* Info banner */}
            <div style={{
              background: 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.25)',
              borderRadius: '0.6rem', padding: '0.85rem 1rem',
              color: '#2ECC71', fontSize: '0.82rem', marginBottom: '1.5rem',
              display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
            }}>
              <Info size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>Changes here are applied <strong>instantly</strong> without requiring admin re-approval. Your app stays live on the platform.</span>
            </div>

            {textState?.error && (
              <div style={{
                background: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.3)',
                borderRadius: '0.6rem', padding: '0.85rem 1rem',
                color: '#FF6B6B', fontSize: '0.875rem', marginBottom: '1.5rem',
              }}>
                {textState.error}
              </div>
            )}

            <form action={textAction} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <input type="hidden" name="project_id" value={project.id} />
              <input type="hidden" name="is_open_source" value={String(isOpenSource)} />
              <input type="hidden" name="is_free" value={String(isFree)} />
              {selectedPlatforms.map(p => (
                <input key={p} type="hidden" name="platforms" value={p} />
              ))}
              {selectedTags.map(t => (
                <input key={t} type="hidden" name="tags" value={t} />
              ))}

              {/* Basic Info */}
              <div style={{ background: '#1F1F1F', border: '1px solid #2B2B2B', borderRadius: '0.75rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>Basic Info</h2>

                <div>
                  <Label required>Project Name</Label>
                  <input
                    id="edit-name" name="name" type="text" required maxLength={60}
                    defaultValue={project.name} style={inputStyle}
                    onFocus={e => e.currentTarget.style.borderColor = '#E50914'}
                    onBlur={e => e.currentTarget.style.borderColor = '#2B2B2B'}
                  />
                </div>

                <div>
                  <Label required>Tagline</Label>
                  <input
                    id="edit-tagline" name="tagline" type="text" required maxLength={120}
                    defaultValue={project.tagline} style={inputStyle}
                    onFocus={e => e.currentTarget.style.borderColor = '#E50914'}
                    onBlur={e => e.currentTarget.style.borderColor = '#2B2B2B'}
                  />
                </div>

                <div>
                  <Label required>Description</Label>
                  <textarea
                    id="edit-description" name="description" required rows={6}
                    defaultValue={project.description}
                    style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
                    onFocus={e => e.currentTarget.style.borderColor = '#E50914'}
                    onBlur={e => e.currentTarget.style.borderColor = '#2B2B2B'}
                  />
                </div>
              </div>

              {/* Classification */}
              <div style={{ background: '#1F1F1F', border: '1px solid #2B2B2B', borderRadius: '0.75rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>Classification</h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <Label required>Category</Label>
                    <select id="edit-category" name="category_id" required
                      defaultValue={project.category_id}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                      onFocus={e => e.currentTarget.style.borderColor = '#E50914'}
                      onBlur={e => e.currentTarget.style.borderColor = '#2B2B2B'}
                    >
                      <option value="">Select category…</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label required>Stage</Label>
                    <select id="edit-stage" name="stage" required
                      defaultValue={project.stage}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                      onFocus={e => e.currentTarget.style.borderColor = '#E50914'}
                      onBlur={e => e.currentTarget.style.borderColor = '#2B2B2B'}
                    >
                      <option value="">Select stage…</option>
                      {STAGES.map(s => (
                        <option key={s.value} value={s.value}>{s.label} — {s.desc}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Platforms */}
                <div>
                  <Label required>Platforms</Label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {PLATFORMS.map(p => {
                      const active = selectedPlatforms.includes(p)
                      const label = p.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                      return (
                        <button key={p} type="button" id={`platform-${p}`} onClick={() => togglePlatform(p)}
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
                </div>

                {/* Tags */}
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
                </div>

                {/* Toggles */}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Open Source', value: isOpenSource, setter: setIsOpenSource },
                    { label: 'Free',        value: isFree,       setter: setIsFree },
                  ].map(({ label, value, setter }) => (
                    <button key={label} type="button"
                      onClick={() => setter(!value)}
                      style={{
                        padding: '0.4rem 0.9rem', fontSize: '0.82rem', fontWeight: 500,
                        background: value ? 'rgba(229,9,20,0.15)' : '#262626',
                        border: `1px solid ${value ? 'rgba(229,9,20,0.5)' : '#2B2B2B'}`,
                        color: value ? '#FFFFFF' : '#AAAAAA',
                        borderRadius: '9999px', cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      {value ? '✓ ' : ''}{label}
                    </button>
                  ))}
                </div>
              </div>

              <button id="save-text-btn" type="submit" disabled={textPending}
                style={{
                  width: '100%', padding: '0.9rem',
                  background: textPending ? '#8B0000' : '#E50914',
                  color: '#FFFFFF', fontWeight: 700, fontSize: '1rem',
                  border: 'none', borderRadius: '0.6rem',
                  cursor: textPending ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  transition: 'background 0.2s', boxShadow: '0 4px 20px rgba(229,9,20,0.25)',
                }}
              >
                {textPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                {textPending ? 'Saving…' : 'Save Changes Instantly'}
              </button>
            </form>
          </div>
        )}

        {/* ───────────── TAB 2: MEDIA & URL EDITS ───────────── */}
        {activeTab === 'media' && (
          <div>
            {/* Warning banner */}
            <div style={{
              background: 'rgba(243,156,18,0.08)', border: '1px solid rgba(243,156,18,0.3)',
              borderRadius: '0.6rem', padding: '0.85rem 1rem',
              color: '#F39C12', fontSize: '0.82rem', marginBottom: '1.5rem',
              display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
            }}>
              <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>
                Changing images or URLs requires <strong>admin re-approval</strong>. Your app will move to <strong>Pending</strong> status until an admin reviews the changes.
              </span>
            </div>

            {mediaState?.error && (
              <div style={{
                background: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.3)',
                borderRadius: '0.6rem', padding: '0.85rem 1rem',
                color: '#FF6B6B', fontSize: '0.875rem', marginBottom: '1.5rem',
              }}>
                {mediaState.error}
              </div>
            )}

            <form action={mediaAction} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <input type="hidden" name="project_id" value={project.id} />
              <input type="hidden" name="icon_url" value={iconUrl} />
              {screenshotUrls.map((url, i) => (
                <input key={i} type="hidden" name="screenshot_urls" value={url} />
              ))}

              {/* App Icon */}
              <div style={{ background: '#1F1F1F', border: '1px solid #2B2B2B', borderRadius: '0.75rem', padding: '1.25rem' }}>
                <Label>App Icon</Label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '72px', height: '72px', borderRadius: '0.75rem',
                    background: '#262626', border: '1px solid #2B2B2B',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', flexShrink: 0,
                  }}>
                    {iconUrl
                      ? <img src={iconUrl} alt="Icon" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                      {uploadingIcon ? 'Uploading…' : 'Change Icon'}
                    </label>
                    <input id="icon-upload" type="file" accept="image/*" onChange={handleIconUpload} style={{ display: 'none' }} />
                    <p style={{ color: '#555', fontSize: '0.75rem', marginTop: '0.4rem' }}>PNG/JPG, 512×512px recommended</p>
                  </div>
                </div>
              </div>

              {/* Screenshots */}
              <div style={{ background: '#1F1F1F', border: '1px solid #2B2B2B', borderRadius: '0.75rem', padding: '1.25rem' }}>
                <Label>Screenshots <span style={{ color: '#555', fontWeight: 400 }}>(up to 5)</span></Label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                  {screenshotUrls.map((url, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img src={url} alt={`Screenshot ${i + 1}`}
                        style={{ height: '80px', width: 'auto', borderRadius: '0.4rem', border: '1px solid #2B2B2B', objectFit: 'cover' }} />
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
                      <input type="file" accept="image/*" multiple onChange={handleScreenshotUpload}
                        style={{ display: 'none' }} disabled={uploadingScreenshot} />
                    </label>
                  )}
                </div>
                <p style={{ color: '#555', fontSize: '0.75rem' }}>PNG/JPG, max 5MB each.</p>
              </div>

              {/* URLs */}
              <div style={{ background: '#1F1F1F', border: '1px solid #2B2B2B', borderRadius: '0.75rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>App Links</h2>

                {[
                  { name: 'website_url',   label: 'Website URL',    icon: <Globe size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />, placeholder: 'https://yourproject.com', defaultValue: project.website_url },
                  { name: 'github_url',    label: 'GitHub URL',     icon: <GitBranch size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />, placeholder: 'https://github.com/you/project', defaultValue: project.github_url },
                  { name: 'appstore_url',  label: 'App Store URL',  icon: null, placeholder: 'https://apps.apple.com/…', defaultValue: project.appstore_url },
                  { name: 'playstore_url', label: 'Play Store URL', icon: null, placeholder: 'https://play.google.com/…', defaultValue: project.playstore_url },
                ].map(field => (
                  <div key={field.name}>
                    <Label>{field.label}</Label>
                    <div style={{ position: 'relative' }}>
                      {field.icon}
                      <input
                        id={`edit-${field.name}`} name={field.name} type="url"
                        placeholder={field.placeholder}
                        defaultValue={field.defaultValue ?? ''}
                        style={{ ...inputStyle, paddingLeft: field.icon ? '2.4rem' : undefined }}
                        onFocus={e => e.currentTarget.style.borderColor = '#E50914'}
                        onBlur={e => e.currentTarget.style.borderColor = '#2B2B2B'}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button id="save-media-btn" type="submit"
                disabled={mediaPending || uploadingIcon || uploadingScreenshot}
                style={{
                  width: '100%', padding: '0.9rem',
                  background: (mediaPending || uploadingIcon || uploadingScreenshot) ? '#7A5A00' : '#F39C12',
                  color: '#FFFFFF', fontWeight: 700, fontSize: '1rem',
                  border: 'none', borderRadius: '0.6rem',
                  cursor: (mediaPending || uploadingIcon || uploadingScreenshot) ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  transition: 'background 0.2s', boxShadow: '0 4px 20px rgba(243,156,18,0.2)',
                }}
              >
                {mediaPending ? <Loader2 size={16} className="animate-spin" /> : <AlertTriangle size={16} />}
                {mediaPending ? 'Submitting for Review…' : 'Submit Changes for Re-Approval'}
              </button>

              <p style={{ textAlign: 'center', color: '#555', fontSize: '0.8rem' }}>
                Your app will be temporarily moved to <strong style={{ color: '#F39C12' }}>Pending</strong> until an admin approves these changes.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
