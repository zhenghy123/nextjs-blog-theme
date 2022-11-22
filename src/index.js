// export const kplayerJS = Promise.resolve(require('./kplayer').default)
import { KPlayer } from './core/index'
import PlayerData from './core/player-data'

function createPlayer(id = '', url = '', options = {}) {
  return new Promise((resolve, reject) => {
    krpanoJS.embedpano({
      id: 'kplayer',
      xml: './krpano.xml',
      target: id || 'krpanoSWFObject',
      html5: 'only',
      consolelog: false,
      onready: function (krpano) {
        console.log('krpanoJS init ')
        const _krpano = krpano.get('global')
        const _options = { ...options, url: url, krpano: _krpano }
        
        const playList = new PlayerData()
        window.playList = playList

        const kplayer = new KPlayer(_options)

        window.kxplayer = kplayer
        window._krpano = _krpano

        _krpano.actions.showlog()
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

export default kplayerJS
