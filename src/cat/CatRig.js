import * as THREE from 'three'
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js'
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js'
import { LineMaterial } from 'three/addons/lines/LineMaterial.js'
import { prepareGeometry, orderedEdges } from './edges.js'
import { makeFillMaterial, makeDotShadowMaterial } from './materials.js'
import { catFrame } from './layout.js'

export const FOV = 24
export const EDGE_ANGLE = 20 // degrees between faces before their shared edge is drawn
const ELEVATION = THREE.MathUtils.degToRad(16)
const FLOOR = -0.62
const DRAW_SECONDS = 2.1
export const PARALLAX = 0.7 // narrow screens: how fast the cat leaves with the page
export const RESTING_YAW = -0.55 // a three-quarter view; also the still pose
const { damp, clamp, smoothstep, degToRad } = THREE.MathUtils
const easeOut = (x) => 1 - Math.pow(1 - x, 3)

// Everything three.js about the cat: the drawing (faces, visible and hidden
// edges, dot shadow), its framing, and the per-frame motion. React only
// mounts `root` and calls frame() and update().
export class CatRig {
  constructor(object) {
    const { geometry, loose } = prepareGeometry(object)
    const { positions, count } = orderedEdges(geometry, loose, EDGE_ANGLE)
    this.geometry = geometry
    this.count = count
    this.lines = new LineSegmentsGeometry().setPositions(positions)

    this.front = new LineMaterial({ linewidth: 1.2, transparent: true, depthWrite: false })
    this.hidden = new LineMaterial({
      linewidth: 1,
      transparent: true,
      depthWrite: false,
      dashed: true,
      dashSize: 0.01,
      gapSize: 0.014,
    })
    this.hidden.depthFunc = THREE.GreaterDepth // drawn only where the faces cover it
    this.fill = makeFillMaterial()
    this.shadow = makeDotShadowMaterial()

    const faces = new THREE.Mesh(geometry, this.fill)
    const hiddenLines = new LineSegments2(this.lines, this.hidden)
    hiddenLines.computeLineDistances()
    hiddenLines.renderOrder = 1
    const frontLines = new LineSegments2(this.lines, this.front)
    frontLines.renderOrder = 2

    this.spin = new THREE.Group()
    this.spin.add(faces, hiddenLines, frontLines)
    this.lift = new THREE.Group()
    this.lift.add(this.spin)
    this.floor = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), this.shadow)
    this.floor.rotation.x = -Math.PI / 2
    this.floor.position.y = FLOOR
    // Construction lines, as on a turntable drawing: the floor circle the
    // cat turns on and its vertical axis. Dashed, faint, drawn after the cat.
    const guide = []
    const R = 0.4
    for (let i = 0; i < 96; i++) {
      const a0 = (i / 96) * Math.PI * 2
      const a1 = ((i + 1) / 96) * Math.PI * 2
      guide.push(Math.cos(a0) * R, FLOOR, Math.sin(a0) * R, Math.cos(a1) * R, FLOOR, Math.sin(a1) * R)
    }
    guide.push(0, FLOOR - 0.03, 0, 0, 0.6, 0)
    this.guideLines = new LineSegmentsGeometry().setPositions(guide)
    this.guide = new LineMaterial({ linewidth: 1, transparent: true, depthWrite: false, dashed: true, dashSize: 0.028, gapSize: 0.018 })
    const guides = new LineSegments2(this.guideLines, this.guide)
    guides.computeLineDistances()
    guides.renderOrder = 3

    this.root = new THREE.Group()
    this.root.add(this.lift, this.floor, guides)

    this.start = -1
    this.yaw = 0
    this.pitch = 0
    this.dim = 1
    this.bg = new THREE.Color()
    this.ink = new THREE.Color()
    this.view = null
    this.viewKey = ''
  }

  // Camera distance and height for this viewport, so the cat stands at
  // catFrame()'s spot and size.
  frame(camera, width, height) {
    this.view = { ...catFrame(width, height), width, height }
    const d = height / (2 * Math.tan(degToRad(FOV / 2)) * this.view.size)
    camera.fov = FOV
    camera.near = d * 0.3
    camera.far = d * 3
    camera.position.set(0, Math.sin(ELEVATION) * d, Math.cos(ELEVATION) * d)
    camera.lookAt(0, -0.05, 0)
    // Coarser dots on a small cat, so the halftone stays legible on a phone.
    this.shadow.uniforms.uCell.value = 0.04 * clamp(440 / this.view.size, 1, 1.6)
    this.viewKey = ''
    this.offset(camera, 0)
  }

  // A view offset moves the picture to the cat's spot without skewing the
  // perspective. On narrow screens the cat drifts up a little slower than
  // the page. Returns true when the picture moved.
  offset(camera, scroll) {
    const v = this.view
    if (!v) return false
    const y = v.wide ? v.y : v.y - scroll * PARALLAX
    const key = `${v.width} ${v.height} ${v.x} ${y}`
    if (key === this.viewKey) return false
    this.viewKey = key
    camera.setViewOffset(v.width, v.height, v.width / 2 - v.x, v.height / 2 - y, v.width, v.height)
    camera.updateProjectionMatrix()
    return true
  }

  update({ clock, camera, gl }, delta, { input, colors, reduced }) {
    const t = clock.elapsedTime
    if (this.start < 0) {
      this.start = t
      this.bg.copy(colors.bg)
      this.ink.copy(colors.ink)
    }
    const dt = Math.min(delta, 0.05)
    const moved = this.offset(camera, input.scroll)

    // Theme: ease toward the page colours with the CSS transition (instant when still).
    const k = reduced ? 1 : 1 - Math.exp(-dt * 14)
    this.bg.lerp(colors.bg, k)
    this.ink.lerp(colors.ink, k)

    // Draw-in: edges appear in walk order, then the shading and the shadow.
    const p = reduced ? 1 : clamp((t - this.start) / DRAW_SECONDS, 0, 1)
    this.lines.instanceCount = Math.max(1, Math.ceil(easeOut(p) * this.count))
    const settle = smoothstep(p, 0.45, 1)

    // On narrow screens the cat steps back once the text scrolls over it.
    const dimTarget = input.wide ? 1 : 1 - 0.9 * smoothstep(input.scroll, 24, 220)
    this.dim = reduced ? dimTarget : damp(this.dim, dimTarget, 10, dt)

    this.front.color.copy(this.ink)
    this.front.opacity = this.dim
    this.hidden.color.copy(this.ink)
    this.hidden.opacity = 0.17 * settle * this.dim
    const fu = this.fill.uniforms
    fu.uBg.value.copy(this.bg)
    fu.uInk.value.copy(this.ink)
    fu.uTone.value = settle * this.dim
    fu.uDpr.value = gl.getPixelRatio()

    // Motion: a slow turn, a float, and a lean toward the pointer.
    const float = reduced ? 0 : Math.sin(t * 0.85) * 0.03
    this.yaw = damp(this.yaw, reduced ? 0 : input.px * 0.5, 2.5, dt)
    this.pitch = damp(this.pitch, reduced ? 0 : input.py * 0.14, 2.5, dt)
    this.spin.rotation.y = RESTING_YAW + (reduced ? 0 : (t - this.start) * 0.16) + this.yaw
    this.lift.position.y = float
    this.lift.rotation.x = this.pitch
    this.lift.rotation.z = reduced ? 0 : Math.sin(t * 0.55) * 0.025

    this.guide.color.copy(this.ink)
    this.guide.opacity = 0.2 * smoothstep(p, 0.7, 1) * this.dim

    const su = this.shadow.uniforms
    su.uInk.value.copy(this.ink)
    su.uOpacity.value = 0.42 * settle * this.dim
    const spread = 1 - float * 2.2 // a higher cat casts a tighter shadow
    su.uRadius.value.set(0.4 * spread, 0.3 * spread)
    return moved
  }

  dispose() {
    this.geometry.dispose()
    this.lines.dispose()
    this.guideLines.dispose()
    this.floor.geometry.dispose()
    for (const m of [this.front, this.hidden, this.guide, this.fill, this.shadow]) m.dispose()
  }
}
