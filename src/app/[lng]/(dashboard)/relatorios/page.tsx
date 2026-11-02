'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface RelatoriosPageProps {
  params: Promise<{ lng: string }>
}

export default function RelatoriosPage(props: RelatoriosPageProps) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const redirectPath = pathname.replace('/relatorios', '/financeiro')
    router.replace(redirectPath)
  }, [pathname, router])

  return null
}
