import { config } from '@/config'
import { MockFlightProvider } from './mock'
import { AmadeusFlightProvider } from './amadeus'
import type { FlightProvider } from './types'

export function getFlightProvider(): FlightProvider {
  switch (config.provider.current) {
    case 'mock':
      return MockFlightProvider
    case 'amadeus':
      return AmadeusFlightProvider
    case 'duffel':
      throw new Error('Duffel provider is not yet implemented. See TODO.md.')
    default: {
      const exhaustive: never = config.provider.current
      throw new Error(`Unknown FLIGHT_PROVIDER: ${String(exhaustive)}`)
    }
  }
}
