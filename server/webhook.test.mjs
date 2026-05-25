// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { sendHonkWebhook } from './webhook.mjs'

describe('sendHonkWebhook', () => {
  it('succeeds when the first request is accepted', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, status: 200 }))

    await sendHonkWebhook({
      webhookUrl: 'https://example.com/hook',
      payload: { honkCount: 1, intensity: 'Classic' },
      fetchImpl,
      maxRetries: 3,
    })

    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('retries retryable failures before succeeding', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: false, status: 429 })
      .mockResolvedValueOnce({ ok: true, status: 200 })

    await sendHonkWebhook({
      webhookUrl: 'https://example.com/hook',
      payload: { honkCount: 10, intensity: 'LEGENDARY' },
      fetchImpl,
      maxRetries: 3,
      retryDelaysMs: [0, 0],
    })

    expect(fetchImpl).toHaveBeenCalledTimes(3)
  })

  it('throws after max retries are exhausted', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 502 }))

    await expect(
      sendHonkWebhook({
        webhookUrl: 'https://example.com/hook',
        payload: { honkCount: 4, intensity: 'Classic' },
        fetchImpl,
        maxRetries: 3,
        retryDelaysMs: [0, 0],
      }),
    ).rejects.toThrow('Webhook request failed with status 502')

    expect(fetchImpl).toHaveBeenCalledTimes(3)
  })
})
