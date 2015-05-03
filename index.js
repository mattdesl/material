global.THREE = require('three')
const Promise = global.Promise || require('es6-promise').Promise

const createOrbitViewer = require('three-orbit-viewer')(THREE)
const createText = require('three-bmfont-text')
const Shader = require('./lib/shader')
const promisify = require('es6-denodeify')(Promise)
const assign = require('object-assign')

const loadBMFont = promisify(require('load-bmfont'))
const loadTexture = promisify(require('./lib/load-texture'))
const ease = require('eases/sine-in-out')

const sdfOpts = {
  minFilter: THREE.LinearFilter,
  generateMipmaps: false,
  wrapS: THREE.RepeatWrapping,
  wrapT: THREE.RepeatWrapping
}

const paperOpt = assign({}, sdfOpts, {
  repeat: new THREE.Vector2(5,5)
})

function loadMaps() {
  // const names = ['diffuse', 'normals']
  const names = ['diffuse', 'normals', 'spec']
  return Promise.all(names.map(name => {
    const url = `assets/brick-${name}.png`
    return loadTexture(url, paperOpt)
  })).then(results => {
    const [diffuse, normals, specular] = results
    return {
      diffuse, normals, specular
    }
  })
}

function loadFont() {
  return Promise.all([
    loadBMFont('assets/Trash.fnt'),
    loadTexture('assets/Trash.png', sdfOpts)
  ]).then(results => {
    const [data, texture] = results
    return {
      data, texture
    }
  })
}

Promise.all([
  loadFont(),
  loadMaps(),
  loadTexture('assets/uv.png', paperOpt)
]).then(results => {
  return start(...results)
}).catch((err) => {
  console.error(err)
  throw err
})

function start(font, maps, uvPattern) {
  const app = createOrbitViewer({
    clearColor: 'rgb(210, 210, 210)',
    clearAlpha: 1.0,
    near: 0.01,
    fov: 55,
    position: new THREE.Vector3(0, 0, -0.2)
    // position: new THREE.Vector3(0.05, -0.05, -0.4)
  })

  // uvPattern.repeat.multiplyScalar(5)

  const ambient = new THREE.AmbientLight('rgb(11,9,12)')
  app.scene.add(ambient)

  const light = new THREE.DirectionalLight(0xffffff, 1)
  light.position.set(0, 1, -4)
  app.scene.add(light)

  const planeGeo = new THREE.PlaneGeometry(1.1, 1.1)
  const planeMat = new THREE.MeshLambertMaterial({
    map: maps.diffuse,
    normalMap: maps.normals,
    specularMap: maps.specular,
    side: THREE.DoubleSide
  })
  const plane = new THREE.Mesh(planeGeo, planeMat)
  planeGeo.computeBoundingBox()
  plane.geometry = planeGeo
  plane.rotation.y = -Math.PI
  plane.position.z = 0.001
  app.scene.add(plane)

  //create our text geometry
  const geom = createText({
    align: 'center',
    text: 'the world is yours', //the string to render
    font: font.data, //the bitmap font definition
    width: 200, //optional width for word-wrap
    lineHeight: 40,
    // letterSpacing: 1.5,
  })

  //here we use 'three-bmfont-text/shaders/sdf'
  //to help us build a shader material
  const material = new THREE.ShaderMaterial(Shader({
    map: font.texture,
    depthTest: false,
    bgNormals: maps.normals,
    bgSpecular: maps.specular,
    bgDiffuse: maps.diffuse,
    bgRepeat: paperOpt.repeat,
    smooth: 1 / 32, //the smooth value for SDF
    side: THREE.DoubleSide,
    transparent: true,
    color: '#ffd735', //ffd735
    attributes: {
      bgUv: { type: 'v2', value: [] }
    }
  }))

  const layout = geom.layout
  const text = new THREE.Mesh(geom, material)
  text.position.x = -layout.width / 2
  text.position.y = layout.height / 2

  //scale it down so it fits in our 3D units
  const textAnchor = new THREE.Object3D()
  textAnchor.scale.multiplyScalar(-0.005)
  textAnchor.add(text)
  app.scene.add(textAnchor)

  //update matrices and then setup UVs
  plane.updateMatrixWorld(true)
  textAnchor.updateMatrixWorld(true)
  updateTextUVs(text, plane)

  // redrawText('foo')

  var lightBall = new THREE.DirectionalLightHelper(light, 1)
  // app.scene.add(lightBall)

  let time = 0
  app.on('tick', dt => {
    time += dt / 1000
    material.uniforms.draw.value = time
    // material.uniforms.draw.value = ease(Math.sin(time)*0.5+0.5)

    // light.position.y = 4 * Math.sin(time)
    lightBall.update()
  })  


  function redrawText(str) {
    geom.update({
      align: 'center',
      text: str,
      font: font.data, //the bitmap font definition
      width: 200, //optional width for word-wrap
      lineHeight: 40,
    })
    var layout = geom.layout
    text.position.x = -layout.width / 2
    text.position.y = layout.height / 2

    //update matrices and then setup UVs
    plane.updateMatrixWorld(true)
    textAnchor.updateMatrixWorld(true)
    updateTextUVs(text, plane)
  }

}


function updateTextUVs(text, background) {
  background.geometry.computeBoundingBox()
  var bounds = background.geometry.boundingBox

  var pos = text.geometry.attributes.position
  var count = pos.itemSize

  var uvArray = new Float32Array(pos.array.length)
  var bgUvs = new THREE.BufferAttribute(uvArray, 2)
  text.geometry.addAttribute('bgUv', bgUvs)

  var tmp = new THREE.Vector3()
    
  var min = background.localToWorld(bounds.min.clone())
  var max = background.localToWorld(bounds.max.clone())
  min.z = 0
  max.z = 0

  for (var i=0; i<pos.array.length/count; i++) {
    var x = pos.array[i * count + 0]
    var y = pos.array[i * count + 1]
    tmp.set(x, y, 0)
    text.localToWorld(tmp)
    tmp.x = (tmp.x - min.x) / (max.x - min.x)
    tmp.y = (tmp.y - min.y) / (max.y - min.y)
    bgUvs.setXY(i, tmp.x, tmp.y)
  }
}

function getCopy() {
  return 'Hello, world.'
}