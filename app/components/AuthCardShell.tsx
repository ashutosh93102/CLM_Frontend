import Link from 'next/link'

type AuthTab = 'login' | 'register'

export default function AuthCardShell({
  title,
  subtitle,
  activeTab,
  children,
}: {
  title: string
  subtitle?: string
  activeTab?: AuthTab
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen bg-[#f6f1eb] overflow-hidden">
      {/* Soft background shapes */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-white/70 blur-2xl" />
      <div className="pointer-events-none absolute top-10 right-[-120px] h-72 w-72 rounded-full bg-white/60 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-28 left-16 h-96 w-96 rounded-full bg-white/70 blur-2xl" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-[420px]">
          <div className="rounded-[28px] bg-white shadow-[0_25px_60px_-35px_rgba(0,0,0,0.35)] border border-black/5 px-8 py-9">
            {/* Logo */}
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#ff8a7a] via-[#ff6f8a] to-[#ff5aa0] text-white font-bold">
              S
            </div>

            <h1 className="mt-4 text-center text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle ? <p className="mt-1 text-center text-sm text-gray-500">{subtitle}</p> : null}

            {/* Tabs */}
            {activeTab ? (
              <div className="mt-6 rounded-xl bg-gray-100 p-1">
                <div className="grid grid-cols-2 gap-1">
                  <Link
                    href="/login"
                    className={
                      activeTab === 'login'
                        ? 'rounded-lg bg-white py-2 text-center text-sm font-semibold text-gray-900 shadow-sm'
                        : 'rounded-lg py-2 text-center text-sm font-medium text-gray-500 hover:text-gray-700'
                    }
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className={
                      activeTab === 'register'
                        ? 'rounded-lg bg-white py-2 text-center text-sm font-semibold text-gray-900 shadow-sm'
                        : 'rounded-lg py-2 text-center text-sm font-medium text-gray-500 hover:text-gray-700'
                    }
                  >
                    Create Account
                  </Link>
                </div>
              </div>
            ) : null}

            <div className="mt-7">{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
