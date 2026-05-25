import type { Intensity } from './intensity'

type HonkTelemetryPayload = {
  honkCount: number
  intensity: Intensity
}

export async function logHonkTelemetry(payload: HonkTelemetryPayload): Promise<void> {
  const response = await fetch('/api/telemetry/honk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Telemetry request failed with status ${response.status}`)
  }
}
