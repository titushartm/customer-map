/**
 * Zeichnet ein Mini-Ortsschild als dehnbares Map-Icon (9-Slice).
 * Über icon-text-fit wächst es mit dem Label, ohne HTML-Marker:
 * alles bleibt in WebGL, auch bei Tausenden Einträgen.
 */
export function createSignImage({ fill, ink, pixelRatio = 2 }) {
  const size = 24
  const pr = pixelRatio
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size * pr
  const ctx = canvas.getContext('2d')
  ctx.scale(pr, pr)

  roundRect(ctx, 0.5, 0.5, size - 1, size - 1, 3)
  ctx.fillStyle = fill
  ctx.fill()
  ctx.lineWidth = 1
  ctx.strokeStyle = ink
  ctx.stroke()
  // Eingezogener Rahmen, wie auf einer echten Ortstafel
  roundRect(ctx, 2.5, 2.5, size - 5, size - 5, 1.5)
  ctx.lineWidth = 1.25
  ctx.stroke()

  return {
    image: ctx.getImageData(0, 0, canvas.width, canvas.height),
    options: {
      pixelRatio: pr,
      stretchX: [[8 * pr, 16 * pr]],
      stretchY: [[8 * pr, 16 * pr]],
      content: [6 * pr, 5 * pr, 18 * pr, 19 * pr],
    },
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
