import '@testing-library/jest-dom'

// JSDOM doesn't implement ResizeObserver; some Radix components depend on it
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// @ts-ignore
global.ResizeObserver = ResizeObserver

// JSDOM doesn't implement Pointer Capture used by some Radix primitives
// @ts-ignore
if (typeof Element !== 'undefined') {
  // @ts-ignore
  Element.prototype.hasPointerCapture = Element.prototype.hasPointerCapture || function () { return false }
  // @ts-ignore
  Element.prototype.setPointerCapture = Element.prototype.setPointerCapture || function () {}
  // @ts-ignore
  Element.prototype.releasePointerCapture = Element.prototype.releasePointerCapture || function () {}
  // polyfill scrollIntoView used by Radix
  // @ts-ignore
  Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || function () {}

  // Polyfill for HTMLMediaElement.play/pause used in tests
  // Some environments (jsdom) don't implement play(), so we return a resolved promise
  if (typeof HTMLMediaElement !== 'undefined') {
    // @ts-ignore
    HTMLMediaElement.prototype.play = HTMLMediaElement.prototype.play || function () { return Promise.resolve() }
    // @ts-ignore
    HTMLMediaElement.prototype.pause = HTMLMediaElement.prototype.pause || function () {}
  }
}
