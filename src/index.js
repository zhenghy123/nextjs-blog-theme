// make it compatible with browserify's umd wrapper
// module.exports = require('./kplayer.js').default
import { resolve } from 'path'

krpanoJS.embedpano({
  id: 'kplayer',
  xml: resolve(__dirname, './xml/krpano.xml'),
  target: 'krpanoSWFObject',
  html5: 'only',
  consolelog: false,
  onready: function (krpano) {
    krpano = krpano.get('global')
    console.log('onready', krpano)
    krpano.actions.showlog()
    window.krpano = krpano
  },
  onerror: function (err) {
    console.error('err', err)
  },
})

console.log(1)
