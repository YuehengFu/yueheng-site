// Where the cat sits on screen, in CSS pixels. The text column is 34rem
// (544px) at the left of a 1120px container, so on wide screens the free
// space to its right is centred at 50vw + 272px whatever the window width.
// index.css places the no-WebGL still with the same numbers; keep them in step.

export const WIDE = 900 // px; below this the cat moves above the intro
const COLUMN = 544
const GUTTER = 32

export function catLayout(w, h) {
  if (w >= WIDE) {
    const container = Math.min(1120, w - GUTTER * 2)
    const free = container - COLUMN // room to the right of the column
    const height = Math.min(h * 0.66, free * 1.55, 720)
    return { wide: true, cx: w / 2 + COLUMN / 2, cy: h * 0.47, height }
  }
  const height = Math.min(h * 0.3, w * 0.7)
  return { wide: false, cx: w / 2, cy: h * 0.235, height }
}
