'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { requestPasswordReset } from '@/app/lib/api'
import AuthCardShell from '@/app/components/AuthCardShell'

export default function ForgotPasswordPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!email) {
      setError('Please enter your email address')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setIsLoading(true)

    try {
      await requestPasswordReset(email)
      setSuccess(true)
      setTimeout(() => {
        router.push(`/verify-otp?type=password-reset&email=${encodeURIComponent(email)}`)
      }, 1500)
    } catch (err: any) {
      setError(err?.message || 'Failed to send reset code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthCardShell
      title="Reset Password"
      subtitle="Enter your email and we’ll send a 6-digit code."
    >
      {success && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-sm text-green-700">✓ Code sent. Redirecting…</p>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-2">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M3 6.5l7 5 7-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 6h12a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-10 py-3 text-sm text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#ff6f8a]"
              disabled={isLoading || success}
              autoComplete="email"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || success}
          className="mt-1 w-full rounded-xl bg-gradient-to-r from-[#ff8a7a] via-[#ff6f8a] to-[#ff5aa0] py-3.5 text-sm font-semibold text-white shadow-[0_12px_25px_-12px_rgba(255,90,160,0.6)] hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {success ? 'Code Sent ✓' : isLoading ? 'Sending…' : 'Send Reset Code →'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link href="/login" className="text-xs text-gray-500 hover:text-gray-700">
          ← Back to Login
        </Link>
      </div>
    </AuthCardShell>
  )
}
