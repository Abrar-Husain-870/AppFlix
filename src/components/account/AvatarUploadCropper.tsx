'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  Camera,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Check,
  X,
  AlertCircle,
  Loader2,
  User,
  Sparkles,
} from 'lucide-react'

interface AvatarUploadCropperProps {
  currentAvatarUrl?: string | null
  username?: string
  displayName?: string
  onAvatarChange: (url: string) => void
  disabled?: boolean
}

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
const MAX_FILE_SIZE_MB = 5
const MIN_DIMENSION = 48
const OUTPUT_SIZE = 512
const VIEWPORT_SIZE = 260
const CROP_SIZE = 240
const CROP_OFFSET = (VIEWPORT_SIZE - CROP_SIZE) / 2

export default function AvatarUploadCropper({
  currentAvatarUrl,
  username = '',
  displayName = '',
  onAvatarChange,
  disabled = false,
}: AvatarUploadCropperProps) {
  // Modal & upload states
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [warningMessage, setWarningMessage] = useState<string | null>(null)

  // Image source & dimensions
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [imageDims, setImageDims] = useState<{ width: number; height: number }>({ width: 0, height: 0 })

  // Cropper transform state
  const [zoom, setZoom] = useState(1.0)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [fillColor, setFillColor] = useState<string>('transparent')

  // Live preview URL for component display
  const [liveAvatarUrl, setLiveAvatarUrl] = useState<string | null>(currentAvatarUrl || null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const imageElementRef = useRef<HTMLImageElement | null>(null)

  // Synchronize incoming avatar URL
  useEffect(() => {
    if (currentAvatarUrl) {
      setLiveAvatarUrl(currentAvatarUrl)
    }
  }, [currentAvatarUrl])

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setErrorMessage(null)
    setWarningMessage(null)

    // 1. Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setErrorMessage('Please upload a valid image file (PNG, JPG, WebP, or SVG).')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    // 2. Validate file size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setErrorMessage(`Image file is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is ${MAX_FILE_SIZE_MB}MB.`)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    // 3. Load & decode image
    const reader = new FileReader()
    reader.onload = (loadEvt) => {
      const src = loadEvt.target?.result as string
      const img = new Image()
      img.onload = () => {
        if (img.naturalWidth < MIN_DIMENSION || img.naturalHeight < MIN_DIMENSION) {
          setErrorMessage(`Image is too small (${img.naturalWidth}×${img.naturalHeight}px). Minimum required is ${MIN_DIMENSION}×${MIN_DIMENSION}px.`)
          return
        }

        if (img.naturalWidth < 200 || img.naturalHeight < 200) {
          setWarningMessage(`Notice: Image is ${img.naturalWidth}×${img.naturalHeight}px. Higher resolution images will look sharper.`)
        }

        imageElementRef.current = img
        setImageDims({ width: img.naturalWidth, height: img.naturalHeight })
        setImageSrc(src)
        setZoom(1.0)
        setPan({ x: 0, y: 0 })
        setFillColor('transparent')
        setModalOpen(true)
      }
      img.onerror = () => {
        setErrorMessage('Failed to decode image file. Please try another image.')
      }
      img.src = src
    }
    reader.readAsDataURL(file)
  }

  // Trigger file dialog
  const openFileDialog = () => {
    if (disabled || loading) return
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }

  // Redraw preview canvas in modal
  const updateLivePreview = useCallback(() => {
    const canvas = previewCanvasRef.current
    const img = imageElementRef.current
    if (!canvas || !img) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = VIEWPORT_SIZE
    canvas.height = VIEWPORT_SIZE

    ctx.clearRect(0, 0, VIEWPORT_SIZE, VIEWPORT_SIZE)

    // Background fill
    if (fillColor && fillColor !== 'transparent') {
      ctx.fillStyle = fillColor
      ctx.fillRect(0, 0, VIEWPORT_SIZE, VIEWPORT_SIZE)
    }

    const aspect = img.naturalWidth / img.naturalHeight
    let drawW = VIEWPORT_SIZE
    let drawH = VIEWPORT_SIZE

    if (aspect > 1) {
      drawH = VIEWPORT_SIZE / aspect
    } else {
      drawW = VIEWPORT_SIZE * aspect
    }

    drawW *= zoom
    drawH *= zoom

    const centerX = VIEWPORT_SIZE / 2 + pan.x
    const centerY = VIEWPORT_SIZE / 2 + pan.y

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, centerX - drawW / 2, centerY - drawH / 2, drawW, drawH)
  }, [zoom, pan, fillColor])

  useEffect(() => {
    if (modalOpen && imageSrc) {
      updateLivePreview()
    }
  }, [modalOpen, imageSrc, zoom, pan, fillColor, updateLivePreview])

  // Mouse & Touch Dragging Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y
    const maxPan = 130 * zoom
    setPan({
      x: Math.max(-maxPan, Math.min(maxPan, newX)),
      y: Math.max(-maxPan, Math.min(maxPan, newY)),
    })
  }

  const handleMouseUp = () => setIsDragging(false)

  // Touch support for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true)
      const t = e.touches[0]
      setDragStart({ x: t.clientX - pan.x, y: t.clientY - pan.y })
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return
    const t = e.touches[0]
    const newX = t.clientX - dragStart.x
    const newY = t.clientY - dragStart.y
    const maxPan = 130 * zoom
    setPan({
      x: Math.max(-maxPan, Math.min(maxPan, newX)),
      y: Math.max(-maxPan, Math.min(maxPan, newY)),
    })
  }

  const handleTouchEnd = () => setIsDragging(false)

  // Zoom control helpers
  const handleZoomChange = (delta: number) => {
    setZoom((prev) => Math.min(3.0, Math.max(0.6, parseFloat((prev + delta).toFixed(2)))))
  }

  const handleReset = () => {
    setZoom(1.0)
    setPan({ x: 0, y: 0 })
  }

  const handleFitContain = () => {
    setZoom(0.92)
    setPan({ x: 0, y: 0 })
  }

  const handleFillCover = () => {
    setZoom(1.35)
    setPan({ x: 0, y: 0 })
  }

  // Export 512x512 Canvas and Upload to Server
  const handleApplyAndSave = async () => {
    const img = imageElementRef.current
    if (!img) return

    setLoading(true)
    setErrorMessage(null)

    try {
      // 1. Render to high-res 512x512 canvas
      const canvas = document.createElement('canvas')
      canvas.width = OUTPUT_SIZE
      canvas.height = OUTPUT_SIZE
      const ctx = canvas.getContext('2d', { willReadFrequently: false })
      if (!ctx) throw new Error('Could not create render canvas context.')

      // Fill background
      if (fillColor && fillColor !== 'transparent') {
        ctx.fillStyle = fillColor
        ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE)
      } else {
        ctx.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE)
      }

      // 1. Calculate image dimensions in viewport coordinates (260px base)
      const aspect = img.naturalWidth / img.naturalHeight
      let baseW = VIEWPORT_SIZE
      let baseH = VIEWPORT_SIZE

      if (aspect > 1) {
        baseH = VIEWPORT_SIZE / aspect
      } else {
        baseW = VIEWPORT_SIZE * aspect
      }

      const viewportDrawW = baseW * zoom
      const viewportDrawH = baseH * zoom

      // 2. Exact scale factor mapping the 240px circle bounding box to the 512px output canvas
      const scaleFactor = OUTPUT_SIZE / CROP_SIZE
      const outputDrawW = viewportDrawW * scaleFactor
      const outputDrawH = viewportDrawH * scaleFactor

      // 3. Center image relative to the circle (circle center in viewport is VIEWPORT_SIZE / 2)
      const outputCenterX = OUTPUT_SIZE / 2 + pan.x * scaleFactor
      const outputCenterY = OUTPUT_SIZE / 2 + pan.y * scaleFactor

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, outputCenterX - outputDrawW / 2, outputCenterY - outputDrawH / 2, outputDrawW, outputDrawH)

      // 4. Convert to Blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/png')
      })

      if (!blob) throw new Error('Failed to generate avatar image.')

      const processedFile = new File([blob], `avatar-${Date.now()}.png`, { type: 'image/png' })

      // 5. Send to /api/upload/avatar
      const formData = new FormData()
      formData.append('file', processedFile)

      const res = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload profile picture.')
      }

      // 6. Update parent and live preview with fresh timestamp
      const finalUrl = data.url + `?t=${Date.now()}`
      setLiveAvatarUrl(finalUrl)
      onAvatarChange(finalUrl)

      // 7. Broadcast global profile_updated event so Navbar updates instantly
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('profile_updated', { detail: { avatar_url: finalUrl } }))
      }

      setModalOpen(false)
    } catch (err: any) {
      console.error('Failed to save profile picture:', err)
      setErrorMessage(err.message || 'Failed to save profile picture.')
    } finally {
      setLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_MIME_TYPES.join(',')}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        id="avatar-crop-input"
        disabled={disabled || loading}
      />

      {/* Profile Trigger Element */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div
          onClick={openFileDialog}
          title="Click to change and crop profile picture"
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: '#262626',
            border: '2px solid #2B2B2B',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'border-color 0.2s, transform 0.15s',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#E50914'
            e.currentTarget.style.transform = 'scale(1.02)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#2B2B2B'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          {liveAvatarUrl ? (
            <img
              src={liveAvatarUrl}
              alt={displayName || username || 'Profile'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <User size={32} style={{ color: '#555' }} />
          )}
        </div>

        {/* Camera Badge */}
        <button
          type="button"
          onClick={openFileDialog}
          disabled={disabled || loading}
          title="Change & crop profile picture"
          style={{
            position: 'absolute',
            bottom: '-2px',
            right: '-2px',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: '#E50914',
            border: '2px solid #080808',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(229, 9, 20, 0.5)',
            transition: 'background 0.15s, transform 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#F40612'
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#E50914'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          {loading ? (
            <Loader2 size={13} className="animate-spin" style={{ color: '#fff' }} />
          ) : (
            <Camera size={13} style={{ color: '#fff' }} />
          )}
        </button>
      </div>

      {/* ── INTERACTIVE CROP & ZOOM MODAL ── */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(180deg, #181212 0%, #121212 30%, #0E0E0E 100%)',
              border: '1px solid #2B2B2B',
              borderRadius: '0.85rem',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 25px rgba(229, 9, 20, 0.15)',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '94vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #222',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ width: '2rem', height: '3px', background: '#E50914', borderRadius: '2px', marginBottom: '0.35rem' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#FFFFFF', margin: 0, letterSpacing: '-0.02em' }}>
                  Crop & Frame Profile Picture
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#888888', margin: '0.2rem 0 0 0' }}>
                  Drag to reposition. Use the slider or buttons to zoom and fit your face inside the circle.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={loading}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#888888',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '0.35rem',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#888888')}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Error / Warning Alert */}
              {errorMessage && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    borderRadius: '0.5rem',
                    padding: '0.65rem 0.9rem',
                    color: '#EF4444',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {warningMessage && (
                <div
                  style={{
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    borderRadius: '0.5rem',
                    padding: '0.65rem 0.9rem',
                    color: '#FBBF24',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>{warningMessage}</span>
                </div>
              )}

              {/* Cropper Viewport + Previews Side by Side */}
              <div
                style={{
                  display: 'flex',
                  gap: '1.5rem',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                }}
              >
                {/* Interactive Crop Viewport (260x260) with Circular Mask */}
                <div
                  style={{
                    position: 'relative',
                    width: `${VIEWPORT_SIZE}px`,
                    height: `${VIEWPORT_SIZE}px`,
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                    background: '#0D0D0D',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    userSelect: 'none',
                    touchAction: 'none',
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  {/* Canvas */}
                  <canvas
                    ref={previewCanvasRef}
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'block',
                    }}
                  />

                  {/* Circular Overlay Mask (Darkens outer ring, highlights 240px circle) */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      pointerEvents: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: '240px',
                        height: '240px',
                        borderRadius: '50%',
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55)',
                        border: '2px dashed rgba(229, 9, 20, 0.85)',
                      }}
                    />
                  </div>

                  {/* Subtle Drag Hint Overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(0, 0, 0, 0.7)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '9999px',
                      fontSize: '0.68rem',
                      color: '#AAA',
                      pointerEvents: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Drag to pan
                  </div>
                </div>

                {/* Live Previews Column (Shows exact scale across the app) */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '120px',
                  }}
                >
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#777', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Live Previews
                  </span>

                  {/* Profile View (72px) */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                    <div
                      style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '2px solid rgba(229, 9, 20, 0.6)',
                        background: '#1A1A1A',
                        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)',
                      }}
                    >
                      <canvas
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'block',
                        }}
                        ref={(node) => {
                          if (node && previewCanvasRef.current) {
                            node.width = 72
                            node.height = 72
                            const ctx = node.getContext('2d')
                            if (ctx) {
                              ctx.clearRect(0, 0, 72, 72)
                              ctx.drawImage(previewCanvasRef.current, 10, 10, 240, 240, 0, 0, 72, 72)
                            }
                          }
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '0.68rem', color: '#888' }}>Profile (72px)</span>
                  </div>

                  {/* Comments / Navbar View (36px) */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '1px solid #333',
                        background: '#1A1A1A',
                      }}
                    >
                      <canvas
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'block',
                        }}
                        ref={(node) => {
                          if (node && previewCanvasRef.current) {
                            node.width = 36
                            node.height = 36
                            const ctx = node.getContext('2d')
                            if (ctx) {
                              ctx.clearRect(0, 0, 36, 36)
                              ctx.drawImage(previewCanvasRef.current, 10, 10, 240, 240, 0, 0, 36, 36)
                            }
                          }
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '0.68rem', color: '#888' }}>Navbar (36px)</span>
                  </div>
                </div>
              </div>

              {/* ── Zoom Slider & Controls ── */}
              <div
                style={{
                  background: '#141414',
                  border: '1px solid #242424',
                  borderRadius: '0.65rem',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#CCCCCC', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ZoomIn size={14} style={{ color: '#E50914' }} /> Zoom & Scale
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#FFFFFF', background: '#222', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                    {Math.round(zoom * 100)}%
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => handleZoomChange(-0.1)}
                    style={{
                      background: '#222',
                      border: '1px solid #333',
                      color: '#FFF',
                      width: '28px',
                      height: '28px',
                      borderRadius: '0.35rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ZoomOut size={14} />
                  </button>

                  <input
                    type="range"
                    min="0.6"
                    max="3.0"
                    step="0.02"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    style={{
                      flex: 1,
                      accentColor: '#E50914',
                      cursor: 'pointer',
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => handleZoomChange(0.1)}
                    style={{
                      background: '#222',
                      border: '1px solid #333',
                      color: '#FFF',
                      width: '28px',
                      height: '28px',
                      borderRadius: '0.35rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ZoomIn size={14} />
                  </button>
                </div>

                {/* Quick Presets */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleFillCover}
                    style={{
                      background: '#1F1F1F',
                      border: '1px solid #333',
                      color: '#DDD',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '0.3rem 0.65rem',
                      borderRadius: '0.35rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    <Maximize2 size={11} /> Fill Circle
                  </button>

                  <button
                    type="button"
                    onClick={handleFitContain}
                    style={{
                      background: '#1F1F1F',
                      border: '1px solid #333',
                      color: '#DDD',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '0.3rem 0.65rem',
                      borderRadius: '0.35rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    <Minimize2 size={11} /> Fit Inside
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    style={{
                      background: '#1F1F1F',
                      border: '1px solid #333',
                      color: '#AAA',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '0.3rem 0.65rem',
                      borderRadius: '0.35rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      marginLeft: 'auto',
                    }}
                  >
                    <RotateCcw size={11} /> Reset
                  </button>
                </div>
              </div>

              {/* Background Fill Options (for transparent PNGs/SVGs) */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#888' }}>
                  Background Fill:
                </span>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {[
                    { id: 'transparent', label: 'None' },
                    { id: '#000000', label: 'Black' },
                    { id: '#181818', label: 'Dark' },
                    { id: '#E50914', label: 'Netflix Red' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFillColor(f.id)}
                      style={{
                        padding: '0.2rem 0.55rem',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        borderRadius: '0.3rem',
                        border: fillColor === f.id ? '1px solid #E50914' : '1px solid #2B2B2B',
                        background: fillColor === f.id ? 'rgba(229, 9, 20, 0.15)' : '#1F1F1F',
                        color: fillColor === f.id ? '#FFFFFF' : '#888888',
                        cursor: 'pointer',
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderTop: '1px solid #222',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <button
                type="button"
                onClick={openFileDialog}
                disabled={loading}
                style={{
                  background: 'transparent',
                  border: '1px solid #333',
                  color: '#AAA',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  padding: '0.55rem 0.9rem',
                  borderRadius: '0.45rem',
                  cursor: 'pointer',
                }}
              >
                Choose Another Image
              </button>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={loading}
                  style={{
                    background: 'transparent',
                    border: '1px solid #333',
                    color: '#CCCCCC',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    padding: '0.55rem 1rem',
                    borderRadius: '0.45rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleApplyAndSave}
                  disabled={loading}
                  style={{
                    background: '#E50914',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    padding: '0.55rem 1.35rem',
                    borderRadius: '0.45rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    boxShadow: '0 4px 16px rgba(229, 9, 20, 0.4)',
                  }}
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Save Profile Picture
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
