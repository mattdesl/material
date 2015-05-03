#pragma glslify: noise2 = require('glsl-noise/simplex/2d')
#pragma glslify: aastep = require('glsl-aastep')

float absorb(float sdf, vec2 uv, float scale, float falloff) {
  float distort = sdf + noise2(uv * scale) * falloff;

  // float anim = sin(time) ;
  // float draw = noise2(vec2(sdf) * anim);

  // float draw = noise2(vec2(length(uv-0.5)) * anim);
  return aastep(mix(0.5, 1.0, 0.0), distort);
}

//writing on paper
// float ink(float sdf, vec2 uv, float time) {
//   float alpha = 0.0;
//   alpha += absorb(sdf*0.95, uv, 700.0, 0.1) * 0.2;
//   alpha += absorb(sdf, uv, 500.0, 0.01) * 0.3;
//   alpha += absorb(sdf, uv, 300.0, 0.1) * 0.3;
//   alpha += absorb(sdf, uv, 100.0, 0.3) * 0.1;
//   alpha += absorb(sdf, uv, 50.0, 0.2) * 0.1;
//   return alpha;
// }

//graffiti spray
float ink(float sdf, vec2 uv, float time) {
  float alpha = 0.0;
  vec2 tex = uv;
  alpha += absorb(sdf, tex, 600.0, 0.1) * 0.2;
  alpha += absorb(sdf, tex, 300.0, 0.1) * 0.2;
  alpha += absorb(sdf, tex, 20.0, 0.05) * 0.2;
  alpha += absorb(sdf, tex, 400.0, 0.05) * 0.2;
  alpha += absorb(sdf, tex, 100.0, 0.2) * 0.2;
  return alpha;
}

#pragma glslify: export(ink)