import { describe, it, expect } from 'vitest';
import { abbreviateNum, relativeTime } from '../api.ts';

describe('abbreviateNum', () => {
  it('returns number as-is below 10000', () => {
    expect(abbreviateNum(500)).toBe('500');
    expect(abbreviateNum(9999)).toBe('9,999');
  });
  it('abbreviates 10k-99k with one decimal', () => {
    expect(abbreviateNum(10000)).toBe('10.0k');
    expect(abbreviateNum(45600)).toBe('45.6k');
  });
  it('abbreviates 100k+ as whole number', () => {
    expect(abbreviateNum(175307)).toBe('175k');
    expect(abbreviateNum(100000)).toBe('100k');
  });
});

describe('relativeTime', () => {
  it('returns "just now" for recent dates', () => {
    const now = new Date().toISOString();
    expect(relativeTime(now)).toBe('just now');
  });
  it('returns minutes ago', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60000).toISOString();
    expect(relativeTime(fiveMinAgo)).toBe('5m ago');
  });
  it('returns hours ago', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 3600000).toISOString();
    expect(relativeTime(twoHoursAgo)).toBe('2h ago');
  });
});
