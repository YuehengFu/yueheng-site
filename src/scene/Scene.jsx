import { Suspense, useCallback, useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import Backdrop from './Backdrop.jsx'
import Cat from './Cat.jsx'
import Studio from './Studio.jsx'
import { LOOKS, placement } from './looks.js'

export const CAM_Z = 8
export const FOV = 30
const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2))
const BACK_Z = -4
// the model's face points along local +x; this yaw turns it three-quarters
// toward the reader and the text column
const REST = { yaw: -2.3, pitch: 0.08, roll: 0.02 }
const easeOut = (x) => 1 - Math.pow(1 - x, 3)

// Pointer in [-1, 1], from the window: the canvas sits behind the page and
// takes no events. Touch is ignored; a finger is scrolling, not aiming.
function usePointer(enabled) {
  const p = useRef({ x: 0, y: 0 })
  useEffect(() => {
    if (!enabled) return
    const onMove = (e) => {
      if (e.pointerType === 'touch') return
      p.current.x = (e.clientX / window.innerWidth) * 2 - 1
      p.current.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [enabled])
  return p
}

function Rig({ look, motion, running, onReady }) {
  const size = useThree((s) => s.size)
  const place = placement(size.width)
  const aspect = size.width / size.height
  const vh = 2 * CAM_Z * TAN
  const vw = vh * aspect
  const catX = (place.cx - 0.5) * vw
  const catY = (0.5 - place.cy) * vh
  const catS = place.h * vh
  const backH = 2 * (CAM_Z - BACK_Z) * TAN
  const backW = backH * aspect

  const group = useRef()
  const key = useRef()
  const rim = useRef()
  const pointer = usePointer(motion)
  const eased = useRef({ x: 0, y: 0, t: 0, start: 0, loaded: false, told: false })
  const invalidate = useThree((s) => s.invalidate)
  const onLoad = useCallback(() => {
    eased.current.loaded = true
    invalidate()
  }, [invalidate])
  const back = useRef()
  const target = useRef({ bg: new THREE.Color(), a: new THREE.Color(), b: new THREE.Color() })

  useFrame((state, delta) => {
    const e = eased.current
    // own clock, advanced only by rendered frames (clamped), so a pause or a
    // hidden tab resumes where it left off instead of jumping ahead
    e.t += Math.min(delta, 0.1)
    const t = e.t
    // theme colours glide while the loop runs, snap when it is on demand
    const k = running ? 1 - Math.exp(-delta * 9) : 1
    const tg = target.current
    const u = back.current.material.uniforms
    u.uBg.value.lerp(tg.bg.set(look.bg), k)
    u.uA.value.lerp(tg.a.set(look.haloA), k)
    u.uB.value.lerp(tg.b.set(look.haloB), k)
    u.uStrength.value += (look.haloStrength - u.uStrength.value) * k
    u.uBand.value += (look.bandStrength - u.uBand.value) * k
    u.uFalloff.value += (look.haloFalloff - u.uFalloff.value) * k
    u.uShadow.value += (look.shadowStrength - u.uShadow.value) * k
    u.uCenter.value.set(place.cx, 1 - place.cy)
    u.uAspect.value = aspect
    u.uRadius.value = place.h * 0.8

    const g = group.current
    if (!g) return
    if (!motion) {
      g.position.set(catX, catY, 0)
      g.rotation.set(REST.pitch, REST.yaw, REST.roll)
      g.scale.setScalar(catS)
      u.uLift.value = 0
      state.scene.environmentRotation.set(0, 0.6, 0)
    } else {
      // pointer, eased so the highlights drift instead of snapping
      const pk = 1 - Math.exp(-delta * 2.5)
      e.x += (pointer.current.x - e.x) * pk
      e.y += (pointer.current.y - e.y) * pk
      const intro = easeOut(Math.min(1, (t - e.start) / 2.2))
      const scroll = window.scrollY
      const lift = Math.sin(t * 0.7)
      g.position.set(catX, catY + lift * 0.035 * catS - (1 - intro) * 0.12 * catS, 0)
      g.rotation.set(
        REST.pitch + Math.sin(t * 0.31) * 0.12 - e.y * 0.1,
        // a slow two-frequency sway around the three-quarter pose (never
        // parked face-on), plus a turn driven by scrolling: reading the page
        // walks you round the cat
        REST.yaw - Math.sin(t * 0.21) * 0.4 - Math.sin(t * 0.083) * 0.25 + scroll * 0.0014 + e.x * 0.25 - (1 - intro) * 1.4,
        REST.roll + Math.sin(t * 0.23 + 1) * 0.06,
      )
      g.scale.setScalar(catS * (0.94 + 0.06 * intro))
      u.uLift.value = lift * 0.5 + 0.5
      // sliding the environment is what moves the glints across the facets
      state.scene.environmentRotation.set(e.y * 0.35, 0.6 + e.x * 0.9 + t * 0.04, 0)
    }
    // two hard lights: as the cat turns, single facets line up with them
    // and flash, which is what makes it read as cut glass
    if (key.current) {
      key.current.position.set(3 + e.x * 4, 4 + e.y * 3, 5)
      key.current.intensity = look.key
    }
    if (rim.current) {
      rim.current.position.set(-5 - e.x * 2, 1 - e.y * 2, -2)
      rim.current.intensity = look.rim
    }
    if (e.loaded && !e.told) {
      e.told = true
      e.start = t
      onReady?.()
    }
  })

  return (
    <>
      <Backdrop ref={back} look={look} width={backW} height={backH} z={BACK_Z} />
      <directionalLight ref={key} color="#fff6ea" />
      <directionalLight ref={rim} color="#cfe6ff" />
      <group ref={group} position={[catX, catY, 0]} scale={catS} rotation={[REST.pitch, REST.yaw, REST.roll]}>
        <Suspense fallback={null}>
          <Cat glass={look.glass} envIntensity={look.envIntensity} onLoad={onLoad} />
        </Suspense>
      </group>
    </>
  )
}

export default function Scene({ theme, motion, running, onReady }) {
  const look = LOOKS[theme]
  const invalidate = useThree((s) => s.invalidate)
  // on-demand loop: repaint after the environment re-bakes for a new theme
  useEffect(() => {
    const id = requestAnimationFrame(() => invalidate())
    return () => cancelAnimationFrame(id)
  }, [theme, invalidate])
  return (
    <>
      <Studio theme={theme} />
      <Rig look={look} motion={motion} running={running} onReady={onReady} />
    </>
  )
}
