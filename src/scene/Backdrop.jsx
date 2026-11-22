import { useEffect, useState } from 'react'
import * as THREE from 'three'

// An opaque full-view plane behind the cat. Transmission only refracts
// opaque things, so this is what the glass bends: a soft two-tone halo and,
// in the dark theme, two faint light slits the facets break into pieces.
// Away from the halo it is exactly the page colour, so its edges vanish.

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uBg;
  uniform vec3 uA;
  uniform vec3 uB;
  uniform vec2 uCenter;
  uniform float uAspect;
  uniform float uRadius;
  uniform float uStrength;
  uniform float uFalloff;
  uniform float uBand;
  uniform float uShadow;
  uniform float uLift;
  varying vec2 vUv;

  void main() {
    vec2 p = vUv - uCenter;
    p.x *= uAspect;
    p /= uRadius;

    float r2 = dot(p, p);
    // fade to nothing near the top and bottom edges: on phones the canvas
    // ends at the first screen and must not leave a seam
    float edge = smoothstep(0.0, 0.16, vUv.y) * smoothstep(1.0, 0.84, vUv.y);
    float halo = exp(-r2 * uFalloff) * edge;
    float k = smoothstep(-0.9, 0.9, p.x - p.y);
    vec3 tint = mix(uA, uB, k);
    vec3 col = mix(uBg, tint, halo * uStrength);

    // two short, thin slits right behind the cat, gone well before the text
    float side = exp(-pow(p.x / 0.3, 2.0));
    float s1 = exp(-pow((p.y - 0.34) / 0.018, 2.0));
    float s2 = exp(-pow((p.y + 0.22) / 0.010, 2.0)) * 0.7;
    col += vec3(0.95, 0.97, 1.0) * (s1 + s2) * side * uBand;

    // a soft floor shadow under the cat, light theme only
    vec2 q = vec2(p.x / 0.62, (p.y + 0.78) / 0.07);
    float sh = exp(-dot(q, q)) * uShadow * (1.0 - uLift * 1.6);
    col *= 1.0 - sh;

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`

// Uniform values are driven every frame by the rig through the mesh ref;
// the initial look only seeds them.
export default function Backdrop({ ref, look, width, height, z }) {
  const [material] = useState(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uBg: { value: new THREE.Color(look.bg) },
          uA: { value: new THREE.Color(look.haloA) },
          uB: { value: new THREE.Color(look.haloB) },
          uCenter: { value: new THREE.Vector2(0.7, 0.5) },
          uAspect: { value: 1 },
          uRadius: { value: 0.5 },
          uStrength: { value: look.haloStrength },
          uFalloff: { value: look.haloFalloff },
          uBand: { value: look.bandStrength },
          uShadow: { value: look.shadowStrength },
          uLift: { value: 0 },
        },
        vertexShader,
        fragmentShader,
        depthWrite: false,
        toneMapped: false,
      }),
  )
  useEffect(() => () => material.dispose(), [material])
  return (
    <mesh ref={ref} position={[0, 0, z]} scale={[width, height, 1]} material={material} renderOrder={-1}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  )
}
