import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

class MockAudio {
  volume = 1

  play() {
    return Promise.resolve()
  }
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('Audio', MockAudio as unknown as typeof Audio)
  })

  it('increments honk count', async () => {
    const user = userEvent.setup()

    render(<App />)

    const button = screen.getByRole('button', { name: 'Honk the goose' })
    await user.click(button)

    expect(screen.getByTestId('honk-count')).toHaveTextContent('1')
  })

  it('reports Epic intensity at five honks', async () => {
    const user = userEvent.setup()

    render(<App />)

    const button = screen.getByRole('button', { name: 'Honk the goose' })
    for (let i = 0; i < 5; i += 1) {
      await user.click(button)
    }

    expect(screen.getByTestId('honk-count')).toHaveTextContent('5')
    expect(screen.getByText('Epic')).toBeInTheDocument()
  })
})
