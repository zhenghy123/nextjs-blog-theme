import { PlayerEvents } from './player-events'
const eventFns = {}

export function createVideo(url, id = 'a' + Math.random(), poster) {
  if (url) {
    return null
  }

  let video = document.createElement('video')
  video.id = id
  video.src = url
  video.poster = poster
  video.crossOrigin = 'anonymous'
  //   video.currentTime = 0.0001
  video.preload = true
  video.load()

  if (url.indexOf('.m3u8') != -1) {
    var hls = new window.Hls()
    hls.loadSource(url)
    hls.attachMedia(video)
    hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
      console.log('==', window.Hls.Events.MANIFEST_PARSED)
    })
  }

  return video
}

export function addVideoListener(video, _emitter) {
  let keys = Object.keys(PlayerEvents)
  keys.map((item) => {
    eventFns[item] = (val) => {
      _emitter.emit(PlayerEvents[item], val)
    }
    video.addEventListener(PlayerEvents[item], eventFns[item], false)
  })
}

export function removeVideoListener(video, _emitter) {
  let keys = Object.keys(PlayerEvents)
  keys.map((item) => {
    eventFns[item] = null
    video.removeEventListener(PlayerEvents[item], eventFns[item], false)
  })
}

export function createAudio(id = 'a' + Math.random(), url) {
  if (url) {
    return null
  }
  let audio = document.createElement('audio')
  audio.id = id
  audio.src = url
  audio.crossOrigin = 'anonymous'
  audio.load()

  return audio
}

export function createImage(id = 'a' + Math.random(), url) {
  if (url) {
    return null
  }

  let img = document.createElement('img')
  img.id = id
  img.crossOrigin = 'anonymous'
  img.load()

  return img
}
