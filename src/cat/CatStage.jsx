import { Component, Suspense, useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import Cat from './Cat.jsx'
import StaticCat from './StaticCat.jsx'
import { WIDE, catFrame } from './layout.js'
import { PARALLAX } from './CatRig.js'

const readColor = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

// Context loss, a failed model fetch or a shader error: show the drawing.
class Fallback extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? <StaticCat /> : this.props.children
  }
}

export default function CatStage() {
  const reduced = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])
  // Shared, mutable inputs the frame loop reads; React never re-renders for them.
  const input = useMemo(() => ({ px: 0, py: 0, scroll: window.scrollY, wide: window.innerWidth >= WIDE }), [])
  const colors = useMemo(
    () => ({ bg: new THREE.Color(readColor('--bg')), ink: new THREE.Color(readColor('--ink')) }),
    [],
  )
  const [hidden, setHidden] = useState(() => document.visibilityState === 'hidden')
  const [invalidate, setInvalidate] = useState(null)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    const redraw = () => invalidate?.()
    const onVisibility = () => setHidden(document.visibilityState === 'hidden')
    // On narrow screens the cat scrolls away with the hero (see CatRig.offset);
    // once its shadow is above the screen there is nothing to draw.
    const checkGone = () => {
      const f = catFrame(window.innerWidth, window.innerHeight)
      setGone(!f.wide && f.y + f.size * 0.75 - window.scrollY * PARALLAX < 0)
    }
    const onScroll = () => {
      input.scroll = window.scrollY
      checkGone()
      redraw()
    }
    const onResize = () => {
      input.wide = window.innerWidth >= WIDE
      checkGone()
    }
    checkGone()
    const onPointer = (e) => {
      if (e.pointerType !== 'mouse') return
      input.px = (e.clientX / window.innerWidth) * 2 - 1
      input.py = (e.clientY / window.innerHeight) * 2 - 1
    }
    const onLeave = () => {
      input.px = 0
      input.py = 0
    }
    // The theme toggle flips data-theme on <html>; follow it.
    const themeWatch = new MutationObserver(() => {
      colors.bg.set(readColor('--bg'))
      colors.ink.set(readColor('--ink'))
      redraw()
    })
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    if (!reduced) {
      window.addEventListener('pointermove', onPointer, { passive: true })
      document.documentElement.addEventListener('pointerleave', onLeave)
    }
    return () => {
      themeWatch.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onPointer)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [input, colors, reduced, invalidate])

  // Still under reduced motion (a frame only when something changes), and no
  // frames at all while the tab is hidden or the cat is scrolled away.
  const frameloop = hidden || gone ? 'never' : reduced ? 'demand' : 'always'

  return (
    <div className="stage" data-gone={gone || undefined} aria-hidden="true">
      <Fallback>
        <Canvas
          frameloop={frameloop}
          dpr={[1, 1.5]}
          flat
          gl={{ antialias: true, alpha: true, powerPreference: 'default' }}
          camera={{ fov: 24, position: [0, 0, 6] }}
          onCreated={(state) => setInvalidate(() => state.invalidate)}
          fallback={<StaticCat />}
        >
          <Suspense fallback={null}>
            <Cat input={input} colors={colors} reduced={reduced} />
          </Suspense>
        </Canvas>
      </Fallback>
    </div>
  )
}
