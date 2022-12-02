// export const kplayerJS = Promise.resolve(require('./kplayer').default)
import Hls from 'hls.js'
import { KPlayer } from './core/index'
import './utils/qmsg'
import './utils/message.min.css'
import './utils/tree.css'
import './skin/ui.css'

function createPlayer(id = '', url = '', options = {}) {
  return new Promise((resolve, reject) => {
    krpanoJS.embedpano({
      id: 'kplayer',
      xml: './krpano.xml',
      target: id || 'krpanoSWFObject',
      html5: 'only+webgl',
      consolelog: true,
      onready: function (krpano) {
        const _krpano = krpano.get('global')
        const _options = {
          ...options,
          url: url,
          id: id,
          krpano: _krpano,
          ispreview: true,
        }

        const kplayer = new KPlayer(_options)
        kplayer.loadJson()

        window._krpano = _krpano

        // _krpano.actions.showlog()
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
}

window.kplayerJS = kplayerJS
window.Hls = Hls

export default kplayerJS
