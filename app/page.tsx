
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/lib/auth-context'

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return
    router.replace(isAuthenticated ? '/dashboard' : '/register')
  }, [isAuthenticated, isLoading, router])

  return null
}
