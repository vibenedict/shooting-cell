'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { playFire, playBlast, playHit } from '@/lib/sfx'

const PLAYER_SIZE = 34
const KEY_MOVE_SPEED = 300 // px/sec, keyboard movement
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
const STAR_COUNT = 70
const SHAKE_DURATION = 0.26
const FLASH_DURATION = 0.16
const MUZZLE_FLASH_DURATION = 0.08
const RING_DURATION = 0.35
const HINT_SEEN_KEY = 'celo-shooter-hint-seen'

const KILL_COLORS = ['#E8465F', '#F5825C', '#F5C542']

interface Vec {
  x: number
  y: number
  hit?: boolean
}

interface Enemy extends Vec {
  rot: number
  phase: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
}

interface FloatText {
  x: number
  y: number
  life: number
  maxLife: number
  text: string
  color: string
}

interface Star {
  x: number
  y: number
  z: number // 0..1 depth: bigger = closer/faster/brighter
}

interface Ring {
  x: number
  y: number
  life: number
  maxLife: number
  maxRadius: number
  color: string
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
  const enemiesRef = useRef<Enemy[]>([])
  const enemyBulletsRef = useRef<Vec[]>([])
  const particlesRef = useRef<Particle[]>([])
  const floatTextsRef = useRef<FloatText[]>([])
  const starsRef = useRef<Star[]>([])
  const ringsRef = useRef<Ring[]>([])
  const shakeTimeRef = useRef(0)
  const flashTimeRef = useRef(0)
  const muzzleFlashRef = useRef(0)
  const bankRef = useRef(0)
  const prevPlayerXRef = useRef(180)
  const thrusterAccumRef = useRef(0)
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
  const keysRef = useRef<Set<string>>(new Set())

