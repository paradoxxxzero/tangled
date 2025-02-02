#version 300 es

precision highp float;
precision highp int;

##CONFIG

#include includes

uniform vec3 eye;

in vec3 vPosition;
in vec3 vUvw;
in vec3 vNormal;

out vec4 outColor;

vec3 hsl2rgb(in vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
}

vec3 rgb2hcv(in vec3 col) {
    vec4 P = mix(vec4(col.bg, -1.0, 2.0 / 3.0), vec4(col.gb, 0.0, -1.0 / 3.0), step(col.b, col.g));
    vec4 Q = mix(vec4(P.xyw, col.r), vec4(col.r, P.yzx), step(P.x, col.r));
    float C = Q.x - min(Q.w, Q.y);
    float H = abs((Q.w - Q.y) / (6. * C + 1e-9) + Q.z);
    return vec3(H, C, Q.x);
}

vec3 rgb2hsl(in vec3 col) {
    col = rgb2hcv(col);
    float L = col.z - col.y * 0.5;
    float S = col.y / (1. - abs(L * 2. - 1.) + 1e-9);
    return vec3(col.x, S, L);
}

vec3 hueAdjust(in vec3 col, in float p) {
    vec3 hsl = rgb2hsl(col);
    hsl.x += p + hue;
    hsl.y *= saturation;
    hsl.z *= lightness;
    return hsl2rgb(hsl);
}
vec3 cosPalette(in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d) {
    return a + b * cos(offset + TAU * (c * velocity * .1 * t + d));
}

vec3 palette(float t) {
    return cosPalette(t,
        #if PALETTE == 0
    vec3(0.5, 0.5, 0.5), vec3(0.5, 0.5, 0.5), vec3(1.0, 1.0, 1.0), vec3(0.0, 0.10, 0.20)
        #elif PALETTE == 1
    vec3(0.5, 0.5, 0.5), vec3(0.5, 0.5, 0.5), vec3(1.0, 1.0, 1.0), vec3(0.0, 0.33, 0.67)
        #elif PALETTE == 2
    vec3(0.5, 0.5, 0.5), vec3(0.5, 0.5, 0.5), vec3(1.0, 1.0, 1.0), vec3(0.3, 0.20, 0.20)
        #elif PALETTE == 3
    vec3(0.5, 0.5, 0.5), vec3(0.5, 0.5, 0.5), vec3(1.0, 1.0, 0.5), vec3(0.8, 0.90, 0.30)
        #elif PALETTE == 4
    vec3(0.5, 0.5, 0.5), vec3(0.5, 0.5, 0.5), vec3(1.0, 0.7, 0.4), vec3(0.0, 0.15, 0.20)
        #elif PALETTE == 5
    vec3(0.5, 0.5, 0.5), vec3(0.5, 0.5, 0.5), vec3(2.0, 1.0, 0.0), vec3(0.5, 0.20, 0.25)
        #elif PALETTE == 6
    vec3(0.8, 0.5, 0.4), vec3(0.2, 0.4, 0.2), vec3(2.0, 1.0, 1.0), vec3(0.0, 0.25, 0.25)
        #elif PALETTE == 7
    vec3(0.731, 1.098, 0.192), vec3(0.358, 1.090, 0.657), vec3(1.077, 0.360, 0.328), vec3(0.965, 2.265, 0.837));
        #endif
    );
}

vec3 color(float t, float p) {
    return hueAdjust(palette(t), p);
}

vec3 color(float t) {
    return color(t, 0.);
}

float grid(vec3 color, vec3 vUvw, float scale, float width) {

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
    vec3 albedo = color(vUvw.y * 100.);
    vec3 eyeDirection = normalize(eye - vPosition);
    vec3 lightPosition = eye;
    vec3 lightDirection = normalize(lightPosition - vPosition);
    float diffuse = abs(dot(vNormal, lightDirection));
    vec3 halfVector = normalize(lightDirection + eyeDirection);
    float specular = pow(abs(dot(vNormal, halfVector)), 32.);
    float k = .8;//diffuse + specular;
    vec3 color = (k + .2) * albedo;

    float opacity = alpha;

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
    outColor = vec4(color, opacity);
}
