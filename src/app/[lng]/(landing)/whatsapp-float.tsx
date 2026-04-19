'use client'

import { useEffect, useState } from 'react'

const WA_NUMBER = '557582947172'
const WA_TEXT = 'Olá, vi o site do Aseno e quero saber mais'

export function WhatsAppFloat() {
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const id = window.setTimeout(() => setRevealed(true), 2000)
    return () => window.clearTimeout(id)
  }, [])

  const href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(WA_TEXT)}`

  return (
    <div className="wa-wrap">
      <span className={`wa-bubble ${revealed ? 'show' : ''}`} aria-hidden={!revealed}>
        Prefere conversar antes?
      </span>
      <a
        href={href}
        target="_blank"
        className="wa-float"
        aria-label="Falar no WhatsApp"
      >
        <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
          <path fill="currentColor" d="M16 3C9.373 3 4 8.373 4 15c0 2.385.703 4.607 1.91 6.473L4 29l7.73-1.868A12.94 12.94 0 0 0 16 27c6.627 0 12-5.373 12-12S22.627 3 16 3zm0 21.75a9.77 9.77 0 0 1-4.976-1.36l-.357-.21-4.586 1.108 1.133-4.47-.232-.368A9.74 9.74 0 1 1 25.75 15c0 5.385-4.365 9.75-9.75 9.75zm5.592-7.302c-.306-.153-1.813-.894-2.094-.997-.281-.102-.486-.153-.691.153-.205.306-.793.997-.972 1.202-.179.205-.358.23-.664.077-.306-.153-1.291-.476-2.46-1.518-.909-.81-1.523-1.81-1.702-2.116-.179-.306-.019-.471.135-.623.139-.138.306-.358.46-.537.153-.179.204-.306.306-.511.102-.205.051-.383-.026-.537-.077-.153-.691-1.663-.948-2.278-.25-.598-.503-.517-.691-.527l-.588-.01c-.204 0-.537.077-.818.383-.281.306-1.073 1.049-1.073 2.557s1.098 2.967 1.251 3.172c.153.205 2.164 3.303 5.243 4.632.733.316 1.305.504 1.751.645.735.234 1.403.201 1.931.122.589-.088 1.813-.741 2.07-1.457.256-.716.256-1.33.179-1.457-.077-.127-.281-.204-.587-.358z"/>
        </svg>
        <span className={`wa-badge ${revealed ? 'show' : ''}`} aria-hidden={!revealed}>1</span>
      </a>
    </div>
  )
}
