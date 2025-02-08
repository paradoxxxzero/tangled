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

    float u = umin + (umax - umin) * uvw.x;
    #if DIMENSIONS > 1
    float v = vmin + (vmax - vmin) * uvw.y;
    #endif
    #if DIMENSIONS > 2
    float w = wmin + (wmax - wmin) * uvw.z;
    #endif

    #if DIMENSIONS == 1
    float eps = 5e-3;
    vec3 proj = xproject(matrix * vec4(xfn(u), yfn(u), zfn(u), wfn(u)));

    float n = umin + (umax - umin) * (uvw.x + eps);
    vec3 nextProj = xproject(matrix * vec4(xfn(n), yfn(n), zfn(n), wfn(n)));

    vec3 tangent = normalize(proj - nextProj);

    vec3 norm = cross(nextProj + NOISE, proj);
    // Rodrigues' rotation formula: rotate norm around tangent by angle theta:
    float theta = uvw.y * TAU;
    norm = normalize(norm * cos(theta) + cross(tangent, norm) * sin(theta));

    vPosition = proj + norm * thickness;
    vNormal = norm;
    #elif DIMENSIONS == 2
    float eps = 5e-5;
    vec3 proj = xproject(matrix * vec4(xfn(u, v), yfn(u, v), zfn(u, v), wfn(u, v)));
    float n = umin + (umax - umin) * (uvw.x + eps);
    vec3 proj1 = xproject(matrix * vec4(xfn(n, v), yfn(n, v), zfn(n, v), wfn(n, v)));
    float m = vmin + (vmax - vmin) * (uvw.y + eps);
    vec3 proj2 = xproject(matrix * vec4(xfn(u, m), yfn(u, m), zfn(u, m), wfn(u, m)));

    vPosition = proj;
    vNormal = normalize(cross(proj2 - proj, proj1 - proj));
    #elif DIMENSIONS == 3
    float eps = 5e-5;
    vec3 proj = xproject(matrix * vec4(xfn(u, v, w), yfn(u, v, w), zfn(u, v, w), wfn(u, v, w)));
    float n = umin + (umax - umin) * (uvw.x + eps);
    vec3 proj1 = xproject(matrix * vec4(xfn(n, v, w), yfn(n, v, w), zfn(n, v, w), wfn(n, v, w)));
    float m = vmin + (vmax - vmin) * (uvw.y + eps);
    vec3 proj2 = xproject(matrix * vec4(xfn(u, m, w), yfn(u, m, w), zfn(u, m, w), wfn(u, m, w)));
    float l = wmin + (wmax - wmin) * (uvw.z + eps);
    vec3 proj3 = xproject(matrix * vec4(xfn(u, v, l), yfn(u, v, l), zfn(u, v, l), wfn(u, v, l)));

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
