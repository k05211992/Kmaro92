import Link from 'next/link'

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm text-center">
        <p className="text-4xl mb-4">📬</p>
        <h1 className="text-xl font-semibold text-gray-900">Check your email</h1>
        <p className="mt-2 text-sm text-gray-500">
          We sent a sign-in link to your email address. Click the link to continue.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm text-brand-600 underline">
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
