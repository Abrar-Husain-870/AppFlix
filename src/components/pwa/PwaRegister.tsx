'use client'

import { useEffect } from 'react'

export default function PwaRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('AppFlix PWA Service Worker registered:', reg.scope)
          })
          .catch((err) => {
            console.warn('AppFlix Service Worker registration failed:', err)
          })
      })
    }
  }, [])

  return null
}
