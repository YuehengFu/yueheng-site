import { useCallback, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { PerformanceMonitor } from '@react-three/drei'
import Scene, { CAM_Z, FOV } from './Scene.jsx'
import { hasWebGL, useOnScreen, usePageVisible, useReducedMotion } from '../hooks.js'

// One canvas behind the page. It renders continuously only while motion is
// allowed, the tab is visible, the canvas is on screen and the visitor has
// not paused it; otherwise the loop drops to on-demand and holds the pose.
export default function Stage({ theme, paused }) {
  const ref = useRef(null)
  const reduced = useReducedMotion()
  const pageVisible = usePageVisible()
  const onScreen = useOnScreen(ref)
  const [webgl] = useState(hasWebGL)
  const [ready, setReady] = useState(false)
  const [maxDpr, setMaxDpr] = useState(1.5)
  const onReady = useCallback(() => setReady(true), [])

  const running = !reduced && !paused && pageVisible && onScreen

  // No WebGL: a still of the same render, placed where the live cat sits.
  if (!webgl) {
    return (
      <div className="stage stage-still" aria-hidden="true">
        <img src={`${import.meta.env.BASE_URL}cat-still-${theme}.webp`} alt="" width="600" height="744" />
      </div>
    )
  }

  return (
    <div ref={ref} className="stage" data-ready={ready || undefined} aria-hidden="true">
      <Canvas
        dpr={[1, maxDpr]}
        frameloop={running ? 'always' : 'demand'}
        camera={{ position: [0, 0, CAM_Z], fov: FOV, near: 0.1, far: 40 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          // Neutral keeps the glass's thin-film colours true instead of ACES's
          // orange shift; the backdrop shader skips tone mapping anyway.
          gl.toneMapping = THREE.NeutralToneMapping
        }}
      >
        <PerformanceMonitor onDecline={() => setMaxDpr(1)} />
        <Scene theme={theme} motion={!reduced} running={running} onReady={onReady} />
      </Canvas>
    </div>
  )
}
