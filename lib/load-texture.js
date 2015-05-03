import THREE from 'three'
import assign from 'object-assign'

const noop = () => {}

export default function(path, opt={}, cb=noop) {
  if (typeof opt === 'function') {
    cb = opt
    opt = {}
  }

  THREE.ImageUtils.loadTexture(path, undefined, 
    tex => {
      assign(tex, opt)
      cb(null, tex)
    },
    () => {
      cb(new Error(`could not load image ${path}`))
    })
}