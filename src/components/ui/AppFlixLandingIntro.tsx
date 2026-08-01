'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Script from 'next/script'

export default function AppFlixLandingIntro() {
  const [shouldPlay, setShouldPlay] = useState(false)
  const [spectrumLoaded, setSpectrumLoaded] = useState(false)
  const [engineLoaded, setEngineLoaded] = useState(false)
  const searchParams = useSearchParams()
  const hasTriggeredRef = useRef(false)

  useEffect(() => {
    const paramTrigger = searchParams.get('playIntro') === 'true' || searchParams.get('justLoggedIn') === 'true'
    const sessionTrigger = typeof window !== 'undefined' && sessionStorage.getItem('play_appflix_intro') === 'true'

    const trigger = paramTrigger || sessionTrigger
    if (!trigger || hasTriggeredRef.current) return
    hasTriggeredRef.current = true

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('play_appflix_intro')
    }

    if (paramTrigger && typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.delete('playIntro')
      url.searchParams.delete('justLoggedIn')
      window.history.replaceState({}, '', url.pathname + url.search)
    }

    setShouldPlay(true)
  }, [searchParams])

  useEffect(() => {
    if (!shouldPlay) return

    function runEngine() {
      const canvasEl = document.getElementById('appflix-intro-canvas')
      const AppflixIntro = (window as any).AppflixIntro

      if (canvasEl && AppflixIntro && typeof AppflixIntro.play === 'function') {
        try {
          AppflixIntro.play({
            canvasId: 'appflix-intro-canvas',
            audioSrc: '/intro/intro_audio.mp3',
            onComplete: () => {
              setShouldPlay(false)
              hasTriggeredRef.current = false
            },
          })
        } catch (err) {
          console.error('Error playing AppFlix intro:', err)
          setShouldPlay(false)
          hasTriggeredRef.current = false
        }
      }
    }

    if ((window as any).AppflixIntro && (window as any).spectrumData) {
      const t = setTimeout(runEngine, 20)
      return () => clearTimeout(t)
    } else if (spectrumLoaded && engineLoaded) {
      const t = setTimeout(runEngine, 20)
      return () => clearTimeout(t)
    }
  }, [shouldPlay, spectrumLoaded, engineLoaded])

  if (!shouldPlay) return null

  return (
    <>
      <Script
        src="/intro/spectrum_data.js"
        strategy="afterInteractive"
        onLoad={() => setSpectrumLoaded(true)}
      />
      <Script
        src="/intro/appflix-intro.js"
        strategy="afterInteractive"
        onLoad={() => setEngineLoaded(true)}
      />
      <canvas
        id="appflix-intro-canvas"
        style={{
          display: 'block',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 999999,
          background: '#000000',
          opacity: 1,
        }}
      />
    </>
  )
}
