// Canvas compositing for before/after progress exports.
import { loadImage } from './image'
import { shortDate, daysBetween } from './thai'

// Draw an image into a rect with object-fit: cover behaviour.
function drawCover(ctx, img, x, y, w, h) {
  const ir = img.width / img.height
  const cr = w / h
  let sw, sh, sx, sy
  if (ir > cr) {
    sh = img.height
    sw = sh * cr
    sx = (img.width - sw) / 2
    sy = 0
  } else {
    sw = img.width
    sh = sw / cr
    sx = 0
    sy = (img.height - sh) / 2
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}

const deltaText = (before, after, key) => {
  const b = parseFloat(before?.measurements?.[key])
  const a = parseFloat(after?.measurements?.[key])
  if (!Number.isFinite(a) || !Number.isFinite(b)) return '—'
  const d = a - b
  return `${d > 0 ? '+' : ''}${d.toFixed(1)}″`
}

// Build a before/after comparison image. Returns a data URL.
export async function buildComparison({ mode, before, after, traineeName, coachName }) {
  const [beforeImg, afterImg] = await Promise.all([
    loadImage(before.photo),
    loadImage(after.photo),
  ])

  const full = mode === 'full'
  const clean = mode === 'clean'
  const simple = mode === 'simple'
  const blank = mode === 'blank'

  const cellW = 540
  const cellH = 676

  let W, H
  if (simple || blank) {
    W = cellW * 2
    H = cellH
  } else {
    const pad = 36
    const headerH = 72
    const gap = 18
    const footerH = 56
    const statH = full ? 80 : 0
    W = pad * 2 + cellW * 2 + gap
    H = pad + headerH + cellH + statH + footerH + pad
  }

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#0a0a0a'
  ctx.fillRect(0, 0, W, H)

  if (simple || blank) {
    drawCover(ctx, beforeImg, 0, 0, cellW, cellH)
    drawCover(ctx, afterImg, cellW, 0, cellW, cellH)

    if (simple) {
      const cells = [
        { x: 0, label: 'BEFORE', date: before.date, hot: false },
        { x: cellW, label: 'AFTER', date: after.date, hot: true },
      ]

      for (const c of cells) {
        // Draw badge
        const bw = 110
        const bh = 34
        ctx.fillStyle = c.hot ? '#ef2b2d' : '#000000'
        ctx.fillRect(c.x + 20, 20, bw, bh)
        
        ctx.fillStyle = '#ffffff'
        ctx.font = '800 16px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(c.label, c.x + 20 + bw / 2, 20 + bh / 2)

        // Draw date with background rectangle for readability
        const dateStr = shortDate(c.date)
        ctx.font = '700 14px sans-serif'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'alphabetic'

        const metrics = ctx.measureText(dateStr)
        const tx = c.x + 20
        const ty = cellH - 20
        const tw = metrics.width + 16
        const th = 26

        ctx.fillStyle = 'rgba(0,0,0,0.6)'
        ctx.fillRect(tx, ty - 20, tw, th)

        ctx.fillStyle = '#ffffff'
        ctx.fillText(dateStr, tx + 8, ty - 2)
      }
    }
  } else {
    const pad = 36
    const headerH = 72
    const gap = 18
    const footerH = 56
    const statH = full ? 80 : 0

    // ── header ──
    ctx.textBaseline = 'alphabetic'
    ctx.textAlign = 'left'
    ctx.fillStyle = '#ef2b2d'
    ctx.font = '900 40px sans-serif'
    ctx.fillText('OX GYM', pad, pad + 36)

    const weeks = Math.max(1, Math.round(daysBetween(before.date, after.date) / 7))
    ctx.textAlign = 'right'
    ctx.fillStyle = '#8a8a8a'
    ctx.font = '700 18px sans-serif'
    ctx.fillText(`${weeks} WEEK TRANSFORMATION`, W - pad, pad + 32)

    ctx.strokeStyle = 'rgba(255,255,255,0.12)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(pad, pad + headerH - 10)
    ctx.lineTo(W - pad, pad + headerH - 10)
    ctx.stroke()

    // ── photo cells ──
    const cellY = pad + headerH
    const cells = [
      { img: beforeImg, x: pad, label: 'BEFORE', data: before, hot: false },
      { img: afterImg, x: pad + cellW + gap, label: 'AFTER', data: after, hot: true },
    ]

    for (const c of cells) {
      ctx.save()
      ctx.beginPath()
      ctx.rect(c.x, cellY, cellW, cellH)
      ctx.clip()
      drawCover(ctx, c.img, c.x, cellY, cellW, cellH)
      ctx.restore()

      ctx.strokeStyle = c.hot ? '#ef2b2d' : 'rgba(255,255,255,0.14)'
      ctx.lineWidth = 2
      ctx.strokeRect(c.x + 1, cellY + 1, cellW - 2, cellH - 2)

      // label badge
      const bw = 132
      const bh = 40
      ctx.fillStyle = c.hot ? '#ef2b2d' : '#0a0a0a'
      ctx.fillRect(c.x + 14, cellY + 14, bw, bh)
      if (!c.hot) {
        ctx.strokeStyle = 'rgba(255,255,255,0.18)'
        ctx.lineWidth = 1
        ctx.strokeRect(c.x + 14, cellY + 14, bw, bh)
      }
      ctx.fillStyle = '#fff'
      ctx.font = '800 18px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(c.label, c.x + 30, cellY + 40)

      // bottom info panel
      const infoH = full ? 104 : 46
      const iy = cellY + cellH - infoH
      ctx.fillStyle = 'rgba(0,0,0,0.78)'
      ctx.fillRect(c.x, iy, cellW, infoH)
      ctx.fillStyle = '#bdbdbd'
      ctx.font = '700 16px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(shortDate(c.data.date), c.x + 16, iy + 28)

      if (full) {
        const parts = [
          ['CHEST', 'chest'],
          ['WAIST', 'waist'],
          ['HIPS', 'hips'],
        ]
        const colW = cellW / 3
        parts.forEach(([lab, key], i) => {
          const v = c.data.measurements?.[key]
          const cx = c.x + colW * i + colW / 2
          ctx.textAlign = 'center'
          ctx.fillStyle = c.hot ? '#ff4346' : '#ffffff'
          ctx.font = '800 28px sans-serif'
          ctx.fillText(
            v != null && v !== '' ? Number(v).toFixed(1) : '—',
            cx,
            iy + 70,
          )
          ctx.fillStyle = '#8a8a8a'
          ctx.font = '700 12px sans-serif'
          ctx.fillText(lab, cx, iy + 90)
        })
      }
    }

    // ── stat strip (full only) ──
    if (full) {
      const sy = cellY + cellH + 10
      const items = [
        { lab: 'CHEST', val: deltaText(before, after, 'chest') },
        { lab: 'WAIST', val: deltaText(before, after, 'waist') },
        { lab: 'HIPS', val: deltaText(before, after, 'hips') },
        { lab: 'DAYS', val: String(daysBetween(before.date, after.date)) },
      ]
      ctx.fillStyle = '#141414'
      ctx.fillRect(pad, sy, W - pad * 2, statH - 14)
      const colW = (W - pad * 2) / items.length
      items.forEach((it, i) => {
        const cx = pad + colW * i + colW / 2
        ctx.textAlign = 'center'
        ctx.fillStyle = '#ef2b2d'
        ctx.font = '800 32px sans-serif'
        ctx.fillText(it.val, cx, sy + 42)
        ctx.fillStyle = '#8a8a8a'
        ctx.font = '700 12px sans-serif'
        ctx.fillText(it.lab, cx, sy + 62)
      })
    }

    // ── footer ──
    const fy = H - pad - 14
    ctx.fillStyle = '#6a6a6a'
    ctx.font = '700 17px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(traineeName || '', pad, fy)
    ctx.textAlign = 'right'
    ctx.fillText(`${coachName || 'COACH'} · OX GYM`, W - pad, fy)
  }

  return canvas.toDataURL(full ? 'image/png' : 'image/jpeg', 0.92)
}
