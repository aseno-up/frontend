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
