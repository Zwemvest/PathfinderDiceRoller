import { describe, it, expect } from 'vitest';

describe('test infrastructure', () => {
  it('runs in a real browser with IndexedDB available', () => {
    expect(typeof indexedDB).toBe('object');
  });

  it('has crypto.getRandomValues available', () => {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    expect(arr[0]).toBeGreaterThanOrEqual(0);
  });
});
