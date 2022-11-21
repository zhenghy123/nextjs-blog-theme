import KPlayer from './core/kplayer'

function createPlayer(id = '', url = '', options = {}) {
  return new Promise((resolve, reject) => {
    krpanoJS.embedpano({
      id: 'kplayer',
      xml: './krpano.xml',
      target: id || 'krpanoSWFObject',
      html5: 'only',
      consolelog: false,
      onready: function (krpano) {
        let _krpano = krpano.get('global')
        let _options = { ...options, url: url, krpano: _krpano }
        let kplayer = new KPlayer(_options)
        resolve(kplayer)
        _krpano.showlog()
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
