'use client'

import { useActionState, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateProfile, changePassword } from '@/app/actions/account'
import { signOut } from '@/app/actions/auth'
import {
  User, Camera, Globe, GitBranch, AtSign, Briefcase, MapPin,
  Lock, LogOut, CheckCircle, AlertTriangle, Loader2,
  BarChart2, FolderKanban, Shield,
} from 'lucide-react'
import Link from 'next/link'

interface Profile {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  website_url: string | null
  twitter_handle: string | null
  github_url: string | null
  linkedin_url: string | null
  location: string | null
  role: string
  created_at: string
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.7rem 0.9rem',
  background: '#262626', border: '1px solid #2B2B2B',
  borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.9rem',
  outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#1F1F1F', border: '1px solid #2B2B2B', borderRadius: '0.85rem', padding: '1.5rem', marginBottom: '1.25rem' }}>
      <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '1.25rem', letterSpacing: '0.01em' }}>
        {title}
      </h2>
      {children}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#AAAAAA', marginBottom: '0.4rem' }}>
      {children}
    </label>
  )
}

export default function AccountPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [bioLen, setBioLen] = useState(0)

  const [profileState, profileAction, profilePending] = useActionState(updateProfile, undefined)
  const [passwordState, passwordAction, passwordPending] = useActionState(changePassword, undefined)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id
      if (!uid) return
      setUserId(uid)
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single()
      if (prof) {
        setProfile(prof)
        setAvatarUrl(prof.avatar_url ?? '')
        setBioLen(prof.bio?.length ?? 0)
      }
    })
  }, [profileState])

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    setUploadingAvatar(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `avatars/${userId}/avatar.${ext}`
    const { error } = await supabase.storage.from('icons').upload(path, file, { upsert: true })
    if (error) { alert('Upload failed: ' + error.message); setUploadingAvatar(false); return }
    const { data } = supabase.storage.from('icons').getPublicUrl(path)
    setAvatarUrl(data.publicUrl + `?t=${Date.now()}`)
    setUploadingAvatar(false)
  }

  const joinDate = profile ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : ''

  if (!profile) {
    return (
      <div style={{ minHeight: '100vh', background: '#141414', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={28} className="animate-spin" style={{ color: '#E50914' }} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#141414', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div className="accent-line" style={{ width: '2rem', marginBottom: '0.5rem' }} />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.03em', marginBottom: '0.2rem' }}>
            My Account
          </h1>
          <p style={{ color: '#AAAAAA', fontSize: '0.875rem' }}>
            Manage your profile and account settings
          </p>
        </div>

        {/* Quick links */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          {[
            { href: '/dashboard/projects', icon: <FolderKanban size={14} />, label: 'My Apps' },
            { href: '/dashboard/analytics', icon: <BarChart2 size={14} />, label: 'Analytics' },
            ...(profile.role === 'admin' ? [{ href: '/admin/queue', icon: <Shield size={14} />, label: 'Admin Queue' }] : []),
          ].map(item => (
            <Link key={item.href} href={item.href} style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.5rem 1rem', background: '#1F1F1F',
              border: '1px solid #2B2B2B', borderRadius: '0.5rem',
              color: '#AAAAAA', fontSize: '0.82rem', textDecoration: 'none',
              transition: 'border-color 0.2s, color 0.2s',
            }}>
              {item.icon}{item.label}
            </Link>
          ))}
        </div>

        {/* ── Profile form ── */}
        <form action={profileAction}>
          <input type="hidden" name="avatar_url" value={avatarUrl} />

          {/* Avatar + identity */}
          <Section title="Profile">
            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: '80px', height: '80px', borderRadius: '50%',
                  background: '#262626', border: '2px solid #2B2B2B',
                  overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <User size={32} style={{ color: '#444' }} />}
                </div>
                <label htmlFor="avatar-upload" style={{
                  position: 'absolute', bottom: '-2px', right: '-2px',
                  width: '26px', height: '26px', borderRadius: '50%',
                  background: '#E50914', border: '2px solid #141414',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}>
                  {uploadingAvatar ? <Loader2 size={12} className="animate-spin" style={{ color: '#fff' }} /> : <Camera size={12} style={{ color: '#fff' }} />}
                </label>
                <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '1rem' }}>{profile.display_name || profile.username}</p>
                <p style={{ color: '#666', fontSize: '0.82rem' }}>@{profile.username}</p>
                <p style={{ color: '#555', fontSize: '0.75rem', marginTop: '0.3rem' }}>Member since {joinDate}</p>
                {profile.role === 'admin' && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                    fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem',
                    background: 'rgba(229,9,20,0.12)', border: '1px solid rgba(229,9,20,0.3)',
                    borderRadius: '9999px', color: '#E50914', marginTop: '0.35rem',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>
                    <Shield size={10} /> Admin
                  </span>
                )}
              </div>
            </div>

            {/* Display name */}
            <div style={{ marginBottom: '1rem' }}>
              <Label>Display Name</Label>
              <input
                id="display-name" name="display_name" type="text"
                defaultValue={profile.display_name ?? ''}
                placeholder="Your full name"
                maxLength={60}
                style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = '#E50914'}
                onBlur={e => e.currentTarget.style.borderColor = '#2B2B2B'}
              />
            </div>

            {/* Username (read-only) */}
            <div style={{ marginBottom: '1rem' }}>
              <Label>Username <span style={{ color: '#555', fontWeight: 400 }}>(cannot be changed)</span></Label>
              <input
                value={`@${profile.username}`}
                disabled
                style={{ ...inputStyle, color: '#555', cursor: 'not-allowed' }}
              />
            </div>

            {/* Bio */}
            <div style={{ marginBottom: '0.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <Label>Bio</Label>
                <span style={{ fontSize: '0.75rem', color: bioLen > 280 ? '#E50914' : '#555' }}>{bioLen}/300</span>
              </div>
              <textarea
                id="bio" name="bio"
                defaultValue={profile.bio ?? ''}
                placeholder="Tell people about yourself…"
                maxLength={300}
                rows={3}
                onChange={e => setBioLen(e.target.value.length)}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
                onFocus={e => e.currentTarget.style.borderColor = '#E50914'}
                onBlur={e => e.currentTarget.style.borderColor = '#2B2B2B'}
              />
            </div>

            {/* Location */}
            <div style={{ marginTop: '1rem' }}>
              <Label>Location</Label>
              <div style={{ position: 'relative' }}>
                <MapPin size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
                <input
                  id="location" name="location" type="text"
                  defaultValue={profile.location ?? ''}
                  placeholder="City, Country"
                  style={{ ...inputStyle, paddingLeft: '2.4rem' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#E50914'}
                  onBlur={e => e.currentTarget.style.borderColor = '#2B2B2B'}
                />
              </div>
            </div>
          </Section>

          {/* Social links */}
          <Section title="Social Links">
            {[
              { name: 'website_url',    label: 'Website',    icon: <Globe size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />, placeholder: 'https://yoursite.com',           type: 'url',  default: profile.website_url },
              { name: 'twitter_handle', label: 'Twitter / X', icon: <AtSign size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />, placeholder: 'username (no @)',        type: 'text', default: profile.twitter_handle },
              { name: 'github_url',     label: 'GitHub',     icon: <GitBranch size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />, placeholder: 'https://github.com/you',  type: 'url',  default: profile.github_url },
              { name: 'linkedin_url',   label: 'LinkedIn',   icon: <Briefcase size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />, placeholder: 'https://linkedin.com/in/you', type: 'url', default: profile.linkedin_url },
            ].map(field => (
              <div key={field.name} style={{ marginBottom: '1rem' }}>
                <Label>{field.label}</Label>
                <div style={{ position: 'relative' }}>
                  {field.icon}
                  <input
                    id={`account-${field.name}`} name={field.name} type={field.type}
                    defaultValue={field.default ?? ''}
                    placeholder={field.placeholder}
                    style={{ ...inputStyle, paddingLeft: '2.4rem' }}
                    onFocus={e => e.currentTarget.style.borderColor = '#E50914'}
                    onBlur={e => e.currentTarget.style.borderColor = '#2B2B2B'}
                  />
                </div>
              </div>
            ))}
          </Section>

          {/* Profile save button + feedback */}
          {profileState?.error && (
            <div style={{
              background: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.3)',
              borderRadius: '0.5rem', padding: '0.75rem 1rem',
              color: '#FF6B6B', fontSize: '0.875rem', marginBottom: '1rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <AlertTriangle size={15} /> {profileState.error}
            </div>
          )}
          {profileState?.success && (
            <div style={{
              background: 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.3)',
              borderRadius: '0.5rem', padding: '0.75rem 1rem',
              color: '#2ECC71', fontSize: '0.875rem', marginBottom: '1rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <CheckCircle size={15} /> Profile saved successfully!
            </div>
          )}
          <button
            id="save-profile-btn" type="submit" disabled={profilePending}
            style={{
              width: '100%', padding: '0.85rem',
              background: profilePending ? '#8B0000' : '#E50914',
              color: '#FFFFFF', fontWeight: 700, fontSize: '0.95rem',
              border: 'none', borderRadius: '0.6rem',
              cursor: profilePending ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              transition: 'background 0.2s', boxShadow: '0 4px 20px rgba(229,9,20,0.2)',
              marginBottom: '1.25rem',
            }}
          >
            {profilePending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
            {profilePending ? 'Saving…' : 'Save Profile'}
          </button>
        </form>

        {/* ── Change password ── */}
        <form action={passwordAction}>
          <Section title="Change Password">
            <div style={{ marginBottom: '1rem' }}>
              <Label>New Password</Label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
                <input
                  id="new-password" name="new_password" type="password"
                  placeholder="Min. 8 characters"
                  minLength={8}
                  style={{ ...inputStyle, paddingLeft: '2.4rem' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#E50914'}
                  onBlur={e => e.currentTarget.style.borderColor = '#2B2B2B'}
                />
              </div>
            </div>
            <div>
              <Label>Confirm New Password</Label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
                <input
                  id="confirm-password" name="confirm_password" type="password"
                  placeholder="Repeat password"
                  style={{ ...inputStyle, paddingLeft: '2.4rem' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#E50914'}
                  onBlur={e => e.currentTarget.style.borderColor = '#2B2B2B'}
                />
              </div>
            </div>

            {passwordState?.error && (
              <div style={{
                marginTop: '0.75rem',
                background: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.3)',
                borderRadius: '0.5rem', padding: '0.65rem 0.9rem',
                color: '#FF6B6B', fontSize: '0.85rem',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}>
                <AlertTriangle size={14} /> {passwordState.error}
              </div>
            )}
            {passwordState?.success && (
              <div style={{
                marginTop: '0.75rem',
                background: 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.3)',
                borderRadius: '0.5rem', padding: '0.65rem 0.9rem',
                color: '#2ECC71', fontSize: '0.85rem',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}>
                <CheckCircle size={14} /> Password changed successfully!
              </div>
            )}

            <button
              id="change-password-btn" type="submit" disabled={passwordPending}
              style={{
                marginTop: '1rem', padding: '0.7rem 1.5rem',
                background: '#262626', border: '1px solid #2B2B2B',
                borderRadius: '0.5rem', color: '#FFFFFF',
                fontWeight: 600, fontSize: '0.875rem',
                cursor: passwordPending ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                transition: 'border-color 0.2s',
              }}
            >
              {passwordPending ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
              {passwordPending ? 'Updating…' : 'Update Password'}
            </button>
          </Section>
        </form>

        {/* ── Danger zone ── */}
        <div style={{
          background: 'rgba(229,9,20,0.04)', border: '1px solid rgba(229,9,20,0.2)',
          borderRadius: '0.85rem', padding: '1.5rem', marginBottom: '1.25rem',
        }}>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#E50914', marginBottom: '0.5rem' }}>Danger Zone</h2>
          <p style={{ color: '#AAAAAA', fontSize: '0.82rem', marginBottom: '1rem' }}>
            Sign out of your account on this device.
          </p>
          <form action={signOut}>
            <button
              id="account-signout-btn"
              type="submit"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.65rem 1.25rem',
                background: 'transparent', border: '1px solid rgba(229,9,20,0.4)',
                borderRadius: '0.5rem', color: '#E50914',
                fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              <LogOut size={14} /> Sign Out
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
