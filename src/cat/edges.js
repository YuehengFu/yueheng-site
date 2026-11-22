import * as THREE from 'three'

// The cat's faces, centred on their bounding box and scaled to one unit
// tall, plus its loose edges (see CatLoader) moved the same way.
export function prepareGeometry(object) {
  let source = null
  object.traverse((child) => {
    if (!source && child.isMesh) source = child.geometry
  })
  const geometry = source.clone()
  geometry.deleteAttribute('uv')
  geometry.deleteAttribute('normal') // the fill shader derives flat normals itself
  geometry.computeBoundingBox()
  const box = geometry.boundingBox
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  geometry.translate(-center.x, -center.y, -center.z)
  geometry.scale(1 / size.y, 1 / size.y, 1 / size.y)
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  const loose = Float32Array.from(object.userData.loose ?? [], (v, i) => (v - center.getComponent(i % 3)) / size.y)
  return { geometry, loose }
}

// Feature edges, ordered for the draw-in: a breadth-first walk over shared
// vertices from the highest point (an ear tip), so the outline spreads from
// there like a pen working down the drawing. Loose edges join the walk.
// Returns a flat xyz array of segment pairs and how many segments there are.
export function orderedEdges(geometry, loose, thresholdAngle = 12) {
  const edges = new THREE.EdgesGeometry(geometry, thresholdAngle)
  const feature = edges.attributes.position.array
  const pos = new Float32Array(feature.length + loose.length)
  pos.set(feature)
  pos.set(loose, feature.length)
  const count = pos.length / 6
  const key = (i) => `${pos[i].toFixed(4)},${pos[i + 1].toFixed(4)},${pos[i + 2].toFixed(4)}`

  const ids = new Map()
  const vertexOf = (i) => {
    const k = key(i)
    if (!ids.has(k)) ids.set(k, { id: ids.size, y: pos[i + 1] })
    return ids.get(k).id
  }
  const seg = []
  const adj = []
  for (let s = 0; s < count; s++) {
    const a = vertexOf(s * 6)
    const b = vertexOf(s * 6 + 3)
    seg.push([a, b])
    ;(adj[a] ||= []).push(s)
    ;(adj[b] ||= []).push(s)
  }

  const heights = [...ids.values()].sort((p, q) => q.y - p.y)
  const level = new Array(count).fill(Infinity)
  const seen = new Set()
  // Disconnected pieces (if any) start from their own highest vertex.
  for (const { id: startId } of heights) {
    if (seen.has(startId)) continue
    const base = Math.max(0, ...level.filter(Number.isFinite)) + 1
    const queue = [[startId, base]]
    seen.add(startId)
    while (queue.length) {
      const [v, d] = queue.shift()
      for (const s of adj[v] || []) {
        if (level[s] > d) level[s] = d
        const [a, b] = seg[s]
        const other = a === v ? b : a
        if (!seen.has(other)) {
          seen.add(other)
          queue.push([other, d + 1])
        }
      }
    }
  }

  const order = [...Array(count).keys()].sort((p, q) => level[p] - level[q])
  const out = new Float32Array(count * 6)
  order.forEach((s, i) => out.set(pos.subarray(s * 6, s * 6 + 6), i * 6))
  edges.dispose()
  return { positions: out, count }
}
