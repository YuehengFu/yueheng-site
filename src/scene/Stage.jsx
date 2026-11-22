import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { Environment, Lightformer, PerformanceMonitor } from '@react-three/drei'
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'
import * as THREE from 'three'
import { catLayout } from './layout.js'

const MODEL_URL = `${import.meta.env.BASE_URL}models/meowmeow.obj`

// The Blender export carries six stray edges ("l" records). OBJLoader turns an
// object with any edge into LineSegments, faces included, so drop the edges
// before parsing and keep the solid.
class SolidOBJLoader extends OBJLoader {
  parse(text) {
    return super.parse(text.replace(/^l .*$/gm, ''))
  }
}

// Three-quarter on, the face turned toward the text column. The idle sway
// (±0.4 rad) runs from near-profile to near-frontal, so the face stays in view.
// Reduced motion holds this pose.
const BASE_YAW = -2.55

// Glossy bone porcelain in both themes: on near-black it glows, on paper the
// key light and the floor shadow carry it. The warm and cool rims are the
// only colour; the page's accent takes the warm one.
const THEMES = {
  dark: { glaze: '#e6dfd3', key: 1.6, env: 1.1, pool: '#ffe9dc', poolOpacity: 0.11, shadow: 0.85 },
  light: { glaze: '#e6dfd3', key: 2, env: 0.95, pool: '#ffffff', poolOpacity: 0.7, shadow: 0.32 },
}

// ?still renders the cat alone (no floor) for public/cat-still.webp, the
// no-WebGL fallback; index.css draws that version's floor shadow.
const STILL = new URLSearchParams(window.location.search).has('still')

const damp = THREE.MathUtils.damp
const easeOut = (p) => 1 - Math.pow(1 - p, 4)

// Pointer and scroll, read in the frame loop without React renders.
function useInputs() {
  const input = useRef({ x: 0, y: 0, scroll: 0 })
  useEffect(() => {
    const onMove = (e) => {
      input.current.x = (e.clientX / window.innerWidth) * 2 - 1
      input.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      input.current.scroll = max > 0 ? window.scrollY / max : 0
    }
    onScroll()
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])
  return input
}

// Load once, keep the mesh only, centre it on its bounding box and scale it
// to a height of 1 so the layout can size it in screen pixels.
function useCat() {
  const obj = useLoader(SolidOBJLoader, MODEL_URL)
  return useMemo(() => {
    let source
    obj.traverse((child) => {
      if (!source && child.isMesh) source = child.geometry
    })
    const geometry = source.clone()
    geometry.computeBoundingBox()
    const size = geometry.boundingBox.getSize(new THREE.Vector3())
    const center = geometry.boundingBox.getCenter(new THREE.Vector3())
    geometry.translate(-center.x, -center.y, -center.z)
    geometry.scale(1 / size.y, 1 / size.y, 1 / size.y)
    geometry.computeBoundingSphere()
    return { geometry, footprint: [size.x / size.y, size.z / size.y] }
  }, [obj])
}

