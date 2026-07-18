'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const PLAYER_SIZE = 34
const BULLET_W = 4
const BULLET_H = 16
const BULLET_SPEED = 480 // px/sec
const ENEMY_SIZE = 36
const ENEMY_BASE_SPEED = 90 // px/sec
const ENEMY_SPEED_RAMP = 2.2 // px/sec, added per elapsed second
const ENEMY_MAX_SPEED = 260
const ENEMY_SPAWN_BASE_MS = 850
const ENEMY_BULLET_W = 5
const ENEMY_BULLET_H = 14
const ENEMY_BULLET_SPEED = 320
const ENEMY_BULLET_SPAWN_BASE_MS = 500
const FIRE_COOLDOWN_MS = 180
const START_HEALTH = 10

interface Vec {
  x: number
  y: number
  hit?: boolean
}

interface Props {
  onGameOver: (score: number) => void
}

export default function ShooterGame({ onGameOver }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const sizeRef = useRef<{ w: number; h: number }>({ w: 360, h: 560 })

  const playerRef = useRef<Vec>({ x: 180, y: 460 })
  const bulletsRef = useRef<Vec[]>([])
  const enemiesRef = useRef<Vec[]>([])
  const enemyBulletsRef = useRef<Vec[]>([])
  const lastFireRef = useRef(0)
  const lastEnemySpawnRef = useRef(0)
  const lastEnemyBulletSpawnRef = useRef(0)
  const elapsedRef = useRef(0)
  const scoreRef = useRef(0)
  const healthRef = useRef(START_HEALTH)
  const draggingRef = useRef(false)
  const rafRef = useRef<number>()
  const overRef = useRef(false)
  const wantsFireRef = useRef(false)

  const [score, setScore] = useState(0)
  const [health, setHealth] = useState(START_HEALTH)

  // Fit canvas to its container, accounting for device pixel ratio.
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const resize = () => {
      const rect = container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      sizeRef.current = { w: rect.width, h: rect.height }
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      const ctx = canvas.getContext('2d')
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
      playerRef.current = {
        x: rect.width / 2,
        y: rect.height - 90,
      }
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(container)
    return () => ro.disconnect()
  }, [])

  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const { w, h } = sizeRef.current
    const half = PLAYER_SIZE / 2
    const x = Math.min(Math.max(clientX - rect.left, half), w - half)
    const y = Math.min(Math.max(clientY - rect.top, half), h - half)
    playerRef.current = { x, y }
  }, [])

  const fire = useCallback(() => {
    wantsFireRef.current = true
  }, [])

  // Main game loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let lastTime = performance.now()

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05)
      lastTime = now

      if (!overRef.current) {
        elapsedRef.current += dt
        const { w, h } = sizeRef.current

        // Fire
        if (wantsFireRef.current && now - lastFireRef.current > FIRE_COOLDOWN_MS) {
          lastFireRef.current = now
          bulletsRef.current.push({
            x: playerRef.current.x,
            y: playerRef.current.y - PLAYER_SIZE / 2,
          })
        }
        wantsFireRef.current = false

        // Spawn enemies (interval shrinks slowly as time passes)
        const spawnEvery = Math.max(ENEMY_SPAWN_BASE_MS - elapsedRef.current * 6, 320)
        if (now - lastEnemySpawnRef.current > spawnEvery) {
          lastEnemySpawnRef.current = now
          enemiesRef.current.push({
            x: Math.random() * (w - ENEMY_SIZE) + ENEMY_SIZE / 2,
            y: -ENEMY_SIZE,
          })
        }

        // Spawn enemy bullets
        const bulletEvery = Math.max(
          ENEMY_BULLET_SPAWN_BASE_MS - elapsedRef.current * 4,
          180
        )
        if (now - lastEnemyBulletSpawnRef.current > bulletEvery) {
          lastEnemyBulletSpawnRef.current = now
          enemyBulletsRef.current.push({
            x: Math.random() * (w - ENEMY_BULLET_W),
            y: -ENEMY_BULLET_H,
          })
        }

        const enemySpeed = Math.min(
          ENEMY_BASE_SPEED + elapsedRef.current * ENEMY_SPEED_RAMP,
          ENEMY_MAX_SPEED
        )

        // Update player bullets
        bulletsRef.current = bulletsRef.current.filter((b) => {
          b.y -= BULLET_SPEED * dt
          return b.y + BULLET_H > 0
        })

        // Update enemies
        enemiesRef.current = enemiesRef.current.filter((e) => {
          e.y += enemySpeed * dt
          return e.y < h + ENEMY_SIZE
        })

        // Update enemy bullets + player collision
        enemyBulletsRef.current = enemyBulletsRef.current.filter((eb) => {
          eb.y += ENEMY_BULLET_SPEED * dt
          if (eb.y > h) return false

          const p = playerRef.current
          const hit =
            eb.x < p.x + PLAYER_SIZE / 2 &&
            eb.x + ENEMY_BULLET_W > p.x - PLAYER_SIZE / 2 &&
            eb.y < p.y + PLAYER_SIZE / 2 &&
            eb.y + ENEMY_BULLET_H > p.y - PLAYER_SIZE / 2

          if (hit) {
            healthRef.current -= 1
            setHealth(healthRef.current)
            if (healthRef.current <= 0) {
              overRef.current = true
              onGameOver(scoreRef.current)
            }
            return false
          }
          return true
        })

        // Bullet vs enemy collisions
        for (const b of bulletsRef.current) {
          for (const e of enemiesRef.current) {
            const dx = Math.abs(b.x - e.x)
            const dy = Math.abs(b.y - e.y)
            if (dx < ENEMY_SIZE / 2 && dy < ENEMY_SIZE / 2) {
              e.hit = true
              b.hit = true
              scoreRef.current += 1
              setScore(scoreRef.current)
              break
            }
          }
        }
        bulletsRef.current = bulletsRef.current.filter((b) => !b.hit)
        enemiesRef.current = enemiesRef.current.filter((e) => !e.hit)
      }

      // ── Draw ──
      const { w, h } = sizeRef.current
      ctx.clearRect(0, 0, w, h)

      const bgGrad = ctx.createLinearGradient(0, 0, 0, h)
      bgGrad.addColorStop(0, '#0A0D14')
      bgGrad.addColorStop(1, '#05060A')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, w, h)

      // Player ship (triangle)
      const p = playerRef.current
      ctx.fillStyle = '#35D07F'
      ctx.beginPath()
      ctx.moveTo(p.x, p.y - PLAYER_SIZE / 2)
      ctx.lineTo(p.x - PLAYER_SIZE / 2, p.y + PLAYER_SIZE / 2)
      ctx.lineTo(p.x + PLAYER_SIZE / 2, p.y + PLAYER_SIZE / 2)
      ctx.closePath()
      ctx.fill()

      // Player bullets
      ctx.fillStyle = '#8FF0C0'
      for (const b of bulletsRef.current) {
        ctx.fillRect(b.x - BULLET_W / 2, b.y, BULLET_W, BULLET_H)
      }

      // Enemies (diamonds)
      ctx.fillStyle = '#E8465F'
      for (const e of enemiesRef.current) {
        ctx.beginPath()
        ctx.moveTo(e.x, e.y - ENEMY_SIZE / 2)
        ctx.lineTo(e.x + ENEMY_SIZE / 2, e.y)
        ctx.lineTo(e.x, e.y + ENEMY_SIZE / 2)
        ctx.lineTo(e.x - ENEMY_SIZE / 2, e.y)
        ctx.closePath()
        ctx.fill()
      }

      // Enemy bullets
      ctx.fillStyle = '#F5C542'
      for (const eb of enemyBulletsRef.current) {
        ctx.fillRect(eb.x, eb.y, ENEMY_BULLET_W, ENEMY_BULLET_H)
      }

      if (!overRef.current) {
        rafRef.current = requestAnimationFrame(loop)
      }
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center justify-between px-4 py-2 font-mono text-sm">
        <span className="text-cs-text1">
          SCORE <span className="text-cs-accent">{score}</span>
        </span>
        <span className="text-cs-text1">
          HP <span className={health <= 3 ? 'text-cs-danger' : 'text-cs-text1'}>{health}</span>
        </span>
      </div>

      <div
        ref={containerRef}
        className="relative mx-3 flex-1 overflow-hidden rounded-lg border border-cs-border"
        onPointerDown={(e) => {
          draggingRef.current = true
          handlePointerMove(e.clientX, e.clientY)
        }}
        onPointerMove={(e) => {
          if (draggingRef.current) handlePointerMove(e.clientX, e.clientY)
        }}
        onPointerUp={() => {
          draggingRef.current = false
        }}
        onPointerLeave={() => {
          draggingRef.current = false
        }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      </div>

      <div className="flex items-center justify-center px-4 py-4">
        <button
          onPointerDown={(e) => {
            e.preventDefault()
            fire()
          }}
          className="flex h-16 w-16 select-none items-center justify-center rounded-full text-xs font-bold uppercase tracking-wide text-black active:scale-95"
          style={{ background: '#35D07F' }}
        >
          Fire
        </button>
      </div>
    </div>
  )
}
