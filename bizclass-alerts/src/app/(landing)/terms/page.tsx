export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12 prose prose-gray">
      <h1>Terms of Service</h1>
      <p className="text-gray-500 text-sm">Last updated: {new Date().getFullYear()}</p>

      <h2>Service description</h2>
      <p>
        BizClass Alerts is a flight price monitoring and notification service. We do not sell,
        issue, or guarantee availability of any airline tickets. We are not a travel agency or
        Online Travel Agency (OTA).
      </p>

      <h2>Disclaimer on prices</h2>
      <ul>
        <li>
          All prices shown are informational and sourced from third-party flight data providers.
        </li>
        <li>Prices and availability may change at any time without notice.</li>
        <li>Fare conditions, baggage allowances, and restrictions must be verified directly with the airline or booking provider.</li>
        <li>We make no guarantee that advertised prices will be available at time of booking.</li>
      </ul>

      <h2>Mixed cabin notice</h2>
      <p>
        Some offers may include &quot;mixed cabin&quot; itineraries where one or more flight segments
        are operated in a class lower than business. We explicitly label all such offers. It is your
        responsibility to review the full itinerary before booking.
      </p>

      <h2>Use of the service</h2>
      <ul>
        <li>You must be 18 or older to use this service.</li>
        <li>You are responsible for the accuracy of your alert criteria.</li>
        <li>We may suspend accounts that abuse the service (e.g., excessive alerts).</li>
      </ul>

      <h2>Limitation of liability</h2>
      <p>
        We are not liable for any losses arising from reliance on prices displayed by this service.
        Always verify prices and terms before purchasing.
      </p>
    </div>
  )
}
