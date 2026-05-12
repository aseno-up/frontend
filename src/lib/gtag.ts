type GtagFn = (...args: unknown[]) => void

function getGtag(): GtagFn | undefined {
  if (typeof window === "undefined") return undefined
  return (window as unknown as { gtag?: GtagFn }).gtag
}

export function gtagEvent(
  name: string,
  params: Record<string, unknown> = {}
): void {
  const gtag = getGtag()
  if (gtag) {
    gtag("event", name, params)
  }
}

// Google Ads SUBMIT_LEAD_FORM conversion. The conversion action in Google Ads
// is configured to match the event name `conversion_event_submit_lead_form`,
// so we don't need a `send_to` label — gtag.js routes by event name when the
// new Google tag (AW-...) is loaded.
//
// When called from a handler that navigates to an external URL, pass the URL
// to use the delayed-navigation pattern (waits up to 2s for the gtag hit to
// land before navigating). For client-side router.push navigations the page
// stays loaded, so the no-url form is enough.
export function gtagReportLeadConversion(
  params: Record<string, unknown> = {},
  navigateTo?: string,
): boolean {
  const gtag = getGtag()
  if (!gtag) {
    if (navigateTo) window.location.href = navigateTo
    return false
  }
  const callback = navigateTo
    ? () => {
        if (typeof navigateTo === 'string') window.location.href = navigateTo
      }
    : undefined
  gtag('event', 'conversion_event_submit_lead_form', {
    ...params,
    ...(callback ? { event_callback: callback, event_timeout: 2000 } : {}),
  })
  return false
}

// Google Ads DEMO_TO_REGISTER conversion. Fires when a lead clicks through from
// the interactive demo page to start the sign-up flow. Matches the Google Ads
// conversion action `conversion_event_demo_to_register`. Pass `navigateTo` when
// the click navigates to a different origin so gtag has time to send the hit.
export function gtagReportDemoToRegister(
  params: Record<string, unknown> = {},
  navigateTo?: string,
): boolean {
  const gtag = getGtag()
  if (!gtag) {
    if (navigateTo) window.location.href = navigateTo
    return false
  }
  const callback = navigateTo
    ? () => {
        if (typeof navigateTo === 'string') window.location.href = navigateTo
      }
    : undefined
  gtag('event', 'conversion_event_demo_to_register', {
    ...params,
    ...(callback ? { event_callback: callback, event_timeout: 2000 } : {}),
  })
  return false
}
