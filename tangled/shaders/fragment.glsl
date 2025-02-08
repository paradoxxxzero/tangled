#version 300 es

precision highp float;
precision highp int;

##CONFIG

#include includes
#include colors

in vec3 vPosition;
in vec3 vUvw;
in vec3 vNormal;

#ifdef TRANSPARENT
layout(location = 0) out vec4 accumColor;
layout(location = 1) out float accumAlpha;

float weight(float z, float a) {
    float b = min(1.0, a * 10.0) + 0.01;
    float c = 1.0 - z * 0.9;
    return clamp(b * b * b * 1e8 * c * c * c, 1e-2, 3e3);
}
#else
out vec4 outColor;
#endif

#ifdef SHADING
  #if SHADING == 5
flat in float vId;
  #elif SHADING == 6
flat in float vId;
  #endif
#endif

#include lighting

float grid(vec4 color, vec3 vUvw, float scale, float width) {
    vec3 gridDist = fract(2. * (vUvw) * scale);
    gridDist = min(gridDist, 1. - gridDist);
    gridDist /= fwidth(vUvw) * scale;
    float dist = min(gridDist.x, gridDist.y);

    #if DIMENSIONS == 3
    dist = min(dist, gridDist.z);
    #endif

    return smoothstep(0., width * 3., dist);
    // return mix(vec3(0.), color, smoothstep(0., width * 3., dist));
}

void main() {
    vec3 baseColor = color(vUvw.x * 100.);
    #ifdef SHADING
    vec4 color = light(vPosition, vNormal, baseColor, vUvw);
    #else
    vec4 color = vec4(baseColor, opacity);
    #endif
    // vec3 eyeDirection = normalize(eye - vPosition);
    // vec3 lightPosition = eye;
    // vec3 lightDirection = normalize(lightPosition - vPosition);
    // float diffuse = abs(dot(vNormal, lightDirection));
    // #ifdef CEL_SHADING
    // diffuse = floor(diffuse * float(CEL_SHADING)) / float(CEL_SHADING);
    // #endif
    // vec3 halfVector = normalize(lightDirection + eyeDirection);
    // float specular = pow(abs(dot(vNormal, halfVector)), 32.);
    // float k = diffuse + specular;
    // vec3 color = (k + .2) * albedo;

    // float opacity = alpha;

    #ifdef GRID
    float dist = grid(color, vUvw, gridScale, gridWidth);
    #ifdef SUBGRID
    dist = min(dist, grid(color, vUvw, subgridScale, subgridWidth));
    #endif
    #ifdef INVERT_GRID
    color *= (1. - dist);
    opacity *= (1. - dist);
    #else
    color *= dist;
    #endif
    #endif

    #ifdef TRANSPARENT
    float w = weight(gl_FragCoord.z, color.a);
    accumColor = vec4(color.rgb * color.a * w, color.a);
    accumAlpha = color.a * w;
    #else
    outColor = color;
    #endif
}
