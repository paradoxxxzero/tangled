#version 300 es
precision highp float;
precision highp int;

##CONFIG

#include includes

in vec3 uvw;

out vec3 vPosition;
out vec3 vUvw;
out vec3 vNormal;

#ifdef SHADING
  #if SHADING == 5
flat out float vId;
  #elif SHADING == 6
flat out float vId;
  #endif
#endif

uniform mat4 matrix;
uniform mat4 viewProjection;

vec3 xproject(vec4 pos) {
    // return pos.xyz;
    // return vec3(pos.xy, length(pos.zw));
    float limit = abs(anakata);
    if(pos.w < -limit) {
        return vec3(intBitsToFloat(-1));
    }
    return vec3(limit * pos.xyz / (limit + pos.w));
}

vec4 viewProject(vec3 position) {
    return viewProjection * vec4(position, 1.);
}

##FUNS

void main() {

    #init_args

    #if DIMENSIONS == 1
    float eps = 5e-3;
    float t = tmin + (tmax - tmin) * uvw.y;
    vec3 proj = xproject(matrix * vec4(x(t), y(t), z(t), w(t)));

    float n = tmin + (tmax - tmin) * (uvw.y + eps);
    vec3 nextProj = xproject(matrix * vec4(x(n), y(n), z(n), w(n)));

    vec3 tangent = normalize(proj - nextProj);

    vec3 norm = cross(nextProj + NOISE, proj);
    // Rodrigues' rotation formula: rotate norm around tangent by angle r:
    float r = uvw.x * TAU;
    norm = normalize(norm * cos(r) + cross(tangent, norm) * sin(r));

    vPosition = proj + norm * thickness;
    vNormal = norm;
    #elif DIMENSIONS == 2
    float eps = 5e-5;
    float t = tmin + (tmax - tmin) * uvw.x;
    float s = smin + (smax - smin) * uvw.y;
    vec3 proj = xproject(matrix * vec4(x(t, s), y(t, s), z(t, s), w(t, s)));
    float n = tmin + (tmax - tmin) * (uvw.x + eps);
    vec3 proj1 = xproject(matrix * vec4(x(n, s), y(n, s), z(n, s), w(n, s)));
    float m = smin + (smax - smin) * (uvw.y + eps);
    vec3 proj2 = xproject(matrix * vec4(x(t, m), y(t, m), z(t, m), w(t, m)));

    vPosition = proj;
    vNormal = normalize(cross(proj2 - proj, proj1 - proj));
    #elif DIMENSIONS == 3
    float eps = 5e-5;
    float t = tmin + (tmax - tmin) * uvw.x;
    float s = smin + (smax - smin) * uvw.y;
    float r = rmin + (rmax - rmin) * uvw.z;
    vec3 proj = xproject(matrix * vec4(x(t, s, r), y(t, s, r), z(t, s, r), w(t, s, r)));
    float n = tmin + (tmax - tmin) * (uvw.x + eps);
    vec3 proj1 = xproject(matrix * vec4(x(n, s, r), y(n, s, r), z(n, s, r), w(n, s, r)));
    float m = smin + (smax - smin) * (uvw.y + eps);
    vec3 proj2 = xproject(matrix * vec4(x(t, m, r), y(t, m, r), z(t, m, r), w(t, m, r)));
    float l = rmin + (rmax - rmin) * (uvw.z + eps);
    vec3 proj3 = xproject(matrix * vec4(x(t, s, l), y(t, s, l), z(t, s, l), w(t, s, l)));

    vPosition = proj;
    vNormal = normalize(proj1 + proj2 + proj3);

    #endif
    vUvw = uvw;
    gl_Position = vec4(viewProject(vPosition));

    #ifdef SHADING 
    #if SHADING == 5
    vId = float(gl_InstanceID);
    #elif SHADING == 6
    vId = float(gl_VertexID);
    #endif
    #endif
}
