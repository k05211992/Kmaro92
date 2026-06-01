import { config } from '@/config'
import { MockFlightProvider } from './mock'
import { AmadeusFlightProvider } from './amadeus'
import type { FlightProvider } from './types'

export function getFlightProvider(): FlightProvider {
  // Feature flag: USE_MOCK_PROVIDER=true always returns mock regardless of FLIGHT_PROVIDER.
  // Safe default for local development and demos.
  if (config.provider.useMock) return MockFlightProvider

  switch (config.provider.current) {
    case 'mock':
      return MockFlightProvider
    case 'amadeus':
      return AmadeusFlightProvider
    case 'duffel':
      throw new Error('Duffel provider is not yet implemented. See V2 roadmap.')
    default: {
      const exhaustive: never = config.provider.current
      throw new Error(`Unknown FLIGHT_PROVIDER: ${String(exhaustive)}`)
    }
  }
}
