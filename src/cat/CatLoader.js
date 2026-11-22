import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'

// meowmeow.obj ends with six loose `l` edges (the whiskers). OBJLoader turns
// any object that has a line statement into one LineSegments, faces and all,
// so this loader takes the line statements out before parsing and hands them
// back as plain segment positions on userData.loose.
export class CatLoader extends OBJLoader {
  parse(text) {
    const vertices = []
    const loose = []
    for (const line of text.split(/\r?\n/)) {
      if (line.startsWith('v ')) {
        const [, x, y, z] = line.trim().split(/\s+/)
        vertices.push([+x, +y, +z])
      } else if (line.startsWith('l ')) {
        const ids = line.trim().split(/\s+/).slice(1).map((s) => parseInt(s, 10))
        const at = (i) => vertices[i > 0 ? i - 1 : vertices.length + i]
        for (let i = 0; i < ids.length - 1; i++) loose.push(...at(ids[i]), ...at(ids[i + 1]))
      }
    }
    const object = super.parse(text.replace(/^l .*$/gm, ''))
    object.userData.loose = new Float32Array(loose)
    return object
  }
}
