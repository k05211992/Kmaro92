'use client'

import { useState } from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface ConnectResponse {
  deepLink: string
  token: string
  expiresAt: string
  instruction: string
}

interface TelegramConnectCardProps {
  isConnected: boolean
  telegramUsername: string | null
}

export function TelegramConnectCard({ isConnected, telegramUsername }: TelegramConnectCardProps) {
  const [connectLink, setConnectLink] = useState<ConnectResponse | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConnect() {
    setConnecting(true)
    setError(null)
    try {
      const res = await fetch('/api/telegram/connect', { method: 'POST' })
      if (!res.ok) {
        const body = (await res.json()) as { error: string }
        setError(body.error)
        return
      }
      setConnectLink((await res.json()) as ConnectResponse)
    } catch {
      setError('Could not generate connect link. Please try again.')
    } finally {
      setConnecting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold text-gray-900">Telegram notifications</h2>
      </CardHeader>
      <CardBody className="space-y-4">
        {isConnected ? (
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-medium">✅ Connected</span>
            {telegramUsername && (
              <span className="text-sm text-gray-500">as @{telegramUsername}</span>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600">
              Connect your Telegram account to receive deal alerts the moment a worthy offer is
              found.
            </p>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {connectLink ? (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
                <p className="text-sm font-medium text-blue-800">Connect in 2 steps:</p>
                <ol className="text-sm text-gray-700 list-decimal list-inside space-y-1">
                  <li>Open the Telegram link below</li>
                  <li>Tap &quot;Start&quot; in the bot chat</li>
                  <li>Come back and refresh this page to confirm</li>
                </ol>
                <a
                  href={connectLink.deepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#229ED9] text-white px-4 py-2 text-sm font-medium hover:bg-[#1a8fc0] transition-colors"
                >
                  Open in Telegram ↗
                </a>
                <p className="text-xs text-gray-500">
                  Link expires at {new Date(connectLink.expiresAt).toLocaleTimeString()}
                  {' — '}
                  <button
                    onClick={() => void handleConnect()}
                    className="underline hover:text-gray-700"
                  >
                    generate a new one
                  </button>
                </p>
              </div>
            ) : (
              <Button onClick={() => void handleConnect()} loading={connecting}>
                Connect Telegram
              </Button>
            )}
          </>
        )}
      </CardBody>
    </Card>
  )
}
