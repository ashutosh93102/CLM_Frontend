
'use client'

import { useEffect, useRef, useState } from 'react'
import type { ClipboardEvent, FormEvent, KeyboardEvent } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import {
  requestLoginOTP,
  resendPasswordResetOTP,
  verifyEmailOTP,
  verifyPasswordResetOTP,
} from '@/app/lib/api'
import AuthCardShell from '@/app/components/AuthCardShell'

type OTPType = 'email' | 'password-reset' | 'login'

export default function OTPVerificationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const otpType = (searchParams?.get('type') || 'email') as OTPType
  const [email, setEmail] = useState(searchParams?.get('email') || '')

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCountdown, setResendCountdown] = useState(0)
  const [verificationSuccess, setVerificationSuccess] = useState(false)
  const [showChangeEmail, setShowChangeEmail] = useState(false)
  const [tempEmail, setTempEmail] = useState(email)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    setTempEmail(email)
  }, [email])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined
    if (resendCountdown > 0) {
      interval = setInterval(() => {
        setResendCountdown((prev) => prev - 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [resendCountdown])

  useEffect(() => {
    if (email && inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [email])

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const nextOtp = [...otp]
    nextOtp[index] = value.slice(-1)
    setOtp(nextOtp)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text')
    const digits = pastedText.replace(/\D/g, '').split('')

    if (digits.length === 0) return

    const nextOtp = [...otp]
    digits.forEach((digit, idx) => {
      if (idx < 6) nextOtp[idx] = digit
    })
    setOtp(nextOtp)

    const lastIndex = Math.min(digits.length - 1, 5)
    inputRefs.current[lastIndex]?.focus()
  }

  const otpCode = otp.join('')

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits')
      return
    }

    setIsLoading(true)
    try {
      if (otpType === 'email') {
        await verifyEmailOTP({ email, otp: otpCode })
      } else if (otpType === 'password-reset') {
        await verifyPasswordResetOTP({ email, otp: otpCode })
      } else if (otpType === 'login') {
        await verifyEmailOTP({ email, otp: otpCode })
      }

      setVerificationSuccess(true)
      setTimeout(() => {
        if (otpType === 'password-reset') {
          router.push(
            `/reset-password?email=${encodeURIComponent(email)}&otp=${otpCode}`
          )
        } else {
            router.replace('/dashboard')
        }
      }, 1200)
    } catch (err: any) {
      setError(
        err?.message ||
          'Invalid OTP. Please try again. Remaining attempts will be shown.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangeEmail = () => {
    setEmail(tempEmail)
    setOtp(['', '', '', '', '', ''])
    setError('')
    setShowChangeEmail(false)
    inputRefs.current[0]?.focus()
  }

  const handleResend = async () => {
    setError('')
    setIsLoading(true)

    try {
      if (otpType === 'email' || otpType === 'login') {
        await requestLoginOTP(email)
      } else if (otpType === 'password-reset') {
        await resendPasswordResetOTP(email)
      }

      setResendCountdown(30)
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } catch (err: any) {
      setError(err?.message || 'Failed to resend OTP. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const getTitle = () => {
    switch (otpType) {
      case 'password-reset':
        return 'Verify Identity'
      case 'login':
        return 'Verify Email'
      default:
        return 'Verify Email'
    }
  }

  const getSubtitle = () => {
    return `Enter the 6-digit code sent to ${email}`
  }

  const getSuccessMessage = () => {
    if (otpType === 'password-reset') return '✓ OTP verified. Redirecting to reset password…'
    if (otpType === 'login') return '✓ Email verified. Signing you in…'
    return '✓ Account verified & activated. Redirecting to dashboard…'
  }

  return (
    <AuthCardShell title={getTitle()} subtitle={getSubtitle()}>
      {verificationSuccess && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-sm text-green-700">{getSuccessMessage()}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-5">
        {showChangeEmail ? (
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-700">Email</label>
            <input
              type="email"
              value={tempEmail}
              onChange={(e) => setTempEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#ff6f8a]"
              placeholder="name@company.com"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={handleChangeEmail}
              className="text-xs font-semibold text-[#ff5aa0] hover:underline"
              disabled={isLoading}
            >
              Update email
            </button>
          </div>
        ) : (
          <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
            <div className="text-[11px] font-semibold text-gray-400">OTP sent to</div>
            <div className="mt-1 text-sm font-semibold text-gray-900 break-all">{email}</div>
            <button
              type="button"
              onClick={() => setShowChangeEmail(true)}
              className="mt-2 text-xs font-semibold text-[#ff5aa0] hover:underline"
              disabled={isLoading}
            >
              Change email
            </button>
          </div>
        )}

        <div className="flex justify-center gap-2">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="h-12 w-10 rounded-xl border border-gray-200 bg-gray-50 text-center text-lg font-bold text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#ff6f8a]"
              disabled={isLoading}
              aria-label={`OTP digit ${index + 1}`}
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-gradient-to-r from-[#ff8a7a] via-[#ff6f8a] to-[#ff5aa0] py-3.5 text-sm font-semibold text-white shadow-[0_12px_25px_-12px_rgba(255,90,160,0.6)] hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Verifying...' : 'Verify OTP →'}
        </button>

        <div className="text-center">
          <div className="text-xs text-gray-500">Didn't receive the code?</div>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCountdown > 0 || isLoading}
            className="mt-2 text-xs font-semibold text-[#ff5aa0] hover:underline disabled:text-gray-400 disabled:no-underline"
          >
            {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend code'}
          </button>
        </div>

        <div className="text-center">
          <Link href="/login" className="text-xs text-gray-500 hover:text-gray-700">
            ← Back to Login
          </Link>
        </div>
      </form>
    </AuthCardShell>
  )
}
