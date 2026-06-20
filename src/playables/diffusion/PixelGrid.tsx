import { PIXEL_GRID, pixelToColor } from './image'

/**
 * Render a 16x16 pixel image as colored rects, centered in a region of the
 * canvas. The image is laid out at integer SVG coordinates so the pixels
 * stay crisp.
 */
export function PixelImage({
  pixels,
  cx,
  cy,
  cell = 16,
}: {
  pixels: number[][]
  cx: number
  cy: number
  cell?: number
}) {
  const total = PIXEL_GRID * cell
  const x0 = cx - total / 2
  const y0 = cy - total / 2
  const rects: React.ReactElement[] = []
  for (let r = 0; r < PIXEL_GRID; r++) {
    for (let c = 0; c < PIXEL_GRID; c++) {
      rects.push(
        <rect
          key={`${r}-${c}`}
          x={x0 + c * cell}
          y={y0 + r * cell}
          width={cell}
          height={cell}
          fill={pixelToColor(pixels[r][c])}
          shapeRendering="crispEdges"
        />,
      )
    }
  }
  return (
    <g>
      {rects}
      {/* Thin frame so the image reads as a panel */}
      <rect
        x={x0 - 0.5}
        y={y0 - 0.5}
        width={total + 1}
        height={total + 1}
        fill="none"
        stroke="var(--color-graph-ink)"
        strokeWidth="1"
      />
    </g>
  )
}
