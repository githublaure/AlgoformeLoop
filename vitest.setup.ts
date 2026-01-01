import '@testing-library/jest-dom'

// JSDOM doesn't implement ResizeObserver; some Radix components depend on it
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// @ts-ignore
global.ResizeObserver = ResizeObserver
