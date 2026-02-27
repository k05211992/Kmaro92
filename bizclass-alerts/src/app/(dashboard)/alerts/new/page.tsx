import { AlertForm } from '@/components/alerts/AlertForm'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { createAlertAction } from '@/lib/actions/alerts'

export default function NewAlertPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create alert</h1>
      <Card>
        <CardHeader>
          <p className="text-sm text-gray-500">
            Set your route, budget, and dates. We&apos;ll notify you via Telegram when a worthy
            business class deal is found. Cabin class is always <strong>Business</strong>.
          </p>
        </CardHeader>
        <CardBody>
          <AlertForm action={createAlertAction} />
        </CardBody>
      </Card>
    </div>
  )
}
