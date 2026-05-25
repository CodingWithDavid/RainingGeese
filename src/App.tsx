import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { getIntensity } from './lib/intensity'

const FALL_DURATION_MS = 3000
const DEFAULT_GOOSE_IMAGE_URL =
  'https://files.taskade.com/space-files/6b9e34c5-9d23-49cf-8b48-61aee1c51515/original/Domestic_goose.png'
const DEFAULT_HONK_SOUND_URL = 'https://www.myinstants.com/media/sounds/honk-sound.mp3'

type FallingGoose = {
  id: string
  x: number
  rotation: number
}

function App() {
  const [honkCount, setHonkCount] = useState(0)
  const [fallingGeese, setFallingGeese] = useState<FallingGoose[]>([])
  const honkCountRef = useRef(0)
  const timeoutIdsRef = useRef<number[]>([])
  const gooseImageUrl = import.meta.env.VITE_GOOSE_IMAGE_URL ?? DEFAULT_GOOSE_IMAGE_URL
  const honkSoundUrl = import.meta.env.VITE_HONK_SOUND_URL ?? DEFAULT_HONK_SOUND_URL
  const fallTargetY = typeof window === 'undefined' ? 1200 : window.innerHeight + 200
  const intensity = useMemo(
    () => (honkCount === 0 ? 'Classic' : getIntensity(honkCount)),
    [honkCount],
  )

  useEffect(() => {
    return () => {
      timeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
    }
  }, [])

  const playHonk = useCallback(() => {
    const audio = new Audio(honkSoundUrl)
    audio.volume = 0.5
    void audio.play().catch((error: unknown) => {
      console.error('Failed to play honk sound:', error)
    })
  }, [honkSoundUrl])

  const handleHonk = useCallback(() => {
    const nextHonkCount = honkCountRef.current + 1
    honkCountRef.current = nextHonkCount
    setHonkCount(nextHonkCount)
    playHonk()

    const gooseId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const fallingGoose: FallingGoose = {
      id: gooseId,
      x: Math.random() * 90 + 5,
      rotation: Math.random() * 360,
    }

    setFallingGeese((currentGeese) => [...currentGeese, fallingGoose])

    const timeoutId = window.setTimeout(() => {
      setFallingGeese((currentGeese) => currentGeese.filter((goose) => goose.id !== gooseId))
      timeoutIdsRef.current = timeoutIdsRef.current.filter((id) => id !== timeoutId)
    }, FALL_DURATION_MS)

    timeoutIdsRef.current.push(timeoutId)
  }, [playHonk])

  return (
    <main className="app-shell">
      <AnimatePresence>
        {fallingGeese.map((goose) => (
          <motion.img
            key={goose.id}
            initial={{ y: -460, opacity: 1, rotate: goose.rotation }}
            animate={{
              y: fallTargetY,
              rotate: goose.rotation + 720,
              opacity: [1, 1, 0.4, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, ease: 'easeIn' }}
            className="falling-goose"
            style={{ left: `${goose.x}%` }}
            src={gooseImageUrl}
            alt="Falling Goose"
          />
        ))}
      </AnimatePresence>

      <section className="content-card">
        <p className="eyebrow">Rain Controller</p>
        <h1>It's Raining Geese</h1>
        <p className="subtitle">
          Tap the goose to honk and trigger rain animations.
        </p>

        <div className="stats-grid">
          <article className="stat-tile">
            <span className="stat-label">Total Honks</span>
            <strong className="stat-value" data-testid="honk-count">
              {honkCount}
            </strong>
          </article>
          <article className="stat-tile">
            <span className="stat-label">Intensity</span>
            <strong className="stat-value">{intensity}</strong>
          </article>
        </div>

        <motion.button
          type="button"
          className="goose-button"
          onClick={handleHonk}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Honk the goose"
        >
          <img src={gooseImageUrl} alt="Goose mascot" className="goose-image" />
        </motion.button>
      </section>
    </main>
  )
}

export default App
