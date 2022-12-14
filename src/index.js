import Hls from 'hls.js'
import { KPlayer } from './core/index'
import { getUrlParams } from './utils/utils'
import './utils/index'

function createPlayer(id = '', url = '', options = {}) {
  return new Promise((resolve, reject) => {
    krpanoJS.embedpano({
      id: 'kplayer',
      xml: './krpano.xml',
      target: id || 'kplayer-container',
      html5: 'only+webgl',
      consolelog: true,
      onready: function (krpano) {
        const _krpano = krpano.get('global')
        const _options = {
          ...options,
          url: url,
          id: id,
          krpano: _krpano,
        }

        const kplayer = new KPlayer(_options)
        // kplayer.loadJson()

        window.kplayer = kplayer
        window.krpano = _krpano

        if (window.location.hostname == 'localhost') {
          _krpano.debugmode = true
        }
        resolve(kplayer)
      },
      onerror: function (err) {
        reject(err)
        throw new Error('player init error:', err)
      },
    })
  })
}

let kplayerJS = {
  version: '1.0.0',
  createPlayer: createPlayer,
  getUrlParams: getUrlParams,
}

window.kplayerJS = kplayerJS
window.Hls = Hls

export default kplayerJS
