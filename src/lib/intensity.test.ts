import { describe, expect, it } from 'vitest'
import { getIntensity } from './intensity'

describe('getIntensity', () => {
  it('returns Classic when honk count is not a milestone', () => {
    expect(getIntensity(1)).toBe('Classic')
    expect(getIntensity(4)).toBe('Classic')
  })

  it('returns Epic when honk count is divisible by 5', () => {
    expect(getIntensity(5)).toBe('Epic')
    expect(getIntensity(15)).toBe('Epic')
  })

  it('returns LEGENDARY when honk count is divisible by 10', () => {
    expect(getIntensity(10)).toBe('LEGENDARY')
    expect(getIntensity(30)).toBe('LEGENDARY')
  })

  it('throws for invalid values', () => {
    expect(() => getIntensity(0)).toThrow('honkCount must be a positive integer')
    expect(() => getIntensity(-2)).toThrow('honkCount must be a positive integer')
    expect(() => getIntensity(1.5)).toThrow('honkCount must be a positive integer')
  })
})
