import { useEffect, useMemo } from 'react'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import { CatLoader } from './CatLoader.js'
import { CatRig } from './CatRig.js'

export const MODEL_URL = `${import.meta.env.BASE_URL}models/meowmeow.obj`

export default function Cat({ input, colors, reduced }) {
  const object = useLoader(CatLoader, MODEL_URL)
  const rig = useMemo(() => new CatRig(object), [object])
  const camera = useThree((s) => s.camera)
  const width = useThree((s) => s.size.width)
  const height = useThree((s) => s.size.height)
  const invalidate = useThree((s) => s.invalidate)

  useEffect(() => () => rig.dispose(), [rig])
  useEffect(() => {
    rig.frame(camera, width, height)
    invalidate()
  }, [rig, camera, width, height, invalidate])

  useFrame((state, delta) => {
    // Under reduced motion the loop runs on demand: a scroll that moves the
    // picture asks for one more frame.
    if (rig.update(state, delta, { input, colors, reduced }) && reduced) invalidate()
  })

  return <primitive object={rig.root} />
}