  const [score, setScore] = useState(0)
  const [health, setHealth] = useState(START_HEALTH)
  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!window.localStorage.getItem(HINT_SEEN_KEY)) setShowHint(true)
  }, [])

  const dismissHint = useCallback(() => {
    setShowHint(false)
    window.localStorage.setItem(HINT_SEEN_KEY, '1')
  }, [])

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
      starsRef.current = Array.from({ length: STAR_COUNT }, () => ({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        z: Math.random(),
      }))
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
    if (showHint) dismissHint()
  }, [showHint, dismissHint])

  // Keyboard controls: arrow keys / WASD to move, Space or X to fire.
  useEffect(() => {
    const moveKeys = new Set([
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'a', 'A', 'd', 'D', 'w', 'W', 's', 'S',
    ])

    const handleKeyDown = (e: KeyboardEvent) => {
      if (moveKeys.has(e.key) || e.key === ' ') e.preventDefault()
      keysRef.current.add(e.key)
      if (e.key === ' ' || e.key === 'x' || e.key === 'X') fire()
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [fire])

  const spawnBurst = (x: number, y: number, count: number, colors: string[], speed = 140) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6
      const s = speed * (0.5 + Math.random() * 0.8)
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * s,
        vy: Math.sin(angle) * s,
        life: 0.35 + Math.random() * 0.25,
        maxLife: 0.5,
        size: 2 + Math.random() * 2.5,
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }
  }

  const spawnRing = (x: number, y: number, color: string, maxRadius = 42) => {
    ringsRef.current.push({ x, y, life: RING_DURATION, maxLife: RING_DURATION, maxRadius, color })
  }

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

      const { w, h } = sizeRef.current
      const enemySpeed = Math.min(
        ENEMY_BASE_SPEED + elapsedRef.current * ENEMY_SPEED_RAMP,
        ENEMY_MAX_SPEED
      )
      const difficultyFactor = enemySpeed / ENEMY_BASE_SPEED

      if (!overRef.current) {
        elapsedRef.current += dt

        // Keyboard movement (arrow keys / WASD), combined with drag
        {
          const keys = keysRef.current
          let kdx = 0
          let kdy = 0
          if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) kdx -= 1
          if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) kdx += 1
          if (keys.has('ArrowUp') || keys.has('w') || keys.has('W')) kdy -= 1
          if (keys.has('ArrowDown') || keys.has('s') || keys.has('S')) kdy += 1
          if (kdx !== 0 || kdy !== 0) {
            if (kdx !== 0 && kdy !== 0) {
              kdx *= Math.SQRT1_2
              kdy *= Math.SQRT1_2
            }
            const half = PLAYER_SIZE / 2
            playerRef.current = {
              x: Math.min(Math.max(playerRef.current.x + kdx * KEY_MOVE_SPEED * dt, half), w - half),
              y: Math.min(Math.max(playerRef.current.y + kdy * KEY_MOVE_SPEED * dt, half), h - half),
            }
          }
        }

        // Ship banking — tilt toward the direction of horizontal travel
        {
          const velX = (playerRef.current.x - prevPlayerXRef.current) / Math.max(dt, 0.001)
          prevPlayerXRef.current = playerRef.current.x
          const targetBank = Math.max(-0.5, Math.min(0.5, velX * 0.0045))
          bankRef.current += (targetBank - bankRef.current) * Math.min(1, dt * 10)
        }

        // Fire
        if (wantsFireRef.current && now - lastFireRef.current > FIRE_COOLDOWN_MS) {
          lastFireRef.current = now
          bulletsRef.current.push({
            x: playerRef.current.x,
            y: playerRef.current.y - PLAYER_SIZE / 2,
          })
          muzzleFlashRef.current = MUZZLE_FLASH_DURATION
          playFire()
        }
        wantsFireRef.current = false

        // Thruster particles (constant faint engine trail)
        thrusterAccumRef.current += dt
        if (thrusterAccumRef.current > 0.045) {
          thrusterAccumRef.current = 0
          const p = playerRef.current
          particlesRef.current.push({
            x: p.x + (Math.random() - 0.5) * 10,
            y: p.y + PLAYER_SIZE / 2 - 2,
            vx: (Math.random() - 0.5) * 20,
            vy: 60 + Math.random() * 40,
            life: 0.25,
            maxLife: 0.25,
            size: 2 + Math.random() * 1.5,
            color: Math.random() > 0.5 ? '#F5C542' : '#F5825C',
          })
        }

        // Spawn enemies (interval shrinks slowly as time passes)
        const spawnEvery = Math.max(ENEMY_SPAWN_BASE_MS - elapsedRef.current * 6, 320)
        if (now - lastEnemySpawnRef.current > spawnEvery) {
          lastEnemySpawnRef.current = now
          enemiesRef.current.push({
            x: Math.random() * (w - ENEMY_SIZE) + ENEMY_SIZE / 2,
            y: -ENEMY_SIZE,
            rot: 0,
            phase: Math.random() * Math.PI * 2,
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

        // Update player bullets
        bulletsRef.current = bulletsRef.current.filter((b) => {
          b.y -= BULLET_SPEED * dt
          return b.y + BULLET_H > 0
        })

        // Update enemies
        enemiesRef.current = enemiesRef.current.filter((e) => {
          e.y += enemySpeed * dt
          e.rot += dt * 1.4
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
            shakeTimeRef.current = SHAKE_DURATION
            flashTimeRef.current = FLASH_DURATION
            spawnBurst(p.x, p.y, 10, ['#E8465F', '#EAF0E8'], 180)
            spawnRing(p.x, p.y, '#E8465F', 50)
            playHit()
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
              spawnBurst(e.x, e.y, 9, KILL_COLORS, 160)
              spawnRing(e.x, e.y, '#F5C542', 44)
              playBlast()
              floatTextsRef.current.push({
                x: e.x,
                y: e.y,
                life: 0.5,
                maxLife: 0.5,
                text: '+1',
                color: '#8FF0C0',
              })
              break
            }
          }
        }
        bulletsRef.current = bulletsRef.current.filter((b) => !b.hit)
        enemiesRef.current = enemiesRef.current.filter((e) => !e.hit)
      }

      // Timers that keep animating briefly after game-over (shake/flash settle)
      if (shakeTimeRef.current > 0) shakeTimeRef.current = Math.max(0, shakeTimeRef.current - dt)
      if (flashTimeRef.current > 0) flashTimeRef.current = Math.max(0, flashTimeRef.current - dt)
      if (muzzleFlashRef.current > 0) muzzleFlashRef.current = Math.max(0, muzzleFlashRef.current - dt)

      // Update blast rings
      ringsRef.current = ringsRef.current.filter((r) => {
        r.life -= dt
        return r.life > 0
      })

      // Update particles
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.vy += 220 * dt // gentle gravity
        p.life -= dt
        return p.life > 0
      })

      // Update floating texts
      floatTextsRef.current = floatTextsRef.current.filter((f) => {
        f.life -= dt
        return f.life > 0
      })

      // Update starfield (speed scales with difficulty for a visible escalation cue)
      for (const s of starsRef.current) {
        s.y += (20 + s.z * 90) * difficultyFactor * dt
        if (s.y > h) {
          s.y = 0
          s.x = Math.random() * w
        }
      }

      // ── Draw ──
      ctx.clearRect(0, 0, w, h)

      const bgGrad = ctx.createLinearGradient(0, 0, 0, h)
      bgGrad.addColorStop(0, '#0A0D16')
      bgGrad.addColorStop(1, '#05060A')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, w, h)

      ctx.save()
      if (shakeTimeRef.current > 0) {
        const mag = 7 * (shakeTimeRef.current / SHAKE_DURATION)
        ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag)
      }

      // Starfield
      for (const s of starsRef.current) {
        ctx.globalAlpha = 0.25 + s.z * 0.6
        ctx.fillStyle = '#EAF0E8'
        const size = 0.6 + s.z * 1.6
        ctx.fillRect(s.x, s.y, size, size)
      }
      ctx.globalAlpha = 1

      // Particles (behind ships/bullets so bursts read as debris)
      for (const p of particlesRef.current) {
        ctx.globalAlpha = Math.max(p.life / p.maxLife, 0)
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      // Blast rings (kill / hit explosions)
      for (const r of ringsRef.current) {
        const t = 1 - r.life / r.maxLife
        ctx.globalAlpha = Math.max(1 - t, 0) * 0.8
        ctx.strokeStyle = r.color
        ctx.lineWidth = 3 * (1 - t) + 0.5
        ctx.beginPath()
        ctx.arc(r.x, r.y, r.maxRadius * t, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.globalAlpha = 1

      // Player bullets + trail — a subtle pulse keeps them feeling energized
      const bulletPulse = 1 + Math.sin(now / 40) * 0.15
      for (const b of bulletsRef.current) {
        const bw = BULLET_W * bulletPulse
        const trailGrad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + BULLET_H + 14)
        trailGrad.addColorStop(0, 'rgba(143,240,192,0.9)')
        trailGrad.addColorStop(1, 'rgba(143,240,192,0)')
        ctx.fillStyle = trailGrad
        ctx.fillRect(b.x - bw / 2, b.y, bw, BULLET_H + 14)
        ctx.fillStyle = '#EAFBF1'
        ctx.fillRect(b.x - bw / 2, b.y, bw, BULLET_H * 0.5)
      }

      // Enemies — two-tone diamond with a breathing core, slow spin
      for (const e of enemiesRef.current) {
        const pulse = 1 + Math.sin(now / 180 + e.phase) * 0.08
        ctx.save()
        ctx.translate(e.x, e.y)
        ctx.rotate(Math.sin(e.rot) * 0.25)
        ctx.scale(pulse, pulse)
        ctx.fillStyle = '#E8465F'
        ctx.beginPath()
        ctx.moveTo(0, -ENEMY_SIZE / 2)
        ctx.lineTo(ENEMY_SIZE / 2, 0)
        ctx.lineTo(0, ENEMY_SIZE / 2)
        ctx.lineTo(-ENEMY_SIZE / 2, 0)
        ctx.closePath()
        ctx.fill()
        ctx.fillStyle = '#F79CAB'
        const inner = ENEMY_SIZE * 0.32
        ctx.beginPath()
        ctx.moveTo(0, -inner)
        ctx.lineTo(inner, 0)
        ctx.lineTo(0, inner)
        ctx.lineTo(-inner, 0)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      }

      // Enemy bullets + trail
      for (const eb of enemyBulletsRef.current) {
        const trailGrad = ctx.createLinearGradient(eb.x, eb.y - 12, eb.x, eb.y)
        trailGrad.addColorStop(0, 'rgba(245,197,66,0)')
        trailGrad.addColorStop(1, 'rgba(245,197,66,0.85)')
        ctx.fillStyle = trailGrad
        ctx.fillRect(eb.x, eb.y - 12, ENEMY_BULLET_W, ENEMY_BULLET_H + 12)
        ctx.fillStyle = '#FCE8A8'
        ctx.fillRect(eb.x, eb.y, ENEMY_BULLET_W, ENEMY_BULLET_H * 0.4)
      }

      // Player ship — layered triangle body + wings + gun barrels + cockpit +
      // thruster flame, banked toward the direction of horizontal travel
      const p = playerRef.current
      const flameLen = 6 + Math.sin(now / 60) * 3
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(bankRef.current)

      // Thruster flame
      ctx.fillStyle = '#F5C542'
      ctx.beginPath()
      ctx.moveTo(-6, PLAYER_SIZE / 2 - 4)
      ctx.lineTo(6, PLAYER_SIZE / 2 - 4)
      ctx.lineTo(0, PLAYER_SIZE / 2 - 4 + flameLen)
      ctx.closePath()
      ctx.fill()

      // Wings
      ctx.fillStyle = '#1C8A54'
      ctx.beginPath()
      ctx.moveTo(-PLAYER_SIZE / 2 - 4, PLAYER_SIZE / 2)
      ctx.lineTo(-PLAYER_SIZE / 2 + 8, 2)
      ctx.lineTo(-6, PLAYER_SIZE / 2)
      ctx.closePath()
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(PLAYER_SIZE / 2 + 4, PLAYER_SIZE / 2)
      ctx.lineTo(PLAYER_SIZE / 2 - 8, 2)
      ctx.lineTo(6, PLAYER_SIZE / 2)
      ctx.closePath()
      ctx.fill()

      // Gun barrels mounted on the wingtips
      const barrelY = 4
      const barrelLen = 9
      ctx.fillStyle = '#2A2E37'
      ctx.fillRect(-PLAYER_SIZE / 2 + 5, barrelY - barrelLen, 3, barrelLen)
      ctx.fillRect(PLAYER_SIZE / 2 - 8, barrelY - barrelLen, 3, barrelLen)

      // Body
      ctx.fillStyle = '#35D07F'
      ctx.beginPath()
      ctx.moveTo(0, -PLAYER_SIZE / 2)
      ctx.lineTo(-PLAYER_SIZE / 2 + 3, PLAYER_SIZE / 2)
      ctx.lineTo(PLAYER_SIZE / 2 - 3, PLAYER_SIZE / 2)
      ctx.closePath()
      ctx.fill()

      // Cockpit
      ctx.fillStyle = '#CFF8E3'
      ctx.beginPath()
      ctx.ellipse(0, -2, 4, 6, 0, 0, Math.PI * 2)
      ctx.fill()

      // Muzzle flash at each gun barrel tip
      if (muzzleFlashRef.current > 0) {
        const ft = muzzleFlashRef.current / MUZZLE_FLASH_DURATION
        ctx.globalAlpha = ft
        ctx.fillStyle = '#FFF6D8'
        for (const gx of [-PLAYER_SIZE / 2 + 6.5, PLAYER_SIZE / 2 - 6.5]) {
          ctx.beginPath()
          ctx.arc(gx, barrelY - barrelLen, 4 * ft + 2, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalAlpha = 1
      }

      ctx.restore()

      // Floating "+1" texts
      for (const f of floatTextsRef.current) {
        const t = 1 - f.life / f.maxLife
        ctx.globalAlpha = Math.max(f.life / f.maxLife, 0)
        ctx.fillStyle = f.color
        ctx.font = 'bold 15px var(--font-plex-mono), monospace'
        ctx.textAlign = 'center'
        ctx.fillText(f.text, f.x, f.y - t * 26)
      }
      ctx.globalAlpha = 1
      ctx.textAlign = 'left'

      ctx.restore()

      // Hit flash overlay (drawn unshaken, full-bleed)
      if (flashTimeRef.current > 0) {
        ctx.globalAlpha = (flashTimeRef.current / FLASH_DURATION) * 0.32
        ctx.fillStyle = '#E8465F'
        ctx.fillRect(0, 0, w, h)
        ctx.globalAlpha = 1
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

  const lowHealth = health <= 3

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center justify-between px-4 py-2">
        <span className="font-mono text-sm text-cs-text2">
          SCORE{' '}
          <span key={score} className="inline-block animate-cs-pop font-display text-xl font-bold text-cs-accent">
            {score}
          </span>
        </span>
        <div
          className={`flex gap-[3px] ${lowHealth ? 'animate-cs-danger-pulse' : ''}`}
          aria-label={`${health} health remaining`}
        >
          {Array.from({ length: START_HEALTH }, (_, i) => (
            <span
              key={i}
              className="h-3 w-2 rounded-sm transition-colors"
              style={{
                background:
                  i < health ? (lowHealth ? '#E8465F' : '#35D07F') : 'rgba(255,255,255,.08)',
              }}
            />
          ))}
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative mx-3 flex-1 overflow-hidden rounded-lg border border-cs-border"
        style={
          lowHealth
            ? { boxShadow: 'inset 0 0 0 2px rgba(232,70,95,.5), inset 0 0 40px rgba(232,70,95,.25)' }
            : undefined
        }
        onPointerDown={(e) => {
          draggingRef.current = true
          handlePointerMove(e.clientX, e.clientY)
          if (showHint) dismissHint()
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

        {showHint && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/55 px-8 text-center animate-cs-in">
            <div>
              <p className="font-display text-lg font-bold uppercase tracking-wide text-cs-text1">
                Drag or arrow keys
              </p>
              <p className="text-sm text-cs-text2">to fly your ship</p>
            </div>
            <div className="h-px w-16 bg-cs-border-strong" />
            <div>
              <p className="font-display text-lg font-bold uppercase tracking-wide text-cs-text1">
                Tap Fire or Space
              </p>
              <p className="text-sm text-cs-text2">to shoot enemies</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center px-4 py-4">
        <button
          onPointerDown={(e) => {
            e.preventDefault()
            fire()
          }}
          className="flex h-16 w-16 select-none items-center justify-center rounded-full text-xs font-bold uppercase tracking-wide text-black shadow-[0_0_0_4px_rgba(53,208,127,0.12)] transition-transform active:scale-90"
          style={{ background: '#35D07F' }}
        >
          Fire
        </button>
      </div>
    </div>
  )
}
