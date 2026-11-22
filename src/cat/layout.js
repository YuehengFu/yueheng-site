// Where the cat stands on screen, in CSS pixels. The page CSS mirrors these
// numbers (--wide, the column width, the phone band), so text and cat never
// claim the same space on a wide screen.

export const WIDE = 1024 // px; at and above this the cat gets its own column
const CONTAINER = 1120
const COLUMN = 544
const GAP = 64

export function catFrame(w, h) {
  if (w >= WIDE) {
    const gutter = 48
    const container = Math.min(CONTAINER, w - gutter * 2)
    const left = (w - container) / 2
    const start = left + COLUMN + GAP
    const free = left + container - start
    return {
      wide: true,
      x: start + free / 2,
      y: h * 0.52,
      // model height in px: tall enough to hold the column, never past the bar
      size: Math.min(h * 0.6, free * 1.15),
    }
  }
  // Phone and tablet: the cat sits in a band above the intro (see .hero in CSS).
  const band = bandHeight(w)
  return { wide: false, x: w / 2, y: 56 + band * 0.46, size: band * 0.68 }
}

// Tied to the width, not the height, so a phone's collapsing URL bar never
// resizes it. CSS: .hero padding-top: clamp(260px, 78vw, 400px).
export function bandHeight(w) {
  return Math.min(Math.max(w * 0.78, 260), 400)
}
