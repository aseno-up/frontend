import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

// Invalidates the active-promotion tag so the landing page re-fetches the
// banner state on the next request. Called by /admin/promocoes after CRUD.
// No secret: worst case is a stale-cache refresh, which is benign.
export async function POST() {
  revalidateTag('active-promotion')
  return NextResponse.json({ ok: true })
}
