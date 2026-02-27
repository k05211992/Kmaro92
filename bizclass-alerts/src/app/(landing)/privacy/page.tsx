export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12 prose prose-gray">
      <h1>Privacy Policy</h1>
      <p className="text-gray-500 text-sm">Last updated: {new Date().getFullYear()}</p>

      <h2>What data we collect</h2>
      <ul>
        <li>Your email address (for authentication via magic link)</li>
        <li>Telegram chat ID and username (only if you connect Telegram)</li>
        <li>Alert preferences: routes, dates, budget, filters</li>
        <li>Flight offer history related to your alerts</li>
      </ul>

      <h2>How we use your data</h2>
      <ul>
        <li>To send you Telegram notifications about deals matching your alerts</li>
        <li>To check flight prices from our data provider</li>
        <li>We do not sell your data to third parties</li>
      </ul>

      <h2>Data retention</h2>
      <p>
        You can delete your alerts at any time. Your account and data can be deleted on request.
      </p>

      <h2>Third-party services</h2>
      <ul>
        <li>Supabase — authentication and database hosting</li>
        <li>Telegram — notification delivery</li>
        <li>Flight data provider (mock in development, real API in production)</li>
      </ul>

      <h2>Contact</h2>
      <p>For privacy questions, contact us via the app.</p>
    </div>
  )
}
