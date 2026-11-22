import { Environment, Lightformer } from '@react-three/drei'

// The reflections come from an environment baked once from Lightformers:
// no HDRI download. A crystal reads through contrast between facets, so the
// studio is a ring of narrow strips with dark gaps between them, not one big
// softbox. Each Lightformer aims at the origin. Pointer movement rotates
// scene.environmentRotation (see Scene), sliding these strips across facets.

const R = 6
// a card on the ring around the cat: angle in degrees (0 = in front), height
const ring = (deg, y = 0) => {
  const a = (deg * Math.PI) / 180
  return [Math.sin(a) * R, y, Math.cos(a) * R]
}

function DarkStudio() {
  return (
    <>
      {/* not pure black: every facet reflects something, the strips do the rest */}
      <color attach="background" args={['#0b0f15']} />
      {/* overhead softbox, warm white */}
      <Lightformer form="rect" color="#fff1df" intensity={1.8} position={[0, 6, 0]} scale={[8, 4, 1]} />
      {/* cool strips on the left */}
      <Lightformer form="rect" color="#e8f4ff" intensity={4} position={ring(-50, 1)} scale={[1.6, 10, 1]} />
      <Lightformer form="rect" color="#8fc7ff" intensity={2.4} position={ring(-100)} scale={[2.2, 10, 1]} />
      <Lightformer form="rect" color="#cfe7ff" intensity={1.4} position={ring(-150)} scale={[1, 10, 1]} />
      {/* warm strips on the right */}
      <Lightformer form="rect" color="#ffe2c4" intensity={3.4} position={ring(45, 0.5)} scale={[1.4, 10, 1]} />
      <Lightformer form="rect" color="#ffb17d" intensity={2.2} position={ring(105)} scale={[2.4, 10, 1]} />
      {/* teal rim from behind */}
      <Lightformer form="rect" color="#9ff0dc" intensity={2} position={ring(180, 1)} scale={[4, 1.2, 1]} />
      {/* one small hard key, front left, for a single bright facet */}
      <Lightformer form="rect" color="#ffffff" intensity={6} position={ring(-15, 3)} scale={[1.2, 1.2, 1]} />
      {/* faint warm bounce from below */}
      <Lightformer form="rect" color="#f0c9a8" intensity={0.5} position={[0, -6, 0]} scale={[8, 8, 1]} />
    </>
  )
}

function LightStudio() {
  return (
    <>
      <color attach="background" args={['#dfe4ea']} />
      <Lightformer form="rect" color="#ffffff" intensity={2.2} position={[0, 6, 0]} scale={[9, 5, 1]} />
      <Lightformer form="rect" color="#ffffff" intensity={1.6} position={ring(0, 0.5)} scale={[7, 3, 1]} />
      {/* black flags between the bright areas: they draw the crisp edges */}
      <Lightformer form="rect" color="#000000" position={ring(-60)} scale={[1.6, 12, 1]} />
      <Lightformer form="rect" color="#000000" position={ring(-120)} scale={[2.4, 12, 1]} />
      <Lightformer form="rect" color="#000000" position={ring(70)} scale={[1.1, 12, 1]} />
      <Lightformer form="rect" color="#000000" position={ring(140)} scale={[2.8, 12, 1]} />
      <Lightformer form="rect" color="#0d1117" position={[0, -6, 0]} scale={[10, 10, 1]} />
      {/* two small tinted cards for colour in the bevels */}
      <Lightformer form="rect" color="#7fb6f0" intensity={2.4} position={ring(-90, 1.5)} scale={[0.8, 3, 1]} />
      <Lightformer form="rect" color="#f2a66e" intensity={2.2} position={ring(100, -1)} scale={[0.8, 3, 1]} />
    </>
  )
}

export default function Studio({ theme }) {
  return (
    <Environment key={theme} resolution={256} frames={1}>
      {theme === 'dark' ? <DarkStudio /> : <LightStudio />}
    </Environment>
  )
}
