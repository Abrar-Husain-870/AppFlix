'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  Upload,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Check,
  X,
  AlertCircle,
  Loader2,
  Sparkles,
  Flame,
  ArrowUpRight,
} from 'lucide-react'
import AppIcon from '@/components/ui/AppIcon'
import { createClient } from '@/lib/supabase/client'

interface IconUploadCropperProps {
  currentIconUrl?: string | null
  appName?: string
  tagline?: string
  categoryName?: string
  userId?: string
  onIconChange: (url: string) => void
  disabled?: boolean
}

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
const MAX_FILE_SIZE_MB = 5
const MIN_DIMENSION = 64
const OUTPUT_SIZE = 512

export default function IconUploadCropper({
  currentIconUrl,
  appName = 'Your App Name',
  tagline = 'A fast, reliable app built for the community.',
  categoryName = 'Productivity',
  userId,
  onIconChange,
  disabled = false,
}: IconUploadCropperProps) {
  // Modal & upload state
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [warningMessage, setWarningMessage] = useState<string | null>(null)

  // Image source & metadata
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [imageDims, setImageDims] = useState<{ width: number; height: number }>({ width: 0, height: 0 })
  const originalFileRef = useRef<File | null>(null)

  // Cropper transform state
  const [zoom, setZoom] = useState(1.0)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [fillColor, setFillColor] = useState<string>('transparent')
  const [customHex, setCustomHex] = useState<string>('#161616')

  // Live preview data URL for marketplace card
  const [livePreviewUrl, setLivePreviewUrl] = useState<string | null>(currentIconUrl || null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const imageElementRef = useRef<HTMLImageElement | null>(null)

  // Handle incoming file selection
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

    // 2. Validate File Size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setErrorMessage(`Image file is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is ${MAX_FILE_SIZE_MB}MB.`)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    originalFileRef.current = file

    // 3. Load image & decode
    const reader = new FileReader()
    reader.onload = (loadEvt) => {
      const src = loadEvt.target?.result as string
      const img = new Image()
      img.onload = () => {
        if (img.naturalWidth < MIN_DIMENSION || img.naturalHeight < MIN_DIMENSION) {
          setErrorMessage(`Image is too small (${img.naturalWidth}×${img.naturalHeight}px). Minimum required is ${MIN_DIMENSION}×${MIN_DIMENSION}px.`)
          return
        }

        if (img.naturalWidth < 256 || img.naturalHeight < 256) {
          setWarningMessage(`Notice: Image is ${img.naturalWidth}×${img.naturalHeight}px. 512×512px or larger is recommended for maximum crispness.`)
        }

        imageElementRef.current = img
        setImageDims({ width: img.naturalWidth, height: img.naturalHeight })
        setImageSrc(src)
        setZoom(1.0)
        setPan({ x: 0, y: 0 })
        setFillColor('transparent')
        setCustomHex('#161616')
        setModalOpen(true)
      }
      img.onerror = () => {
        setErrorMessage('Failed to decode the image file. It may be corrupted or unreadable.')
      }
      img.src = src
    }
    reader.readAsDataURL(file)
  }

  // Generate live preview on canvas
  const updateLivePreview = useCallback(() => {
    const img = imageElementRef.current
    if (!img) return

    const canvas = document.createElement('canvas')
    canvas.width = 160
    canvas.height = 160
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (fillColor && fillColor !== 'transparent') {
      ctx.fillStyle = fillColor
      ctx.fillRect(0, 0, 160, 160)
    } else {
      ctx.clearRect(0, 0, 160, 160)
    }

    // Calculate dimensions to maintain aspect ratio and apply zoom + pan
    const aspect = img.naturalWidth / img.naturalHeight
    let drawW = 160
    let drawH = 160

    if (aspect > 1) {
      drawH = 160 / aspect
    } else {
      drawW = 160 * aspect
    }

    drawW *= zoom
    drawH *= zoom

    const centerX = 160 / 2 + (pan.x * (160 / 260))
    const centerY = 160 / 2 + (pan.y * (160 / 260))

    ctx.drawImage(img, centerX - drawW / 2, centerY - drawH / 2, drawW, drawH)
    setLivePreviewUrl(canvas.toDataURL('image/png'))
  }, [zoom, pan, fillColor])

  useEffect(() => {
    if (modalOpen && imageSrc) {
      updateLivePreview()
    }
  }, [modalOpen, imageSrc, zoom, pan, fillColor, updateLivePreview])

  // Mouse Drag / Touch Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y
    // Limit pan bounds to prevent losing image completely
    const maxPan = 130 * zoom
    setPan({
      x: Math.max(-maxPan, Math.min(maxPan, newX)),
      y: Math.max(-maxPan, Math.min(maxPan, newY)),
    })
  }

  const handleMouseUp = () => setIsDragging(false)

  // Zoom control helpers
  const handleZoomChange = (delta: number) => {
    setZoom((prev) => Math.min(3.0, Math.max(0.6, parseFloat((prev + delta).toFixed(2)))))
  }

  const handleReset = () => {
    setZoom(1.0)
    setPan({ x: 0, y: 0 })
  }

  const handleTrimWhitespace = () => {
    setZoom(1.28)
    setPan({ x: 0, y: 0 })
  }

  const handleFitContain = () => {
    setZoom(0.92)
    setPan({ x: 0, y: 0 })
  }

  // Export 512x512 Canvas and Upload
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
      if (!ctx) throw new Error('Canvas context could not be created.')

      // Fill background if a fill color is selected for empty spaces
      if (fillColor && fillColor !== 'transparent') {
        ctx.fillStyle = fillColor
        ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE)
      } else {
        ctx.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE)
      }

      const aspect = img.naturalWidth / img.naturalHeight
      let drawW = OUTPUT_SIZE
      let drawH = OUTPUT_SIZE

      if (aspect > 1) {
        drawH = OUTPUT_SIZE / aspect
      } else {
        drawW = OUTPUT_SIZE * aspect
      }

      drawW *= zoom
      drawH *= zoom

      // Scale pan from viewport (260px) to output (512px)
      const scaleFactor = OUTPUT_SIZE / 260
      const centerX = OUTPUT_SIZE / 2 + pan.x * scaleFactor
      const centerY = OUTPUT_SIZE / 2 + pan.y * scaleFactor

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, centerX - drawW / 2, centerY - drawH / 2, drawW, drawH)

      // 2. Convert to Blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/png')
      })

      if (!blob) throw new Error('Failed to encode 512x512 PNG.')

      const processedFile = new File([blob], `icon-${Date.now()}.png`, { type: 'image/png' })

      // 3. Attempt Server-side processing route (/api/upload/icon)
      let uploadedUrl: string | null = null
      try {
        const formData = new FormData()
        formData.append('file', processedFile)

        const res = await fetch('/api/upload/icon', {
          method: 'POST',
          body: formData,
        })

        if (res.ok) {
          const data = await res.json()
          if (data.url) uploadedUrl = data.url
        }
      } catch (apiErr) {
        console.warn('Server icon upload route failed, falling back to direct client storage:', apiErr)
      }

      // 4. Fallback to direct client Supabase upload if server route was unavailable
      if (!uploadedUrl) {
        const supabase = createClient()
        const uploadUserId = userId || (await supabase.auth.getUser()).data.user?.id
        if (!uploadUserId) throw new Error('Authentication required to upload icons.')

        const filePath = `${uploadUserId}/${Date.now()}.png`
        const { error: uploadError } = await supabase.storage
          .from('icons')
          .upload(filePath, processedFile, { contentType: 'image/png', upsert: true })

        if (uploadError) throw new Error(uploadError.message)

        const { data: urlData } = supabase.storage.from('icons').getPublicUrl(filePath)
        uploadedUrl = urlData.publicUrl
      }

      // 5. Update state and notify parent
      setLivePreviewUrl(uploadedUrl)
      onIconChange(uploadedUrl)
      setModalOpen(false)
    } catch (err: any) {
      console.error('Failed to save icon:', err)
      setErrorMessage(err.message || 'Failed to save and upload icon.')
    } finally {
      setLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Background style helper for crop viewport:
  // Shows checkered transparency grid if transparent, or the chosen fill color
  const getViewportBg = () => {
    if (!fillColor || fillColor === 'transparent') {
      return 'repeating-conic-gradient(#2c2c2c 0% 25%, #181818 0% 50%) 50% / 14px 14px'
    }
    return fillColor
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Current Icon Trigger Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
        {/* Reusable AppIcon preview */}
        <div style={{ position: 'relative' }}>
          <AppIcon
            src={livePreviewUrl || currentIconUrl}
            alt={appName || 'App Icon'}
            size={64}
            fallbackText={appName}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              type="button"
              disabled={disabled || loading}
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 1.15rem',
                background: '#222222',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '0.5rem',
                color: '#FFFFFF',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: disabled || loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!disabled && !loading) {
                  e.currentTarget.style.borderColor = '#E50914'
                  e.currentTarget.style.background = '#2A2A2A'
                }
              }}
              onMouseLeave={(e) => {
                if (!disabled && !loading) {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
                  e.currentTarget.style.background = '#222222'
                }
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Processing…</span>
                </>
              ) : (
                <>
                  <Upload size={15} />
                  <span>{currentIconUrl ? 'Replace Icon' : 'Upload Icon'}</span>
                </>
              )}
            </button>

            {livePreviewUrl && (
              <button
                type="button"
                onClick={() => {
                  if (imageElementRef.current) {
                    setModalOpen(true)
                  } else if (currentIconUrl) {
                    const img = new Image()
                    img.crossOrigin = 'anonymous'
                    img.onload = () => {
                      imageElementRef.current = img
                      setImageSrc(currentIconUrl)
                      setModalOpen(true)
                    }
                    img.src = currentIconUrl
                  }
                }}
                style={{
                  padding: '0.55rem 0.85rem',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.5rem',
                  color: '#AAAAAA',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                Re-adjust
              </button>
            )}
          </div>

          <p style={{ color: '#777777', fontSize: '0.78rem', margin: 0 }}>
            PNG, JPG, SVG or WebP. Cropped &amp; normalized to 512×512px. Transparent &amp; dark logos fully supported.
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {/* Inline Feedback Banner */}
      {errorMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(229, 9, 20, 0.12)',
            border: '1px solid rgba(229, 9, 20, 0.35)',
            borderRadius: '0.5rem',
            padding: '0.65rem 0.85rem',
            color: '#FF6B6B',
            fontSize: '0.82rem',
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ── MODAL: Interactive Cropper & Live Marketplace Preview ── */}
      {modalOpen && imageSrc && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              background: '#141414',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '1rem',
              width: '100%',
              maxWidth: '820px',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.95)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  Adjust App Icon &amp; Marketplace Preview
                </h3>
                <p style={{ color: '#888888', fontSize: '0.82rem', margin: '0.2rem 0 0' }}>
                  Position and zoom your logo. Eliminate awkward borders or excessive whitespace.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#AAAAAA',
                  cursor: 'pointer',
                  padding: '0.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body: 2 Columns */}
            <div
              style={{
                padding: '1.5rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '2rem',
              }}
            >
              {/* Column 1: Interactive Crop Canvas & Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#CCCCCC' }}>
                    1:1 Square Crop Canvas
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#777777' }}>
                    Drag to move • Zoom to resize
                  </span>
                </div>

                {/* Crop Viewport */}
                <div
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  style={{
                    width: '260px',
                    height: '260px',
                    borderRadius: '57px', // 22% squircle border
                    overflow: 'hidden',
                    position: 'relative',
                    background: getViewportBg(),
                    border: '2px solid rgba(229, 9, 20, 0.65)',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.8), inset 0 0 20px rgba(0, 0, 0, 0.4)',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    userSelect: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* Subtle Grid Guidelines */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      border: '1px dashed rgba(255, 255, 255, 0.12)',
                      pointerEvents: 'none',
                      zIndex: 3,
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      left: '33.33%',
                      right: '33.33%',
                      top: 0,
                      bottom: 0,
                      borderLeft: '1px dotted rgba(255, 255, 255, 0.08)',
                      borderRight: '1px dotted rgba(255, 255, 255, 0.08)',
                      pointerEvents: 'none',
                      zIndex: 3,
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '33.33%',
                      bottom: '33.33%',
                      left: 0,
                      right: 0,
                      borderTop: '1px dotted rgba(255, 255, 255, 0.08)',
                      borderBottom: '1px dotted rgba(255, 255, 255, 0.08)',
                      pointerEvents: 'none',
                      zIndex: 3,
                    }}
                  />

                  {/* Movable/Scalable Image */}
                  <img
                    src={imageSrc}
                    alt="Cropping target"
                    draggable={false}
                    style={{
                      position: 'absolute',
                      maxWidth: 'none',
                      maxHeight: 'none',
                      width: `${imageDims.width > imageDims.height ? 260 * zoom : (260 * (imageDims.width / (imageDims.height || 1))) * zoom}px`,
                      height: `${imageDims.height >= imageDims.width ? 260 * zoom : (260 * (imageDims.height / (imageDims.width || 1))) * zoom}px`,
                      transform: `translate(${pan.x}px, ${pan.y}px)`,
                      pointerEvents: 'none',
                      transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                    }}
                  />
                </div>

                {/* Zoom Controls */}
                <div style={{ width: '100%', maxWidth: '280px', marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.78rem', color: '#AAAAAA' }}>Zoom</span>
                    <span style={{ fontSize: '0.78rem', color: '#FFFFFF', fontWeight: 600 }}>{Math.round(zoom * 100)}%</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => handleZoomChange(-0.1)}
                      style={{
                        background: '#222222',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '0.35rem',
                        color: '#FFF',
                        padding: '0.35rem 0.5rem',
                        cursor: 'pointer',
                      }}
                    >
                      <ZoomOut size={14} />
                    </button>

                    <input
                      type="range"
                      min="0.6"
                      max="3.0"
                      step="0.05"
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
                        background: '#222222',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '0.35rem',
                        color: '#FFF',
                        padding: '0.35rem 0.5rem',
                        cursor: 'pointer',
                      }}
                    >
                      <ZoomIn size={14} />
                    </button>
                  </div>
                </div>

                {/* Presets Row */}
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.85rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={handleFitContain}
                    style={{
                      padding: '0.35rem 0.65rem',
                      background: '#1F1F1F',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '0.4rem',
                      color: '#CCC',
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                    }}
                  >
                    Fit Whole Logo
                  </button>
                  <button
                    type="button"
                    onClick={handleTrimWhitespace}
                    style={{
                      padding: '0.35rem 0.65rem',
                      background: '#1F1F1F',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '0.4rem',
                      color: '#CCC',
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                    }}
                  >
                    Trim Whitespace
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    style={{
                      padding: '0.35rem 0.65rem',
                      background: '#1F1F1F',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '0.4rem',
                      color: '#CCC',
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <RotateCcw size={12} />
                    <span>Reset</span>
                  </button>
                </div>

                {/* Logo Space Fill Color */}
                <div style={{ marginTop: '1.25rem', width: '100%', maxWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#CCCCCC' }}>
                      Logo Space Fill Color
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#888888', fontFamily: 'monospace' }}>
                      {fillColor === 'transparent' ? 'TRANSPARENT' : fillColor.toUpperCase()}
                    </span>
                  </div>
                  <p style={{ color: '#777777', fontSize: '0.72rem', margin: '0 0 0.5rem', lineHeight: 1.3 }}>
                    Fills empty top/bottom or side space for rectangular/non-square logos.
                  </p>

                  {/* Swatches Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.3rem', marginBottom: '0.5rem' }}>
                    {[
                      { id: 'transparent', label: 'Alpha', value: 'transparent', bg: 'repeating-conic-gradient(#3a3a3a 0% 25%, #202020 0% 50%) 50% / 6px 6px' },
                      { id: 'dark', label: 'Dark', value: '#161616', bg: '#161616' },
                      { id: 'black', label: 'Black', value: '#000000', bg: '#000000' },
                      { id: 'white', label: 'White', value: '#FFFFFF', bg: '#FFFFFF' },
                      { id: 'red', label: 'Red', value: '#E50914', bg: '#E50914' },
                    ].map((swatch) => {
                      const isSelected = fillColor.toLowerCase() === swatch.value.toLowerCase()
                      return (
                        <button
                          key={swatch.id}
                          type="button"
                          onClick={() => setFillColor(swatch.value)}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.2rem',
                            padding: '0.4rem 0.2rem',
                            background: isSelected ? 'rgba(229, 9, 20, 0.15)' : '#1F1F1F',
                            border: `1.5px solid ${isSelected ? '#E50914' : 'rgba(255, 255, 255, 0.08)'}`,
                            borderRadius: '0.4rem',
                            color: isSelected ? '#FFFFFF' : '#888888',
                            fontSize: '0.68rem',
                            fontWeight: isSelected ? 700 : 400,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span
                            style={{
                              width: '14px',
                              height: '14px',
                              borderRadius: '50%',
                              background: swatch.bg,
                              border: swatch.value === '#FFFFFF' ? '1px solid #AAAAAA' : '1px solid rgba(255,255,255,0.25)',
                              boxSizing: 'border-box',
                            }}
                          />
                          <span>{swatch.label}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Custom Color Row */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: '#191919',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.4rem',
                    padding: '0.35rem 0.55rem',
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', flex: 1 }}>
                      <input
                        type="color"
                        value={fillColor === 'transparent' ? customHex : fillColor}
                        onChange={(e) => {
                          const val = e.target.value
                          setCustomHex(val)
                          setFillColor(val)
                        }}
                        style={{
                          width: '22px',
                          height: '22px',
                          padding: 0,
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          background: 'transparent',
                        }}
                      />
                      <span style={{ fontSize: '0.74rem', color: '#AAAAAA' }}>Custom Color:</span>
                    </label>
                    <input
                      type="text"
                      value={fillColor === 'transparent' ? '' : fillColor}
                      placeholder="#HEX"
                      maxLength={7}
                      onChange={(e) => {
                        let val = e.target.value.trim()
                        if (!val) {
                          setFillColor('transparent')
                          return
                        }
                        if (!val.startsWith('#')) val = '#' + val
                        setFillColor(val)
                        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                          setCustomHex(val)
                        }
                      }}
                      style={{
                        width: '72px',
                        background: '#111111',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '0.3rem',
                        color: '#FFFFFF',
                        fontSize: '0.74rem',
                        padding: '0.2rem 0.4rem',
                        outline: 'none',
                        fontFamily: 'monospace',
                        textTransform: 'uppercase',
                        textAlign: 'center',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Column 2: Live Marketplace Card Preview */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#CCCCCC', marginBottom: '0.2rem' }}>
                  Live App Card Preview (Marketplace)
                </span>
                <p style={{ color: '#777777', fontSize: '0.75rem', margin: '0 0 1rem' }}>
                  Simulated presentation on AppFlix&apos;s standard dark marketplace card.
                </p>

                {/* Simulated Marketplace Card (Standard AppFlix Card Theme) */}
                <div
                  style={{
                    background: 'linear-gradient(145deg, #0F0F0F 0%, #080808 100%)',
                    borderRadius: '0.85rem',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '1.25rem',
                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.85rem' }}>
                    {/* The Live Normalized Icon with fill color reflected */}
                    <div style={{ flexShrink: 0 }}>
                      <AppIcon
                        src={livePreviewUrl}
                        alt={appName}
                        size={54}
                        fallbackText={appName}
                        style={{
                          background: fillColor === 'transparent' ? '#161616' : fillColor,
                        }}
                      />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <h4
                          style={{
                            margin: 0,
                            fontSize: '1rem',
                            fontWeight: 800,
                            color: '#FFFFFF',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {appName || 'App Name'}
                        </h4>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '999px',
                            background: 'rgba(229, 9, 20, 0.15)',
                            color: '#E50914',
                            border: '1px solid rgba(229, 9, 20, 0.3)',
                          }}
                        >
                          Beta
                        </span>
                      </div>
                      <p
                        style={{
                          margin: '0.35rem 0 0',
                          fontSize: '0.8rem',
                          color: '#AAAAAA',
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {tagline || 'A fast, reliable app built for the community.'}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer tags & upvote mockup */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                      paddingTop: '0.75rem',
                    }}
                  >
                    <span style={{ fontSize: '0.72rem', color: '#666666' }}>
                      Category: <strong style={{ color: '#AAAAAA' }}>{categoryName}</strong>
                    </span>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        background: '#1F1F1F',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '0.4rem',
                        padding: '0.25rem 0.6rem',
                        fontSize: '0.75rem',
                        color: '#FFFFFF',
                        fontWeight: 600,
                      }}
                    >
                      <Flame size={12} style={{ color: '#E50914' }} />
                      <span>24</span>
                    </div>
                  </div>
                </div>

                {/* Trending Now Banner Preview */}
                <div style={{ marginTop: '1.25rem' }}>
                  <span style={{ fontSize: '0.78rem', color: '#888888', display: 'block', marginBottom: '0.4rem' }}>
                    Trending Now Centerpiece Preview:
                  </span>
                  <div
                    style={{
                      height: '90px',
                      borderRadius: '8px',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <img
                      src="/assets/poster backgronds for apps.jpg"
                      alt=""
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.55)' }} />
                    <div style={{ position: 'relative', zIndex: 2 }}>
                      <AppIcon
                        src={livePreviewUrl}
                        alt={appName}
                        size={52}
                        fallbackText={appName}
                        style={{
                          background: fillColor === 'transparent' ? '#161616' : fillColor,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '0.85rem',
                background: '#111111',
              }}
            >
              <button
                type="button"
                disabled={loading}
                onClick={() => setModalOpen(false)}
                style={{
                  padding: '0.6rem 1.25rem',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '0.5rem',
                  color: '#AAAAAA',
                  fontSize: '0.85rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleApplyAndSave}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.6rem 1.45rem',
                  background: '#E50914',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: '#FFFFFF',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(229, 9, 20, 0.4)',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Standardizing &amp; Saving…</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Apply &amp; Save Icon (512×512)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
