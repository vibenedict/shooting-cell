'use client'

import { useEffect, useRef } from 'react'

const STAR_COUNT = 80
const SHIP_MIN_INTERVAL = 2.5
const SHIP_MAX_INTERVAL = 5.5

interface Star {
  x: number
  y: number
  z: number // 0..1 depth
  driftX: number
}

interface Nebula {
  x: number
  y: number
  r: number
  color: string
  vx: number
  vy: number
}

interface Planet {
  x: number
  y: number
  r: number
  color: string
  ring?: boolean
}

interface DriftShip {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  angle: number
  trail: { x: number; y: number }[]
}

interface Props {
  /** Overall opacity of the whole scene (0-1). */
  opacity?: number
}

export default function SpaceBackground({ opacity = 1 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0
    let h = 0
    let stars: Star[] = []
    let nebulas: Nebula[] = []
    let planets: Planet[] = []
    let ships: DriftShip[] = []
    let nextShipAt = 0
    let elapsed = 0

    const resize = () => {
      const rect = container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      w = rect.width
      h = rect.height
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      stars = Array.from({ length: STAR_COUNT }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: Math.random(),
        driftX: (Math.random() - 0.5) * 4,
      }))

      nebulas = [
        { x: w * 0.2, y: h * 0.25, r: Math.max(w, h) * 0.35, color: '53,208,127', vx: 2, vy: 1.5 },
        { x: w * 0.8, y: h * 0.6, r: Math.max(w, h) * 0.3, color: '245,197,66', vx: -1.5, vy: 2 },
        { x: w * 0.5, y: h * 0.85, r: Math.max(w, h) * 0.25, color: '232,70,95', vx: 1, vy: -1 },
      ]

      planets = [
        { x: w * 0.85, y: h * 0.12, r: 22, color: '#8FD9B6', ring: true },
        { x: w * 0.12, y: h * 0.82, r: 14, color: '#E8A5B0' },
      ]

      ships = []
      nextShipAt = elapsed + SHIP_MIN_INTERVAL
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(container)

    const spawnShip = () => {
      const fromLeft = Math.random() > 0.5
      const y = Math.random() * h * 0.7 + h * 0.05
      const speed = 26 + Math.random() * 22
      ships.push({
        x: fromLeft ? -20 : w + 20,
        y,
        vx: fromLeft ? speed : -speed,
        vy: (Math.random() - 0.5) * 8,
        size: 10 + Math.random() * 8,
        angle: fromLeft ? Math.PI / 2 : -Math.PI / 2,
        trail: [],
      })
    }

    let lastTime = performance.now()
    let raf: number

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05)
      lastTime = now
      elapsed += dt

      // Update stars — slow diagonal ambient drift
      for (const s of stars) {
        s.y += (4 + s.z * 10) * dt
        s.x += s.driftX * dt
        if (s.y > h) s.y = 0
        if (s.x > w) s.x = 0
        if (s.x < 0) s.x = w
      }

      // Update nebulas — gentle bounce-drift
      for (const n of nebulas) {
        n.x += n.vx * dt
        n.y += n.vy * dt
        if (n.x < -n.r * 0.3 || n.x > w + n.r * 0.3) n.vx *= -1
        if (n.y < -n.r * 0.3 || n.y > h + n.r * 0.3) n.vy *= -1
      }

      // Spawn / update drifting ships
      if (elapsed > nextShipAt) {
        spawnShip()
        nextShipAt = elapsed + SHIP_MIN_INTERVAL + Math.random() * (SHIP_MAX_INTERVAL - SHIP_MIN_INTERVAL)
      }
      ships = ships.filter((s) => {
        s.trail.push({ x: s.x, y: s.y })
        if (s.trail.length > 6) s.trail.shift()
        s.x += s.vx * dt
        s.y += s.vy * dt
        return s.x > -30 && s.x < w + 30
      })

      // ── Draw ──
      ctx.clearRect(0, 0, w, h)
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h)
      bgGrad.addColorStop(0, '#0A0D16')
      bgGrad.addColorStop(1, '#05060A')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, w, h)

      // Nebula glows
      for (const n of nebulas) {
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r)
        grad.addColorStop(0, `rgba(${n.color},0.10)`)
        grad.addColorStop(1, `rgba(${n.color},0)`)
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fill()
      }

      // Planets
      for (const p of planets) {
        const grad = ctx.createRadialGradient(
          p.x - p.r * 0.3, p.y - p.r * 0.3, p.r * 0.1,
          p.x, p.y, p.r
        )
        grad.addColorStop(0, p.color)
        grad.addColorStop(1, '#05060A')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
        if (p.ring) {
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(-0.3)
          ctx.strokeStyle = 'rgba(234,240,232,0.35)'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.ellipse(0, 0, p.r * 1.7, p.r * 0.45, 0, 0, Math.PI * 2)
          ctx.stroke()
          ctx.restore()
        }
      }

      // Stars
      for (const s of stars) {
        ctx.globalAlpha = 0.2 + s.z * 0.55
        ctx.fillStyle = '#EAF0E8'
        const size = 0.6 + s.z * 1.4
        ctx.fillRect(s.x, s.y, size, size)
      }
      ctx.globalAlpha = 1

      // Drifting spaceships with fading trail
      for (const s of ships) {
        for (let i = 0; i < s.trail.length; i++) {
          const t = s.trail[i]
          ctx.globalAlpha = (i / s.trail.length) * 0.25
          ctx.fillStyle = '#35D07F'
          ctx.beginPath()
          ctx.arc(t.x, t.y, s.size * 0.15, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalAlpha = 0.55
        ctx.save()
        ctx.translate(s.x, s.y)
        ctx.rotate(s.angle)
        ctx.fillStyle = '#7FE8B3'
        ctx.beginPath()
        ctx.moveTo(0, -s.size / 2)
        ctx.lineTo(-s.size / 2 + 2, s.size / 2)
        ctx.lineTo(s.size / 2 - 2, s.size / 2)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
        ctx.globalAlpha = 1
      }

      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 overflow-hidden" style={{ opacity }}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  )
}
