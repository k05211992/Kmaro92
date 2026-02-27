import type {
  FlightProvider,
  FlightSearchCriteria,
  NormalizedFlightOffer,
  RawFlightResult,
} from '../types'

/**
 * Amadeus Flight Offers Search adapter.
 * Stub implementation — see TODO.md for integration guide.
 */
export const AmadeusFlightProvider: FlightProvider = {
  name: 'amadeus',

  async searchFlights(_criteria: FlightSearchCriteria): Promise<RawFlightResult[]> {
    // TODO: implement Amadeus OAuth2 token fetch + Flight Offers Search API
    // See TODO.md → "Connect real flight API"
    throw new Error('Amadeus provider is not yet implemented. Set FLIGHT_PROVIDER=mock to use mock data.')
  },

  normalizeResults(_raw: RawFlightResult[]): NormalizedFlightOffer[] {
    // TODO: map Amadeus FlightOffer shape to NormalizedFlightOffer
    throw new Error('Amadeus normalizeResults not yet implemented.')
  },

  buildDeepLink(_offer: NormalizedFlightOffer, _criteria: FlightSearchCriteria): string {
    // TODO: build Amadeus deep link or redirect to partner booking page
    throw new Error('Amadeus buildDeepLink not yet implemented.')
  },
}
