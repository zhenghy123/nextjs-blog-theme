/**
 * 播放器UI
 */

import { changeClass, format } from '../utils/utils'

export class PlayerUI {
  constructor(_player) {
    this._player = _player
    this._canplayAll = false

    this._videoCount = 0
    this._currentVideoId = ''
    this._currentVideo = null
    this._currentVideoDuration = 0

    this.videoData = {}

    this.timer = null

    this.appendPlayerUI()
    this.init()

    Qmsg.loading(`视频正在加载中，请稍后`)
  }

  appendPlayerUI() {
    //   <div class="kplayer-ui">
    const tmp = `
      <div class="kplayer-progress">
        <div class="progress-outer">
          <div class="progress-cache"></div>
          <div class="progress-played">
            <div class="progress-btn"></div>
            <div class="progress-point"></div>
            <div class="progress-thumbnial progress-tips"></div>
          </div>
        </div>
      </div>
      <div class="kplayer-controls">
        <div class="kplayer-pause icon" >
          <img src="assets/svgs/pause.svg" />
        </div>
        <div class="kplayer-play icon hidden" >
          <img src="assets/svgs/play.svg" />
        </div>
        <div class="kplayer-time">
          <span class="current-time">00:00</span>
          <span class="duration">00:00</span>
        </div>
        <div class="kplayer-blank"></div>
        <div class="kplayer-tree icon" >
            <img src="assets/svgs/tree.svg" />
         </div>
        <div class="kplayer-volume icon">
          <img src="assets/svgs/volume.svg" />
        </div>
        <div class="kplayer-fullscreen icon">
          <img src="assets/svgs/fullscreen.svg" />
        </div>
      </div>
      `
    //   </div>
    let kui = document.createElement('div')
    kui.className = 'kplayer-ui'
    kui.innerHTML = tmp
    let id = this._player._options.id
    console.log()
    document.querySelector('#' + id).appendChild(kui)
  }

  init() {
    this.videoCanplay = this.videoCanplay.bind(this)
    this.videoTimeupdate = this.videoTimeupdate.bind(this)
    this.videoChange = this.videoChange.bind(this)
    this.videoPlaying = this.videoPlaying.bind(this)
    this.videoPause = this.videoPause.bind(this)
    this.videoPlay = this.videoPlay.bind(this)

    this.render = this.render.bind(this)

    this.handleVideoPlay = this.handleVideoPlay.bind(this)
    this.handleVideoPause = this.handleVideoPause.bind(this)
    this.handleTree = this.handleTree.bind(this)

    this.addEvent()
  }

  handleVideoPlay() {
    console.log(111)
    this._currentVideo.play()
  }
  handleVideoPause() {
    console.log(222)
    this._currentVideo.pause()
  }

  videoCanplay(event) {
    if (this._videoCount == 0) {
      this._videoCount = this._player._playerParse._json.videoList.length
    }

    let video = event.path[0]
    this.videoData[video.id] = video.duration

    // 视频全部预加载完
    if (Object.keys(this.videoData).length == this._videoCount) {
      this._canplayAll = true
      Qmsg.closeAll()
      this.videoChange()
      this._player._emitter.emit('canplayAll')
    }
  }

  videoTimeupdate(event) {
    let _currentTime = event.path[0].currentTime
    // let percent = (_currentTime / this._currentVideoDuration) * 100
    // document.querySelector('.progress-played').style.width = percent + '%'

    document.querySelector('.current-time').textContent = format(_currentTime)
  }

  /**
   * 注意：
   * 在playerControl中切换视频时需要调用：_emitter.emit('videoChange')
   */
  videoChange() {
    this._currentVideoId =
      this._player._playerParse._playerControl._currentVideoId
    this._currentVideo = this._player._playerParse._playerControl._currentVideo
    this._currentVideoDuration = this.videoData[this._currentVideoId]

    document.querySelector('.kplayer-ui .duration').textContent = format(
      this._currentVideoDuration
    )
  }

  videoPlaying() {
    window.cancelAnimationFrame(this.timer)

    this.render()
  }

  videoPlay() {
    console.log(
      document.querySelector('.kplayer-play'),
      document.querySelector('.kplayer-pause')
    )
    changeClass(document.querySelector('.kplayer-play'), 'show', 'hidden')
    changeClass(document.querySelector('.kplayer-pause'), 'hidden', 'show')
  }

  videoPause() {
    changeClass(document.querySelector('.kplayer-pause'), 'show', 'hidden')
    changeClass(document.querySelector('.kplayer-play'), 'hidden', 'show')

    window.cancelAnimationFrame(this.timer)
  }

  handleTree() {
    this._player._emitter.emit('treeShow')
  }

  addEvent() {
    this._player._emitter.on('canplay', this.videoCanplay)
    this._player._emitter.on('timeupdate', this.videoTimeupdate)
    this._player._emitter.on('chengeVideo', this.videoChange)
    this._player._emitter.on('playing', this.videoPlaying)
    this._player._emitter.on('pause', this.videoPause)
    this._player._emitter.on('play', this.videoPlay)

    document
      .querySelector('.kplayer-pause')
      .addEventListener('click', this.handleVideoPlay)
    document
      .querySelector('.kplayer-play')
      .addEventListener('click', this.handleVideoPause)
    document
      .querySelector('.kplayer-tree')
      .addEventListener('click', this.handleTree)
  }

  removeEvent() {
    this._player._emitter.off('canplay', this.videoCanplay)
    this._player._emitter.off('timeupdate', this.videoTimeupdate)
    this._player._emitter.off('chengeVideo', this.videoChange)
    this._player._emitter.off('playing', this.videoPlaying)
    this._player._emitter.off('pause', this.videoPause)
    this._player._emitter.off('play', this.videoPlay)

    document
      .querySelector('.kplayer-pause')
      .removeEventListener('click', this.handleVideoPlay)
    document
      .querySelector('.kplayer-play')
      .removeEventListener('click', this.handleVideoPause)

    document
      .querySelector('.kplayer-tree')
      .removeEventListener('click', this.handleTree)
  }

  /**
   * 采用动画绘制进度条
   */
  render() {
    let _currentTime = this._currentVideo.currentTime
    let percent = (_currentTime / this._currentVideoDuration) * 100

    document.querySelector('.progress-played').style.width = percent + '%'

    this.timer = requestAnimationFrame(this.render)
  }

  destory() {
    this.removeEvent()
    this._player = null
  }
}
