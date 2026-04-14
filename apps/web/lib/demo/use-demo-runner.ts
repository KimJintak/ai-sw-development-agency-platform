'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { DemoScenario, DemoStep } from './scenarios'

export type PlayState = 'idle' | 'playing' | 'paused' | 'finished'

export interface DemoRunnerState {
  elapsed: number
  playState: PlayState
  activeSteps: DemoStep[]
  currentStep: DemoStep | null
  progress: number
  play: () => void
  pause: () => void
  reset: () => void
  seek: (ms: number) => void
  setSpeed: (s: number) => void
  speed: number
}

export function useDemoRunner(scenario: DemoScenario): DemoRunnerState {
  const [elapsed, setElapsed] = useState(0)
  const [playState, setPlayState] = useState<PlayState>('idle')
  const [speed, setSpeed] = useState(1)
  const rafRef = useRef<number | null>(null)
  const lastTickRef = useRef<number>(0)

  const tick = useCallback(
    (now: number) => {
      const dt = now - lastTickRef.current
      lastTickRef.current = now
      setElapsed((prev) => {
        const next = prev + dt * speed
        if (next >= scenario.durationMs) {
          setPlayState('finished')
          return scenario.durationMs
        }
        return next
      })
      rafRef.current = requestAnimationFrame(tick)
    },
    [scenario.durationMs, speed],
  )

  useEffect(() => {
    if (playState === 'playing') {
      lastTickRef.current = performance.now()
      rafRef.current = requestAnimationFrame(tick)
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [playState, tick])

  const play = useCallback(() => {
    if (playState === 'finished') setElapsed(0)
    setPlayState('playing')
  }, [playState])

  const pause = useCallback(() => setPlayState('paused'), [])

  const reset = useCallback(() => {
    setElapsed(0)
    setPlayState('idle')
  }, [])

  const seek = useCallback((ms: number) => {
    setElapsed(Math.max(0, Math.min(ms, scenario.durationMs)))
  }, [scenario.durationMs])

  const activeSteps = scenario.steps.filter((s) => s.at <= elapsed)
  const currentStep = activeSteps[activeSteps.length - 1] ?? null
  const progress = scenario.durationMs > 0 ? elapsed / scenario.durationMs : 0

  return {
    elapsed,
    playState,
    activeSteps,
    currentStep,
    progress,
    play,
    pause,
    reset,
    seek,
    setSpeed,
    speed,
  }
}
