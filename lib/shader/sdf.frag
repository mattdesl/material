#extension GL_OES_standard_derivatives : enable

varying vec2 vUv;
varying vec3 vViewPosition;
varying vec2 vBgUv;
uniform float smooth;
uniform vec3 color;
uniform float opacity;
uniform float draw; 
uniform vec3 specularColor;

uniform sampler2D map;
uniform sampler2D bgDiffuse;
uniform sampler2D bgNormals;
uniform sampler2D bgSpecular;
uniform float normalScale;
uniform float shininess;

uniform vec3 ambientLightColor;
#if MAX_DIR_LIGHTS > 0
  uniform vec3 directionalLightColor[ MAX_DIR_LIGHTS ];
  uniform vec3 directionalLightDirection[ MAX_DIR_LIGHTS ];
#endif

#pragma glslify: ink = require('./ink', time=draw)
#pragma glslify: aastep = require('glsl-aastep')
#pragma glslify: perturb = require('glsl-perturb-normal')
#pragma glslify: faceNormal = require('glsl-face-normal')
// #pragma glslify: diffuse = require('glsl-diffuse-lambert')
#pragma glslify: diffuse2 = require('glsl-diffuse-oren-nayar')
#pragma glslify: specular = require('glsl-specular-blinn-phong')

vec3 transformDirection(in vec3 normal, in mat4 matrix) {
  return normalize((matrix * vec4(normal, 0.0)).xyz);
}

void main() {
  vec4 texColor = texture2D(map, vUv);
  float dist = texColor.a;
  float alpha = ink(dist, vUv, draw);
  float stroke = ink(smoothstep(0.5, 0.7, dist), vUv, draw);

  // vec3 diffuse = texture2D(bgDiffuse, vBgUv).rgb;
  // diffuse *= 0.4;
  // vec3 diffuse = color;


  //get light properties from ThreeJS
  vec3 lightColor = directionalLightColor[0];
  vec3 L = transformDirection(directionalLightDirection[0], viewMatrix);

  vec3 normalMap = texture2D(bgNormals, vBgUv).xyz * 2.0 - 1.0;
  vec3 N = normalize(faceNormal(vViewPosition));
  vec3 V = normalize(vViewPosition);
  vec3 surfaceNormal = perturb(normalMap, N, V, vUv);
  
  float specularStrength = texture2D(bgSpecular, vBgUv).r;
  vec3 specularLight = vec3(1.0) * specularStrength * specular(L, V, surfaceNormal, shininess);
  
  // vec3 diffuseLight = lightColor * diffuse(L, surfaceNormal);
  vec3 diffuseLight = lightColor * diffuse2(L, V, surfaceNormal, 1.0, 1.2);
  vec3 bgColor = texture2D(bgDiffuse, vBgUv).rgb;
  vec3 paintColor = mix(vec3(0.2), color, stroke);
  vec3 diffuseColor = mix(paintColor, bgColor, 0.1);
  vec3 finalColor = diffuseColor * (diffuseLight + ambientLightColor) + specularLight;
  
  gl_FragColor.rgb = finalColor;
  gl_FragColor.a = alpha * opacity;
  if (gl_FragColor.a < 0.06)
    discard;
}