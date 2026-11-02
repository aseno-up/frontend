import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

// Invalidates the public-config tag so the landing page re-fetches plan data
// on the next request. Called by admin pages after saving pricing changes.
// No secret: worst case is a stale-cache refresh, which is benign.
export async function POST() {
  revalidateTag('public-config')
  return NextResponse.json({ ok: true })
}
