'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell, CheckCheck, Trash2, X, MessageSquare, AlertTriangle,
  Clock, ShieldAlert, CheckCircle, Sparkles, ExternalLink
} from 'lucide-react'
import {
  AppNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllReadNotifications
} from '@/app/actions/notifications'

function formatTimeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return 'Just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}h ago`
  const diffDays = Math.floor(diffHour / 24)
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 30) return `${diffDays}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getNotificationVisuals(notif: AppNotification) {
  const t = (notif.title + ' ' + (notif.message || '')).toLowerCase()

  if (t.includes('review') || t.includes('comment') || t.includes('replied')) {
    return {
      icon: <MessageSquare size={15} />,
      color: '#5B8DEF',
      bg: 'rgba(91, 141, 239, 0.15)',
      border: 'rgba(91, 141, 239, 0.3)',
    }
  }
  if (t.includes('1 day') || t.includes('expired') || t.includes('rejected')) {
    return {
      icon: <AlertTriangle size={15} />,
      color: '#E50914',
      bg: 'rgba(229, 9, 20, 0.18)',
      border: 'rgba(229, 9, 20, 0.4)',
    }
  }
  if (t.includes('hurry') || t.includes('3 days') || t.includes('7 days') || t.includes('15 days') || t.includes('expiring')) {
    return {
      icon: <Clock size={15} />,
      color: '#F59E0B',
      bg: 'rgba(245, 158, 11, 0.15)',
      border: 'rgba(245, 158, 11, 0.35)',
    }
  }
  if (t.includes('report') || t.includes('flagged')) {
    if (t.includes('resolved')) {
      return {
        icon: <CheckCircle size={15} />,
        color: '#2ECC71',
        bg: 'rgba(46, 204, 113, 0.15)',
        border: 'rgba(46, 204, 113, 0.3)',
      }
    }
    return {
      icon: <ShieldAlert size={15} />,
      color: '#E50914',
      bg: 'rgba(229, 9, 20, 0.18)',
      border: 'rgba(229, 9, 20, 0.4)',
    }
  }
  if (t.includes('activated') || t.includes('approved') || t.includes('live')) {
    return {
      icon: <Sparkles size={15} />,
      color: '#2ECC71',
      bg: 'rgba(46, 204, 113, 0.15)',
      border: 'rgba(46, 204, 113, 0.3)',
    }
  }

  return {
    icon: <Bell size={15} />,
    color: '#E50914',
    bg: 'rgba(229, 9, 20, 0.15)',
    border: 'rgba(229, 9, 20, 0.3)',
  }
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState<'unread' | 'all'>('unread')
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const popoverRef = useRef<HTMLDivElement>(null)

  const loadNotifications = async () => {
    try {
      const res = await getUserNotifications()
      setNotifications(res.notifications)
      setUnreadCount(res.unreadCount)
    } catch (err) {
      console.error('[NotificationBell fetch error]', err)
    }
  }

  useEffect(() => {
    loadNotifications()
    // Periodic refresh every 60s
    const interval = setInterval(loadNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

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

  function handleToggleOpen() {
    if (!isOpen) {
      loadNotifications()
    }
    setIsOpen(prev => !prev)
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    })
  }

  function handleClearRead() {
    startTransition(async () => {
      await deleteAllReadNotifications()
      setNotifications(prev => prev.filter(n => !n.is_read))
    })
  }

  function handleDismissOne(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    const target = notifications.find(n => n.id === id)
    setNotifications(prev => prev.filter(n => n.id !== id))
    if (target && !target.is_read) {
      setUnreadCount(c => Math.max(0, c - 1))
    }

    startTransition(async () => {
      await deleteNotification(id)
    })
  }

  function handleCardClick(notif: AppNotification) {
    if (!notif.is_read) {
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n))
      setUnreadCount(c => Math.max(0, c - 1))
      markNotificationAsRead(notif.id)
    }

    if (notif.link) {
      setIsOpen(false)
      router.push(notif.link)
    }
  }

  const displayedNotifications = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications

  return (
    <div style={{ position: 'relative' }} ref={popoverRef}>
      {/* Bell Trigger Button in Netflix Style */}
      <button
        id="navbar-notification-bell-btn"
        onClick={handleToggleOpen}
        aria-label="Notifications"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '34px',
          height: '34px',
          borderRadius: '50%',
          background: isOpen ? 'rgba(229, 9, 20, 0.15)' : 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${isOpen ? 'rgba(229, 9, 20, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
          color: unreadCount > 0 ? '#FFFFFF' : '#CCCCCC',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(229, 9, 20, 0.18)'
          e.currentTarget.style.borderColor = 'rgba(229, 9, 20, 0.5)'
          e.currentTarget.style.color = '#FFFFFF'
        }}
        onMouseLeave={e => {
          if (!isOpen) {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
            e.currentTarget.style.color = unreadCount > 0 ? '#FFFFFF' : '#CCCCCC'
          }
        }}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-3px',
            right: '-3px',
            minWidth: '17px',
            height: '17px',
            padding: '0 4px',
            borderRadius: '999px',
            background: '#E50914',
            color: '#FFFFFF',
            fontSize: '0.65rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px rgba(229, 9, 20, 0.85)',
            border: '2px solid #000000',
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Popover Panel - Netflix Dark Cinema Theme */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 10px)',
          right: 0,
          width: '390px',
          maxWidth: 'calc(100vw - 20px)',
          background: 'linear-gradient(180deg, #181212 0%, #121212 25%, #0E0E0E 100%)',
          border: '1px solid #2B2B2B',
          borderRadius: '0.85rem',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 25px rgba(229, 9, 20, 0.12)',
          zIndex: 1000,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '530px',
          animation: 'dropdownIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          {/* Header */}
          <div style={{
            padding: '1rem 1.25rem 0.85rem',
            borderBottom: '1px solid #222222',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.015)',
          }}>
            <div>
              <div style={{ width: '1.75rem', height: '2.5px', background: '#E50914', borderRadius: '2px', marginBottom: '0.35rem' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#FFFFFF', margin: 0, letterSpacing: '-0.03em' }}>
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '999px',
                    background: '#E50914',
                    color: '#FFFFFF',
                    boxShadow: '0 0 8px rgba(229, 9, 20, 0.5)',
                    letterSpacing: '0.04em',
                  }}>
                    {unreadCount} new
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={isPending}
                  title="Mark all as read"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#CCCCCC',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.3rem 0.55rem',
                    borderRadius: '0.35rem',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = '#FFFFFF'
                    e.currentTarget.style.borderColor = '#E50914'
                    e.currentTarget.style.background = 'rgba(229, 9, 20, 0.15)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = '#CCCCCC'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <CheckCheck size={13} style={{ color: '#E50914' }} /> Mark read
                </button>
              )}
              {notifications.some(n => n.is_read) && (
                <button
                  onClick={handleClearRead}
                  disabled={isPending}
                  title="Clear all read notifications"
                  style={{
                    background: 'transparent',
                    border: '1px solid transparent',
                    color: '#888888',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.3rem 0.5rem',
                    borderRadius: '0.35rem',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = '#FF6B6B'
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = '#888888'
                    e.currentTarget.style.borderColor = 'transparent'
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <Trash2 size={12} /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Netflix Segmented Tabs (Unread default on left, All on right) */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #202020',
            padding: '0.45rem 1.25rem',
            gap: '0.5rem',
            background: '#0D0D0D',
          }}>
            <button
              onClick={() => setFilter('unread')}
              style={{
                background: filter === 'unread' ? '#E50914' : 'transparent',
                border: 'none',
                borderRadius: '0.35rem',
                padding: '0.3rem 0.75rem',
                color: filter === 'unread' ? '#FFFFFF' : '#888888',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: filter === 'unread' ? '0 2px 10px rgba(229, 9, 20, 0.4)' : 'none',
                letterSpacing: '0.02em',
              }}
              onMouseEnter={e => {
                if (filter !== 'unread') {
                  e.currentTarget.style.color = '#FFFFFF'
                  e.currentTarget.style.background = '#1A1A1A'
                }
              }}
              onMouseLeave={e => {
                if (filter !== 'unread') {
                  e.currentTarget.style.color = '#888888'
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('all')}
              style={{
                background: filter === 'all' ? '#E50914' : 'transparent',
                border: 'none',
                borderRadius: '0.35rem',
                padding: '0.3rem 0.75rem',
                color: filter === 'all' ? '#FFFFFF' : '#888888',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: filter === 'all' ? '0 2px 10px rgba(229, 9, 20, 0.4)' : 'none',
                letterSpacing: '0.02em',
              }}
              onMouseEnter={e => {
                if (filter !== 'all') {
                  e.currentTarget.style.color = '#FFFFFF'
                  e.currentTarget.style.background = '#1A1A1A'
                }
              }}
              onMouseLeave={e => {
                if (filter !== 'all') {
                  e.currentTarget.style.color = '#888888'
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              All ({notifications.length})
            </button>
          </div>

          {/* Notifications List */}
          <div style={{
            overflowY: 'auto',
            maxHeight: '390px',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {displayedNotifications.length === 0 ? (
              <div style={{
                padding: '3rem 1.5rem',
                textAlign: 'center',
                color: '#777777',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.65rem',
              }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: 'rgba(229, 9, 20, 0.1)',
                  border: '1px solid rgba(229, 9, 20, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#E50914',
                }}>
                  <Bell size={20} />
                </div>
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                  {filter === 'unread' ? 'No unread notifications' : "You're all caught up"}
                </p>
                <span style={{ fontSize: '0.75rem', color: '#888888', maxWidth: '240px', lineHeight: 1.45 }}>
                  App updates, user reviews, reports, and listing alerts will arrive here.
                </span>
              </div>
            ) : (
              displayedNotifications.map(notif => {
                const visuals = getNotificationVisuals(notif)
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleCardClick(notif)}
                    style={{
                      padding: '0.9rem 1.25rem',
                      borderBottom: '1px solid #1E1E1E',
                      background: notif.is_read
                        ? '#121212'
                        : 'linear-gradient(90deg, rgba(229, 9, 20, 0.08) 0%, rgba(20, 20, 20, 0.95) 100%)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      cursor: notif.link ? 'pointer' : 'default',
                      position: 'relative',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#1E1E1E'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = notif.is_read
                        ? '#121212'
                        : 'linear-gradient(90deg, rgba(229, 9, 20, 0.08) 0%, rgba(20, 20, 20, 0.95) 100%)'
                    }}
                  >
                    {/* Left unread Netflix Red accent bar */}
                    {!notif.is_read && (
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: '3.5px',
                        background: '#E50914',
                        boxShadow: '0 0 8px rgba(229, 9, 20, 0.7)',
                      }} />
                    )}

                    {/* Category Icon */}
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '0.5rem',
                      background: visuals.bg,
                      border: `1px solid ${visuals.border}`,
                      color: visuals.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '1px',
                    }}>
                      {visuals.icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <h4 style={{
                          margin: 0,
                          fontSize: '0.84rem',
                          fontWeight: notif.is_read ? 600 : 800,
                          color: notif.is_read ? '#DDDDDD' : '#FFFFFF',
                          lineHeight: 1.35,
                          letterSpacing: '-0.01em',
                        }}>
                          {notif.title}
                        </h4>

                        {/* Individual Cross / Dismiss Button */}
                        <button
                          onClick={e => handleDismissOne(e, notif.id)}
                          title="Dismiss and delete notification"
                          style={{
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            color: '#777777',
                            cursor: 'pointer',
                            padding: '3px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '4px',
                            transition: 'all 0.15s ease',
                            flexShrink: 0,
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.color = '#FFFFFF'
                            e.currentTarget.style.borderColor = '#E50914'
                            e.currentTarget.style.background = '#E50914'
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.color = '#777777'
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
                          }}
                        >
                          <X size={13} />
                        </button>
                      </div>

                      {notif.message && (
                        <p style={{
                          margin: '0.3rem 0 0.4rem',
                          fontSize: '0.78rem',
                          color: '#A0A0A0',
                          lineHeight: 1.45,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}>
                          {notif.message}
                        </p>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '0.15rem' }}>
                        <span style={{ fontSize: '0.68rem', color: '#666666', fontWeight: 500 }}>
                          {formatTimeAgo(notif.created_at)}
                        </span>
                        {notif.link && (
                          <span style={{
                            fontSize: '0.7rem',
                            color: '#E50914',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                          }}>
                            View details <ExternalLink size={10} />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
