import Link from 'next/link'

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold text-gray-900">
            Streamline CLM
          </Link>
          <div className="flex gap-4 text-sm">
            <Link href="/login" className="text-gray-600 hover:text-gray-900">
              Sign in
            </Link>
            <Link href="/register" className="text-[#ff5aa0] hover:underline font-semibold">
              Create account
            </Link>
          </div>
        </div>

        <h1 className="mt-10 text-3xl font-bold text-gray-900">Help</h1>
        <p className="mt-3 text-gray-600">Quick links and guidance for using Streamline CLM.</p>

        <div className="mt-8 space-y-3 text-gray-700">
          <p>
            - Trouble signing in? Try{' '}
            <Link href="/forgot-password" className="text-[#ff5aa0] hover:underline font-medium">
              resetting your password
            </Link>
            .
          </p>
          <p>
            - Need to create an account? Go to{' '}
            <Link href="/register" className="text-[#ff5aa0] hover:underline font-medium">
              Sign up
            </Link>
            .
          </p>
          <p>
            - After signup, verify your email with OTP to activate the account.
          </p>
        </div>
      </div>
    </div>
  )
}
