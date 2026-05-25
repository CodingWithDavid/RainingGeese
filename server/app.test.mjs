// @vitest-environment node
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import { createApp } from './app.mjs'

describe('telemetry API', () => {
  it('rejects invalid payloads', async () => {
    const app = createApp({ webhookUrl: 'https://example.com/webhook' })
    const response = await request(app).post('/api/telemetry/honk').send({ honkCount: 0 })

    expect(response.status).toBe(400)
    expect(response.body.error).toContain('honkCount')
  })

  it('rejects intensity mismatches', async () => {
    const app = createApp({ webhookUrl: 'https://example.com/webhook' })
    const response = await request(app)
      .post('/api/telemetry/honk')
      .send({ honkCount: 10, intensity: 'Epic' })

    expect(response.status).toBe(400)
    expect(response.body.error).toContain('intensity mismatch')
  })

  it('accepts valid payloads and forwards telemetry', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, status: 200 }))
    const app = createApp({
      webhookUrl: 'https://example.com/webhook',
      fetchImpl,
      allowedOrigins: ['http://localhost:5173'],
    })

    const response = await request(app)
      .post('/api/telemetry/honk')
      .set('origin', 'http://localhost:5173')
      .send({ honkCount: 5, intensity: 'Epic' })

    expect(response.status).toBe(202)
    expect(fetchImpl).toHaveBeenCalledTimes(1)

    const payload = JSON.parse(fetchImpl.mock.calls[0][1].body)
    expect(payload).toMatchObject({
      eventType: 'goose_honk',
      honkCount: 5,
      intensity: 'Epic',
    })
  })

  it('returns 503 when webhook is not configured', async () => {
    const app = createApp({ webhookUrl: '' })
    const response = await request(app).post('/api/telemetry/honk').send({ honkCount: 1 })

    expect(response.status).toBe(503)
  })
})
