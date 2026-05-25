import express from 'express'
import { getIntensityFromCount, INTENSITY_LEVELS } from './intensity.mjs'
import { sendHonkWebhook } from './webhook.mjs'

const RATE_LIMIT_WINDOW_MS = 60_000
const MAX_REQUESTS_PER_WINDOW = 90

function createRateLimiter() {
  const requestsByIp = new Map()

  return (req, res, next) => {
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown'
    const now = Date.now()
    const currentWindow = (requestsByIp.get(ip) ?? []).filter(
      (requestTime) => now - requestTime < RATE_LIMIT_WINDOW_MS,
    )

    if (currentWindow.length >= MAX_REQUESTS_PER_WINDOW) {
      return res.status(429).json({ error: 'Too many requests. Please slow down.' })
    }

    currentWindow.push(now)
    requestsByIp.set(ip, currentWindow)
    return next()
  }
}

function normalizeOrigins(allowedOriginsInput) {
  if (typeof allowedOriginsInput === 'string') {
    return allowedOriginsInput
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
  }

  if (Array.isArray(allowedOriginsInput)) {
    return allowedOriginsInput.map((value) => value.trim()).filter(Boolean)
  }

  return []
}

function validatePayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { message: 'Request body must be a JSON object.' }
  }

  const honkCount = body.honkCount
  const intensity = body.intensity

  if (!Number.isInteger(honkCount) || honkCount < 1 || honkCount > 1_000_000) {
    return { message: 'honkCount must be an integer between 1 and 1000000.' }
  }

  if (intensity !== undefined && !INTENSITY_LEVELS.includes(intensity)) {
    return { message: `intensity must be one of: ${INTENSITY_LEVELS.join(', ')}.` }
  }

  const expectedIntensity = getIntensityFromCount(honkCount)
  if (intensity !== undefined && intensity !== expectedIntensity) {
    return {
      message: `intensity mismatch. Expected ${expectedIntensity} for honkCount ${honkCount}.`,
    }
  }

  return { honkCount, intensity: expectedIntensity }
}

function hasAllowedOrigin(origin, allowedOrigins) {
  if (!origin || allowedOrigins.length === 0) {
    return true
  }

  return allowedOrigins.includes(origin)
}

export function createApp({
  webhookUrl = process.env.HONK_WEBHOOK_URL,
  allowedOrigins = process.env.ALLOWED_ORIGINS,
  fetchImpl = fetch,
  maxRetries = 3,
} = {}) {
  const app = express()
  const normalizedOrigins = normalizeOrigins(allowedOrigins)

  app.disable('x-powered-by')
  app.use(express.json({ limit: '16kb' }))
  app.use(createRateLimiter())

  app.get('/api/health', (_req, res) => {
    res.status(200).json({ ok: true })
  })

  app.post('/api/telemetry/honk', async (req, res) => {
    const origin = req.get('origin')
    if (!hasAllowedOrigin(origin, normalizedOrigins)) {
      return res.status(403).json({ error: 'Origin is not allowed.' })
    }

    const validationResult = validatePayload(req.body)
    if ('message' in validationResult) {
      return res.status(400).json({ error: validationResult.message })
    }

    if (!webhookUrl) {
      return res.status(503).json({ error: 'Webhook destination is not configured.' })
    }

    try {
      await sendHonkWebhook({
        webhookUrl,
        fetchImpl,
        maxRetries,
        payload: {
          eventType: 'goose_honk',
          honkCount: validationResult.honkCount,
          intensity: validationResult.intensity,
          occurredAt: new Date().toISOString(),
        },
      })

      return res.status(202).json({ accepted: true })
    } catch (error) {
      console.error('Failed to forward honk telemetry:', error)
      return res.status(502).json({ error: 'Failed to forward telemetry.' })
    }
  })

  app.use((error, _req, res, _next) => {
    if (error instanceof SyntaxError && 'body' in error) {
      return res.status(400).json({ error: 'Malformed JSON body.' })
    }

    console.error('Unhandled API error:', error)
    return res.status(500).json({ error: 'Internal server error.' })
  })

  return app
}
