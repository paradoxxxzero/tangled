import { PI, TAU, cos, sin } from './math'

export const cage = ({
  x_resolution,
  y_resolution,
  z_resolution,
  x_faces,
  y_faces,
  z_faces,
} = {}) => {
  const indices = []
  const vertices = []
  const uvws = []

  const x_step = 1 / x_resolution
  const x_count = x_resolution + 1
  const y_step = 1 / y_resolution
  const y_count = y_resolution + 1
  const z_step = 1 / z_resolution
  const z_count = z_resolution + 1

  const xy_count = x_count * y_count

  for (let k = 0; k < z_count; k++) {
    for (let j = 0; j < y_count; j++) {
      for (let i = 0; i < x_count; i++) {
        vertices.push(-1 + i * x_step, -1 + j * y_step, -1 + k * z_step)
        uvws.push(i / (x_count - 1), j / (y_count - 1), k / (z_count - 1))
        if (i > 0 && j > 0 && k > 0) {
          const i1 = i - 1
          const j1 = j - 1
          const k1 = k - 1
          if (x_faces) {
            indices.push(
              i + j * x_count + k * xy_count,
              i + j1 * x_count + k * xy_count,
              i + j1 * x_count + k1 * xy_count
            )
            indices.push(
              i + j * x_count + k * xy_count,
              i + j1 * x_count + k1 * xy_count,
              i + j * x_count + k1 * xy_count
            )
          }
          if (y_faces) {
            indices.push(
              i + j * x_count + k * xy_count,
              i + j * x_count + k1 * xy_count,
              i1 + j * x_count + k1 * xy_count
            )
            indices.push(
              i + j * x_count + k * xy_count,
              i1 + j * x_count + k1 * xy_count,
              i1 + j * x_count + k * xy_count
            )
          }
          if (z_faces) {
            indices.push(
              i + j * x_count + k * xy_count,
              i + j1 * x_count + k * xy_count,
              i1 + j1 * x_count + k * xy_count
            )
            indices.push(
              i + j * x_count + k * xy_count,
              i1 + j1 * x_count + k * xy_count,
              i1 + j * x_count + k * xy_count
            )
          }
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

export const grid = ({ x_resolution, y_resolution } = {}) => {
  const indices = []
  const vertices = []
  const uvws = []

  const x_step = 1 / x_resolution
  const x_count = x_resolution + 1
  const y_step = 1 / y_resolution
  const y_count = y_resolution + 1

  for (let j = 0; j < y_count; j++) {
    for (let i = 0; i < x_count; i++) {
      vertices.push(-1 + i * x_step, -1 + j * y_step)
      uvws.push(i / (x_count - 1), j / (y_count - 1), 0)
      if (i > 0 && j > 0) {
        const i1 = i - 1
        const j1 = j - 1
        indices.push(i + j * x_count, i + j1 * x_count, i1 + j1 * x_count)
        indices.push(i + j * x_count, i1 + j1 * x_count, i1 + j * x_count)
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
  x_resolution,
  y_resolution,
} = {}) => {
  const indices = []
  const vertices = []
  const normals = []
  const uvws = []

  if (radius !== null) {
    radiusTop = radius
    radiusBottom = radius
  }
  const x_segments = x_resolution
  const y_segments = y_resolution * 10
  let index = 0
  const indexArray = []
  const halfHeight = height / 2
  const slope = (radiusBottom - radiusTop) / height

  for (let y = 0; y <= y_segments; y++) {
    const indexRow = []

    const v = y / y_segments
    const radius = v * (radiusBottom - radiusTop) + radiusTop

    for (let x = 0; x <= x_segments; x++) {
      const u = x / x_segments

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

  for (let x = 0; x < x_segments; x++) {
    for (let y = 0; y < y_segments; y++) {
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
