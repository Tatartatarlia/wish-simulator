import { useEffect, useRef } from 'react'
import type { MeteorTone } from '../lib/types.ts'

const TONE = {
  blue: { trail: '#3aa0ff', glow: '#7ec8ff' },
  purple: { trail: '#8b5cf6', glow: '#d8b4fe' },
  gold: { trail: '#f5a524', glow: '#ffd56a' },
} as const

function hexAlpha(hex: string, alpha: number): string {
  const value = hex.slice(1)
  const r = Number.parseInt(value.slice(0, 2), 16)
  const g = Number.parseInt(value.slice(2, 4), 16)
  const b = Number.parseInt(value.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function MeteorShow({ tones, onDone }: { tones: MeteorTone[]; onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tonesRef = useRef(tones)
  const onDoneRef = useRef(onDone)
  const finishedRef = useRef(false)
  onDoneRef.current = onDone

  const finishRef = useRef(() => {})
  finishRef.current = () => {
    if (finishedRef.current) return
    finishedRef.current = true
    onDoneRef.current()
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      const timer = window.setTimeout(() => finishRef.current(), 240)
      return () => window.clearTimeout(timer)
    }

    let stopped = false
    let frame = 0
    const snapshot = tonesRef.current
    const count = snapshot.length
    const flight = count === 1 ? 1680 : 1240
    const stagger = count === 1 ? 0 : 115
    const begin = performance.now()
    const endAt = 160 + (count - 1) * stagger + flight + 380

    const meteors = snapshot.map((tone, index) => {
      const lane = count === 1 ? 0.52 : (index + 0.5) / count
      return {
        tone,
        delay: 160 + index * stagger,
        x0: lane * 0.55 + 0.38,
        y0: -0.12,
        x1: lane * 0.92 + 0.02,
        y1: 0.74,
        size: tone === 'rainbow' || tone === 'gold' ? (count === 1 ? 5.4 : 3.5) : count === 1 ? 4.4 : 2.6,
      }
    })

    const sparks: { x: number; y: number; vx: number; vy: number; life: number; hue: number; tone: MeteorTone }[] = []
    const sky = Array.from({ length: 90 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.3 + 0.25,
      a: Math.random() * 0.55 + 0.25,
      p: Math.random() * Math.PI * 2,
    }))

    const fit = () => {
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const bitmapWidth = Math.max(1, Math.floor(width * dpr))
      const bitmapHeight = Math.max(1, Math.floor(height * dpr))
      if (canvas.width !== bitmapWidth || canvas.height !== bitmapHeight) {
        canvas.width = bitmapWidth
        canvas.height = bitmapHeight
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      return { width, height }
    }

    const draw = (now: number) => {
      if (stopped) return
      const { width, height } = fit()
      context.clearRect(0, 0, width, height)

      const background = context.createLinearGradient(0, 0, 0, height)
      background.addColorStop(0, '#07111e')
      background.addColorStop(0.55, '#102848')
      background.addColorStop(1, '#071018')
      context.fillStyle = background
      context.fillRect(0, 0, width, height)

      for (const star of sky) {
        const twinkle = 0.45 + 0.55 * Math.sin(now / 420 + star.p)
        context.fillStyle = `rgba(255,255,255,${star.a * twinkle})`
        context.beginPath()
        context.arc(star.x * width, star.y * height, star.r, 0, Math.PI * 2)
        context.fill()
      }

      const rainbowLive = meteors.some((meteor) => {
        const progress = (now - begin - meteor.delay) / flight
        return meteor.tone === 'rainbow' && progress > 0.02 && progress < 1.2
      })
      if (rainbowLive) {
        const hue = (now / 10) % 360
        const glow = context.createRadialGradient(width * 0.5, height * 0.42, 10, width * 0.5, height * 0.42, width * 0.48)
        glow.addColorStop(0, `hsla(${hue}, 95%, 72%, 0.2)`)
        glow.addColorStop(0.45, `hsla(${(hue + 48) % 360}, 95%, 64%, 0.1)`)
        glow.addColorStop(1, 'transparent')
        context.fillStyle = glow
        context.fillRect(0, 0, width, height)
      }

      for (const meteor of meteors) {
        const raw = (now - begin - meteor.delay) / flight
        if (raw <= 0) continue
        const clamped = Math.min(raw, 1)
        const eased = clamped < 1 ? 1 - (1 - clamped) ** 1.7 : 1
        const headX = (meteor.x0 + (meteor.x1 - meteor.x0) * eased) * width
        const headY = (meteor.y0 + (meteor.y1 - meteor.y0) * eased) * height
        const fade = clamped < 1 ? 1 : Math.max(0, 1 - (raw - 1) * 2.6)
        const steps = 22

        for (let step = steps; step >= 1; step -= 1) {
          const back = eased - (0.24 * step) / steps
          if (back <= 0) continue
          const x = (meteor.x0 + (meteor.x1 - meteor.x0) * back) * width
          const y = (meteor.y0 + (meteor.y1 - meteor.y0) * back) * height
          const nextT = Math.min(back + 0.24 / steps, eased)
          const nx = (meteor.x0 + (meteor.x1 - meteor.x0) * nextT) * width
          const ny = (meteor.y0 + (meteor.y1 - meteor.y0) * nextT) * height
          const alpha = (1 - step / steps) * fade
          context.lineCap = 'round'
          context.lineWidth = meteor.size * (1.15 - step / steps)
          if (meteor.tone === 'rainbow') {
            const hue = (now / 5 + step * 14) % 360
            context.strokeStyle = `hsla(${hue}, 100%, 68%, ${alpha})`
            context.shadowColor = `hsla(${hue}, 100%, 62%, 0.95)`
          } else {
            context.strokeStyle = hexAlpha(TONE[meteor.tone].trail, alpha)
            context.shadowColor = TONE[meteor.tone].glow
          }
          context.shadowBlur = meteor.tone === 'gold' || meteor.tone === 'rainbow' ? 16 : 8
          context.beginPath()
          context.moveTo(x, y)
          context.lineTo(nx, ny)
          context.stroke()
        }

        if (clamped < 1) {
          const head = context.createRadialGradient(headX, headY, 0, headX, headY, meteor.size * 7)
          if (meteor.tone === 'rainbow') {
            const hue = (now / 5) % 360
            head.addColorStop(0, '#fff')
            head.addColorStop(0.35, `hsla(${hue}, 100%, 74%, 0.95)`)
            head.addColorStop(1, `hsla(${(hue + 36) % 360}, 100%, 60%, 0)`)
            context.shadowColor = `hsl(${hue}, 100%, 70%)`
          } else {
            head.addColorStop(0, '#fff')
            head.addColorStop(0.35, TONE[meteor.tone].glow)
            head.addColorStop(1, 'transparent')
            context.shadowColor = TONE[meteor.tone].glow
          }
          context.shadowBlur = 22
          context.fillStyle = head
          context.beginPath()
          context.arc(headX, headY, meteor.size * 7, 0, Math.PI * 2)
          context.fill()

          if (meteor.tone !== 'blue' || count === 1) {
            sparks.push({
              x: headX,
              y: headY,
              vx: (Math.random() - 0.5) * 1.6,
              vy: (Math.random() - 0.4) * 1.6,
              life: 1,
              hue: meteor.tone === 'rainbow' ? (now / 5) % 360 : meteor.tone === 'gold' ? 40 : 270,
              tone: meteor.tone,
            })
          }
        }
        context.shadowBlur = 0
      }

      for (let i = sparks.length - 1; i >= 0; i -= 1) {
        const spark = sparks[i]
        if (!spark) continue
        spark.x += spark.vx
        spark.y += spark.vy
        spark.life -= 0.02
        if (spark.life <= 0) {
          sparks.splice(i, 1)
          continue
        }
        context.fillStyle =
          spark.tone === 'rainbow'
            ? `hsla(${spark.hue}, 100%, 70%, ${spark.life})`
            : hexAlpha(spark.tone === 'gold' ? '#ffd56a' : spark.tone === 'purple' ? '#d8b4fe' : '#9ad7ff', spark.life)
        context.beginPath()
        context.arc(spark.x, spark.y, 1.6 * spark.life + 0.4, 0, Math.PI * 2)
        context.fill()
      }
      if (sparks.length > 500) sparks.splice(0, sparks.length - 500)

      if (now - begin < endAt) frame = requestAnimationFrame(draw)
      else if (!stopped) finishRef.current()
    }

    frame = requestAnimationFrame(draw)
    return () => {
      stopped = true
      cancelAnimationFrame(frame)
    }
  }, [])

  const rainbowAt = tonesRef.current.indexOf('rainbow')
  const rainbowDelay = rainbowAt < 0 ? 0 : 160 + rainbowAt * (tonesRef.current.length === 1 ? 0 : 115)

  return (
    <div
      className="meteor-layer"
      role="dialog"
      aria-label={`流星动画，共 ${tones.length} 颗`}
      onClick={() => finishRef.current()}
    >
      <canvas ref={canvasRef} className="meteor-canvas" />
      <div className="meteor-pips" aria-hidden="true">
        {tones.map((tone, index) => (
          <i
            key={`${tone}-${index}`}
            className={`pip pip-${tone}`}
            style={{ animationDelay: `${160 + index * (tones.length === 1 ? 0 : 115)}ms` }}
          />
        ))}
      </div>
      {rainbowAt >= 0 && (
        <div className="radiance-banner" style={{ animationDelay: `${rainbowDelay}ms` }}>
          捕获明光
        </div>
      )}
      <p className="meteor-skip">点击任意处跳过</p>
    </div>
  )
}
