import '@testing-library/jest-dom'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { server } from './handlers'

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// IntersectionObserver is not implemented in jsdom.
// Stores the last observer callback so tests can trigger it manually.
const mockIntersectionObserver = vi.fn(function (
  this: { observe: ReturnType<typeof vi.fn>; unobserve: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> },
  callback: IntersectionObserverCallback,
) {
  this.observe = vi.fn()
  this.unobserve = vi.fn()
  this.disconnect = vi.fn()
  ;(mockIntersectionObserver as unknown as { lastCallback: IntersectionObserverCallback }).lastCallback = callback
})

vi.stubGlobal('IntersectionObserver', mockIntersectionObserver)

// window.matchMedia is not implemented in jsdom.
// Returns matches: false by default; override per-test with vi.fn().mockReturnValue({ matches: true, ... })
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
