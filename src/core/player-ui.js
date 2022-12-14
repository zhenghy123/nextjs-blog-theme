/**
 * 播放器UI
 */

import { changeClass, removeClass, addClass, format } from '../utils/utils'

const $ = (s) => {
  return document.querySelector(s)
}

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
    this.isLoading = false

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
        <div class="kplayer-fullscreen icon">
          <img src="assets/svgs/fullscreen.svg" />
        </div>
        <div class="kplayer-exitscreen icon hidden">
          <img src="assets/svgs/exitscreen.svg" />
        </div>
      </div>
      `
    //   </div>
    let kui = document.createElement('div')
    kui.className = 'kplayer-ui'
    kui.innerHTML = tmp
    let id = this._player._options.id
    $('#' + id).appendChild(kui)

    let loading = document.createElement('div')
    loading.className = 'kplayer-loading hidden'
    loading.innerHTML = `
      <img src="assets/svgs/loading.svg" />
    `
    $('#' + id).appendChild(loading)
  }

  init() {
    this.videoCanplay = this.videoCanplay.bind(this)
    this.videoTimeupdate = this.videoTimeupdate.bind(this)
    this.videoChange = this.videoChange.bind(this)
    this.videoPlaying = this.videoPlaying.bind(this)
    this.videoPause = this.videoPause.bind(this)
    this.videoPlay = this.videoPlay.bind(this)

    this.videoLoading = this.videoLoading.bind(this)
    this.videoLoadingHide = this.videoLoadingHide.bind(this)

    this.render = this.render.bind(this)

    this.handleVideoPlay = this.handleVideoPlay.bind(this)
    this.handleVideoPause = this.handleVideoPause.bind(this)
    this.handleTree = this.handleTree.bind(this)
    this.handleProgress = this.handleProgress.bind(this)
    this.handleMousedown = this.handleMousedown.bind(this)
    this.fullScreenEvent = this.fullScreenEvent.bind(this)

    this.addEvent()
  }

  handleVideoPlay() {
    this._currentVideo.play()
  }
  handleVideoPause() {
    this._currentVideo.pause()
  }

  videoCanplay(event) {
    if (this._videoCount == 0) {
      this._videoCount = this._player._playerParse?._json.videoList.length
    }

    let video = event.path[0]
    this.videoData[video.id] = video.duration

    // 视频全部预加载完
    if (Object.keys(this.videoData).length == this._videoCount) {
      if (!this._canplayAll) {
        this._canplayAll = true
        Qmsg.closeAll()
        this.videoChange()
        this._player._emitter.emit('canplayAll')
      }

      if (event.path[0].id == this._currentVideoId) {
        this.videoLoadingHide()
      }
    }
  }

  videoTimeupdate(event) {
    let _currentTime = event.path[0].currentTime
    // let percent = (_currentTime / this._currentVideoDuration) * 100
    // $('.progress-played').style.width = percent + '%'

    $('.current-time').textContent = format(_currentTime)

    if (this._currentVideo?.paused) {
      let _currentTime = this._currentVideo.currentTime
      let percent = (_currentTime / this._currentVideoDuration) * 100

      $('.progress-played').style.width = percent + '%'
    }
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

    console.log('==', format(this._currentVideoDuration))

    $('.kplayer-ui .duration').textContent = format(this._currentVideoDuration)
    // 切换后重置进度条
    let _currentTime = this._currentVideo.currentTime
    let percent = (_currentTime / this._currentVideoDuration) * 100
    $('.progress-played').style.width = percent + '%'
  }

  videoPlaying() {
    this.isLoading = false
    this.checkLoading()
  }

  videoPlay() {
    changeClass($('.kplayer-play'), 'show', 'hidden')
    changeClass($('.kplayer-pause'), 'hidden', 'show')

    window.cancelAnimationFrame(this.timer)
    this.render()
  }

  videoPause() {
    changeClass($('.kplayer-pause'), 'show', 'hidden')
    changeClass($('.kplayer-play'), 'hidden', 'show')

    window.cancelAnimationFrame(this.timer)
  }

  handleTree() {
    this._player._emitter.emit('treeShow')
  }

  handleMousedown(event) {
    let screenX = event.clientX
    let offsetX = event.clientX
    let dx = 0

    let mousemovefn = (ev) => {
      dx = ev.clientX - screenX
      // this.handleProgress(ev, offsetX + dx)

      let offsetWidth = $('.progress-outer').offsetWidth
      let pert = (offsetX + dx) / offsetWidth
      let time = this._currentVideoDuration * pert

      $('.current-time').textContent = format(time)
      $('.progress-played').style.width = pert * 100 + '%'
    }
    let mouseupfn = (ev) => {
      dx = ev.clientX - screenX
      this.handleProgress(ev, offsetX + dx)

      window.removeEventListener('mousemove', mousemovefn)
      window.removeEventListener('mouseup', mouseupfn)
      window.removeEventListener('mouseleave', mouseupfn)
    }
    window.addEventListener('mousemove', mousemovefn)
    window.addEventListener('mouseup', mouseupfn)
    window.addEventListener('mouseleave', mouseupfn)

    event.stopPropagation()
    return false
  }

  handleProgress(event, x = 0) {
    Promise.resolve().then(() => {
      this._currentVideo.pause()

      let offsetX = x || event.offsetX
      let offsetWidth = $('.progress-outer').offsetWidth
      let pert = offsetX / offsetWidth
      let time = this._currentVideoDuration * pert

      this._currentVideo.currentTime = time
      $('.current-time').textContent = format(time)
      $('.progress-played').style.width = pert * 100 + '%'
    })
  }

  checkLoading() {
    let loading = $('.kplayer-loading')
    if (this.isLoading) {
      changeClass(loading, 'flex', 'hidden')
    } else {
      changeClass(loading, 'hidden', 'flex')
    }
  }

  videoLoading() {
    this.isLoading = true
    this.checkLoading()
  }

  videoLoadingHide() {
    this.isLoading = false
    this.checkLoading()
  }

  addEvent() {
    this._player._emitter.on('canplay', this.videoCanplay)
    this._player._emitter.on('timeupdate', this.videoTimeupdate)
    this._player._emitter.on('videoChange', this.videoChange)
    this._player._emitter.on('playing', this.videoPlaying)
    this._player._emitter.on('pause', this.videoPause)
    this._player._emitter.on('play', this.videoPlay)

    // TODO:销毁
    this._player._emitter.on('seeking', this.videoLoading)
    this._player._emitter.on('seeked', this.videoLoadingHide)
    this._player._emitter.on('waiting', this.videoLoading)
    this._player._emitter.on('error', this.videoLoadingHide)

    $('.kplayer-pause').addEventListener('click', this.handleVideoPlay)
    $('.kplayer-play').addEventListener('click', this.handleVideoPause)
    $('.kplayer-tree').addEventListener('click', this.handleTree)
    $('.progress-outer').addEventListener('mousedown', this.handleProgress)
    $('.progress-btn').addEventListener('mousedown', this.handleMousedown)
    $('.kplayer-fullscreen').addEventListener('click', this.fullScreenEvent)
    $('.kplayer-exitscreen').addEventListener('click', this.fullScreenEvent)
  }

  removeEvent() {
    this._player._emitter.off('canplay', this.videoCanplay)
    this._player._emitter.off('timeupdate', this.videoTimeupdate)
    this._player._emitter.off('videoChange', this.videoChange)
    this._player._emitter.off('playing', this.videoPlaying)
    this._player._emitter.off('pause', this.videoPause)
    this._player._emitter.off('play', this.videoPlay)

    this._player._emitter.off('seeking', this.videoLoading)
    this._player._emitter.off('seeked', this.videoLoadingHide)
    this._player._emitter.off('waiting', this.videoLoading)
    this._player._emitter.off('error', this.videoLoadingHide)

    $('.kplayer-pause').removeEventListener('click', this.handleVideoPlay)
    $('.kplayer-play').removeEventListener('click', this.handleVideoPause)
    $('.kplayer-tree').removeEventListener('click', this.handleTree)
    $('.progress-outer').removeEventListener('mousedown', this.handleProgress)
    $('.progress-btn').removeEventListener('mousedown', this.handleMousedown)
    $('.kplayer-fullscreen').addEventListener('click', this.fullScreenEvent)
    $('.kplayer-exitscreen').addEventListener('click', this.fullScreenEvent)
  }

  /**
   * 采用动画绘制进度条
   */
  render() {
    let _currentTime = this._currentVideo.currentTime
    let percent = (_currentTime / this._currentVideoDuration) * 100

    $('.progress-played').style.width = percent + '%'

    this._player._emitter.emit('videotime', _currentTime)

    this.timer = requestAnimationFrame(this.render)
  }

  destory() {
    this.removeEvent()
    this._player = null
  }

  fullScreenEvent() {
    if (this.checkFull()) {
      this.exitFullScreen()
      changeClass($('.kplayer-fullscreen'), 'show', 'hidden')
      changeClass($('.kplayer-exitscreen'), 'hidden', 'show')
    } else {
      this.enterFullScreen()
      changeClass($('.kplayer-fullscreen'), 'hidden', 'show')
      changeClass($('.kplayer-exitscreen'), 'show', 'hidden')
    }
  }

  // 判断是否全屏
  checkFull() {
    var isFull = false
    if (document.fullscreenEnabled || document.msFullscreenEnabled) {
      isFull = window.fullScreen || document.webkitIsFullScreen
      if (isFull === undefined) {
        isFull = false
      }
    }
    return isFull
  }
  // 退出全屏
  exitFullScreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if (document.webkitCancelFullScreen) {
      document.webkitCancelFullScreen()
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen()
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen()
    }
  }
  // 进入全屏
  enterFullScreen() {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen()
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen()
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen()
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen()
    }
  }
}
