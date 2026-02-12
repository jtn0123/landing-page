import { vi } from 'vitest';

// Mock IntersectionObserver as a proper constructor
class MockIntersectionObserver {
  callback: IntersectionObserverCallback;
  options: IntersectionObserverInit | undefined;
  static instances: MockIntersectionObserver[] = [];

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    this.options = options;
    MockIntersectionObserver.instances.push(this);
  }
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn().mockReturnValue([]);
  root = null;
  rootMargin = '';
  thresholds = [0];

  // Helper to trigger
  trigger(entries: Partial<IntersectionObserverEntry>[]) {
    this.callback(entries as IntersectionObserverEntry[], this as unknown as IntersectionObserver);
  }
}

(globalThis as any).IntersectionObserver = MockIntersectionObserver;

// Ensure matchMedia exists
Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  configurable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock Touch constructor for jsdom
if (typeof globalThis.Touch === 'undefined') {
  (globalThis as any).Touch = class Touch {
    identifier: number;
    target: EventTarget;
    clientX: number;
    clientY: number;
    pageX: number;
    pageY: number;
    screenX: number;
    screenY: number;
    constructor(init: { identifier: number; target: EventTarget; clientX?: number; clientY?: number }) {
      this.identifier = init.identifier;
      this.target = init.target;
      this.clientX = init.clientX ?? 0;
      this.clientY = init.clientY ?? 0;
      this.pageX = this.clientX;
      this.pageY = this.clientY;
      this.screenX = this.clientX;
      this.screenY = this.clientY;
    }
  };
}

export { MockIntersectionObserver };
