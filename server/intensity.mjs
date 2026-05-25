export const INTENSITY_LEVELS = ['Classic', 'Epic', 'LEGENDARY']

export function getIntensityFromCount(honkCount) {
  if (!Number.isInteger(honkCount) || honkCount < 1) {
    throw new Error('honkCount must be a positive integer')
  }

  if (honkCount % 10 === 0) {
    return 'LEGENDARY'
  }

  if (honkCount % 5 === 0) {
    return 'Epic'
  }

  return 'Classic'
}
