import { PlayerEvents } from './player-events'

const eventFns = {}
// 播放器控制
export class PlayerControl {
  constructor(_player, _parser) {
    console.log('_player:', _player)
    this._player = _player
    this._parser = _parser

    this._currentTime = 0 // 毫秒
    this._currentVideoId = ''
    this.currentVideo = null

    this._timer = null

    this.init()
  }

  init() {
    //
    this._player._emitter.on('timeupdate', (v) => {
      this._currentTime = v.path[0].currentTime
      // console.log('v==', this._currentTime * 1000)

      // TODO:待优化==
      if (v.path[0].id == this._currentVideoId) {
        console.log('yes', this._currentTime)

        let percent = (this._currentTime / this.currentVideo.duration) * 100
        document.querySelector('.progress-played').style.width = percent + '%'
        document.querySelector('.current-time').textContent = format(
          this._currentTime
        )

        document.querySelector('.duration').textContent = format(
          this.currentVideo.duration
        )

        this.toggleHotspot()
      }
    })

    this._player._options.hotspotClick = (id) => {
      console.log('hotspotClick==', id)
      // 文本无点击反应

      // 点击音效（都有）

      // 跳故事节点（分支选项&立即触发）

      // 跳当前时间（分支选项&立即触发）

      // 互动因子：互动因控制显隐|互动因子计算（立即重刷toggleHotspot，刷新显隐）
      // TODO:逻辑理一理
      // 组合点击，成功：1跳故事节点 2跳当前时间 失败：错误提示
    }

    this._player._options.setMainFov = (fovInfo) => {
      console.log('setMainFov==', fovInfo)
    }
  }

  /**
   * 根据视频id,当前时间、互动因子判断热点显隐
   */
  toggleHotspot() {
    const { ids, activeNodes } = this._parser.getActivetCompIds(
      this._currentVideoId,
      this._currentTime * 1000
    )
    console.log(ids, activeNodes)

    // TODO:根据互动因子过滤出要显示的ids（互动因子作用分两种：分支选择作用在按钮，组合点击作用在整体）

    this._player.showHotspot(ids)

    // 组件开始时间点可暂停视频

    // 组件开始时间点可播放视频（继续播放）

    // 组件结束时间点可暂停视频

    // 组件结束时间点可触发倒计时--计时结束触发某一个子控件上的事件
    this.handleCountDown(2).then(() => {
      console.log('倒计时结束')
    })
    // 组件结束时间点可播放视频（继续播放）
  }

  /**
   * 设置或恢复默认fov信息
   * 在视频切换时需要调用
   * @param {String} fovInfo
   */
  setMainFov(fovInfo) {
    if (fovInfo) {
      this._player.setMainFov(fovInfo)
    } else {
      // 没有则回复默认设置
      let _fovInfo = {
        hlookat: 0,
        vlookat: 0,
        fov: 90,
      }
      this._player.setMainFov(JSON.stringify(_fovInfo))
    }
  }

  /**
   * 处理倒计时
   * TODO:倒计时期间是否响应其他操作待确认，_timer可提到this中
   * @param {Number} count
   * @returns
   */
  handleCountDown(count) {
    if (this._timer) {
      return
    }
    return new Promise((resolve) => {
      let _count = count
      this._timer = setInterval(() => {
        Qmsg.info(`倒计时${_count}`)
        if (_count <= 0) {
          clearInterval(this._timer)
          this._timer = null
          resolve()
        }
        _count--
      }, 1000)
    })
  }

  /**
   * 初始化首个视频
   */
  initFirstVideo() {
    this._currentVideoId = this._parser._firstVideoId
    let videoItem = this._parser.getVideoItem(this._parser._firstVideoId)

    if (videoItem.video.currentTime == 0) {
      videoItem.video.currentTime = 0.0001
    }

    this.currentVideo = videoItem.video
    this._player.changeVideo(videoItem.video)
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
