const DEFAULT_RETRY_DELAYS_MS = [200, 450, 900]

function wait(delayMs) {
  if (delayMs <= 0) {
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    setTimeout(resolve, delayMs)
  })
}

export async function sendHonkWebhook({
  webhookUrl,
  payload,
  fetchImpl = fetch,
  maxRetries = 3,
  retryDelaysMs = DEFAULT_RETRY_DELAYS_MS,
}) {
  let lastError = new Error('Webhook request failed before sending')

  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    try {
      const response = await fetchImpl(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        return
      }

      const isRetryable = response.status >= 500 || response.status === 429
      lastError = new Error(`Webhook request failed with status ${response.status}`)

      if (!isRetryable) {
        throw lastError
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown webhook error')
    }

    if (attempt < maxRetries - 1) {
      const delayMs = retryDelaysMs[Math.min(attempt, retryDelaysMs.length - 1)]
      await wait(delayMs)
    }
  }

  throw lastError
}
