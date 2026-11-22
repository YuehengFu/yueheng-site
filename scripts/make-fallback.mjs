// Draws the no-WebGL fallback: the cat in its resting pose as an SVG line
// drawing (visible edges solid, hidden edges dashed, the dot shadow), from the
// same model, camera and edge rules as the live scene.
// Run: node scripts/make-fallback.mjs  ->  src/cat/fallbackDrawing.js
import { readFileSync, writeFileSync } from 'node:fs'
import * as THREE from 'three'
import { CatLoader } from '../src/cat/CatLoader.js'
import { prepareGeometry } from '../src/cat/edges.js'

const FOV = 24
const ELEVATION = THREE.MathUtils.degToRad(16)
const RESTING_YAW = -0.55
const FLOOR = -0.62
const BOX = 100 // viewBox units; the cat is SCALE of it tall
const SCALE = 0.7
const THRESHOLD = Math.cos(THREE.MathUtils.degToRad(20))

const object = new CatLoader().parse(readFileSync(new URL('../public/models/meowmeow.obj', import.meta.url), 'utf8'))
const { geometry, loose } = prepareGeometry(object)
geometry.rotateY(RESTING_YAW)
const looseVecs = []
for (let i = 0; i < loose.length; i += 3) looseVecs.push(new THREE.Vector3(loose[i], loose[i + 1], loose[i + 2]).applyAxisAngle(new THREE.Vector3(0, 1, 0), RESTING_YAW))
const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }))
mesh.updateMatrixWorld()

const d = BOX / (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * BOX * SCALE)
const camera = new THREE.PerspectiveCamera(FOV, 1, d * 0.3, d * 3)
camera.position.set(0, Math.sin(ELEVATION) * d, Math.cos(ELEVATION) * d)
camera.lookAt(0, -0.05, 0)
camera.updateMatrixWorld()
camera.updateProjectionMatrix()

const toSvg = (v) => {
  const p = v.clone().project(camera)
  return [((p.x + 1) / 2) * BOX, ((1 - p.y) / 2) * BOX]
}
const f = (n) => n.toFixed(2)

// Edge -> adjacent face normals, keyed by rounded endpoint positions.
const pos = geometry.attributes.position
const key = (v) => `${v.x.toFixed(4)},${v.y.toFixed(4)},${v.z.toFixed(4)}`
const edges = new Map()
const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3()
for (let i = 0; i < pos.count; i += 3) {
  a.fromBufferAttribute(pos, i)
  b.fromBufferAttribute(pos, i + 1)
  c.fromBufferAttribute(pos, i + 2)
  const normal = new THREE.Triangle(a, b, c).getNormal(new THREE.Vector3())
  const centroid = a.clone().add(b).add(c).divideScalar(3)
  const front = normal.dot(camera.position.clone().sub(centroid)) > 0
  for (const [p, q] of [[a, b], [b, c], [c, a]]) {
    const k = [key(p), key(q)].sort().join('|')
    if (!edges.has(k)) edges.set(k, { p: p.clone(), q: q.clone(), faces: [] })
    edges.get(k).faces.push({ normal, front })
  }
}

const raycaster = new THREE.Raycaster()
const visible = []
const hidden = []
for (const { p, q, faces } of edges.values()) {
  const feature = faces.length === 1 || faces.some((x) => faces.some((y) => x.normal.dot(y.normal) < THRESHOLD))
  if (!feature) continue
  // Occluded when something sits between the camera and the edge's midpoint.
  const mid = p.clone().add(q).multiplyScalar(0.5)
  const dir = mid.clone().sub(camera.position)
  const dist = dir.length()
  raycaster.set(camera.position, dir.normalize())
  const hit = raycaster.intersectObject(mesh)[0]
  const seen = !hit || hit.distance > dist - 0.004
  const [x1, y1] = toSvg(p)
  const [x2, y2] = toSvg(q)
  ;(seen ? visible : hidden).push(`M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}`)
}

// Loose edges (whiskers): drawn unless a face hides their midpoint.
for (let i = 0; i < looseVecs.length; i += 2) {
  const [p, q] = [looseVecs[i], looseVecs[i + 1]]
  const mid = p.clone().add(q).multiplyScalar(0.5)
  const dir = mid.clone().sub(camera.position)
  const dist = dir.length()
  raycaster.set(camera.position, dir.normalize())
  const hit = raycaster.intersectObject(mesh)[0]
  const [x1, y1] = toSvg(p)
  const [x2, y2] = toSvg(q)
  ;(!hit || hit.distance > dist - 0.004 ? visible : hidden).push(`M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}`)
}

// The dot shadow: the same world-space grid and falloff as the shader.
const dots = []
const cell = 0.04
for (let i = -20; i <= 20; i++) {
  for (let j = -20; j <= 20; j++) {
    const x = (i + 0.5) * cell
    const z = (j + 0.5) * cell
    const r = Math.hypot(x / 0.4, z / 0.3)
    const t = Math.min(Math.max((r - 0.15) / 0.85, 0), 1)
    const fill = 1 - t * t * (3 - 2 * t)
    const radius = 0.36 * Math.sqrt(fill) * cell
    if (radius < cell * 0.06) continue
    const [sx, sy] = toSvg(new THREE.Vector3(x, FLOOR, z))
    const [ex] = toSvg(new THREE.Vector3(x + radius, FLOOR, z))
    dots.push(`M${f(sx - (ex - sx))} ${f(sy)}a${f(ex - sx)} ${f((ex - sx) * 0.6)} 0 1 0 ${f(2 * (ex - sx))} 0a${f(ex - sx)} ${f((ex - sx) * 0.6)} 0 1 0 ${f(-2 * (ex - sx))} 0`)
  }
}

// Construction lines: the floor circle and the vertical axis (axis hidden inside the body is left out).
const guides = []
for (let i = 0; i <= 96; i++) {
  const a = (i / 96) * Math.PI * 2
  const [x, y] = toSvg(new THREE.Vector3(Math.cos(a) * 0.4, FLOOR, Math.sin(a) * 0.4))
  guides.push(`${i ? 'L' : 'M'}${f(x)} ${f(y)}`)
}
{
  const [x1, y1] = toSvg(new THREE.Vector3(0, geometry.boundingBox.max.y + 0.01, 0))
  const [x2, y2] = toSvg(new THREE.Vector3(0, 0.6, 0))
  guides.push(`M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}`)
}

const out = `// Generated by scripts/make-fallback.mjs. Do not edit by hand.
export const BOX = ${BOX}
export const SCALE = ${SCALE}
export const visible = ${JSON.stringify(visible.join(''))}
export const hidden = ${JSON.stringify(hidden.join(''))}
export const dots = ${JSON.stringify(dots.join(''))}
export const guides = ${JSON.stringify(guides.join(''))}
`
writeFileSync(new URL('../src/cat/fallbackDrawing.js', import.meta.url), out)
console.log(`visible ${visible.length}, hidden ${hidden.length}, dots ${dots.length}, ${out.length} bytes`)
