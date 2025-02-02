import { PI, TAU, cos, sin } from './math'

export const cage = ({ resolution = 100 } = {}) => {
  const indices = []
  const vertices = []
  const uvws = []

  const step = 1 / resolution
  const count = 2 * resolution + 1
  const count2 = count * count

  for (let k = 0; k < count; k++) {
    for (let j = 0; j < count; j++) {
      for (let i = 0; i < count; i++) {
        vertices.push(-1 + i * step, -1 + j * step, -1 + k * step)
        uvws.push(i / (count - 1), j / (count - 1), k / (count - 1))
        if (i > 0 && j > 0 && k > 0) {
          const i1 = i - 1
          const j1 = j - 1
          const k1 = k - 1
          indices.push(
            i + j * count + k * count2,
            i + j1 * count + k * count2,
            i1 + j1 * count + k * count2
          )
          indices.push(
            i + j * count + k * count2,
            i1 + j1 * count + k * count2,
            i1 + j * count + k * count2
          )
          indices.push(
            i + j * count + k * count2,
            i + j * count + k1 * count2,
            i1 + j * count + k1 * count2
          )
          indices.push(
            i + j * count + k * count2,
            i1 + j * count + k1 * count2,
            i1 + j * count + k * count2
          )
          indices.push(
            i + j * count + k * count2,
            i + j1 * count + k * count2,
            i + j1 * count + k1 * count2
          )
          indices.push(
            i + j * count + k * count2,
            i + j1 * count + k1 * count2,
            i + j * count + k1 * count2
          )
        }
      }
    }
  }
  return {
    vertices,
    indices,
    uvws,
  }
}

export const grid = ({ resolution = 100 } = {}) => {
  const indices = []
  const vertices = []
  const uvws = []

  const step = 1 / resolution
  const count = 2 * resolution + 1

  for (let j = 0; j < count; j++) {
    for (let i = 0; i < count; i++) {
      vertices.push(-1 + i * step, -1 + j * step)
      uvws.push(i / (count - 1), j / (count - 1), 0)
      if (i > 0 && j > 0) {
        const i1 = i - 1
        const j1 = j - 1
        indices.push(i + j * count, i + j1 * count, i1 + j1 * count)
        indices.push(i + j * count, i1 + j1 * count, i1 + j * count)
      }
    }
  }
  return {
    vertices,
    indices,
    uvws,
  }
}

export const tube = ({
  radius = null,
  radiusTop = 1,
  radiusBottom = 1,
  height = 1,
  radialSegments = 8,
  segments = 1,
} = {}) => {
  const indices = []
  const vertices = []
  const normals = []
  const uvws = []

  if (radius !== null) {
    radiusTop = radius
    radiusBottom = radius
  }

  let index = 0
  const indexArray = []
  const halfHeight = height / 2
  const slope = (radiusBottom - radiusTop) / height

  for (let y = 0; y <= segments; y++) {
    const indexRow = []

    const v = y / segments
    const radius = v * (radiusBottom - radiusTop) + radiusTop

    for (let x = 0; x <= radialSegments; x++) {
      const u = x / radialSegments

      const theta = u * TAU

      const sinTheta = sin(theta)
      const cosTheta = cos(theta)

      // vertex
      const vertex = [
        radius * sinTheta,
        -v * height + halfHeight,
        radius * cosTheta,
      ]
      vertices.push(...vertex)
      const normal = [sinTheta, slope, cosTheta]

      const nr = (normal[0] ** 2 + normal[1] ** 2 + normal[2] ** 2) ** -0.5
      normals.push(...normal.map(v => v * nr))
      uvws.push(u, 1 - v, 0)
      indexRow.push(index++)
    }

    indexArray.push(indexRow)
  }

  for (let x = 0; x < radialSegments; x++) {
    for (let y = 0; y < segments; y++) {
      const a = indexArray[y][x]
      const b = indexArray[y + 1][x]
      const c = indexArray[y + 1][x + 1]
      const d = indexArray[y][x + 1]

      indices.push(a, b, d)
      indices.push(b, c, d)
    }
  }
  return {
    vertices,
    normals,
    uvws,
    indices,
  }
}
