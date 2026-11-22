import * as THREE from 'three'

// The faces: the page colour with a faint ink tone in three flat steps, like
// a pencil shading pass. The darkest step gets diagonal hatching at a fixed
// on-screen pitch, as on a section drawing. Both colours are uniforms, so the
// cat follows the page theme exactly.
export function makeFillMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uBg: { value: new THREE.Color() },
      uInk: { value: new THREE.Color() },
      uTone: { value: 1 }, // 0..1, fades the shading back to the page colour
      uDpr: { value: 1 },
      uLight: { value: new THREE.Vector3(-0.55, 0.7, 0.45).normalize() }, // view space
    },
    vertexShader: /* glsl */ `
      varying vec3 vView;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vView = mv.xyz;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uBg;
      uniform vec3 uInk;
      uniform float uTone;
      uniform float uDpr;
      uniform vec3 uLight;
      varying vec3 vView;
      void main() {
        // Flat facet normal from screen derivatives: the low-poly look, no seams.
        vec3 n = normalize(cross(dFdx(vView), dFdy(vView)));
        float l = dot(n, uLight);
        float band = l > 0.45 ? 0.0 : (l > -0.05 ? 1.0 : 2.0);
        float tone = (0.035 + band * 0.045) * uTone;
        vec3 col = mix(uBg, uInk, tone);
        if (band > 1.5) {
          float s = (gl_FragCoord.x + gl_FragCoord.y) / uDpr;
          float d = abs(fract(s / 5.0) - 0.5) * 5.0; // px to the nearest hatch line
          float line = 1.0 - smoothstep(0.3, 1.0, d);
          col = mix(col, uInk, line * 0.16 * uTone);
        }
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }
    `,
    polygonOffset: true, // pushes the faces back so the edges on them win the depth test
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  })
}

// The shadow: a halftone ellipse of dots on the floor. The dot grid is fixed
// in world space; only each dot's radius follows the cat's height, so the
// shadow breathes as the cat floats.
export function makeDotShadowMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uInk: { value: new THREE.Color() },
      uOpacity: { value: 0 },
      uRadius: { value: new THREE.Vector2(0.42, 0.3) },
      uCell: { value: 0.04 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vXZ;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vXZ = w.xz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uInk;
      uniform float uOpacity;
      uniform vec2 uRadius;
      uniform float uCell;
      varying vec2 vXZ;
      void main() {
        vec2 p = vXZ / uCell;
        vec2 cell = floor(p) + 0.5;
        vec2 g = p - cell;
        float r = length(cell * uCell / uRadius);
        if (r > 1.0) discard;
        float fill = 1.0 - smoothstep(0.1, 1.0, r);
        float radius = 0.38 * sqrt(fill);
        float d = length(g);
        float aa = fwidth(d);
        // Dots shrink toward the rim and fade as they get too small to draw.
        float a = (1.0 - smoothstep(radius - aa, radius + aa, d)) * smoothstep(0.0, 0.35, fill);
        if (a < 0.01) discard;
        gl_FragColor = vec4(uInk, a * uOpacity);
        #include <colorspace_fragment>
      }
    `,
  })
}
