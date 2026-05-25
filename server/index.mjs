import 'dotenv/config'
import { createApp } from './app.mjs'

const port = Number(process.env.PORT ?? 8787)
const app = createApp()

app.listen(port, () => {
  console.log(`Telemetry API listening on http://localhost:${port}`)

  if (!process.env.HONK_WEBHOOK_URL) {
    console.warn(
      'HONK_WEBHOOK_URL is not set. POST /api/telemetry/honk will return 503 until configured.',
    )
  }
})
