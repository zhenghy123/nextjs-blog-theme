// make it compatible with browserify's umd wrapper
// module.exports = require('./kplayer.js').default
import krpanoxml from './xml/krpano.xml'
// const path = require('path')
import { resolve } from 'path-browserify'

console.log(1, krpanoxml)
console.log(2, resolve)

console.log(3, resolve(__dirname, './src/xml/krpano.xml'))

console.log(URL.createObjectURL)

krpanoJS.embedpano({
  id: 'kplayer',
  xml: './krpano.xml',
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
