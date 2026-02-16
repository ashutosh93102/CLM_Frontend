import Link from 'next/link'

export default function PrivacyPage() {
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

        <h1 className="mt-10 text-3xl font-bold text-gray-900">Privacy Policy</h1>
        <p className="mt-3 text-gray-600">This is a placeholder Privacy Policy page. Replace with your policy.</p>

        <div className="mt-8 space-y-4 text-gray-700 leading-relaxed">
          <p>
            We collect and process data necessary to provide the service, improve product experience, and maintain security.
          </p>
          <p>
            If you have questions about your data, please reach out via the Contact page.
          </p>
        </div>
      </div>
    </div>
  )
}
