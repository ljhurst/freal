import '@testing-library/jest-dom/vitest';
import { beforeEach } from 'vitest';

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

// jsdom has no layout, so charts keep their default width.
globalThis.ResizeObserver = ResizeObserverStub;

beforeEach(() => {
  sessionStorage.clear();
});
