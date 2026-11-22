import { useEffect, useState } from 'react'
import { catFrame } from './layout.js'
import { BOX, SCALE, visible, hidden, dots, guides } from './fallbackDrawing.js'

// The resting pose as a line drawing, for browsers without WebGL. It stands
// where the live cat would, and takes the page ink through currentColor.
export default function StaticCat() {
  const [view, setView] = useState(() => [window.innerWidth, window.innerHeight])
  useEffect(() => {
    const onResize = () => setView([window.innerWidth, window.innerHeight])
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const frame = catFrame(view[0], view[1])
  const side = frame.size / SCALE
  return (
    <svg
      className="static-cat"
      data-wide={frame.wide || undefined}
      viewBox={`0 0 ${BOX} ${BOX}`}
      width={side}
      height={side}
      style={{ left: frame.x - side / 2, top: frame.y - side / 2 }}
      aria-hidden="true"
      focusable="false"
    >
      <path d={dots} fill="currentColor" opacity="0.42" />
      <path d={guides} fill="none" stroke="currentColor" strokeWidth={BOX / side} strokeDasharray="1.6 1" opacity="0.2" />
      <path d={hidden} fill="none" stroke="currentColor" strokeWidth={(1 * BOX) / side} strokeDasharray="1.1 1.1" opacity="0.12" />
      <path d={visible} fill="none" stroke="currentColor" strokeWidth={(1.2 * BOX) / side} strokeLinecap="round" />
    </svg>
  )
}
