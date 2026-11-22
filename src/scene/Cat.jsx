import { useEffect, useMemo } from 'react'
import { useLoader } from '@react-three/fiber'
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'
import * as THREE from 'three'

export const MODEL_URL = `${import.meta.env.BASE_URL}models/meowmeow.obj`

// The Blender export carries six stray edge records ("l ..."). OBJLoader
// turns any object holding one into LineSegments, which would leave no mesh
// at all, so drop them before parsing.
class FacesOnlyOBJLoader extends OBJLoader {
  parse(text) {
    return super.parse(text.replace(/^l\s.*$/gm, ''))
  }
}

// The OBJ is one mesh ("Cube", ~287 verts). Pull its geometry out, centre it
// on its bounding box and scale it to a height of 1, so placement elsewhere
// can think in "cat heights".
function useCatGeometry() {
  const obj = useLoader(FacesOnlyOBJLoader, MODEL_URL)
  const geometry = useMemo(() => {
    let src = null
    obj.traverse((child) => {
      if (!src && child.isMesh) src = child.geometry
    })
    const g = src.clone()
    g.computeBoundingBox()
    const box = g.boundingBox
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    g.translate(-center.x, -center.y, -center.z)
    g.scale(1 / size.y, 1 / size.y, 1 / size.y)
    g.computeBoundingSphere()
    return g
  }, [obj])
  useEffect(() => () => geometry.dispose(), [geometry])
  return geometry
}

export default function Cat({ glass, envIntensity, onLoad }) {
  const geometry = useCatGeometry()
  useEffect(() => onLoad?.(), [onLoad])
  return (
    <mesh geometry={geometry}>
      <meshPhysicalMaterial
        {...glass}
        transmission={1}
        metalness={0}
        flatShading
        side={THREE.DoubleSide}
        envMapIntensity={envIntensity}
      />
    </mesh>
  )
}
