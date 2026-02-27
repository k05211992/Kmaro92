import Link from 'next/link'

const features = [
  {
    icon: '🔔',
    title: 'Set your budget',
    desc: 'Tell us your route, dates, and max price. We watch the market for you.',
  },
  {
    icon: '✈️',
    title: 'Business class only',
    desc: 'We track only business class fares — not economy deals in disguise.',
  },
  {
    icon: '📲',
    title: 'Instant Telegram alerts',
    desc: 'Get a Telegram message the moment a worthy deal is found. No email noise.',
  },
  {
    icon: '💡',
    title: 'Know why it\'s good',
    desc: 'Each alert includes a factual explanation of why this price stands out.',
  },
]

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16 sm:py-24 text-center">
          <span className="inline-block bg-brand-50 text-brand-600 text-sm font-semibold px-3 py-1 rounded-full mb-4">
            Business class · Smart alerts
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
            Never miss a great{' '}
            <span className="text-brand-600">business class deal</span>
          </h1>
          <p className="mt-5 text-lg text-gray-500 max-w-xl mx-auto">
            Set your route, budget, and dates. We monitor prices around the clock and alert you via
            Telegram the moment a worthy offer appears.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-6 py-3 text-base font-semibold text-white hover:bg-brand-700 transition-colors shadow-sm"
            >
              Create a free alert →
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              How it works
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="how-it-works" className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-12">
            How it works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 text-lg">{f.title}</h3>
                <p className="mt-1 text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Example notification */}
      <section className="bg-gray-900 py-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-8">What an alert looks like</h2>
          <div className="bg-white rounded-2xl p-5 text-left shadow-xl mx-auto max-w-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-sm">✈️</div>
              <div>
                <p className="font-semibold text-sm">BizClass Alerts</p>
                <p className="text-xs text-gray-400">just now</p>
              </div>
            </div>
            <p className="font-bold text-gray-900 mb-2">✈️ Deal alert!</p>
            <p className="text-sm text-gray-700">📍 SVO → JFK</p>
            <p className="text-sm text-gray-700">📅 15 Mar 2025</p>
            <p className="text-sm font-semibold text-brand-600 mt-1">💰 2,340 EUR</p>
            <p className="text-sm text-gray-600">⏱ 10h 30m · 1 stop</p>
            <p className="text-sm mt-1">🟢 Full Business Class</p>
            <p className="text-xs text-gray-500 mt-2 italic">
              ✅ Below your 2,500 EUR budget · 160 EUR savings
            </p>
            <div className="mt-3">
              <span className="inline-block bg-brand-600 text-white text-xs px-3 py-1.5 rounded-lg">
                🔗 View offer
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="mx-auto max-w-xl px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Ready to stop overpaying?</h2>
          <p className="mt-3 text-gray-500">
            Free to use. No credit card required. Cancel any alert anytime.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-brand-600 px-8 py-3 text-base font-semibold text-white hover:bg-brand-700 transition-colors shadow-sm"
          >
            Get started free →
          </Link>
          <p className="mt-4 text-xs text-gray-400">
            This service does not sell tickets. Prices and availability may change.
          </p>
        </div>
      </section>
    </>
  )
}
