import * as THREE from 'three'

// A glass-bubble material for the instanced node bodies — matches the reference:
// each node reads as a translucent 3D sphere you can see THROUGH (links show
// behind it), with a bright fresnel rim and a small specular highlight that
// sells the round, glassy, "sexy" look. NormalBlending (not additive) so the
// orb tints the background instead of washing out.
//
// Built on MeshBasicMaterial so per-instance color (setColorAt → instanceColor)
// keeps working; onBeforeCompile injects the fresnel + specular lighting.
export function makeOrbMaterial({
  rimPower = 2.4,
  centerAlpha = 0.16,
  rimAlpha = 1.0,
  shininess = 36,
} = {}) {
  const mat = new THREE.MeshBasicMaterial({
    transparent: true,
    blending: THREE.NormalBlending,
    depthWrite: false,
    toneMapped: false,
  })

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uRimPower = { value: rimPower }
    shader.uniforms.uCenterAlpha = { value: centerAlpha }
    shader.uniforms.uRimAlpha = { value: rimAlpha }
    shader.uniforms.uShininess = { value: shininess }

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 vOrbN;
        varying vec3 vOrbV;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        mat3 nrm = mat3(modelViewMatrix);
        #ifdef USE_INSTANCING
          nrm = nrm * mat3(instanceMatrix);
        #endif
        vOrbN = normalize(nrm * normalize(normal));
        vec4 orbMv = modelViewMatrix *
        #ifdef USE_INSTANCING
          instanceMatrix *
        #endif
          vec4(transformed, 1.0);
        vOrbV = -orbMv.xyz;`,
      )

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uRimPower;
        uniform float uCenterAlpha;
        uniform float uRimAlpha;
        uniform float uShininess;
        varying vec3 vOrbN;
        varying vec3 vOrbV;`,
      )
      .replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
        vec3 N = normalize(vOrbN);
        vec3 V = normalize(vOrbV);
        float fres = pow(1.0 - abs(dot(N, V)), uRimPower);
        // fixed key light (upper-left) for a crisp specular highlight
        vec3 L = normalize(vec3(0.45, 0.7, 0.55));
        float spec = pow(max(dot(N, L), 0.0), uShininess);
        vec3 tint = gl_FragColor.rgb;
        vec3 col = tint * (0.22 + 0.6 * fres) + tint * spec * 1.6 + vec3(1.0) * spec * 0.9;
        float a = clamp(uCenterAlpha + fres * uRimAlpha + spec, 0.0, 0.94);
        gl_FragColor = vec4(col, a);`,
      )
  }

  return mat
}
