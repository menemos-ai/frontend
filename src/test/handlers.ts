import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

export const handlers = [
  http.get(`${API}/memory/:tokenId/info`, ({ params }) => {
    return HttpResponse.json({
      tokenId: params.tokenId,
      contentHash: '0xabc123',
      storageUri: 'ipfs://QmTest',
      creator: '0x1234567890123456789012345678901234567890',
      parent: null,
      timestamp: '1714000000',
    })
  }),

  http.get(`${API}/marketplace/listings/:tokenId`, ({ params }) => {
    return HttpResponse.json({
      tokenId: params.tokenId,
      price: '1000000000000000000',
      rentalPricePerDay: '100000000000000000',
      isForSale: true,
      isForRent: true,
      isForFork: false,
      forkRoyaltyBps: 500,
      seller: '0x1234567890123456789012345678901234567890',
    })
  }),

  http.get(`${API}/memory/:tokenId`, ({ params }) => {
    return HttpResponse.json({
      tokenId: params.tokenId,
      bundle: null,
    })
  }),
]

export const server = setupServer(...handlers)
