'use client'

import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'

interface HighlightCard {
  title: string
  value: string
  meta: string
}

interface AuthShellProps {
  children: ReactNode
  heading: string
  description: string
  badgeLabel?: string
  highlightCards?: HighlightCard[]
}

const defaultCards: HighlightCard[] = [
  { title: 'Automation uptime', value: '99.98%', meta: 'last 90 days' },
  { title: 'Approvals cleared', value: '2,184', meta: '+18% vs last qtr' },
  { title: 'Templates synced', value: '74', meta: 'shared across org' },
  { title: 'SLA compliance', value: '100%', meta: 'no breaches detected' },
]

const AuthShell = ({
  children,
  heading,
  description,
  badgeLabel = 'Live status',
  highlightCards,
}: AuthShellProps) => {
  const heroRef = useRef<HTMLDivElement | null>(null)
  const [cursor, setCursor] = useState({ x: 45, y: 50 })

  useEffect(() => {
    const node = heroRef.current
    if (!node) return

    const handlePointerMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 100
      const y = ((event.clientY - rect.top) / rect.height) * 100
      setCursor({ x, y })
    }

    node.addEventListener('pointermove', handlePointerMove)
    return () => node.removeEventListener('pointermove', handlePointerMove)
  }, [])

  const cards = useMemo(() => highlightCards || defaultCards, [highlightCards])

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-950 lg:flex-row">
      <div
        ref={heroRef}
        className="relative hidden w-full flex-col justify-between overflow-hidden px-8 py-12 text-white lg:flex lg:w-3/5 2xl:w-2/3"
        style={{
          backgroundImage: `radial-gradient(circle at ${cursor.x}% ${cursor.y}%, rgba(255,255,255,0.35), transparent 55%), linear-gradient(135deg, #4338CA 0%, #7C3AED 35%, #DB2777 75%, #FB7185 100%)`,
        }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="auth-orb absolute -top-24 right-20 h-64 w-64 rounded-full bg-fuchsia-400/40"></div>
          <div className="auth-orb absolute bottom-10 left-10 h-52 w-52 rounded-full bg-sky-400/20" style={{ animationDelay: '2s' }}></div>
          <div className="auth-ring absolute -bottom-32 right-0 h-96 w-96 rounded-full border border-white/20"></div>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em]">
            <span className="h-2 w-2 rounded-full bg-emerald-300"></span>
            {badgeLabel}
          </div>
          <div>
            <h1 className="text-5xl font-black leading-tight tracking-tight 2xl:text-6xl">{heading}</h1>
            <p className="mt-4 max-w-2xl text-lg text-white/80">{description}</p>
          </div>
        </div>

        <div className="relative z-10 mt-12 grid gap-4 sm:grid-cols-2">
          {cards.map((card) => (
            <div
              key={card.title}
              className="rounded-3xl border border-white/30 bg-white/10 p-4 backdrop-blur transition hover:bg-white/20"
            >
              <p className="text-xs uppercase tracking-[0.35em] text-white/80">{card.title}</p>
              <p className="mt-2 text-3xl font-bold">{card.value}</p>
              <p className="text-sm text-white/70">{card.meta}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative flex min-h-screen w-full items-center justify-center bg-white px-6 py-10 lg:w-2/5 2xl:w-1/3">
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-slate-100 via-white to-transparent lg:hidden" aria-hidden></div>
        <div className="relative z-10 w-full max-w-md">{children}</div>
      </div>

      <style jsx>{`
        @keyframes floatSlow {
          0% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-18px) scale(1.05); }
          100% { transform: translateY(0px) scale(1); }
        }
        @keyframes ringPulse {
          0% { transform: scale(0.95); opacity: 0.4; }
          50% { transform: scale(1.05); opacity: 0.8; }
          100% { transform: scale(0.95); opacity: 0.4; }
        }
        .auth-orb {
          animation: floatSlow 14s ease-in-out infinite;
          filter: blur(24px);
        }
        .auth-ring {
          animation: ringPulse 18s ease-in-out infinite;
          filter: blur(1px);
        }
      `}</style>
    </div>
  )
}

export default AuthShell