// A soft radial falloff, used white for the pool of light on the floor and
// black for the shadow under the cat (one textured quad each, no shadow pass).
function useRadialTexture(inner) {
  const texture = useMemo(() => {
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(inner, 'rgba(255,255,255,0.5)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [inner])
  useEffect(() => () => texture.dispose(), [texture])
  return texture
}

// Softboxes baked once into the environment cube: a big key above-left, a
// narrow fill at front-right, a warm and a cool strip behind for the rims, a
// top light and a faint floor bounce. Each flat facet mirrors one direction,
// so the cat breaks these into separate glints as it turns.
function StudioLights({ intensity }) {
  return (
    <Environment resolution={256} frames={1} environmentIntensity={intensity}>
      <Lightformer form="rect" intensity={4} position={[-4, 4.5, 4]} scale={[6, 3.5]} />
      <Lightformer form="rect" intensity={1.6} position={[4, 0.5, 5]} scale={[1.5, 6]} />
      <Lightformer form="rect" intensity={16} color="#ffcfae" position={[4.5, 2, -3.5]} scale={[0.6, 8]} />
      <Lightformer form="rect" intensity={9} color="#b9cdff" position={[-5, 2, -3]} scale={[0.5, 7]} />
      <Lightformer form="circle" intensity={3} position={[0, 6, -1]} scale={3.5} />
      <Lightformer form="rect" intensity={0.3} color="#ffe2d0" position={[0, -4, 0]} scale={[10, 10]} />
    </Environment>
  )
}

function Studio({ theme, reduced, onReady }) {
  const { geometry, footprint } = useCat()
  const size = useThree((s) => s.size)
  const viewport = useThree((s) => s.viewport)
  const invalidate = useThree((s) => s.invalidate)
  const input = useInputs()
  const poolMap = useRadialTexture(0.45)
  const shadowMap = useRadialTexture(0.3)

  const look = THEMES[theme]
  const L = catLayout(size.width, size.height)
  const k = viewport.height / size.height // world units per CSS pixel at z = 0
  const scale = L.height * k
  const x = (L.cx - size.width / 2) * k
  const y = (size.height / 2 - L.cy) * k
  const floorY = y - scale * 0.6
  const poolSize = L.wide ? 1.65 : 1.3

  const rig = useRef()
  const body = useRef()
  const shadow = useRef()
  const motion = useRef({ t: 0, enter: reduced ? 1 : 0, px: 0, py: 0, sc: 0 })

  useEffect(() => {
    onReady()
    invalidate()
  }, [onReady, invalidate])

  useFrame((_, rawDelta) => {
    const m = motion.current
    const delta = Math.min(rawDelta, 1 / 20)
    if (!reduced) {
      m.t += delta
      m.enter = Math.min(1, m.enter + delta / 1.8)
      m.px = damp(m.px, input.current.x, 2.2, delta)
      m.py = damp(m.py, input.current.y, 2.2, delta)
      m.sc = damp(m.sc, input.current.scroll, 3, delta)
    }
    const e = easeOut(m.enter)
    const t = m.t
    const lift = Math.sin(t * 0.8) * 0.03 - (1 - e) * 0.14 // in cat heights
    const yaw = BASE_YAW + Math.sin(t * 0.21) * 0.4 + m.px * 0.32 + m.sc * 0.8 - (1 - e) * 0.9
    rig.current.position.y = y + lift * scale
    body.current.rotation.set(0.06 + m.py * 0.12 + Math.sin(t * 0.5) * 0.025, yaw, Math.sin(t * 0.37) * 0.03)

    // The shadow turns with the body and softens as the cat rises.
    const s = shadow.current
    s.rotation.y = yaw
    s.scale.setScalar(1 + lift * 1.6)
    s.children[0].material.opacity = look.shadow * e * (1 - lift * 3)
  })

  return (
    <>
      <StudioLights intensity={look.env} />
      <directionalLight position={[-3, 5, 3]} intensity={look.key} color="#fff4ea" />
      <group ref={rig} position={[x, y, 0]} scale={scale}>
        <group ref={body}>
          <mesh geometry={geometry}>
            <meshPhysicalMaterial
              color={look.glaze}
              roughness={0.35}
              metalness={0}
              clearcoat={1}
              clearcoatRoughness={0.03}
              flatShading
            />
          </mesh>
        </group>
      </group>

      <mesh visible={!STILL} position={[x, floorY - 0.004, 0]} rotation-x={-Math.PI / 2} renderOrder={-2}>
        <planeGeometry args={[scale * poolSize, scale * poolSize]} />
        <meshBasicMaterial
          map={poolMap}
          color={look.pool}
          transparent
          opacity={look.poolOpacity}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <group ref={shadow} visible={!STILL} position={[x, floorY, 0]}>
        <mesh rotation-x={-Math.PI / 2} renderOrder={-1}>
          <planeGeometry args={[scale * footprint[0] * 1.35, scale * footprint[1] * 1.35]} />
          <meshBasicMaterial map={shadowMap} color="#000000" transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
    </>
  )
}

export default function Stage({ theme, reduced, onReady }) {
  const [dprMax, setDprMax] = useState(1.5)
  const [hidden, setHidden] = useState(() => document.hidden)

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  // Hidden tab: no frames at all. Reduced motion: one still frame, redrawn
  // only when something (theme, size) changes.
  const frameloop = hidden ? 'never' : reduced ? 'demand' : 'always'

  return (
    <Canvas
      dpr={[1, dprMax]}
      frameloop={frameloop}
      camera={{ position: [0, 2.4, 10], fov: 24, near: 0.1, far: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NeutralToneMapping
        gl.setClearColor(0x000000, 0)
      }}
      aria-hidden="true"
    >
      <PerformanceMonitor onDecline={() => setDprMax(1)} />
      <Suspense fallback={null}>
        <Studio theme={theme} reduced={reduced} onReady={onReady} />
      </Suspense>
    </Canvas>
  )
}
