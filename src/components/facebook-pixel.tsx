'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'
import { newEventID } from '@/lib/meta-pixel'

const DEV_HOSTS = ['localhost', '127.0.0.1', '']
const CAPI_API_URL = process.env.NEXT_PUBLIC_API_URL || ''

type FbqFn = (...args: unknown[]) => void

function getFbq(): FbqFn | undefined {
  return (window as unknown as { fbq?: FbqFn }).fbq
}

function readCookie(name: string): string {
  if (typeof document === 'undefined') return ''
  const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'))
  return m ? decodeURIComponent(m[1]) : ''
}

// PageView is the heaviest contributor to the browser/server-side event gap
// flagged by Meta: ad blockers + iOS privacy strip it on a real chunk of
// visitors. Mirroring it via CAPI with a shared eventID is what closes that
// gap without double-counting.
function mirrorPageView(eventID: string): void {
  if (typeof fetch !== 'function' || !CAPI_API_URL) return
  const fbp = readCookie('_fbp')
  const fbc = readCookie('_fbc')
  try {
    void fetch(`${CAPI_API_URL}/meta/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id: eventID,
        event_name: 'PageView',
        event_source_url: window.location.href,
        user_data: {
          ...(fbp ? { fbp } : {}),
          ...(fbc ? { fbc } : {}),
        },
      }),
      keepalive: true,
    }).catch(() => {})
  } catch {
    // analytics must not break the page
  }
}

export function FacebookPixel() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (DEV_HOSTS.includes(window.location.hostname)) return
    setEnabled(true)

    const fbq = getFbq()
    if (fbq) {
      fbq('consent', 'grant')
      const eventID = newEventID()
      fbq('track', 'PageView', {}, { eventID })
      mirrorPageView(eventID)
    }

    return () => {
      getFbq()?.('consent', 'revoke')
    }
  }, [])

  if (!enabled) return null

  return (
    <>
      <Script id="facebook-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('consent', 'grant');
          // autoConfig=false desativa "Configuracao automatica" da Meta:
          // sem isso, eventos do Event Setup Tool / Eventos Automaticos
          // configurados no Events Manager disparam SEM value/currency.
          // Meta aceita string 'false' por documentacao oficial — boolean
          // nem sempre eh respeitado pelo fbevents.js.
          fbq('set', 'autoConfig', 'false', '1268822281463738');
          fbq('init', '1268822281463738');
          // The bootstrap PageView fires here without an eventID; the React
          // effect above re-fires PageView with an eventID and a CAPI mirror
          // for dedup. The first call is best-effort coverage for visitors
          // whose React tree never mounts (instant bounces).
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src="https://www.facebook.com/tr?id=1268822281463738&ev=PageView&noscript=1"
          alt=""
        />
      </noscript>
    </>
  )
}
