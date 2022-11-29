import { PlayerEvents } from './player-events'

const eventFns = {}
// 播放器控制
export class PlayerControl {
  constructor(_player, _parser) {
    console.log('_player:', _player)
    this._player = _player
    this._parser = _parser

    this._currentVideoId = ''

    this.init()
  }

  init() {
    //
    this._player._emitter.on('timeupdate', (v) => {
      console.log('v==', v)
    })
  }

  initFirstVideo() {
    this._currentVideoId = this._parser._firstVideoId
    let videoItem = this._parser.getVideoItem(this._parser._firstVideoId)
    this._player.changeVideo(videoItem.video.src)
  }

  //
  addVideoListener(video) {
    let keys = Object.keys(PlayerEvents)
    keys.map((item) => {
      eventFns[item] = (val) => {
        // this._player.update()
        this._player._emitter.emit(PlayerEvents[item], val)
      }
      video.addEventListener(PlayerEvents[item], eventFns[item], false)
    })
  }

  removeVideoListener(video) {
    let keys = Object.keys(PlayerEvents)
    keys.map((item) => {
      video.removeEventListener(PlayerEvents[item], eventFns[item], false)
    })
  }

  changeVideo() {}

  /**
   * 如果视频设置了fovInfo,切花视频fov
   */
  changeFov() {}

  /**
   * 如果视频没有设置fovInfo,恢复默认view
   */
  gotoInitFov() {}
}
